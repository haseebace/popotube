# PoPoTube Frontend Tasks

Based on the `Frontend_PRD.md`, here is a detailed, step-by-step breakdown of the tasks required to build the "Public Showcase" interface. For now, we are focusing on pure functionality using the default Shadcn UI (in light mode), similar to how our admin dashboard is built. We will add custom theming and a dark-mode Netflix look in a later iteration.

> **CRITICAL UI RULES:**
> - **Always use default shadcn components** without adding custom Tailwind `className` overrides or inline `style` props directly to them. 
> - **Wrap all distinct UI sections** tightly in `<div className="...">` containers, applying any necessary layout or spacing styles on the wrapper `div` instead of the shadcn component.

---

## Phase 1: Environment & API Setup
1. **Configure TMDb Environment Variables**
   - Add `TMDB_API_KEY` (and optionally `TMDB_BASE_URL`) to `.env.local`.
   - Ensure the variables are accessible to the Next.js backend.

2. **Create TMDb API Proxies (Next.js App Router)**
   - Create `app/api/tmdb/trending/route.ts` to perform a `GET` request to TMDb's trending endpoint securely on the server.
   - Create `app/api/tmdb/search/route.ts` to perform a `GET` request to search TMDb based on a URL query parameter.
   - Create `app/api/tmdb/details/route.ts` to fetch detailed movie metadata (synopsis, cast) via a specific `tmdb_id`.

3. **Database Preparation**
   - Check the Supabase `movies` table schema to ensure it has a `tmdb_id` column (likely integer or string) indexed for fast lookups. Add it if it's missing.

## Phase 2: Global UI Layout & Components (Public Route Group)
4. **Main Layout and Route Group**
   - Set up the public route group layout in `app/(public)/layout.tsx` to keep the public website completely separate from the `/admin` dashboard.
   - Use standard light mode / default Shadcn styling for now.
   
5. **Global Navbar Component**
   - Build a `Navbar` component wrapped in a `<header>` or `<nav>` div.
   - Include the PoPoTube Logo.
   - Use default Shadcn `NavigationMenu` or `Button` components for links (`/`, `/search`, `/categories`).

6. **Reusable Movie Card Component**
   - Create a basic "Movie Poster" card component. 
   - Wrap it in a `<div>` handling sizing or margins. 
   - Use Shadcn's default `Card` if needed, but remember to only style the wrapper `<div>`.

## Phase 3: Homepage (`app/(public)/page.tsx`) Structure
7. **Hero Banner Component**
   - Fetch the #1 trending movie from `/api/tmdb/trending`.
   - Create a basic `Hero` section wrapped in a `<div>` with the movie's backdrop or title.
   - Add default Shadcn `Button` elements within the Hero for "Play" and "More Info".

8. **Movie Lists / Grids**
   - Implement fetching for categories (e.g., "Trending Now", "Action", "Comedy").
   - For each section, create a wrapper `<div>` with a title (e.g., `<h2>Trending Now</h2>`).
   - Use a basic layout (like a grid or Shadcn `Carousel` with default styling) to display the `Movie Card` components.

## Phase 4: Search & Discovery Pages
9. **Search Interface (`app/(public)/search/page.tsx`)**
   - Create the search page layout wrapped in a main `<div>`.
   - Add a search bar using the standard Shadcn `Input` component, safely wrapped in its own `<div className="...">` for positioning.
   - Implement debounced search logic connecting to `/api/tmdb/search`.

10. **Search Results Grid**
    - Wrap the results section in a `<div>` formatted as a CSS Grid.
    - Dynamically render `Movie Card` components for the returned results.

11. **Categories Page (`app/(public)/categories/[genre]/page.tsx`)**
    - Similar to the Search page, create a grid layout wrapped in a `<div>`.
    - Fetch and display movies queried by genre ID from TMDb.

## Phase 5: The Watch / Intercept Architecture (`app/(public)/watch/[tmdb_id]/page.tsx`)
12. **Movie Details Layout**
    - Create the UI structure wrapped in a container `<div>`. 
    - Display the movie title, synopsis, poster, and cast using data from the TMDb details API.

13. **Implementation: "The Interception Check"**
    - Build an API endpoint `GET /api/public/movie-status?tmdb_id=[id]`. This queries Supabase to check if a movie with this `tmdb_id` exists.
    - On page load, the frontend hits this endpoint.

14. **Implementation: Cache Miss & Trigger Ingestion**
    - Create an API endpoint `POST /api/public/trigger-ingestion`.
    - If step 13 returns "Not Found", the frontend automatically sends a payload to `trigger-ingestion`.
    - The backend matches the title/year via Jackett, selects the magnet, and adds the job to the existing `ingestionQueue`.

15. **The Waiting Room UI (Processing state)**
    - While ingestion is happening, display a simple "Setting up stream..." UI. Wrap this screen in its own `<div>`.
    - Use standard Shadcn `Progress` or `Skeleton` components.
    - Setup a polling mechanism (e.g., every 5-10 seconds) on the frontend repeating the `GET /api/public/movie-status` check.

16. **Playback UI (Completed state)**
    - Once the polling returns `status === 'completed'` and provides a Bunny `stream_url`, transition the UI.
    - Hide the loading `<div>` and reveal the video player `<div>`.
    - Instantiate the Bunny Stream player.

## Phase 6: Backend Queue & Database Finalization
17. **Connecting the Pipeline**
    - Ensure the backend BullMQ worker processing `bunny-download` actions correctly logs the `tmdb_id` to Supabase alongside the final video URL.
    - Make sure the movie record updates its state (e.g., `pending` -> `downloading` -> `completed`) accurately so the frontend polling accurately reflects real-time status.
