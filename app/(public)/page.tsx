import React from "react";
import HeroBanner from "@/components/public/HeroBanner";
import MovieCategoryRow from "@/components/public/MovieCategoryRow";

// TMDB Watch Provider IDs (region: US)
const PROVIDERS = {
  netflix: { id: 8, label: "Netflix", color: "#E50914" },
  disney: { id: 337, label: "Disney+", color: "#113CCF" },
  max: { id: 1899, label: "Max", color: "#002BE7" },
  prime: { id: 9, label: "Prime Video", color: "#00A8E0" },
  appletv: { id: 350, label: "Apple TV+", color: "#555555" },
};

function providerEndpoint(id: number) {
  return `/api/tmdb/discover?with_watch_providers=${id}&watch_region=US`;
}

export default function PublicHomepage() {
  return (
    <div className="w-full max-w-[100vw] overflow-x-hidden flex-1 flex flex-col items-center">
      <HeroBanner />

      <div className="w-full pb-16 pt-4 space-y-6">
        {/* ── Trending ── */}
        <MovieCategoryRow
          title="Trending Today"
          endpoint="/api/tmdb/trending?time_window=day"
        />
        <MovieCategoryRow
          title="Trending This Week"
          endpoint="/api/tmdb/trending?time_window=week"
        />

        {/* ── Streaming Platforms ── */}
        <MovieCategoryRow
          title={
            <img
              src="https://cdn.jsdelivr.net/gh/glincker/thesvg@main/public/icons/netflix/wordmark.svg"
              className="h-12 w-auto"
              alt="Netflix"
            />
          }
          endpoint={providerEndpoint(PROVIDERS.netflix.id)}
        />
        <MovieCategoryRow
          title={
            <img
              src="https://cdn.jsdelivr.net/gh/glincker/thesvg@main/public/icons/disney/default.svg"
              className="h-18 w-auto"
              alt="Disney+"
            />
          }
          endpoint={providerEndpoint(PROVIDERS.disney.id)}
        />
        <MovieCategoryRow
          title={
            <img
              src="https://cdn.jsdelivr.net/gh/glincker/thesvg@main/public/icons/hbo-max/default.svg"
              className="h-20 w-auto"
              alt="Max"
            />
          }
          endpoint={providerEndpoint(PROVIDERS.max.id)}
        />
        <MovieCategoryRow
          title={
            <img
              src="https://thesvg.org/icons/amazon-prime/default.svg"
              className="h-20 w-auto"
              alt="Prime Video"
            />
          }
          endpoint={providerEndpoint(PROVIDERS.prime.id)}
        />
        <MovieCategoryRow
          title={
            <img
              src="https://cdn.jsdelivr.net/gh/glincker/thesvg@main/public/icons/apple-tv/default.svg"
              className="h-20 w-auto"
              alt="Apple TV+"
            />
          }
          endpoint={providerEndpoint(PROVIDERS.appletv.id)}
        />

        {/* ── Genres ── */}
        <MovieCategoryRow
          title="Action Movies"
          endpoint="/api/tmdb/discover?with_genres=28"
        />
        <MovieCategoryRow
          title="Comedy Movies"
          endpoint="/api/tmdb/discover?with_genres=35"
        />
      </div>
    </div>
  );
}
