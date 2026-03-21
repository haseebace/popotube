# PopoTube Routing & API Documentation

This document provides a comprehensive overview of every URL page route and API endpoint available in the PopoTube application. It covers both the public-facing Next.js frontend, administrative pages, frontend API proxies to third parties (like TMDB/Jackett), and the Fastify-based Node.js backend handling the core business logic.

---

## 🖥 1. Frontend Page URLs (Next.js Application)

These are the user-accessible and administrator-accessible pages served by the Next.js App Router (`app/` directory).

### Platform Application Routes
* **`/`** – **Home Page**: The primary landing page for users. Highly discoverable UI for watching media.
* **`/search`** – **Global Search**: User-facing interface for querying available movies/shows via TMDB.
* **`/categories`** – **Categories Hub**: Displays available genres to browse.
* **`/categories/[genre]`** – **Genre View**: Displays TMDB discover results filtered by the specified genre.
* **`/watch/[tmdb_id]`** – **Player Page**: The video playback experience. Detects the movie status using `tmdb_id`, triggers ingestion if it hasn't been downloaded yet, and embeds the core media player to stream the content if ready.

### Administrative Routes
* **`/admin`** – **Dashboard**: Main overview for administrators.
* **`/admin/login`** – **Auth Entry**: Admin authentication gate/login page.
* **`/admin/downloads`** – **Active Jobs Management**: A dashboard for viewing the active queue of progressing, pending, and failed BullMQ torrent download jobs.
* **`/admin/library`** – **Content Library**: View all downloaded or available media items in Real-Debrid.
* **`/admin/search`** – **Manual Torrent Search**: Manual Jackett search UI for administrators to forcefully ingest magnet links that the automatic metadata-scraper might have missed. 
* **`/admin/settings`** – **Settings Configuration**: Management of system settings.

---

## 🌐 2. Frontend API Endpoints (Next.js Route Handlers)

These Node serverless endpoint routes (`app/api/`) sit between the browser UI and our core data sources to ensure API keys (TMDB, Jackett) are protected and bypass CORS.

* **`ALL /api/backend/[...path]`**
  * **Role**: Dynamic proxy router.
  * **Description**: Securely proxies any `GET`, `POST`, `PUT`, `DELETE` or `PATCH` requests directly to the internal Fastify backend. Ensures frontend can transparently communicate with backend while circumventing Next.js complexities or CORS issues.
* **`GET /api/public/movie-status?tmdb_id=<id>`**
  * **Role**: Public checking endpoint.
  * **Description**: Queries the backend service to verify the current download progress or readiness of a video by its TMDB ID. Used mostly on the `/watch/[tmdb_id]` page to poll progress.
* **`POST /api/public/trigger-ingestion`**
  * **Role**: Triggering endpoint for users.
  * **Body**: `{ "tmdb_id": 1234, "title": "Movie Name", "year": "2023" }`
  * **Description**: Forwards an automated request to the backend to kick off a search, scraping, and Real-Debrid download flow for the requested video.
* **`GET /api/search?q=<query>`**
  * **Role**: Direct Torrent Metadata Scraper.
  * **Description**: Bypasses TMDB to query Jackett indexers natively for raw torrent results. Maps and normalizes the incoming data into strict `{ title, tracker, size, seeders, magnetUri... }` JSON structs. Highly utilized by the Admin Search UI.
* **`GET /api/tmdb/discover?with_genres=<id>&page=<n>&sort_by=<param>`**
  * **Role**: TMDB Proxy.
  * **Description**: Resolves `TMDB_API_KEY` and forwards queries to the TMDB `/discover` API for paginated catalog browsing. Caches the responses.
* **`GET /api/tmdb/search?query=<text>&page=<n>`**
  * **Role**: TMDB Proxy.
  * **Description**: Proxies queries safely to the TMDB `/search/movie` API. Used by the platform search bars.
* **`GET /api/tmdb/trending?time_window=<day|week>&page=<n>`**
  * **Role**: TMDB Proxy.
  * **Description**: Quickly gets trending movies for the Homepage feeds. Request caching ensures we do not hit TMDB API rate limits.

---

## ⚙️ 3. Backend API Endpoints (Fastify / Node.js)

These underlying services interact with the Database (Supabase), Real-Debrid API, and construct background worker queues using BullMQ. 

Base endpoint for backend via docker composition is `http://backend:3001` or through frontend proxy `http://localhost:3000/api/backend/`.

### Ingestion & Job Management
* **`POST /api/ingest`**
  * **Body**: `{ "magnet": "urn:btih...", "size": 12345, "title": "Movie", "tmdb_id": 123 }` 
  * **Description**: Validates the magnet link, attempts to insert/update a video record in the Supabase `videos` table resolving duplicate key violations intelligently. Finally, submits the download job directly to the BullMQ ingestion pipeline.
* **`POST /api/trigger-ingestion`**
  * **Body**: `{ "tmdb_id": 1234, "title": "Movie Name", "year": "2023" }`
  * **Description**: The high-level automatic fetcher. It calls out to Jackett API dynamically using the `title` and `year` to discover magnet links. Runs a **Scoring Algorithm** (`Score = Seeders / (SizeGB)`) to select the most efficient streaming quality to use. Once found, inserts the torrent into the Supabase database and queues a `download` job.
* **`POST /api/cancel-job`**
  * **Body**: `{ "videoId": "uuid-here" }`
  * **Description**: Cancels a pending, retrying, or active download job. Purges the record from the Supabase database. Background worker instances are coded to halt execution and clean up Real-Debrid connections once their underlying Database record is destroyed.

### Playback & Stream State
* **`GET /api/movie-status?tmdb_id=<id>`**
  * **Description**: Queries the `videos` table mapped to this specific TMDB ID. Serves state tracking data representing the download progress bar, playback stream URL, or any ingestion `error_message` preventing playback.
* **`GET /api/stream/:videoId`**
  * **Description**: Seamless video streaming proxy. Fetches the cached stream playback URL from Real-Debrid via Supabase data. Pipes the stream buffers backwards transparently to the user, deliberately scrubbing the `Content-Disposition` headers so web browsers cleanly run native inline `<video>` tags instead of triggering a file download.

### Library Administration
* **`GET /api/library?page=1&limit=50`**
  * **Description**: Fetches current torrents sitting inside the user's authentic Real-Debrid account. Returns data representing what has been cached remotely.
* **`DELETE /api/library/:id`**
  * **Description**: Interacts with Real-Debrid to obliterate an unwanted torrent permanently from the network.

### System & Health Checks
* **`GET /health`**
  * **Description**: Fastify healthcheck answering with `{ "status": "ok", "timestamp": "current_time" }`. Useful for Docker Compose readiness probes.
* **`ALL /admin/queues`** *(UI Interface)*
  * **Description**: This is not an API endpoint, but an entire graphical interface mounted over `/admin/queues` generated by `@bull-board`. It allows developers or administrators low-level insights into Redis / BullMQ worker pipelines to pause, retry, or wipe queued background jobs.
