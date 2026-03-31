# PoPoTube

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![Fastify](https://img.shields.io/badge/Fastify-5-black?logo=fastify)](https://fastify.dev/)
[![React](https://img.shields.io/badge/React-19-149eca?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Real-Debrid](https://img.shields.io/badge/Real--Debrid-Streaming-orange)](https://real-debrid.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20Realtime-3ecf8e?logo=supabase&logoColor=white)](https://supabase.com/)

PoPoTube is a self-hosted web application that lets you search for torrents via Jackett, instantly retrieve video files using **Real-Debrid**, and stream them directly in the browser — no local torrent clients, no disk storage, no transcoding delays.

The app integrates with **Torrentio** as a torrent discovery source alongside Jackett, with Real-Debrid handling downloads. The public watch flow now prefers Torrentio candidates that are already cached on Real-Debrid by checking torrent hash instant-availability before queueing ingestion. Videos are streamed via server-side proxy for seamless browser playback.

## ✨ Features

- **Torrent Search**: Integrated with Jackett and Torrentio to search across public and private trackers.
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
- **Torrent Search**: Jackett (Dockerized), Torrentio
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

### Environment Templates

- Frontend template: [`.env.frontend.example`](.env.frontend.example)
- Backend template: [`backend/.env.example`](backend/.env.example)

Use them as source-of-truth for variable ownership:

- Frontend (Vercel): `BACKEND_URL`, `TMDB_*`, `NEXT_PUBLIC_SUPABASE_*`, optional `NEXT_PUBLIC_*` flags.
- Backend (VPS/local): `REDIS_URL`, `SUPABASE_*`, `REAL_DEBRID_API_KEY`, `JACKETT_*`, `MEDIAFLOW_*`, `BACKEND_INTERNAL_API_KEY`.

### Local Development (Host Frontend + Dockerized Backend/Jackett)

#### 1) Prerequisites

- [Docker](https://docs.docker.com/engine/install/) & Docker Compose
- Node.js + npm
- A [Supabase](https://supabase.com/) project
- A [Real-Debrid](https://real-debrid.com/) Premium account

#### 2) Configure Environment

Create root `.env` for local development (shared local runtime), and optionally `backend/.env` when running backend directly:

```bash
cp .env.frontend.example .env
cp backend/.env.example backend/.env
```

Then fill in real values.

#### 3) Install Dependencies

```bash
npm install
npm install --prefix backend
```

#### 4) Start Services

```bash
# Jackett + backend container
docker compose -f docker-compose.dev.yml up -d --build

# Frontend on host
npm run dev
```

| Service     | URL                     |
| ----------- | ----------------------- |
| Frontend    | `http://localhost:3000` |
| Backend API | `http://localhost:3001` |
| Jackett UI  | `http://localhost:9117` |

### Production Split Deployment

#### Frontend (Vercel)

- Deploy repository root as the Next.js project.
- Set Vercel environment variables:
  - `BACKEND_URL=https://<your-vps-api-domain>`
  - `TMDB_API_KEY`, `TMDB_BASE_URL`
  - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`

#### Backend (VPS)

Pick one:

1. **Docker Compose on VPS** using [`backend/docker-compose.vps.yml`](backend/docker-compose.vps.yml), or
2. **Process manager (systemd/pm2)** running `backend/dist/index.js`.

For Docker Compose flow:

```bash
cd backend
cp .env.example .env
docker compose -f docker-compose.vps.yml up -d --build
```

Expose backend through a domain/reverse proxy and set frontend `BACKEND_URL` to that public API origin.

### Cleanup / Removed Burden

The project now uses split deployment artifacts:

- Removed root `Dockerfile` (frontend deploys on Vercel directly).
- Removed root `docker-compose.yml` (replaced by:
  - `docker-compose.dev.yml` for local dev
  - `backend/docker-compose.vps.yml` for VPS backend stack).

## 🗺️ Roadmap

- **MediaFlow Proxy**: Live transcoding of non-browser-native video containers (MKV, AVI, TS) into HLS for universal browser playback.
- **Torrentio deep integration**: Enhanced source selection and quality scoring.
- **Multi-provider support**: Pluggable debrid backends beyond Real-Debrid.

## 📝 License

MIT License. Feel free to fork and modify for your own personal media streaming setup.
