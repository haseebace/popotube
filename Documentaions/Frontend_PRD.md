# PoPoTube Frontend PRD (Public Showcase)

## 1. Overview
The goal of this phase is to build the "Public Showcase" for PoPoTube—a Netflix-style, automated streaming frontend. 
Because manually ingesting every movie is unscalable, we will implement an **On-Demand (Just-In-Time) Architecture**. The frontend will display a massive catalog of movies sourced from the **TMDb (The Movie Database) API**. When a user plays a movie, the system checks if we already have it in our Supabase playback library. If we do, it plays instantly. If not, it seamlessly triggers our backend Jackett/Real-Debrid ingestion pipeline in the background and presents a beautiful loading screen until the stream is ready.

## 2. Core Architecture: "On-Demand" Pipeline
1. **Browse**: User visits the site. The homepage (`/`) fetches "Trending", "Popular", and "Top Rated" movies directly from the **TMDb API**.
2. **Details**: User clicks a movie and is taken to the details/player page (`/watch/[tmdb_id]`).
3. **The Interception Check**:
   - The frontend checks our Supabase database for the `tmdb_id`.
   - **Cache Hit**: If the movie exists and `status === 'completed'`, the player instantly loads the `stream_url` or `playback_source`.
   - **Cache Miss**: If the movie is missing, the frontend sends a request to our backend (`POST /api/public/watch-demand`). The backend queries Jackett using the movie title/year, picks the best magnet, and throws it into the BullMQ `ingestionQueue`.
4. **The Waiting Room**: While the movie is being resolved through Real-Debrid, the user sees a "Setting up secure stream..." cinematic loading UI that polls the database for progress.
5. **Playback**: Once the playback source is ready, the player appears, and the movie starts.

## 3. URLs and Routing

As outlined in the architecture plan, the public frontend will utilize the following routes, completely separated from the `/admin` dashboard.

| Route | Purpose | Description |
| :--- | :--- | :--- |
| `/` | Landing / Home | The main Netflix-style homepage. Features dynamic rows (Trending, Action, Comedy) powered by TMDb. |
| `/watch/[tmdb_id]` | Video Player & Loading | The dedicated movie page. Handles the caching logic, the ingestion loading screen, and the final direct/HLS player. |
| `/search` | Public Search | A dedicated search page targeting the TMDb API to find any movie globally. |
| `/categories/[genre]` | Genre Filtering | Browse TMDb movies filtered by specific genres. |

## 4. UI/UX Design Requirements (Netflix Clone Aesthetic)
- **Dark Mode Default**: Deep blacks (`#141414`), Netflix Red (`#E50914`), and stark white text.
- **Hero Banner**: The `/` homepage will feature a massive auto-playing trailer (or static large backdrop) of the #1 Trending movie.
- **Horizontal Carousels**: Movie rows (Trending Now, Top Rated, etc.) should be horizontally scrollable with hover-to-expand micro-animations.
- **The Player**: The direct/HLS player will utilize the custom CSS injected previously to maintain the cinematic, oversized-controls look.

## 5. Required APIs (To Be Built)
### Public Application APIs (Next.js App Router)
- `GET /api/tmdb/trending` - Proxy to fetch trending movies securely without exposing the TMDb API key.
- `GET /api/tmdb/search?query=...` - Proxy for searching TMDb.
- `GET /api/public/movie-status?tmdb_id=...` - Checks our Supabase database to see if a specific TMDb ID has been ingested yet, and returns its status/progress.
- `POST /api/public/trigger-ingestion` - Kicks off the BullMQ Jackett -> Real-Debrid pipeline for a requested TMDb ID.

## 6. Execution Plan
1. **TMDb Integration Setup**: Securely store the TMDb API key in `.env` and create API utility functions to fetch movie data.
2. **Homepage Layout (`/`)**: Build the cinematic Hero section and horizontal movie carousels.
3. **Search Page (`/search`)**: Build a real-time search interface querying TMDb.
4. **The Watch/Intercept Page (`/watch/[tmdb_id]`)**: 
   - Build the UI for the movie details (Synopsis, Poster, Cast).
   - Implement the "Supabase Check" logic.
   - Build the "Loading / Ingestion" polling UI.
5. **Backend Bridge**: Connect the public `trigger-ingestion` endpoint to our ingestion logic, modifying it to accept and store the `tmdb_id` in Supabase alongside the movie data.
