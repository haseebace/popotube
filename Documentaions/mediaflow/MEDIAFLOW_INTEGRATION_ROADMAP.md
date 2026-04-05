# MediaFlow Integration Roadmap (PoPoTube)

This roadmap is written for your current stack:

- Next.js frontend
- Fastify backend
- BullMQ ingestion worker
- Real-Debrid source links
- MediaFlow Proxy (self-hosted, e.g. GCP Compute Engine)

Goal:

- Play non-browser-compatible files (like many MKV links) in browser.
- Keep playback fast.
- Keep Real-Debrid links hidden from the client.

---

## Current Status (Already Achieved)

Date: 2026-03-30

Verified setup:

- `MEDIAFLOW_BASE_URL` is set to:
  - `http://35.224.213.146:8888` (example: GCP VM; use HTTPS + domain when ready)
- Root app `.env` includes:
  - `MEDIAFLOW_BASE_URL`
  - `MEDIAFLOW_API_PASSWORD`
  - `MEDIAFLOW_ENABLED=true`
- MediaFlow health check works:
  - `GET /health` -> `200` with `{"status":"healthy"}`
- Password-protected endpoint works with current password:
  - `GET /proxy/ip?api_password=...` -> `200`
  - Current reported MediaFlow public IP: `54.177.170.222`

What this confirms:

- MediaFlow instance is reachable at `MEDIAFLOW_BASE_URL`.
- API password is now synchronized between Railway and local `.env`.
- Backend can safely proceed with authenticated MediaFlow integration work.

---

## What MediaFlow gives us (from your docs)

Useful endpoints for this project:

- `GET /proxy/stream` -> proxy direct file links
- `GET /proxy/transcode/playlist.m3u8` -> on-the-fly HLS transcoding (browser-safe fallback)
- `GET /proxy/ip` -> verify MediaFlow egress/public IP

Useful configuration:

- `API_PASSWORD` -> protect your MediaFlow instance
- `ENABLE_HLS_PREBUFFER` and related HLS cache env vars -> smoother playback
- `REDIS_URL` -> recommended for multi-worker stability/caching
- `FORWARDED_ALLOW_IPS` -> trusted forwarded headers setup behind Railway/reverse proxies

---

## Important design decision

Do not send raw Real-Debrid URLs to browsers.

Always go:

1. Backend gets RD URL
2. Backend builds MediaFlow URL
3. Frontend plays MediaFlow URL

This gives better control, easier failover, and less account/IP exposure.

---

## Phase 0: Baseline and safety checks

Objective:

- Confirm current behavior and add observability before changing playback source logic.

Tasks:

1. Verify MediaFlow health from backend:
   - call `/health`
   - call `/proxy/ip`
2. Add environment variables in app backend:
   - `MEDIAFLOW_BASE_URL`
   - `MEDIAFLOW_API_PASSWORD` (if used)
   - `MEDIAFLOW_ENABLED=true|false`
3. Add backend logs for source selection:
   - selected playback source type
   - fallback reason
   - URL type (`direct`, `mediaflow-stream`, `mediaflow-transcode-hls`)

Code touch points:

- `backend/src/queue/ingestion.ts`
- `backend/src/lib/logger.ts`

Exit criteria:

- Backend can reach MediaFlow.
- Logs clearly show current source decision per title.

---

## Phase 1: Build MediaFlow URL helper layer

Objective:

- Centralize MediaFlow URL generation in one backend utility.

Tasks:

1. Create a helper module (example file):
   - `backend/src/lib/mediaflow.ts`
2. Implement URL builders:
   - `buildMediaflowStreamUrl(rdUrl, options)`
   - `buildMediaflowTranscodeHlsUrl(rdUrl, options)`
3. Support optional API password and optional request headers in URL params.
4. Add small validation:
   - reject empty or invalid URLs
   - normalize output type enum

Code touch points:

- New: `backend/src/lib/mediaflow.ts`
- Use from: `backend/src/queue/ingestion.ts`

Exit criteria:

- Given an RD URL, helper returns valid MediaFlow URLs for stream and transcode-HLS.

---

## Phase 2: Source selection policy (fast path + fallback)

Objective:

- Keep fast playback for compatible links and auto-fallback for incompatible ones.

Policy:

1. If file is clearly browser-safe (`mp4`, maybe `webm`) -> use `mediaflow stream`.
2. If file is likely unsafe (`mkv`, unknown container, known unsupported codec) -> use `mediaflow transcode HLS`.
3. If stream path fails at runtime -> switch to transcode HLS and persist.

Tasks:

1. Extend playback source shape in DB usage:
   - include `playback_source.type` values:
     - `mediaflow_stream`
     - `mediaflow_transcode_hls`
2. In worker completion step:
   - build MediaFlow URL instead of exposing raw RD URL
   - save selected source in `playback_source.url`
3. Keep `stream_url` for backward compatibility if needed, but player should prefer `playback_source.url`.

Code touch points:

- `backend/src/queue/ingestion.ts`
- `lib/watch-playback.ts`

Exit criteria:

- Completed titles return MediaFlow URL for playback.
- MKV titles default to HLS/transcode path.

---

## Phase 3: Player and frontend behavior

Objective:

- Ensure the watch player handles both direct-like and HLS URLs cleanly.

Tasks:

1. In playback type detection:
   - if URL contains `.m3u8`, force HLS mime type.
2. Keep Video.js path as the primary player.
3. Add clear UI state:
   - "Optimizing stream..." for transcode startup delay.
4. Add retry strategy:
   - on initial playback error, call backend re-resolve endpoint to switch source to HLS.

Code touch points:

- `lib/watch-playback.ts`
- `components/public/watch/WatchPageShell.tsx`
- `components/public/watch/WatchNetflixPlayer.tsx`

Exit criteria:

- Player starts for both MP4 and MKV-backed titles.
- First-play errors can auto-recover by switching source.

---

## Phase 4: Railway and runtime tuning

Objective:

- Make transcoding stable and affordable on Railway.

Tasks:

1. Configure MediaFlow env on Railway:
   - `API_PASSWORD`
   - `ENABLE_HLS_PREBUFFER=true`
   - tune prebuffer values conservatively first
2. If using multiple workers/high load:
   - attach Redis (`REDIS_URL`) for shared cache/rate-limit coordination
3. Tune Gunicorn:
   - start with conservative workers
   - avoid too many workers on small Railway plans
4. Add health monitoring:
   - periodic backend check of `/health`
   - periodic log of `/proxy/ip` result

Exit criteria:

- Stable playback under normal load.
- No major buffering spike after a few concurrent users.

---

## Phase 5: Security hardening

Objective:

- Avoid open-proxy abuse and protect source URLs.

Tasks:

1. Enforce MediaFlow password usage from backend.
2. Do not expose raw RD links in frontend responses.
3. Optionally use encoded/encrypted MediaFlow URLs for client-facing playback links.
4. Add domain allowlist checks in backend before proxy URL generation.
5. Limit verbose logs so tokens/passwords never appear.

Code touch points:

- `backend/src/lib/mediaflow.ts`
- `backend/src/lib/logger.ts`
- `app/api/public/movie-status/route.ts`

Exit criteria:

- No sensitive URL/token leakage in browser or logs.

---

## Execution order (recommended)

1. Phase 0 (baseline)
2. Phase 1 (URL helper)
3. Phase 2 (source selection in worker)
4. Phase 3 (player fallback UX)
5. Phase 4 (Railway tuning)
6. Phase 5 (security hardening)

---

## Success metrics

Track these after rollout:

- Playback start time (P50/P95)
- Playback failure rate before first frame
- MKV success rate in browser
- Rebuffer events in first 60 seconds
- Worker completion-to-play latency

---

## Notes about Railway and IP behavior

- If all playback is routed through MediaFlow/backend, users do not need to hit Real-Debrid directly.
- That is usually what you want for consistency.
- But remember: one proxy egress can also become a bottleneck under heavy traffic, so monitor bandwidth and CPU.
