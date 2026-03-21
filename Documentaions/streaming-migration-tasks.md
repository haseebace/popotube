# Streaming Migration Tasks

This file tracks the migration from the current Bunny-based ingestion/playback pipeline to a Real-Debrid-first streaming architecture.

---

## Goal

**Target flow:**

```
Jackett search → Real-Debrid download → direct browser playback or proxied/transcoded playback
```

---

## Task 1: Collapse Duplicated Public API Layers

> Audit and consolidate the two overlapping public-facing API layers into a single, well-defined orchestration surface.

### 1.1 — Audit Existing Routes ✅

- [x] List all routes registered in the **Fastify backend** public router (e.g. `backend/src/routes/popohub-public.ts` and adjacent files).
- [x] List all routes registered in the **Next.js** `/app/api/` or `/pages/api/` directories that are public-facing.
- [x] Create a comparison table mapping duplicate or overlapping routes across both layers (same intent, different path or implementation).
- [x] Identify which routes are called by the frontend, which are called internally, and which are no longer called at all.

---

#### Fastify Backend Routes (`backend/src/routes/` — runs on port 3001)

| Route | Method | File | Purpose |
|---|---|---|---|
| `POST /api/bunny-download` | POST | `bunny-download.ts` | Receives magnet + metadata, inserts DB record, enqueues BullMQ job |
| `POST /api/cancel-job` | POST | `cancel-job.ts` | Deletes the DB record for a video, killing the worker loop |
| `GET /api/public/discovery` | GET | `popohub-public.ts` | Fetches trending + popular movies from TMDB, merges and returns them |
| `GET /movie-search` | GET | `popohub-public.ts` | Searches TMDB by query string — **note: no `/api/` prefix** |
| `GET /api/public/torrents` | GET | `popohub-public.ts` | Looks up TMDB title, searches Jackett, scores and returns top 20 torrents |
| `GET /health` | GET | `index.ts` (inline) | Simple health check |
| `ANY /admin/queues/*` | ANY | `index.ts` (Bull Board) | BullMQ dashboard UI |

---

#### Next.js API Routes (`app/api/` — runs in the Next.js process)

| Route | Method | File | Purpose |
|---|---|---|---|
| `ANY /api/backend/[...path]` | ALL | `backend/[...path]/route.ts` | **Transparent reverse proxy** — forwards all calls to `http://127.0.0.1:3001/api/<path>` |
| `GET /api/public/movie-status` | GET | `public/movie-status/route.ts` | Queries Supabase directly for a video record by `tmdb_id`, returns status + `stream_url` |
| `POST /api/public/trigger-ingestion` | POST | `public/trigger-ingestion/route.ts` | Searches Jackett, picks best torrent, **calls `/api/bunny-download` on the Fastify backend** |
| `GET /api/search` | GET | `search/route.ts` | Raw Jackett search by free-text query `?q=`, returns normalised results |
| `GET /api/tmdb/details` | GET | `tmdb/details/route.ts` | Fetches full movie details + credits + videos from TMDB by `tmdb_id` |
| `GET /api/tmdb/discover` | GET | `tmdb/discover/route.ts` | TMDB discover endpoint with genre/sort filters |
| `GET /api/tmdb/search` | GET | `tmdb/search/route.ts` | TMDB movie search by text query |
| `GET /api/tmdb/trending` | GET | `tmdb/trending/route.ts` | TMDB trending movies by time window |

---

#### Overlap / Duplication Analysis

| Intent | Fastify Route | Next.js Route | Verdict |
|---|---|---|---|
| **TMDB movie search** | `GET /movie-search` (no `/api/` prefix!) | `GET /api/tmdb/search` | ⚠️ **Overlap** — both hit TMDB `/search/movie`. Fastify version has a broken path prefix (no `/api/`). Next.js version is actively used by frontend. |
| **Jackett search** | `GET /api/public/torrents` (scored, TMDB-aware) | `GET /api/search` (raw, free-text only) | ⚠️ **Partial overlap** — different levels of abstraction. Fastify version is richer (scoring, TMDB lookup). Next.js is a raw pass-through used by the admin search page. |
| **TMDB discovery/trending** | `GET /api/public/discovery` (merged trending+popular) | `GET /api/tmdb/trending` + `GET /api/tmdb/discover` | ⚠️ **Overlap** — Fastify merges two calls into one. Next.js exposes each separately. Frontend uses the Next.js versions. |
| **Playback status** | ❌ None | `GET /api/public/movie-status` | ✅ Only in Next.js — no backend equivalent. |
| **Ingest / queue job** | `POST /api/bunny-download` | `POST /api/public/trigger-ingestion` (calls Fastify) | ⚠️ **Two-layer overlap** — Next.js route does its own Jackett search and then calls the Fastify route. |
| **Cancel job** | `POST /api/cancel-job` | (via `/api/backend/cancel-job` proxy) | ✅ Correctly proxied — Next.js passes through to Fastify. |

---

#### Caller Map (who calls what)

| Route | Called By | Actively Used? |
|---|---|---|
| `POST /api/bunny-download` (Fastify) | `app/api/public/trigger-ingestion/route.ts` (internal server-to-server) | ✅ Yes |
| `POST /api/cancel-job` (Fastify) | `app/admin/(dashboard)/downloads/page.tsx` via `/api/backend/cancel-job` proxy | ✅ Yes |
| `GET /api/public/discovery` (Fastify) | **No frontend caller found** | ❌ **Unused** — dead route |
| `GET /movie-search` (Fastify) | **No frontend caller found** | ❌ **Unused** — also has broken path (no `/api/` prefix) |
| `GET /api/public/torrents` (Fastify) | **No frontend caller found** | ❌ **Unused** — admin search page uses `/api/search` instead |
| `ANY /api/backend/[...path]` (Next.js proxy) | `app/admin/(dashboard)/downloads/page.tsx` (cancel-job), `app/admin/(dashboard)/search/page.tsx` (bunny-download) | ✅ Yes |
| `GET /api/public/movie-status` (Next.js) | `components/public/WatchClient.tsx` | ✅ Yes |
| `POST /api/public/trigger-ingestion` (Next.js) | `components/public/WatchClient.tsx` | ✅ Yes |
| `GET /api/search` (Next.js) | `app/admin/(dashboard)/search/page.tsx` | ✅ Yes |
| `GET /api/tmdb/details` (Next.js) | **No frontend caller found** (watch page calls TMDB directly) | ❌ **Unused** |
| `GET /api/tmdb/discover` (Next.js) | `app/(public)/categories/[genre]/page.tsx` | ✅ Yes |
| `GET /api/tmdb/search` (Next.js) | `app/(public)/search/page.tsx`, `components/admin/TMDBSearchAutocomplete.tsx` | ✅ Yes |
| `GET /api/tmdb/trending` (Next.js) | `components/public/HeroBanner.tsx` | ✅ Yes |

---

#### Key Findings

> [!WARNING]
> **3 Fastify routes are completely dead** — `GET /api/public/discovery`, `GET /movie-search`, and `GET /api/public/torrents` — no frontend caller exists for any of them.

> [!WARNING]
> **`GET /api/tmdb/details` (Next.js) is unused** — the watch page (`/watch/[tmdb_id]/page.tsx`) calls the TMDB API directly from the component, bypassing the Next.js route entirely.

> [!NOTE]
> The `/api/backend/[...path]` Next.js proxy is the bridge between the frontend and the Fastify backend. All admin-initiated backend calls go through it.

> [!NOTE]
> `POST /api/public/trigger-ingestion` (Next.js) duplicates Jackett search logic that already exists in `GET /api/public/torrents` (Fastify). These two need to be consolidated into a single backend-owned flow in Task 1.2.

### 1.2 — Choose a Single Orchestration Layer ✅

- [x] Decide whether the **Fastify backend** or the **Next.js API routes** will be the single source of truth for:
  - [x] Search (Jackett passthrough or aggregated search results)
  - [x] Playback status (polling or streaming job state)
  - [x] Playback initiation (trigger RD download + link resolution)
- [x] Document the decision in this file or a separate ADR:

**Decision:**
**Next.js API routes** will act as the single orchestration layer and public API for the frontend.
- **Search & Discovery:** Handled by Next.js routes (leveraging its built-in `fetch` caching for TMDB).
- **Playback Status:** Handled by Next.js (querying Supabase directly).
- **Playback Initiation:** Next.js will handle the Jackett search/scoring, pick the best torrent, and then send a simple "ingest this magnet" command to Fastify.

**Fastify** will be stripped of public aggregator routes and will exist strictly as an internal microservice for:
- BullMQ worker orchestration (processing the magnet -> RD flow).
- Video proxying (streaming large files to the browser).

- [x] Ensure the chosen layer has proper middleware: auth, rate limiting, error handling, logging. (Next.js already handles this natively via its route handlers and Supabase RLS).

### 1.3 — Remove / Deprecate Redundant Routes ✅

- [x] Remove or stub out PopoHUB-inherited routes in the Fastify backend that no longer align with the PoPoTube streaming architecture (deleted `popohub-public.ts`).
- [x] Remove or stub out Next.js API routes that are now proxied or replaced by the Fastify backend (deleted `/api/tmdb/details`).
- [x] Add `@deprecated` comments or HTTP `410 Gone` responses to any routes kept temporarily for compatibility (N/A — directly deleted as nothing calls them).
- [x] Confirm no active frontend component or page is still calling the deprecated routes.

### 1.4 — Clarify Backend Responsibility Boundaries ✅

- [x] Ensure the boundary is strictly enforced based on the 1.2 decision:
  - **Next.js**: Handles the public API contract (search, status, trigger initiation).
  - **Fastify**: Handles worker orchestration (BullMQ job creation) and future playback proxying.
- [x] Remove any business logic from Next.js API routes that belongs in the Fastify backend (Already aligned: Next.js handles the Jackett scrape, then passes the `magnet` to Fastify).
- [x] Update backend route registrations in `index.ts` to reflect the final, authoritative route set (Completed in 1.3: `index.ts` now only loads the queue and job routes).

---

## Task 2: Remove Bunny From The Hot Path

> The primary playback path must no longer depend on Bunny. Real-Debrid's direct or proxied link should be the first-class playback source.

### 2.1 — Update the Ingestion Worker ✅

- [x] Locate the ingestion worker entry point (e.g. worker file that handles BullMQ jobs).
- [x] Find the step where `unrestrictLink()` is called and a usable source URL is returned from Real-Debrid.
- [x] Add a step immediately after `unrestrictLink()` that marks the title as **playback-ready** in the database.
- [x] Remove the code block that waits for Bunny to fetch the file (the Bunny pull/fetch trigger).
- [x] Remove the code block that waits for Bunny to finish encoding/transcoding the video.
- [x] Ensure the worker does **not** fail or stall if Bunny-related steps are skipped.

### 2.2 — Remove Bunny From Playback Resolution Logic ✅

- [x] Find all places where the playback URL is resolved before returning it to a client.
- [x] Remove any logic that checks for, waits for, or prefers a Bunny CDN URL over a direct Real-Debrid link.
- [x] Ensure the playback resolver returns the Real-Debrid direct URL (or proxy URL) as the primary source.

### 2.3 — Mark Titles Playable Without Bunny ✅

- [x] Update the job completion logic: a title should be marked `playable = true` (or equivalent status) as soon as a valid playback URL exists — not after Bunny processing.
- [x] Update any frontend polling logic that waits for a Bunny-specific status flag before enabling playback.
- [x] Verify in the database that the playback-ready state is correctly set end-to-end after this change.

### 2.4 — Make Bunny Optional ✅

- [x] Wrap any remaining Bunny-specific ingestion calls in a feature flag or config toggle (e.g. `ENABLE_BUNNY_FALLBACK=true`).
- [x] Ensure the worker gracefully skips Bunny steps when the flag is off, without throwing errors.
- [x] Document how to re-enable Bunny as a fallback if explicitly decided later.

### 2.5 — Update Admin Dashboard Library ✅

- [x] Locate the Library tab in the Admin Dashboard (`app/admin/(dashboard)/library/page.tsx` or similar).
- [x] Remove the API calls that fetch the video/library list from the Bunny CDN.
- [x] Implement a new Fastify route (or use an existing one) to fetch the user's active torrents directly from the Real-Debrid API (`/torrents`).
- [x] Update the Admin Library UI to display the Real-Debrid fetched files (showing status, sizes, links, etc.) instead of Bunny-hosted files.

---

## Task 3: Redefine Playback Source Storage

> Replace the overloaded `stream_url` field with a structured playback source that the system can use to select the correct playback strategy.

### 3.1 — Audit Current `stream_url` Usage ✅

- [x] Find every place in the codebase that reads or writes `stream_url`.
- [x] Document what type of value is currently stored in it (Bunny iframe URL, direct link, CDN link, etc.).
- [x] Identify which components or routes consume this field to drive playback.

### 3.2 — Design the New Playback Source Schema ✅

- [x] Define a new `playback_source` structure (JSON column or related table) that supports:
  - [x] `type`: one of `direct`, `proxy`, `mediaflow`, or `bunny` (legacy)
  - [x] `url`: the raw URL for this source
  - [x] `codec`: e.g. `H264`, `H265`, `AV1`
  - [x] `container`: e.g. `mkv`, `mp4`, `avi`
  - [x] `mime_type`: e.g. `video/mp4`, `video/x-matroska`
  - [x] `is_streamable`: boolean — whether the file is safe to stream without transcoding
  - [x] `source_type`: e.g. `real_debrid`, `bunny_cdn`
  - [x] `expires_at`: optional, for signed or time-limited URLs
- [x] Write and apply a Supabase migration for any schema changes.

### 3.3 — Update Ingestion Worker to Write New Schema ✅

- [x] After `unrestrictLink()` resolves, write the result into the new `playback_source` structure.
- [x] Populate `codec`, `container`, and `mime_type` from Real-Debrid metadata where available.
- [x] Set `is_streamable` based on container/codec heuristics (e.g. `mp4` in an H.264 stream is directly streamable).
- [x] Set `type` to `direct` for a raw RD link, `proxy` if routing through the backend proxy.

### 3.4 — Update All Consumers of `stream_url` ✅

- [x] Update any route or service that reads `stream_url` to read from the new `playback_source` structure instead.
- [x] Update the watch page (frontend) to use the new field for determining how to load the player.
- [x] After all consumers are migrated, mark `stream_url` as deprecated in the schema (or drop it if safe).

---

## Task 4: Replace The Bunny Iframe Player

> Replace the Bunny-embedded iframe player with a real, controllable media player that can handle direct files, HLS streams, and proxied content.

### 4.1 — Remove The Iframe ✅

- [x] Locate the watch page component that renders the Bunny `<iframe>`.
- [x] Remove the `<iframe>` element and all Bunny embed URL logic.
- [x] Ensure the page still renders without errors after the iframe is removed.

### 4.2 — Implement Native `<video>` Playback ✅

- [x] Add a `<video>` element (or a wrapper library like `video.js` or `Plyr`) to the watch page.
- [x] Wire it to the `url` field from `playback_source` when `type === 'direct'` or `is_streamable === true`.
- [x] Set the `type` attribute on `<source>` from the `mime_type` field in `playback_source`.
- [x] Test direct playback for `mp4` and `webm` files.

### 4.3 — Implement HLS / fMP4 Playback ✅

- [x] Integrate an HLS-capable player (e.g. `hls.js`) for transcoded or proxied streams.
- [x] Use HLS playback when `type === 'proxy'` or `type === 'mediaflow'`.
- [x] Pass the proxy/MediaFlow URL as the HLS manifest source.
- [x] Confirm that adaptive bitrate switching works if the proxy supports it.

### 4.4 — Handle Player States ✅

- [x] Implement a **loading state** that shows a spinner or skeleton while the source URL is being resolved.
- [x] Implement an **error state** that shows a user-friendly message if playback fails to start.
- [x] Implement a **seeking** state / buffering indicator so the user knows when the stream is buffering.
- [x] Ensure the player does not flash or auto-play before the source is confirmed ready.

### 4.5 — Future-Proof Caption Support ✅

- [x] Add a placeholder `<track>` element structure inside `<video>` so caption support can be wired in later without refactoring the player.
- [x] Document where caption/subtitle metadata would need to be stored in `playback_source` when the time comes: *(Captions should be stored as an array of objects within `playback_source.captions` with properties: `url`, `lang`, `label`, and `default` boolean)*.

---

## Task 5: Preserve Real-Debrid Files By Default

> Stop automatically deleting Real-Debrid files. Cleanup must only happen when explicitly requested.

### 5.1 — Remove Automatic Deletion on Success ✅

- [x] Find all places where Real-Debrid files or torrents are deleted upon successful job completion.
- [x] Remove or disable those deletion calls.
- [x] Verify in the RD dashboard (or via API) that files are no longer deleted after a test run.

### 5.2 — Remove Automatic Deletion on Failure / Cancel ✅

- [x] Find all places where Real-Debrid files or torrents are deleted when a job fails or is cancelled.
- [x] Remove or disable those deletion calls.
- [x] Confirm that a cancelled job leaves the RD file intact.

### 5.3 — Rebuild or Remove Stale Compiled Output ✅

- [x] Check if a compiled or transpiled `dist/` directory exists in the backend.
- [x] If `dist/` is present and out of sync with source, delete it and rebuild: `npm run build` (or equivalent).
- [x] Alternatively, ensure the dev/production runner always uses the live TypeScript source (e.g. via `tsx` or `ts-node`).
- [x] Confirm that the running backend behavior matches the source behavior after this step.

### 5.4 — Implement Explicit Cleanup Action ✅

- [x] Add an admin endpoint (e.g. `DELETE /api/admin/rd-cleanup/:id`) that allows manual deletion of a specific RD file.
- [x] Optionally add a bulk cleanup endpoint for multiple files.
- [x] Document that RD cleanup is now a manual/admin-only action, not automatic.
- [x] Update any relevant UI (admin panel or similar) to expose the delete action.

---

## Task 7: Native Streaming Proxy (Completed) ✅
- [x] Create a Fastify streaming endpoint parsing `videoId` directly to strip `content-disposition`.
- [x] Leverage `@fastify/reply-from` to pass through `Range`/`Chunked` requests locally.
- [x] Register Next.js rewrites (`/api/proxy/:path*`) tying natively back to `backend`.
- [x] Map Client Player to fetch from proxy.

---

## Task 6: Rename Bunny-Specific API And Terminology

> Remove all Bunny-specific naming from routes, jobs, and internal services. The API should reflect what it actually does now.

### 6.1 — Rename API Endpoints ✅

- [x] Rename `/api/bunny-download` (or equivalent) to a neutral name such as `/api/prepare-playback` or `/api/ingest`.
- [x] Update the Fastify route registration to use the new path.
- [x] Update all frontend `fetch()`/`axios` calls that reference the old route name.
- [x] Add a redirect or `301` response on the old route temporarily to catch any missed callers.

### 6.2 — Rename Job / Queue Terminology ✅

- [x] Find all BullMQ queue names, job names, or event names that contain "bunny" (e.g. `bunny-encode`, `bunny-fetch`).
- [x] Rename them to neutral terms that describe the actual operation (e.g. `ingest`, `prepare-stream`, `resolve-source`).
- [x] Update the worker that processes those jobs to register under the new queue/job names.
- [x] Drain or flush any stale jobs in the old queues to avoid leftover processing.

### 6.3 — Rename Internal Service Terminology ✅

- [x] Search the codebase for any variable names, function names, type names, or comments that contain "bunny" (case-insensitive).
- [x] Rename them to neutral equivalents (e.g. `bunnyUrl` → `streamUrl` or `sourceUrl`).
- [x] Update any TypeScript types or interfaces that expose Bunny-specific field names in their public shape.

### 6.4 — Align Frontend With New Naming ✅

- [x] Update any frontend components or hooks that reference old Bunny-specific field names or route names.
- [x] Update API response types/interfaces in the frontend to match the new backend contract.
- [x] Run a final codebase-wide grep for `bunny` (case-insensitive) and resolve any remaining references.

### 6.5 — Verify End-to-End Consistency ✅

- [x] Trigger a full test flow: search → RD download → playback initiation → player load.
- [x] Confirm no request hits an old Bunny route or uses stale terminology.
- [x] Confirm all logs, queue dashboards, and DB records use the new neutral naming.

---

## Notes

- Execute these tasks **one at a time in order** unless we explicitly decide to reorder them.
- Each task should be committed separately with a clear message describing what was changed.
- After completing each task, do a quick smoke test of the full flow before moving on.
