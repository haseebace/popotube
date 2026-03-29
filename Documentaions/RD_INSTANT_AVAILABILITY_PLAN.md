# Real-Debrid Instant Availability Integration Plan

## Summary
Add a cache-aware selection stage to the public ingestion flow so Torrentio candidates are checked against Real-Debrid `GET /torrents/instantAvailability/{hash}` before choosing the torrent to ingest. The new behavior should prefer candidates that are already instantly downloadable on RD, while keeping the current Torrentio-first, `1080p+`-only flow and the existing BullMQ worker path for the final `addMagnet -> selectFiles -> unrestrict` steps.

## Implementation Changes

### 1. Extend the Real-Debrid client with cache-availability support
- Add a new RD client method in `backend/src/lib/real-debrid.ts` to call `GET /torrents/instantAvailability/{hash}`.
- Normalize the response into explicit typed structures instead of passing raw RD JSON around.
- Treat the endpoint as authenticated and rate-limited like the rest of the RD client.
- Log request timing with the existing RD request logger automatically via the axios interceptor.
- Add a helper that answers two implementation-level questions for a given hash:
  - `isInstantAvailable`: whether the RD response contains an `rd` host variant with at least one selectable file-set
  - `instantFileVariants`: the returned file-set variants, preserving file IDs and file metadata for optional later use
- Keep the implementation tolerant of empty or missing hash results. Empty result means “not instantly available,” not “hard failure.”

### 2. Introduce cached-aware candidate ranking in trigger-ingestion
- Update `backend/src/routes/trigger-ingestion.ts` so the selection pipeline becomes:
  1. resolve TMDb -> IMDb
  2. fetch Torrentio candidates
  3. filter to valid `1080p`, `1080i`, or `2160p` candidates
  4. extract `infoHash` for each valid candidate
  5. check RD instant availability for the candidate hashes
  6. rank candidates with cached candidates strongly preferred
  7. insert the selected torrent into `videos` and queue the existing worker
- Preserve the existing “reuse existing TMDB video” checks before and after search.
- Add a deterministic ranking rule so the implementer does not need to choose weights later:
  - first priority: `isInstantAvailable === true`
  - second priority: existing current score from `scoreTorrentResult`
  - third priority: more seeders
  - fourth priority: larger size only when score and cache status are tied
- Do not fall back to sub-1080p results. The current `1080p+` rule remains unchanged.
- If Torrentio returns valid candidates but none are cached, proceed with the current non-cached best candidate behavior.
- If RD availability checks fail transiently, degrade gracefully to current behavior instead of failing the request.
- Add a per-request timeout budget so instant-availability lookup does not make the route slower than the current path in the worst case:
  - use batched or concurrency-limited requests
  - cap concurrent RD cache checks to a small fixed number such as `5`
  - if availability checks exceed the timeout budget, continue with score-only ranking

### 3. Add explicit selection metadata and logs
- Expand route-level logs in `backend/src/routes/trigger-ingestion.ts` so the decision is visible in production:
  - `torrentio_result_count`
  - `valid_1080_plus_count`
  - `rd_cache_checked_count`
  - `rd_cached_count`
  - `selected_info_hash`
  - `selected_is_cached`
  - `selected_quality`
  - `selected_seeders`
  - `selected_size`
- Add one log line for the RD cache-check stage:
  - message: `Real-Debrid instant availability check completed`
  - fields: `duration_ms`, `checked_count`, `cached_count`
- Update the final “selected candidate” log so it explicitly includes `selected_is_cached`.
- Keep logger changes limited to content only; no formatter overhaul is needed.

### 4. Preserve the worker contract, but make it cache-aware in logs
- Do not bypass the BullMQ worker in v1. Continue sending the selected magnet through the existing queue in `backend/src/queue/ingestion.ts`.
- Add `rd_expected_cached` or equivalent metadata to the queued job payload so the worker logs can confirm whether the selected torrent was expected to be cached.
- Log the job start with that flag so it is easy to compare expected cache hits against actual timing.
- Do not change the worker’s functional sequence yet. Even cached torrents should still use:
  - `addMagnet`
  - `getTorrentInfo`
  - `selectFiles`
  - `unrestrictLink`
- Leave advanced optimizations, such as using instant-availability file IDs to influence file selection, out of v1 unless needed to resolve a concrete mismatch.

### 5. Keep frontend behavior unchanged for v1
- Do not change `components/public/WatchClient.tsx` in this phase.
- The frontend should continue polling status as it does today.
- The expected benefit comes from picking an RD-cached torrent more often, not from changing player behavior yet.
- If the backend returns a reused completed record as today, preserve that response shape exactly.

### 6. Define the response/typing additions explicitly
- Extend the internal Torrentio candidate type in `backend/src/routes/trigger-ingestion.ts` with:
  - `isInstantAvailable: boolean`
  - `instantAvailability?: <typed RD availability shape>`
- Extend the job payload type used by the ingestion worker with:
  - `rdExpectedCached?: boolean`
- No public API response shape changes are required for `/api/public/trigger-ingestion` or `/api/trigger-ingestion` in v1.
- No database migration is required in v1.
- Optional future extension, intentionally not in scope for v1:
  - persist `selected_is_cached` or cache-check diagnostics in the `videos` table

## Subtasks

### Subtask A: RD client support
- Add typed `instantAvailability` interfaces.
- Implement `getInstantAvailability(hash: string)`.
- Implement a helper to derive `isInstantAvailable` from the RD response.
- Add unit-level parsing coverage for representative RD payload shapes.

### Subtask B: Candidate enrichment
- Update Torrentio candidate normalization so every valid candidate has a normalized lowercase `infoHash`.
- Build a cache-check enrichment pass over the filtered `1080p+` candidates.
- Attach RD cache metadata to each candidate before ranking.

### Subtask C: Cached-first ranking
- Refactor the final candidate selection so cache status is part of the ordering contract.
- Preserve existing scoring logic, but move it behind the new first-order “cached beats uncached” rule.
- Ensure the chosen candidate always remains valid under the current quality filter.

### Subtask D: Logging and observability
- Add the cache-check summary log.
- Add cached-selection fields to the existing “best candidate selected” log.
- Add `rdExpectedCached` to job logs so timing comparisons can be made later.

### Subtask E: Verification
- Verify behavior with one movie whose chosen torrent is RD-cached.
- Verify behavior with one movie whose candidates are not RD-cached.
- Verify graceful fallback when RD instant-availability calls fail or time out.

## Test Plan
- Static checks:
  - backend type-check remains clean with `npx tsc --noEmit` from `backend/`
- Route-level behavior:
  - cached candidate available: route selects a cached candidate and logs `selected_is_cached=true`
  - no cached candidates: route still returns success and logs `selected_is_cached=false`
  - no valid `1080p+` candidates: route still returns `404` with the current quality-specific error
  - RD cache-check failure: route still completes using score-only fallback
- Worker behavior:
  - queued job includes `rdExpectedCached`
  - worker still completes the existing RD flow without contract changes
  - logs show faster end-to-end timing on cache-hit titles compared with non-cached titles
- Regression checks:
  - existing “reuse existing TMDB video” behavior still wins before a new Torrentio/RD lookup
  - admin/manual flows remain untouched
  - stream playback path remains unchanged once a video reaches `completed`

## Assumptions and Defaults
- `instantAvailability` is used as a ranking signal, not as a replacement for `addMagnet`.
- The cache check is treated as describing broader RD cache availability for the torrent hash; implementation should not depend on it being account-local.
- `1080p`, `1080i`, and `2160p` remain the only accepted qualities.
- No DB schema changes are made in v1.
- No frontend API contract changes are made in v1.
- If RD cache-check calls are partially unavailable, fallback is “continue with current scoring logic,” not “fail the request.”
