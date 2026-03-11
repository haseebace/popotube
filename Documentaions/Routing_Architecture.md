# PoPoTube Routing & Architecture Plan

This document outlines the URL structure for PoPoTube, clearly separating the **Public Showcase** (what visitors see) from the **Admin Dashboard** (the ingestion engine for managing content).

## 1. Public Showcase (Unauthenticated)
These routes are publicly accessible. They serve the end-user experience, allowing anyone to browse, search, and watch fully processed videos from Bunny Stream.

| Route | Purpose | Description |
| :--- | :--- | :--- |
| `/` | Landing / Home | The main Netflix-style homepage. Features trending or recently added movies from the Supabase `videos` table. |
| `/watch/[id]` | Video Player | The dedicated movie page. This loads the `stream_url` from Bunny CDN and provides the viewing experience. |
| `/search` | Public Search | A search page that **only queries our Supabase database**. It does NOT scrape torrents. |
| `/categories/[genre]` | Genre Filtering | (Optional Future Feature) Browse movies by genre. |

---

## 2. Admin Dashboard (Authenticated)
These routes are strictly protected. They power the ingestion engine (Jackett -> Real-Debrid -> BunnyCDN) and must be locked behind authentication (e.g., Supabase Auth or Basic Auth). 

Everything here exists under the `/admin` prefix.

| Route | Purpose | Description |
| :--- | :--- | :--- |
| `/admin/login` | Authentication | The secure gateway. Redirects unauthorized users here. |
| `/admin` | Dashboard Overview | High-level stats: active active downloads, total movies, available disk space, etc. |
| `/admin/search` | Torrent Scraper | (Formerly `/Home`). Queries Jackett, displays magnets, and triggers the `bunny-download` queue. |
| `/admin/downloads` | Ingestion Tracker | (Formerly `/downloads`). Monitors Real-Debrid and Bunny Stream progress in real-time. |
| `/admin/library` | Content Manager | (Formerly `/library`). View, edit metadata, or delete fully completed videos from the database. |
| `/admin/settings` | Configuration | Manage API keys, indexers, or application preferences. |

---

## 3. API Routes Structure
Our backend Next.js and Fastify API routes should follow a similar logical separation to ensure public users cannot trigger admin actions.

### Public APIs
- `GET /api/public/videos` - Fetch latest videos for the homepage.
- `GET /api/public/videos/[id]` - Fetch details and streaming link for a specific video.

### Admin APIs (Secured)
- `POST /api/bunny-download` - Trigger torrent ingestion.
- `POST /api/cancel-job` - Cancel an active download/ingestion job.
- `DELETE /api/videos/[id]` - Remove a video from the library.

---

## 4. Next Steps & Execution Plan
To implement this architecture, we will follow these steps:
1. **Directory Restructuring**: Move the existing `app/Home`, `app/downloads`, and `app/library` folders into a new `app/admin/...` directory.
2. **Sidebar Update**: Update `components/ui/sidebar.tsx` to point to the new `/admin/...` paths.
3. **Authentication Layer**: Implement Next.js `middleware.ts` to automatically block all requests starting with `/admin` unless the user is securely logged in.
4. **Public Layout Setup**: Create a new transparent, Netflix-style `layout.tsx` at the root `app/` level, completely independent of the Admin sidebar.
