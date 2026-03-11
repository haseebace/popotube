"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import MovieCard from '@/components/public/MovieCard';

export default function CategoryPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  
  const genreId = params.genre;
  const genreName = searchParams.get('name') || 'Category';

  const [movies, setMovies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMovies() {
      if (!genreId) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/tmdb/discover?with_genres=${genreId}`);
        if (!res.ok) throw new Error('Failed to fetch movies');
        const data = await res.json();
        setMovies(data.results || []);
      } catch (error) {
        console.error('Error fetching genre movies:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchMovies();
  }, [genreId]);

  return (
    <div className="w-full flex-1 container max-w-7xl mx-auto px-4 py-8">
      {/* Header Container */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">{genreName} Movies</h1>
        <p className="text-muted-foreground">Browsing top movies in the {genreName} genre.</p>
      </div>

      {/* Grid Container */}
      <div className="w-full">
        {loading ? (
          <div className="text-center text-muted-foreground py-12">Loading movies...</div>
        ) : movies.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">No movies found in this category.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {movies.map((movie) => (
              <MovieCard
                key={movie.id}
                id={movie.id}
                title={movie.title || movie.name}
                posterPath={movie.poster_path}
                releaseDate={movie.release_date}
                voteAverage={movie.vote_average}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
