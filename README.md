# PoPoTube

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![Fastify](https://img.shields.io/badge/Fastify-5-black?logo=fastify)](https://fastify.dev/)
[![React](https://img.shields.io/badge/React-19-149eca?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Real-Debrid](https://img.shields.io/badge/Real--Debrid-Streaming-orange)](https://real-debrid.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20Realtime-3ecf8e?logo=supabase&logoColor=white)](https://supabase.com/)

PoPoTube is a self-hosted web application that lets you search for torrents via Jackett, instantly retrieve video files using **Real-Debrid**, and stream them directly in the browser — no local torrent clients, no disk storage, no transcoding delays.

The app integrates with **Torrentio** and **Comet** as torrent discovery sources alongside Jackett, with Real-Debrid handling downloads. The public watch flow now prefers Torrentio candidates that are already cached on Real-Debrid by checking torrent hash instant-availability before queueing ingestion. Videos are streamed via server-side proxy for seamless browser playback.

## ✨ Features

- **Torrent Search**: Integrated with Jackett, Torrentio, and Comet to search across public and private trackers.
- **Cache-Aware Selection**: Public playback prefers Torrentio candidates already available on Real-Debrid for faster startup.
- **Zero Local Storage**: Files are downloaded by Real-Debrid and streamed directly via HTTP — nothing touches your server's disk.
- **Instant Playback**: Completed downloads are unrestricted through Real-Debrid and proxied to the browser for immediate streaming.
- **Background Worker**: BullMQ + Redis ingestion pipeline with real-time progress updates via Supabase Realtime.
- **De-duplication**: Prevents re-downloading the same torrent via `info_hash` lookups.
- **Public Library**: Browse trending movies, search by genre, and watch — all from a Netflix-style UI.
- **Admin Dashboard**: Global control center with queue stats, Real-Debrid account health, and a torrent search + ingest workflow.

## 🏗️ Architecture Stack

- **Frontend**: Next.js 16 (App Router), React 19, Shadcn UI, Tailwind CSS 4
- **Backend**: Node.js, Fastify 5, TypeScript
- **Queue System**: BullMQ backed by Redis
- **Database**: Supabase (PostgreSQL + Realtime)
- **Torrent Search**: Jackett (Dockerized), Torrentio, Comet
- **Downloader**: Real-Debrid API
- **Stream Proxy**: Fastify reverse-proxy for browser-compatible playback
- **Planned**: MediaFlow Proxy for live transcoding of non-browser-native containers (MKV, AVI, etc.) into HLS

## 🔄 How It Works

```
User clicks "Watch" on a movie
        │
        ▼
  Torrentio fetches movie streams
  by TMDb/IMDb metadata
        │
        ▼
  Best Torrentio release is chosen
  from metadata (no RD hash probe)
        │
        ▼
  Real-Debrid downloads the torrent
  and provides a direct HTTP link
        │
        ▼
  Fastify proxies the stream to the
  browser for instant playback
```

## 🚀 Getting Started

### Docker Compose + Host Frontend (Recommended)

#### 1. Prerequisites

- [Docker](https://docs.docker.com/engine/install/) & Docker Compose
- A [Supabase](https://supabase.com/) project
- A [Real-Debrid](https://real-debrid.com/) Premium account

#### 2. Environment Variables

Create a `.env` file at the project root:

```ini
# Database / Supabase
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=<your-anon-key>
SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# Redis (For BullMQ)
REDIS_URL=redis://...

# Jackett
JACKETT_URL=http://127.0.0.1:9117
JACKETT_API_KEY=<your-jackett-api-key>

# Comet
COMET_URL=http://127.0.0.1:8000

# Backend
BACKEND_URL=http://127.0.0.1:3001

# TMDB
TMDB_API_KEY=<your-tmdb-api-key>

# Real-Debrid
REAL_DEBRID_API_KEY=<your-real-debrid-api-token>
```

#### 3. Build & Run

```bash
docker compose up -d --build   # Jackett + backend + Comet + Postgres
npm run dev                    # Frontend on the host
```

| Service     | URL                     |
| ----------- | ----------------------- |
| Frontend    | `http://localhost:3000` |
| Backend API | `http://localhost:3001` |
| Jackett UI  | `http://localhost:9117` |
| Comet       | `http://localhost:8000` |

#### 4. Configure Jackett

1. Open Jackett's web UI at port `9117` on localhost.
2. Copy the API Key from the top-right and add it to your `.env` as `JACKETT_API_KEY`.
3. Add your preferred indexers (e.g., 1337x, ThePirateBay, RARBG).
4. Restart the stack if needed: `docker compose down && docker compose up -d`.

### Local Development

```bash
# Install dependencies
npm install              # Frontend (root)
npm install --prefix backend  # Backend

# Start infra
docker compose up -d jackett comet comet-postgres
redis-server --daemonize yes

# Start backend (port 3001)
cd backend && npm run dev

# Start frontend (port 3000) in a separate terminal
npm run dev
```

Notes:

- The root `docker-compose.yml` does not run the frontend. Run Next.js on the host for fast refresh.
- Use `http://127.0.0.1:9117` for `JACKETT_URL` when the frontend is running on your machine.
- Do not run another Comet compose stack on port `8000` at the same time.

## 🗺️ Roadmap

- **MediaFlow Proxy**: Live transcoding of non-browser-native video containers (MKV, AVI, TS) into HLS for universal browser playback.
- **Torrentio / Comet deep integration**: Enhanced source selection and quality scoring.
- **Multi-provider support**: Pluggable debrid backends beyond Real-Debrid.

## 📝 License

MIT License. Feel free to fork and modify for your own personal media streaming setup.
