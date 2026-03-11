import React from 'react';
import HeroBanner from '@/components/public/HeroBanner';
import MovieCategoryRow from '@/components/public/MovieCategoryRow';

export default function PublicHomepage() {
  return (
    <div className="w-full flex-1 flex flex-col items-center">
      <HeroBanner />
      
      <div className="w-full pb-16 pt-4 space-y-6">
        <MovieCategoryRow title="Trending Today" endpoint="/api/tmdb/trending?time_window=day" />
        <MovieCategoryRow title="Trending This Week" endpoint="/api/tmdb/trending?time_window=week" />
        {/* TMDB Action Genre ID is 28 */}
        <MovieCategoryRow title="Action Movies" endpoint="/api/tmdb/discover?with_genres=28" />
        {/* TMDB Comedy Genre ID is 35 */}
        <MovieCategoryRow title="Comedy Movies" endpoint="/api/tmdb/discover?with_genres=35" />
      </div>
    </div>
  );
}
