# PoPoTube v2 Development Task List (Real-Debrid Integration)

This document breaks down the migration from local qBittorrent/Nginx to the Real-Debrid API, based on the v2 architecture PRD.

---

## Phase 1: Authentication & Preparation

- [x] **Task 1.1: Add Environment Variable**
  - [ ] Obtain a Real-Debrid API Key. (Waiting on user)
  - [x] Add `REAL_DEBRID_API_KEY` to the `backend/.env` file.
  - [x] Remove obsolete variables from `.env` (like `QBITTORRENT_URL`, `NGINX_SECURE_LINK_SECRET`).

---

## Phase 2: Refactoring Backend Services (Code Eradication)

- [x] **Task 2.1: Delete qBittorrent Client**
  - [x] Completely delete `backend/src/lib/qbittorrent.ts`.
- [x] **Task 2.2: Delete Nginx Secure Links**
  - [x] Completely delete `backend/src/lib/secure-link.ts`.
- [x] **Task 2.3: Build Real-Debrid Client (`lib/real-debrid.ts`)**
  - [x] Create an Axios instance pointing to `https://api.real-debrid.com/rest/1.0/` using the `Authorization: Bearer <API_KEY>` header.
  - [x] Implement `addMagnet(magnet: string)`: Adds a magnet to Real-Debrid and returns the torrent ID.
  - [x] Implement `getTorrentInfo(id: string)`: Checks if the torrent is ready (`status === 'downloaded'`).
  - [x] Implement `selectFiles(id: string)`: Tells Real-Debrid to start processing the largest video file inside the torrent.
  - [x] Implement `unrestrictLink(link: string)`: Converts the raw Real-Debrid file URL into a high-speed, direct HTTP `download` link.
  - [x] Implement `deleteTorrent(id: string)`: Cleans up the torrent from the user's Real-Debrid dashboard when finished.

---

## Phase 3: Rewriting the Ingestion Worker (`queue/ingestion.ts`)

- [x] **Task 3.1: Phase 1 (Real-Debrid Download)**
  - [x] Remove all qBittorrent logic from the worker.
  - [x] Submit the magnet to Real-Debrid -> Check if cached.
  - [x] If not cached, poll Real-Debrid until it finishes downloading its own copy.
  - [x] Select the video file inside the torrent.
- [x] **Task 3.2: Phase 2 (Link Unrestricting / Bunny Handoff)**
  - [x] Unrestrict the file link to get the final `.mp4`/`.mkv` URL from Real-Debrid.
  - [x] Remove Nginx logic. Send this clean Real-Debrid link directly into `bunnyStreamClient.fetchVideo`.
  - [x] Save the `bunny_video_id` to Supabase.
- [x] **Task 3.3: Phase 3 (Bunny Encoding Poller)**
  - [x] Retain the exact same Bunny Stream polling logic as v1 (wait for encoding, finalize `stream_url`).

---

## Phase 4: Container Cleanup & Deployment

- [x] **Task 4.1: Update `docker-compose.yml`**
  - [x] Completely delete the `qbittorrent` service block from the file.
  - [x] Completely delete the `nginx` service block from the file.
  - [x] Remove `depends_on: - qbittorrent` from frontend/backend.
  - [x] Remove the `./media:/downloads` volume mounts from all containers since local storage is no longer needed.
- [ ] **Task 4.2: Build and Deploy**
  - [x] Run `docker compose down`.
  - [x] Run `docker compose build --no-cache`.
  - [x] Run `docker compose up -d`.
  - [ ] Test the full pipeline to verify search -> Real-Debrid -> Bunny -> Playback works seamlessly.
