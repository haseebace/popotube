# Future Implementation

## Goal

We want to move PoPoTube to a cleaner runtime shape:

```text
Browser -> Fastify -> Supabase
```

The main rule is simple:

- the browser should talk to **one backend API**
- that backend API should be **Fastify**
- Fastify should own the business logic and data access
- we should remove **Next.js API routes** that only proxy or duplicate backend work

This file tracks the Fastify-first cleanup. **Items 1–11 phase 1 are done** (identity tables + FKs; see §11 deferred hardening).

---

## Why We Want This

Right now, some flows take an extra hop:

```text
Browser -> Next.js API -> Fastify -> Supabase
```

That is more moving parts than we need.

Problems with that setup:

- extra network hop
- duplicated request shaping
- more files to maintain
- harder to understand data flow
- more places for bugs and mismatched behavior

We want one clear path instead of making requests take a little vacation before reaching the real backend.

---

## Approved Direction

For public and admin app flows, we want to standardize on:

```text
Browser -> Fastify -> Supabase
```

That means:

- remove Next.js API routes that only forward requests
- remove generic backend pass-through layers
- move business logic to Fastify when browser-side code needs an API
- keep Next.js focused on pages, UI, and server-rendered page composition

---

## Improvement Backlog

## 1. Remove public watch proxy routes

### Current flow

```text
Browser -> /api/public/* on Next.js -> Fastify -> Supabase
```

### Target flow

```text
Browser -> Fastify -> Supabase
```

### Routes to remove

- `app/api/public/movie-status/route.ts`
- `app/api/public/trigger-ingestion/route.ts`

### Frontend callers to update

- `hooks/useWatchIngestion.ts`
- `hooks/useTvEpisodeIngestion.ts`
- `components/public/watch/WatchPageShell.tsx`
- `components/public/WatchClient.tsx`

### Fastify routes already available

- `GET /api/movie-status`
- `POST /api/trigger-ingestion`

### Notes

- **Done:** MediaFlow and force-HLS were removed; browser playback uses direct/streamable files plus Fastify `GET /api/stream/:videoId` for Real-Debrid proxying. Next.js public watch routes removed.

### Status

- Done

---

## 2. Remove generic Next.js backend pass-through

### Current flow

```text
Browser -> /api/backend/[...path] on Next.js -> Fastify
```

### Problem

This is a general-purpose proxy layer.
It hides which backend routes are actually being used and adds one more HTTP hop for admin pages.

### Route to remove

- `app/api/backend/[...path]/route.ts`

### Frontend callers to update

- `app/admin/(dashboard)/page.tsx`
- `app/admin/(dashboard)/settings/page.tsx`
- `app/admin/(dashboard)/settings/integrations/page.tsx`
- `app/admin/(dashboard)/activedownloads/page.tsx`
- `app/admin/(dashboard)/search-jackett/page.tsx`
- `app/admin/(dashboard)/search-torrentio/page.tsx`
- `app/admin/(dashboard)/torrents/page.tsx`
- `app/admin/(dashboard)/downloaded-unrestricted/page.tsx`

### Example changes

- `/api/backend/dashboard/stats` -> direct Fastify `/api/dashboard/stats`
- `/api/backend/ingest` -> direct Fastify `/api/ingest`
- `/api/backend/library` -> direct Fastify `/api/library`
- `/api/backend/downloads` -> direct Fastify `/api/downloads`

### Status

- Done

---

## 3. Remove Next.js search proxy for Jackett

### Current flow

```text
Browser -> /api/search on Next.js -> Fastify /api/search -> Jackett
```

### Route to remove

- `app/api/search/route.ts`

### Frontend callers to update

- admin Jackett search page

### Target flow

```text
Browser -> Fastify /api/search -> Jackett
```

### Status

- Done

---

## 4. Remove Next.js Torrentio admin lookup route

### Current flow

```text
Browser -> /api/torrentio/search on Next.js -> TMDB + Torrentio
```

### Problem

This is another API living in Next.js instead of Fastify.
If we want one backend API surface, this logic should move to Fastify or be removed.

### Route to remove or migrate

- `app/api/torrentio/search/route.ts`

### Frontend callers to update

- `app/admin/(dashboard)/search-torrentio/page.tsx`

### Better target

Move this into Fastify as a proper backend route, for example:

- `GET /api/torrentio/search`

Then the browser calls Fastify directly.

### Status

- Done (`GET /api/torrentio/search` on Fastify; Next route removed.)

---

## 5. Remove Next.js stream proxy rewrite as an app-facing API layer

### Current flow

```text
Browser -> /api/proxy/stream/:id on Next.js rewrite -> Fastify /api/stream/:id
```

### Current config

- `next.config.ts` rewrites `/api/proxy/:path*` to Fastify `/api/:path*`

### Problem

This is lighter than a real Next.js route handler, but it is still an extra Next.js layer in front of Fastify for streaming.

### Target flow

```text
Browser -> Fastify /api/stream/:id
```

### Files likely affected

- `next.config.ts`
- `lib/watch-playback.ts`
- any player component that expects `/api/proxy/stream/:id`

### Notes

- **Done:** `lib/watch-playback.ts` uses `NEXT_PUBLIC_BACKEND_URL` + `/api/stream/:id`; Next `rewrites` for `/api/proxy/*` removed.

### Status

- Done

---

## 6. Review and remove other proxy-style Next.js API routes

These are not always Fastify proxies today, but they still create a second API layer inside Next.js.

### Routes to review

- `app/api/tmdb/trending/route.ts`
- `app/api/tmdb/search/route.ts`
- `app/api/tmdb/discover/route.ts`
- `app/api/tmdb/tv/season/route.ts`

### Current behavior

These routes mainly proxy or reshape TMDB responses for client-side pages/components.

### Decision we need

For each one, choose one of these:

1. Move it to Fastify and let the browser call Fastify directly.
2. Remove the browser API call entirely and fetch the data in a Next.js page/server component.

**Outcome:** Option (1) — Fastify routes under `/api/tmdb/*` (`trending`, `search`, `discover`, `tv/season`); Next.js TMDB routes removed; public callers use `publicBackendApiUrl`.

### Important note

If the target architecture is truly:

```text
Browser -> Fastify -> Supabase
```

then client-side API calls should not go to Next.js for this data anymore.

### Status

- Done

---

## 7. Stop mixing browser-side Supabase data access with Fastify-owned backend data access

### Current example

`app/admin/(dashboard)/activedownloads/page.tsx` talks directly to Supabase from the browser:

- direct `.from("videos").select(...)`
- direct realtime subscription on `videos`

### Why this matters

If we want one clean backend path, Fastify should own the data rules for this screen too.

### Future direction

Possible cleanup:

- browser calls Fastify for active jobs
- Fastify queries Supabase
- realtime can later be replaced by:
  - Fastify SSE
  - WebSocket
  - or a controlled polling endpoint

### Note

This is slightly different from the Next.js API problem, but it is part of the same architecture cleanup.

### Status

- Done (`GET /api/admin/active-downloads` + polling; Supabase realtime removed from this page.)

---

## 8. Add a single public backend base URL for the frontend

To remove Next.js API middlemen, the frontend needs a clean way to call Fastify directly.

### Work needed

- define one frontend-safe backend origin
- standardize environment variable usage
- update all browser fetch calls to use that base URL
- verify CORS and auth behavior

### Candidate environment variables

- keep using `BACKEND_URL`
- **`NEXT_PUBLIC_BACKEND_URL`** added for browser calls (see `lib/backend-public-url.ts`).

### Status

- Done

---

## 9. Add proper CORS and request policy on Fastify

If the browser is going to call Fastify directly, Fastify must be ready for it.

### Work needed

- configure allowed origins
- configure allowed headers
- configure allowed methods
- check credentials behavior if needed
- verify streaming route behavior in browser

### Status

- Done (`@fastify/cors` in `backend/src/index.ts`; `CORS_ORIGIN` env.)

---

## 10. Consolidate business logic into Fastify only

We want Fastify to be the single source of truth for:

- availability checks
- ingestion triggers
- manual ingest
- admin queue/library/download APIs
- Torrentio admin lookups
- TMDB-backed browser APIs if they still need runtime endpoints

### Benefit

This makes it much easier to answer:

“Where does this request really go?”

Right now the answer is sometimes:

“Well first it goes here, then there, then over there, then finally to the place that actually matters.”

That is not the kind of plot twist we need.

### Status

- Done for browser-facing APIs listed above (watch, admin, TMDB, Torrentio, stream, active downloads). Further consolidation can stay incremental.

---

## 11. Split movie and TV data into separate tables

### Reason

Right now the code stores both movies and TV episodes in the single `videos` table.

Current behavior in the codebase:

- movie rows use `tmdb_id` as a movie id
- TV rows use that same `tmdb_id` as the **series** id
- TV episode identity is then inferred from:
  - `tmdb_media_type = 'tv'`
  - `season_number`
  - `episode_number`
- `backend/src/lib/video-reuse.ts` finds TV rows using:
  - `tmdb_id`
  - `season_number`
  - `episode_number`
- the repo already has a `tmdb_episode_id` column in migration
  - `supabase/migrations/20260330120000_videos_tmdb_media_type_tv_support.sql`
- TMDB season responses already include an episode `id`
  - `lib/tmdb-tv.ts`

So the app already has enough raw identifiers to stop mixing movies and TV into one catch-all table.

### Problem with the current shape

The current `videos` table is doing too many jobs at once:

- media identity
- movie/series classification
- episode identity
- ingestion state
- playback state
- dedupe state

That makes the model harder to reason about and easier to break.

### Desired direction

Split movie and TV identity into separate tables.

At minimum:

- `movies`
- `tv_series`
- `tv_episodes`

### Recommended relationship model

Use **TMDB IDs**, not random characters or handmade keys.

That is the cleanest option already supported by the code and by TMDB responses.

Recommended structure:

#### `movies`

- internal primary key
- `tmdb_movie_id` unique
- title and metadata cache fields

#### `tv_series`

- internal primary key
- `tmdb_series_id` unique
- name and metadata cache fields

#### `tv_episodes`

- internal primary key
- `series_id` foreign key -> `tv_series.id`
- `tmdb_episode_id` unique when available
- `tmdb_series_id` optional denormalized helper if useful
- `season_number`
- `episode_number`
- unique constraint on:
  - `(series_id, season_number, episode_number)`

### Important recommendation

Do **not** simply duplicate the current `videos` table into one movies table and one TV table with the same playback columns pasted twice.

A cleaner design is:

- media identity tables:
  - `movies`
  - `tv_series`
  - `tv_episodes`
- ingestion/playback table:
  - keep `videos` or rename it later to something more honest like `media_assets`, `playback_items`, or `ingestions`

Then:

- a movie playback row links to `movies`
- an episode playback row links to `tv_episodes`

That avoids duplicating all the ingestion columns and queue-state columns across two nearly identical tables.

### Why this is better

- movie identity becomes clean and separate
- TV series identity becomes clean and separate
- episodes become first-class records
- series-to-episode relation becomes explicit
- dedupe logic becomes easier to reason about
- future metadata caching becomes easier
- admin screens can show richer movie/series/episode information without overloading the `videos` table further

### Code areas affected

This is not a small schema tweak. It touches the main ingestion logic.

Main areas that will need updates:

- `backend/src/lib/video-reuse.ts`
- `backend/src/routes/movie-status.ts`
- `backend/src/routes/trigger-ingestion.ts`
- `backend/src/routes/ingest.ts`
- `backend/src/queue/ingestion.ts`
- `backend/src/routes/cancel-job.ts`
- `backend/src/routes/stream.ts`
- `app/admin/(dashboard)/activedownloads/page.tsx`
- any direct `videos` table reads

### Implementation notes

#### Step 1: Add new identity tables

Add:

- `movies`
- `tv_series`
- `tv_episodes`

#### Step 2: Backfill identity records from existing data

From current `videos` rows:

- movie rows create `movies` entries
- TV rows create `tv_series` entries
- TV rows also create `tv_episodes` entries using:
  - current `tmdb_id` as series TMDB id
  - `season_number`
  - `episode_number`
  - `tmdb_episode_id` when present or backfilled later

#### Step 3: Link playback/ingestion rows to the new identity tables

Instead of relying on:

- `tmdb_media_type`
- `tmdb_id`
- `season_number`
- `episode_number`

the playback row should point to:

- `movie_id`
  or
- `tv_episode_id`

#### Step 4: Update reuse logic

Replace current reuse lookup rules with explicit foreign-key-based logic.

Current TV lookup is:

- series TMDB id
- season
- episode

Future TV lookup should prefer:

- `tv_episode_id`
  or
- `tmdb_episode_id`

#### Step 5: Update watch and ingestion flows

Movie watch flow should resolve against `movies`.

TV watch flow should resolve against `tv_episodes`.

#### Step 6: Remove old overloaded columns when migration is complete

Eventually we should reduce or remove legacy overloaded columns such as:

- `tmdb_media_type`
- mixed-use `tmdb_id`
- episode identity stored only through season/episode on the playback row

### First version decision

For the first implementation, the best practical linking strategy is:

- use `tmdb_series_id` on `tv_series`
- use `tmdb_episode_id` on `tv_episodes` when available
- always keep `season_number` + `episode_number`
- enforce unique `(series_id, season_number, episode_number)`

That gives us a stable relationship even before every historic row has a TMDB episode id.

### Status

- **Done (phase 1 — identity tables + FKs + dual-read)**

**Shipped**

- Migration [`supabase/migrations/20260405214849_add_media_identity_tables.sql`](supabase/migrations/20260405214849_add_media_identity_tables.sql): `movies`, `tv_series`, `tv_episodes`; nullable `videos.movie_id` / `videos.tv_episode_id`; backfill from existing `videos`; RLS enabled on identity tables (service role bypasses).
- Remote DB: apply the same SQL via Supabase MCP `apply_migration` (project `popotube`) or `supabase db push` so hosted Postgres matches the file.
- Backend: [`backend/src/lib/media-identity.ts`](backend/src/lib/media-identity.ts) (`ensureMovieRow`, `ensureTvEpisodeRow`, `resolveVideoIdentityInsertColumns`, `backfillVideoIdentityFksIfNeeded`); wired in [`trigger-ingestion.ts`](backend/src/routes/trigger-ingestion.ts), [`ingest.ts`](backend/src/routes/ingest.ts), [`ingestion.ts` worker](backend/src/queue/ingestion.ts).
- Reuse: [`backend/src/lib/video-reuse.ts`](backend/src/lib/video-reuse.ts) resolves via `movies` / `tv_episodes` FK first, then legacy `tmdb_id` + `tmdb_media_type` + season/episode.

**Deferred (phase 2 — hardening)**

- Step 6 above: drop or stop writing legacy `tmdb_id` / `tmdb_media_type` / season/episode on `videos` once all rows and callers use FKs only.
- Richer metadata on identity tables; admin UI joins.

---

## Suggested Migration Order

This order keeps risk lower. **Phases 1–5 are done** (see statuses in sections 1–7 and 4–6 above).

### Phase 1: Remove obvious Fastify pass-throughs — **Done**

- remove `app/api/backend/[...path]/route.ts`
- remove `app/api/search/route.ts`
- point admin pages straight to Fastify

### Phase 2: Remove public watch proxy routes — **Done**

- remove `app/api/public/movie-status/route.ts`
- remove `app/api/public/trigger-ingestion/route.ts`
- point watch hooks straight to Fastify

### Phase 3: Remove extra stream indirection — **Done**

- replace `/api/proxy/stream/:id` usage with direct Fastify stream URL
- remove rewrite dependency if no longer needed

### Phase 4: Clean up remaining Next.js API endpoints — **Done**

- move `torrentio/search` logic to Fastify
- review all `tmdb/*` API routes
- either move them to Fastify or replace them with server-rendered data loading

### Phase 5: Clean up direct browser-to-Supabase data paths — **Done**

- review `/admin/activedownloads`
- centralize backend data access in Fastify

---

## Files Most Likely To Change Later

_(Historical checklist: the Next.js routes below were **removed**; callers now hit Fastify via `NEXT_PUBLIC_BACKEND_URL` and `lib/backend-public-url.ts`.)_

### Next.js API routes to remove or reduce

- `app/api/public/movie-status/route.ts`
- `app/api/public/trigger-ingestion/route.ts`
- `app/api/search/route.ts`
- `app/api/backend/[...path]/route.ts`
- `app/api/torrentio/search/route.ts`
- `app/api/tmdb/trending/route.ts`
- `app/api/tmdb/search/route.ts`
- `app/api/tmdb/discover/route.ts`
- `app/api/tmdb/tv/season/route.ts`

### Frontend callers that will need fetch changes

- `hooks/useWatchIngestion.ts`
- `hooks/useTvEpisodeIngestion.ts`
- `components/public/watch/WatchPageShell.tsx`
- `components/public/WatchClient.tsx`
- `components/public/HeroBanner.tsx`
- `app/admin/(dashboard)/page.tsx`
- `app/admin/(dashboard)/settings/page.tsx`
- `app/admin/(dashboard)/settings/integrations/page.tsx`
- `app/admin/(dashboard)/activedownloads/page.tsx`
- `app/admin/(dashboard)/search-jackett/page.tsx`
- `app/admin/(dashboard)/search-torrentio/page.tsx`
- `app/admin/(dashboard)/torrents/page.tsx`
- `app/admin/(dashboard)/downloaded-unrestricted/page.tsx`

### Fastify side likely to expand

- `backend/src/index.ts`
- `backend/src/routes/movie-status.ts`
- `backend/src/routes/trigger-ingestion.ts`
- `backend/src/routes/ingest.ts`
- `backend/src/routes/search.ts`
- `backend/src/routes/stream.ts`
- new Fastify route for Torrentio admin search
- possible new Fastify routes for TMDB-backed browser data

---

## First Confirmed Improvement Added To This List

### Improvement

Remove the duplicate public watch API path:

```text
Browser -> Next.js public API -> Fastify -> Supabase
```

and replace it with:

```text
Browser -> Fastify -> Supabase
```

### Why

- simpler request flow
- fewer layers
- easier debugging
- one backend API instead of two

### Included similar cleanups

Yes. Any similar proxy-style process should be reviewed and removed so that the app moves toward one clean backend path.

---

## Notes

Phases 1–5 and backlog items **1–10** are implemented in the repo (Fastify-first browser API, CORS, `NEXT_PUBLIC_BACKEND_URL`, TMDB/Torrentio on Fastify, stream URLs, active downloads API).

**Item 11 (phase 1):** `movies` / `tv_series` / `tv_episodes` + `videos.movie_id` / `tv_episode_id` + backfill + backend upsert/reuse — see §11. **Phase 2** (drop legacy TMDB columns on `videos`) is still optional follow-up.

Ongoing hygiene:

1. Keep `NEXT_PUBLIC_BACKEND_URL` and `CORS_ORIGIN` aligned with production origins.
2. Regression-test public watch, admin pages, and streaming after backend or deploy changes.
