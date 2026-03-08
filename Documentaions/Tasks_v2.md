# PoPoTube v2 Development Task List (Real-Debrid Integration)

This document breaks down the migration from local qBittorrent/Nginx to the Real-Debrid API, based on the v2 architecture PRD.

---

## Phase 1: Authentication & Preparation

- [ ] **Task 1.1: Add Environment Variable**
  - [ ] Obtain a Real-Debrid API Key.
  - [ ] Add `REAL_DEBRID_API_KEY` to the `backend/.env` file.
  - [ ] Remove obsolete variables from `.env` (like `QBITTORRENT_URL`, `NGINX_SECURE_LINK_SECRET`).

---

## Phase 2: Refactoring Backend Services (Code Eradication)

- [ ] **Task 2.1: Delete qBittorrent Client**
  - [ ] Completely delete `backend/src/lib/qbittorrent.ts`.
- [ ] **Task 2.2: Delete Nginx Secure Links**
  - [ ] Completely delete `backend/src/lib/secure-link.ts`.
- [ ] **Task 2.3: Build Real-Debrid Client (`lib/real-debrid.ts`)**
  - [ ] Create an Axios instance pointing to `https://api.real-debrid.com/rest/1.0/` using the `Authorization: Bearer <API_KEY>` header.
  - [ ] Implement `addMagnet(magnet: string)`: Adds a magnet to Real-Debrid and returns the torrent ID.
  - [ ] Implement `getTorrentInfo(id: string)`: Checks if the torrent is ready (`status === 'downloaded'`).
  - [ ] Implement `selectFiles(id: string)`: Tells Real-Debrid to start processing the largest video file inside the torrent.
  - [ ] Implement `unrestrictLink(link: string)`: Converts the raw Real-Debrid file URL into a high-speed, direct HTTP `download` link.
  - [ ] Implement `deleteTorrent(id: string)`: Cleans up the torrent from the user's Real-Debrid dashboard when finished.

---

## Phase 3: Rewriting the Ingestion Worker (`queue/ingestion.ts`)

- [ ] **Task 3.1: Phase 1 (Real-Debrid Download)**
  - [ ] Remove all qBittorrent logic from the worker.
  - [ ] Submit the magnet to Real-Debrid -> Check if cached.
  - [ ] If not cached, poll Real-Debrid until it finishes downloading its own copy.
  - [ ] Select the video file inside the torrent.
- [ ] **Task 3.2: Phase 2 (Link Unrestricting / Bunny Handoff)**
  - [ ] Unrestrict the file link to get the final `.mp4`/`.mkv` URL from Real-Debrid.
  - [ ] Remove Nginx logic. Send this clean Real-Debrid link directly into `bunnyStreamClient.fetchVideo`.
  - [ ] Save the `bunny_video_id` to Supabase.
- [ ] **Task 3.3: Phase 3 (Bunny Encoding Poller)**
  - [ ] Retain the exact same Bunny Stream polling logic as v1 (wait for encoding, finalize `stream_url`).

---

## Phase 4: Container Cleanup & Deployment

- [ ] **Task 4.1: Update `docker-compose.yml`**
  - [ ] Completely delete the `qbittorrent` service block from the file.
  - [ ] Completely delete the `nginx` service block from the file.
  - [ ] Remove `depends_on: - qbittorrent` from frontend/backend.
  - [ ] Remove the `./media:/downloads` volume mounts from all containers since local storage is no longer needed.
- [ ] **Task 4.2: Build and Deploy**
  - [ ] Run `docker compose down`.
  - [ ] Run `docker compose build --no-cache`.
  - [ ] Run `docker compose up -d`.
  - [ ] Test the full pipeline to verify search -> Real-Debrid -> Bunny -> Playback works seamlessly.
