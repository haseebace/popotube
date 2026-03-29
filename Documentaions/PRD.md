# Product Requirements Document (PRD)

> Legacy document. This file describes the deprecated Bunny-era architecture and is preserved for historical reference only. The live application now uses a Real-Debrid-first playback flow.

## Product Name
Torrent → Bunny Stream Ingestion Platform

---

# 1. Overview

This platform allows users to search for torrents and convert them into **streamable videos hosted on Bunny Stream**.

Users search for content on the website. The system retrieves torrent results from configured indexers using **Jackett**. Each result includes a **magnet link**.

When a user clicks **"Download Bunny"**, the platform:

1. Takes the magnet link and checks if the torrent has already been processed or is currently downloading.
2. If not processed:
   - Downloads the torrent via an isolated VPS torrent client.
   - Exposes the completed video temporarily via **secured, signed HTTP**.
   - Sends the HTTP URL to the **Bunny Stream** Fetch API.
3. Bunny Stream fetches the video, encodes it, and prepares it for distribution.
4. The backend polls Bunny Stream until encoding is finished.
5. The user receives a **permanent CDN streaming playback URL**.

---

# 2. Goals

### Primary Goals
- Convert torrent results into **streamable video links**
- Store videos permanently in Bunny Stream
- Prevent duplicate downloads and concurrent processing of the same file
- Securely transfer files without exposing the VPS to public web scraping
- Minimize VPS storage usage via aggressive cleanup routines

### Secondary Goals
- Provide quick streaming access
- Reduce infrastructure cost
- Allow scalable ingestion via queued jobs

---

# 3. Non-Goals

The platform will NOT:
- Host permanent video storage on the VPS
- Provide long-term torrent seeding services
- Provide torrent browsing beyond Jackett's indexed results
- Host its own video playback server infrastructure (Bunny handles all playback)

---

# 4. User Flow

### Search Flow
1. User searches for content on the frontend.
2. Backend queries **Jackett** API.
3. Torrent indexers return results.
4. Results are displayed to the user via UI cards.
   *Each result includes: title, size, seeders, magnet link, and a **Download Bunny** button.*

### Download Bunny Flow
1. User clicks **Download Bunny**.
2. Backend receives the magnet link and extracts the info hash.
3. Backend checks the Supabase database for duplicates or active locks.
4. If completed → returns existing stream URL immediately.
5. If processing → subscribes to live updates via Supabase Realtime.
6. If not found → adds job to BullMQ and starts the ingestion pipeline.

---

# 5. Core Architecture

## Hybrid Architecture

Two dedicated services, each doing what it does best:

```text
┌──────────────────────────────────────────┐
│         Next.js 16  (port 3000)          │
│  /Home, /search results UI               │
│  Shadcn UI · Zustand                     │
│  Supabase Realtime (live job status)     │
└───────────────────┬──────────────────────┘
                    │ internal API calls
┌───────────────────▼──────────────────────┐
│       Fastify Server  (port 4000)        │
│  POST /bunny-download                    │
│  GET  /job/:id                           │
│  GET  /search  →  Jackett                │
│  BullMQ Workers                          │
│  qBittorrent API integration             │
│  Bunny Stream API integration            │
│  Pino structured logging (built-in)      │
└───────┬──────────┬──────────┬────────────┘
        │          │          │
   ┌────▼───┐ ┌───▼────┐ ┌──▼──────────┐
   │ Redis  │ │  qBit  │ │  Supabase   │
   │ BullMQ │ │ (VPS)  │ │  Postgres   │
   └────────┘ └────────┘ └─────────────┘
                  │
              ┌───▼────┐
              │ Nginx  │
              │  HTTP  │ (Signed URLs)
              └───┬────┘
                  │
           ┌──────▼───────┐
           │ Bunny Stream │
           └──────────────┘
```

---

# 6. Duplicate Detection & Concurrency Locking

Duplicate prevention ensures we never waste bandwidth downloading or uploading the same file twice. 

Each torrent contains a unique 40-character **info hash** (e.g., from `magnet:?xt=urn:btih:ABC123DEF456`). 

## Concurrency Lock
If two users click "Download Bunny" on the exact same torrent at the exact same moment, the database could race. To prevent this:
- The system attempts an `INSERT` into the `videos` table with the `info_hash`.
- Because `info_hash` has a `UNIQUE` constraint, the second user's request will fail the insert and instead fallback to fetching the existing row.
- If the status is `submitted`, `downloading_torrent`, `exposing_http`, `bunny_fetching`, or `encoding`, the frontend simply attaches to the existing job and waits.

---

# 7. Proxy Ingestion Pipeline

The system uses a **Proxy Ingestion Architecture**. The VPS acts as a temporary proxy to pass downloaded files to Bunny Stream.

## Step-by-Step Pipeline
1. **Queueing**: Job enters BullMQ. Status: `submitted`.
2. **Download**: Fastify commands qBittorrent to add the magnet link. Status: `downloading_torrent`.
3. **Exposure**: When 100% downloaded, Fastify generates an Nginx secure token. Status: `exposing_http`.
4. **Bunny Ingestion**: Fastify calls Bunny's Fetch API with the signed URL. Status: `bunny_fetching`.
5. **Bunny Polling**: Fastify polls the Bunny API `GET /library/{libraryId}/videos/{videoId}`. 
   - Bunny is actively processing the file. Status: `encoding`.
6. **Completion**: Bunny status reaches `3` (Finished). Fastify constructs the final `stream_url`. Status: `completed`.
7. **Cleanup**: Fastify permanently deletes the file from qBittorrent and the VPS disk.

---

# 8. File Security & HTTP Exposure

**CRITICAL:** Bare files must NEVER be permanently exposed on the VPS. 

To allow Bunny Stream to fetch the file securely:
1. Nginx is configured with the `secure_link` module.
2. Fastify generates a cryptographically signed URL containing an expiration timestamp (e.g., `+60 minutes`) and an MD5 hash of the file path, expiration, and a secret key.
3. Example URL: `http://vps-domain.com/files/movie.mp4?md5=X&expires=Y`
4. If a user (or scraper) guesses the file path without the correct signature and active timestamp, Nginx returns `403 Forbidden`.
5. As an additional layer, Nginx optionally restricts access to Bunny Stream CDN IP origin blocks.

---

# 9. Storage Budget & Cleanup

The VPS storage is strictly a **passthrough buffer**.

- **Cleanup on Success**: Right after `completed`, the video file is deleted.
- **Cleanup on Failure**: If a job enters `failed`, the file must be wiped to prevent dead data accumulation.
- **Disk Budget Halt**: A system monitor checks VPS disk space. If free space drops below 10GB, BullMQ pauses processing new download tasks to prevent server crashes.

---

# 10. Job Status System

Each ingestion job goes through a strict state machine:

```text
submitted → downloading_torrent → exposing_http → bunny_fetching → encoding → completed
                                                                          ↘ failed
```

*(Note: `checking_duplicate` happens synchronously before the job is created).*

- **Polling implementation**: The frontend does not need to poll an API continuously. It subscribes to Supabase Realtime for the `videos` table, filtering by the specific `info_hash` to receive instant status updates.

---

# 11. API Design

## Submit Download (`POST /api/bunny-download`)
**Request:**
```json
{
  "magnet": "magnet:?xt=urn:btih:ABC123",
  "title": "Example Movie 1080p",
  "size": 1400000000 
}
```
**Response:**
```json
{
  "jobId": "uuid-1234",
  "infoHash": "ABC123",
  "status": "processing"
}
```

## Check Job Status (`GET /api/job/:infoHash`)
*(Only used as fallback or initial load, frontend relies on Supabase Realtime)*
**Response:**
```json
{
  "status": "encoding",
  "streamUrl": null
}
```

---

# 12. Tech Stack

## Frontend
| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | **Next.js 16** (App Router) | RSC, streaming, file-based routing |
| UI Library | **Shadcn UI** + Radix UI | Unstyled by default, component library |
| State Management | **Zustand** | Lightweight, for search + job polling state |
| Real-time Updates | **Supabase Realtime** | Subscribes to `videos` table for live job status |

## Backend API Server
| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | **Fastify** (port 4000) | Dedicated backend server, separate from Next.js |
| Logging | **Pino** + **pino-pretty** | Built-in to Fastify, zero config, beautiful terminal output |
| Job Queue | **BullMQ** | Persistent, retryable ingestion jobs |
| Queue Store | **Redis** | BullMQ backing store |
| Queue Dashboard | **BullMQ Board** | Web UI at `/admin/queues` — inspect, retry, drain jobs |

## Database
| Layer | Technology | Notes |
|-------|-----------|-------|
| Platform | **Supabase** (PostgreSQL 17) | Project: `popotube`, Region: eu-west-2 London |
| Client | `@supabase/supabase-js` | `service_role` key on backend only — no ORM needed |

## Torrent & File Pipeline
| Layer | Technology | Notes |
|-------|-----------|-------|
| Torrent Client | **qBittorrent-nox** | Runs as isolated Docker container, controlled via REST API |
| HTTP File Server | **Nginx** | Serves downloaded files via securely signed URLs |
| Video CDN | **Bunny Stream** | Ingestion via Fetch API, encoding, global CDN playback |

---

# 13. Infrastructure & Cost Model

**Estimated Cost Drivers:**
1. **VPS (Proxy Node)**: 4 vCPU, 8GB RAM, 100GB NVMe (approx. ~$15-20/mo). Bandwidth should ideally be unmetered or 10TB+ to handle torrent ingress and Bunny egress.
2. **Bunny Stream Storage**: $0.01 per GB per month for Edge Storage.
3. **Bunny Stream CDN Bandwidth**: $0.005 per GB for streaming delivery.

*A highly cost-effective setup, as the VPS stays fixed-cost, and Bunny charges fractions of a penny for the actual persistent video storage.*

---

# 14. Risks & Retry Policy

| Risk | Mitigation | Retry Policy |
|-----|-----|-----|
| Torrent stalls or has no seeders | Timeouts applied on download phase | Fails permanently after a set timeout (e.g. 24h). Requires user manual restart. |
| Fetch link to Bunny times out | Network transient errors | BullMQ auto-retries the `exposing_http` → `bunny_fetching` step up to 3 times with exponential backoff. |
| VPS runs out of Disk space | System halts new queues if disk < 10GB | New requests get a `503 Disk Full` error dynamically instead of crashing. |
| Bunny encoding fails | Invalid codec from source torrent | Fatal error. Mark as `failed` with `error_message`. Wipe file. |

---

# 15. Success Metrics

- **E2E Ingestion Time**: Average time from magnet submission to streamable URL.
- **Duplicate Prevention Savings**: GB of bandwidth saved per month by blocking duplicate downloads.
- **Cache Hit Rate**: Percentage of time a user clicks "Download Bunny" and instantly receives an existing URL.
- **VPS Uptime**: Avoiding Out-Of-Memory or Out-Of-Disk crashes under high load.

---

# 16. Supabase Infrastructure

## Project Details
| Field | Value |
|-------|-------|
| **Project Name** | popotube |
| **Project ID** | `flxpqgzgvadbnwizpwmo` |
| **Region** | eu-west-2 (London) |
| **Status** | Active |
| **Database** | PostgreSQL 17 |

## Database: `videos` Table
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `uuid` | PRIMARY KEY, default `gen_random_uuid()` | Auto-generated row ID |
| `info_hash` | `text` | NOT NULL, UNIQUE | Torrent info hash — used for duplicate detection |
| `title` | `text` | NOT NULL | Torrent title |
| `magnet_uri` | `text` | nullable | Full magnet link |
| `size_bytes` | `bigint` | nullable | File size in bytes |
| `bunny_video_id` | `text` | nullable | Bunny Stream video ID (set after ingestion) |
| `stream_url` | `text` | nullable | Final playback URL from Bunny |
| `status` | `text` | NOT NULL, default `submitted`, CHECK enum | Pipeline stage |
| `error_message` | `text` | nullable | Populated on failure |
| `created_at` | `timestamptz` | NOT NULL, default `NOW()` | Row creation time |
| `updated_at` | `timestamptz` | NOT NULL, default `NOW()` | Auto-updated via trigger |

### Indexes
| Index | Column | Purpose |
|-------|--------|---------|
| `idx_videos_info_hash` | `info_hash` | Fast duplicate lookups |
| `idx_videos_status` | `status` | Job queue filtering |

## Security Configuration
- **RLS (Row Level Security):** Enabled on `videos` table
- **Public access:** Disabled — no anon or public policies
- **Access model:** Backend only via `service_role` key (server-side API routes)
- **Function hardening:** `set_updated_at` trigger function has locked `search_path = ''` to prevent injection
