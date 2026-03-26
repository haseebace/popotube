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
| Frontend | `npm run dev` (from root) | 3000 | Next.js dev with Turbopack |
| Backend | `npm run dev` (from `backend/`) | 3001 | Uses `tsx watch` for hot-reload |
| Redis | `redis-server --daemonize yes` | 6379 | Required by backend (BullMQ) |

### Key Development Gotchas

- **Redis is required**: The backend will crash at startup if `REDIS_URL` is not set and Redis is not reachable. Start Redis before the backend.
- **`.env` file placement**: Both services read from the root `.env` file, but the backend's `redis.ts` and `supabase.ts` resolve dotenv relative to their own source paths. A symlink at `backend/.env -> ../.env` ensures all imports find the env vars correctly.
- **Supabase is soft-required**: The backend warns but starts without valid Supabase credentials. However, any route that touches the DB will fail.
- **External services**: Full end-to-end flows require Real-Debrid, Bunny Stream, Jackett, and TMDB API keys. The app runs structurally without them but API routes return errors.
- **Frontend rewrites**: The Next.js config proxies `/api/proxy/*` to `BACKEND_URL` (defaults to `http://127.0.0.1:3001`). No separate CORS config needed for local dev.
- **Frontend API proxy**: The frontend also proxies `/api/backend/*` to `http://127.0.0.1:3001/api/*` via a catch-all route handler (not a rewrite). The admin dashboard uses this path.
- **Admin auth**: The `/admin` route tree is protected by Supabase auth. Accessing `/admin` without a session redirects to `/admin/login`.
- **TMDB API key**: The homepage requires a `TMDB_API_KEY` env var (not listed in the README). Without it, the homepage shows "Loading..." indefinitely as all TMDB API routes return 500.

### Lint / Build / Test

- **Frontend lint**: `npx eslint .` (from root). Uses `eslint.config.mjs` with Next.js presets. Pre-existing warnings exist.
- **Backend type-check**: `npx tsc --noEmit` (from `backend/`). Clean.
- **Backend build**: `npm run build` (from `backend/`). Produces `dist/`.
- **No automated test suite**: The backend `test` script is a placeholder (`echo "Error: no test specified"`).
