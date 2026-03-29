"use client";

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Search as SearchIcon } from 'lucide-react';
import MovieCard from '@/components/public/MovieCard';

// Hook for debouncing input
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const debouncedQuery = useDebounce(query, 500);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q0 = params.get('q');
    if (q0) setQuery(q0);
  }, []);

  useEffect(() => {
    async function performSearch() {
      if (!debouncedQuery.trim()) {
        setResults([]);
        return;
      }
      
      setLoading(true);
      try {
        const res = await fetch(`/api/tmdb/search?query=${encodeURIComponent(debouncedQuery)}`);
        if (!res.ok) throw new Error('Search failed');
        const data = await res.json();
        setResults(data.results || []);
      } catch (error) {
        console.error('Error searching:', error);
      } finally {
        setLoading(false);
      }
    }

    performSearch();
  }, [debouncedQuery]);

  return (
    <div className="w-full flex-1 container max-w-7xl mx-auto px-4 py-8">
      {/* Header and Search Bar Container */}
      <div className="mb-12">
        <h1 className="text-3xl font-bold mb-6 text-center">Search Movies</h1>
        <div className="max-w-xl mx-auto relative">
          <Input 
            type="text" 
            placeholder="Type a movie name..." 
            className="pl-10 h-12 text-lg"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
        </div>
      </div>

      {/* Results Container */}
      <div className="w-full">
        {loading && (
          <div className="text-center text-muted-foreground my-12">
            Searching...
          </div>
        )}
        
        {!loading && query.trim() !== '' && results.length === 0 && (
          <div className="text-center text-muted-foreground my-12">
            No movies found for "{query}".
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {results.map((movie) => (
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
      </div>
    </div>
  );
}
