# PoPoTube Development Task List

This document breaks down the Torrent → Bunny Stream Ingestion Platform into manageable, sequential development tasks based on the PRD.

---

## Phase 1: Foundation & Database Setup

- [x] **Task 1.1: Initialize Supabase Project**
  - [x] Log in to Supabase and navigate to the `popotube` project.
  - [x] Execute SQL to create the `videos` table with all columns (`id`, `info_hash`, `title`, `magnet_uri`, `size_bytes`, `bunny_video_id`, `stream_url`, `status`, `error_message`, `created_at`, `updated_at`).
  - [x] Add the `UNIQUE` constraint on `info_hash`.
  - [x] Create the `updated_at` trigger function and apply it to the `videos` table.
  - [x] Enable Row Level Security (RLS) on the `videos` table (restrict to `service_role` only).
  - [x] Create indexes on `info_hash` and `status`.
- [x] **Task 1.2: Configure Environment Variables**
  - [x] Add Supabase URL and `service_role` key to the backend/frontend `.env` files.
  - [x] Add Supabase public URL and anon key to the frontend `.env.local`.

---

## Phase 2: Fastify Backend Setup & Infrastructure

- [x] **Task 2.1: Initialize Fastify App**
  - [x] Create a new directory for the standalone Fastify backend (e.g., `backend/`).
  - [x] Initialize Node.js project (`npm init -y`) and install TypeScript, Fastify, Pino, and `@supabase/supabase-js`.
  - [x] Set up basic health check route (`GET /health`).
- [x] **Task 2.2: Setup Docker Stack (Local/VPS)**
  - [x] Create a `docker-compose.yml` defining Redis, qBittorrent-nox, and Nginx.
  - [x] Ensure proper volume mounting for qBittorrent config and downloads.
- [x] **Task 2.3: BullMQ Integration**
  - [x] Install BullMQ and ioredis in the Fastify app.
  - [x] Implement a Redis connection helper.
  - [x] Set up a BullMQ Queue (`ingestionQueue`) and a basic Worker that logs job processing.
  - [x] Optional: Integrate the BullMQ Board UI for debugging.

---

## Phase 3: Core API Endpoints

- [x] **Task 3.1: Build `POST /api/bunny-download` (Next.js or Fastify)**
  - [x] Parse incoming JSON body (`magnet`, `size`, `title`).
  - [x] Extract the 40-character `info_hash` from the magnet link.
  - [x] Perform database duplicate check/insert handling race conditions (try insert; if duplicate constraint violation, catch it and fetch existing record).
  - [x] If new, queue the job in BullMQ.
  - [x] Return standard JSON response containing `jobId` and `status`.

---

## Phase 4: Ingestion Pipeline (BullMQ Workers)

- [x] **Task 4.1: qBittorrent Downloader Logic (Status: `downloading_torrent`)**
  - [x] Integrate qBittorrent API (authentication, adding a magnet via API).
  - [x] Worker polls qBittorrent for torrent progress.
  - [x] Update Supabase status to `downloading_torrent`.
- [x] **Task 4.2: File Exposure via Nginx (Status: `exposing_http`)**
  - [x] Update Supabase status to `exposing_http`.
  - [x] Write utility function in Fastify to generate the MD5 Signed URL required by Nginx's `secure_link` module.
  - [x] Verify the signed URL actually returns the file when hit locally/externally.
# Task 4.3: Bunny Stream Ingestion (Status: `bunny_fetching`)
  - [x] Update Supabase status to `bunny_fetching`.
  - [x] Make a `POST` request to Bunny Stream's Fetch API using the Nginx Signed URL.
  - [x] Save the returned `bunny_video_id` to Supabase.
- [x] **Task 4.4: Bunny Encoding Poller (Status: `encoding`)**
  - [x] Update Supabase status to `encoding`.
  - [x] Poll the Bunny Stream API (`GET /library/{libraryId}/videos/{videoId}`) every X seconds.
  - [x] When status hits `3` (Finished), construct the final `stream_url`.
- [x] **Task 4.5: Completion Pipeline (Status: `completed` or `failed`)**
  - [x] Update Supabase status to `completed` and save `stream_url`.
  - [x] Trigger file cleanup: Instruct qBittorrent to delete the torrent AND local files.
  - [x] Implement global error handling in worker to transition status to `failed`, save `error_message`, and trigger cleanup.

---

## Phase 5: Next.js Frontend Integration

- [x] **Task 5.1: Wire the "Download Bunny" Button**
  - [x] Update `ResultCard` component in `/Home/page.tsx` to call `POST /api/backend/bunny-download` on click.
  - [x] Redirect user to the `/downloads` page when the request is successful.
- [x] **Task 5.2: Active Downloads Page (`/downloads`)**
  - [x] Setup Supabase Realtime client in Next.js (`@supabase/supabase-js` using standard anon key, watching the `videos` table).
  - [x] Fetch currently processing items on initial load.
  - [x] Subscribe to database changes to actively update the UI as the status progresses (`downloading_torrent` -> `completed`).
- [x] **Task 5.3: Library Page (`/library`)**
  - [x] Fetch and display all videos from the database where `status = 'completed'`.
  - [x] Implement a video player or link that handles the Bunny `stream_url`.

---

## Phase 6: Polish & Deployment

- [ ] **Task 6.1: Cleanup Routines and Resilience**
  - [x] Create a cron job or startup check that verifies disk space on the VPS before processing new jobs.
  - [ ] Test the failure states (e.g., bad magnet link, Bunny fetch timeout).
- [ ] **Task 6.2: Final Deployment**
  - [ ] Containerize the Fastify app.
  - [ ] Deploy Next.js to Vercel/VPS.
  - [ ] Configure actual domain names for Nginx and Fastify.
