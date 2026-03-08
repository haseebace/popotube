# PoPoTube: Torrent → Bunny Stream Ingestion Platform (v2: Real-Debrid Architecture)

## 1. Product Overview
PoPoTube v2 is a web application designed to allow users to search for torrents, instantly retrieve them via Real-Debrid, and permanently ingest them into Bunny Stream for high-performance, edge-delivered HLS video playback. 

By replacing local torrent clients (qBittorrent) with the Real-Debrid API, the platform eliminates the need for expensive local storage, bypasses ISP/Cloud Provider torrent throttling, and reduces ingestion time from hours to seconds for cached content.

## 2. Core Architecture

### Frontend (Next.js / React)
- **Framework**: Next.js (App Router)
- **UI Component Library**: Shadcn UI + Tailwind CSS
- **Core Pages**:
  1. `/Home`: Search engine interface (queries Jackett) offering "Download" buttons.
  2. `/downloads`: A real-time dashboard displaying active ingestion jobs (fetching from Real-Debrid → encoding in Bunny).
  3. `/library`: A catalog of all fully processed videos available for instant streaming.

### Backend (Node.js / Fastify)
- **Framework**: Fastify (TypeScript)
- **Queue/Worker System**: BullMQ backed by Redis for resilient, background job processing.
- **Database**: Supabase (PostgreSQL) — acts as the central source of truth for video metadata, job status, uniquely identifying duplicates via `info_hash`.
- **Search Provider**: Jackett (Dockerized locally for API access).
- **Download Provider**: Real-Debrid API (Replaces qBittorrent/Nginx).
- **CDN / Transcoder**: Bunny Stream.

### Deployment Environment
- **Platform**: Google Cloud VPS (or any standard Linux VM).
- **Containerization**: Docker Compose.
- **Containers**:
  - `frontend`: Next.js web application.
  - `backend`: Fastify API & BullMQ Ingestion Worker.
  - `jackett`: Search indexer API.
  - *(qBittorrent and Nginx file server have been removed in v2)*.

## 3. The Ingestion Pipeline (The "Happy Path")

When a user clicks "Download":
1. **Deduplication Check**: Backend checks Supabase for the torrent's `info_hash`. If it exists, the job is instantly skipped and the user is pointed to the existing Bunny Stream video.
2. **Real-Debrid Submission**: Backend sends the Magnet URI to the Real-Debrid API.
3. **Availability Check**:
   - *Cached*: Real-Debrid instantly provides a direct HTTP `.mp4`/`.mkv` link.
   - *Uncached*: Real-Debrid begins downloading the torrent to its own servers. The worker polls until Real-Debrid finishes and provides the link.
4. **Bunny Stream Ingestion**: The backend sends the direct Real-Debrid HTTP link to the Bunny Stream "Fetch Video" API. Bunny Stream downloads the file directly from Real-Debrid's massive data centers.
5. **Transcoding**: Bunny Stream converts the file into web-safe HLS chunks (`.ts`) and multiple resolutions.
6. **Completion**: The backend updates Supabase with the final `stream_url`. The video appears in the user's `/library`.

## 4. Key Improvements in v2
- **Zero Local Storage**: The VPS hard drive is completely bypassed. Files move directly from Real-Debrid to Bunny Stream.
- **Unthrottled Speed**: Real-Debrid handles the P2P swarm, bypassing Google Cloud's P2P traffic throttling.
- **Lower RAM Usage**: Removing qBittorrent frees up significant memory on the VPS.
- **Simplified Networking**: No need to securely expose local files via Nginx signed URLs.

## 5. Environment Variables Required
- `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` (Backend)
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` (Frontend)
- `REDIS_URL` (Backend)
- `BUNNY_API_KEY` / `BUNNY_LIBRARY_ID` (Backend)
- `REAL_DEBRID_API_KEY` (Backend - **NEW**)
- `JACKETT_URL` / `JACKETT_API_KEY` (Frontend API Route)
