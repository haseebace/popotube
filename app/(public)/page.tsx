import React from 'react';
import HeroBanner from '@/components/public/HeroBanner';
import MovieCategoryRow from '@/components/public/MovieCategoryRow';

// TMDB Watch Provider IDs (region: US)
const PROVIDERS = {
  netflix:   { id: 8,    label: 'Netflix',      color: '#E50914' },
  disney:    { id: 337,  label: 'Disney+',      color: '#113CCF' },
  max:       { id: 1899, label: 'Max',           color: '#002BE7' },
  prime:     { id: 9,    label: 'Prime Video',   color: '#00A8E0' },
  appletv:   { id: 350,  label: 'Apple TV+',     color: '#555555' },
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
        <MovieCategoryRow title="Trending Today"    endpoint="/api/tmdb/trending?time_window=day" />
        <MovieCategoryRow title="Trending This Week" endpoint="/api/tmdb/trending?time_window=week" />

        {/* ── Streaming Platforms ── */}
        <MovieCategoryRow
          title="Now Streaming on Netflix"
          endpoint={providerEndpoint(PROVIDERS.netflix.id)}
          badge={{ label: PROVIDERS.netflix.label, color: PROVIDERS.netflix.color }}
        />
        <MovieCategoryRow
          title="Now Streaming on Disney+"
          endpoint={providerEndpoint(PROVIDERS.disney.id)}
          badge={{ label: PROVIDERS.disney.label, color: PROVIDERS.disney.color }}
        />
        <MovieCategoryRow
          title="Now Streaming on Max"
          endpoint={providerEndpoint(PROVIDERS.max.id)}
          badge={{ label: PROVIDERS.max.label, color: PROVIDERS.max.color }}
        />
        <MovieCategoryRow
          title="Now Streaming on Prime Video"
          endpoint={providerEndpoint(PROVIDERS.prime.id)}
          badge={{ label: PROVIDERS.prime.label, color: PROVIDERS.prime.color }}
        />
        <MovieCategoryRow
          title="Now Streaming on Apple TV+"
          endpoint={providerEndpoint(PROVIDERS.appletv.id)}
          badge={{ label: PROVIDERS.appletv.label, color: PROVIDERS.appletv.color }}
        />

        {/* ── Genres ── */}
        <MovieCategoryRow title="Action Movies"  endpoint="/api/tmdb/discover?with_genres=28" />
        <MovieCategoryRow title="Comedy Movies"  endpoint="/api/tmdb/discover?with_genres=35" />
      </div>
    </div>
  );
}

