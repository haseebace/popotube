# PoPoTube

PoPoTube is a scalable, self-hosted web application that lets you search for torrents, instantly retrieve them using Real-Debrid, and permanently ingest them into Bunny Stream for high-performance, edge-delivered HLS video playback.

This project bypasses local torrent clients, heavy storage requirements, and cloud provider P2P throttling by utilizing **Real-Debrid** as a lightning-fast download middleman, shipping gigabytes of video directly to **BunnyCDN** for web encoding.

## ✨ Features
- **Torrent Search**: Integrated with Jackett to search across dozens of public and private trackers instantly.
- **Zero Local Storage**: Files are downloaded by Real-Debrid and sent directly to Bunny Stream via HTTP, never touching your server's disk space.
- **Background Worker**: Managed by BullMQ and Redis, providing a resilient ingestion pipeline with progressive UI updates.
- **De-duplication**: Prevents downloading the same torrent twice via Supabase `info_hash` lookups.
- **Dashboard**: Track your current downloads, see completion percentages, and manage your streaming library.

## 🏗️ Architecture Stack
- **Frontend**: Next.js (App Router), React, Shadcn UI, Tailwind CSS
- **Backend**: Node.js, Fastify, TypeScript
- **Queue System**: BullMQ backed by Redis
- **Database**: Supabase (PostgreSQL)
- **Search Engine**: Jackett (Dockerized)
- **Downloader**: Real-Debrid API
- **CDN / Transcoder**: Bunny Stream

## 🚀 Getting Started (Docker Compose)

The easiest way to run PoPoTube is via Docker Compose.

### 1. Prerequisites
- [Docker](https://docs.docker.com/engine/install/) & Docker Compose
- A [Supabase](https://supabase.com/) project
- A [Bunny.net](https://bunny.net/) account and Stream Library
- A [Real-Debrid](https://real-debrid.com/) Premium account

### 2. Environment Variables
Create a single `.env` file at the root of the project with the following keys:

```ini
# Database / Supabase
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=<your-anon-key>
SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# Redis (For BullMQ)
REDIS_URL=redis://...

# Jackett
JACKETT_URL=http://jackett:9117
JACKETT_API_KEY=<your-jackett-api-key>

# Bunny Stream
BUNNY_API_KEY=<your-bunny-api-key>
BUNNY_LIBRARY_ID=<your-bunny-library-id>

# Real-Debrid
REAL_DEBRID_API_KEY=<your-real-debrid-api-token>
```

### 3. Build & Run
Run the following command to build the images and start the stack in detached mode:

```bash
docker compose up -d --build
```

- **Frontend**: `http://localhost:3000`
- **Backend API**: `http://localhost:3001`
- **Jackett UI**: `http://localhost:9117` (Used to configure your indexers/trackers)

### 4. Configure Jackett
1. Go to `http://localhost:9117`.
2. Grab the API Key from the top right and put it in your `.env` file (`JACKETT_API_KEY`).
3. Add your preferred indexers (e.g., 1337x, ThePirateBay).
4. Restart the stack (`docker compose down && docker compose up -d`) to apply the API key.

## 📝 License
MIT License. Feel free to fork and modify for your own personal media ingestion pipelines.
