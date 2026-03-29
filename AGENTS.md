# AGENTS.md

## Cursor Cloud specific instructions

### Project Structure

PoPoTube is a two-package Node.js project (not a monorepo workspace):

- **Frontend** (root `/workspace`): Next.js 16 App Router, React 19, Tailwind CSS 4, Shadcn UI. Scripts in `package.json`.
- **Backend** (`/workspace/backend`): Fastify 5, BullMQ, TypeScript. Scripts in `backend/package.json`.

Both packages use **npm** with lockfiles. Run `npm install` separately in each directory.

### Running Services

| Service | Command | Port | Notes |
|---------|---------|------|-------|
| Frontend | `npm run dev` (from root) | 3000 | **Host only** — Next.js dev with Turbopack (not started by root `docker-compose.yml`) |
| Backend | `npm run dev` (from `backend/`) | 3001 | Local dev with `tsx watch`, or run in Docker via `docker compose up backend` |
| Redis | `redis-server --daemonize yes` | 6379 | Required by backend (BullMQ) |
| Docker stack | `docker compose up -d` (repo root) | 9117 / 3001 / 8000 | **Jackett**, **backend**, **Comet**, and **comet-postgres** — see root `docker-compose.yml` |

**Docker Compose (repo root):** starts **Jackett**, **backend**, **Comet**, and **comet-postgres** only. The **Next.js app is not in Compose**; use `npm run dev` locally for fast refresh. In `.env`, point `JACKETT_URL` / `COMET_URL` / `BACKEND_URL` at `http://127.0.0.1:…` so the host dev server can reach published ports. The **backend container** sets `JACKETT_URL=http://jackett:9117` so it reaches Jackett by Docker service name.

**Do not use `http://host.docker.internal:9117` for `JACKETT_URL` when Next runs on your machine** — that hostname is for processes *inside* Docker to reach the host. Use `http://127.0.0.1:9117` (or `localhost`) so API routes can reach Jackett’s published port.

**Duplicate Comet:** root `docker-compose.yml` publishes Comet on **port 8000**. Do **not** run the separate `comet-deploy /docker-compose.yml` stack at the same time (it also uses port 8000) — stop one stack or remove the duplicate to avoid clashes.

### Key Development Gotchas

- **Redis is required**: The backend will crash at startup if `REDIS_URL` is not set and Redis is not reachable. Start Redis before the backend.
- **`.env` file placement**: Both services read from the root `.env` file, but the backend's `redis.ts` and `supabase.ts` resolve dotenv relative to their own source paths. A symlink at `backend/.env -> ../.env` ensures all imports find the env vars correctly.
- **Supabase is soft-required**: The backend warns but starts without valid Supabase credentials. However, any route that touches the DB will fail.
- **External services**: Full end-to-end flows require Real-Debrid, Jackett, and TMDB API keys. BunnyCDN has been removed from the architecture. The app runs structurally without external keys but API routes return errors.
- **Public playback flow**: Poster-click playback is metadata-driven. The backend resolves TMDb -> IMDb, queries Torrentio, filters to `1080p+`, checks Real-Debrid instant availability by torrent hash, prefers cached candidates, then queues the existing ingestion worker.
- **Frontend rewrites**: The Next.js config proxies `/api/proxy/*` to `BACKEND_URL` (defaults to `http://127.0.0.1:3001`). No separate CORS config needed for local dev.
- **Frontend API proxy**: The frontend also proxies `/api/backend/*` to `http://127.0.0.1:3001/api/*` via a catch-all route handler (not a rewrite). The admin dashboard uses this path.
- **Admin auth**: The `/admin` route tree is protected by Supabase auth. Accessing `/admin` without a session redirects to `/admin/login`.
- **TMDB API key**: The homepage requires a `TMDB_API_KEY` env var. Without it, the homepage shows "Loading..." indefinitely as all TMDB API routes return 500.

### Lint / Build / Test

- **Frontend lint**: `npx eslint .` (from root). Uses `eslint.config.mjs` with Next.js presets. Pre-existing warnings exist.
- **Backend type-check**: `npx tsc --noEmit` (from `backend/`). Clean.
- **Backend build**: `npm run build` (from `backend/`). Produces `dist/`.
- **No automated test suite**: The backend `test` script is a placeholder (`echo "Error: no test specified"`).
