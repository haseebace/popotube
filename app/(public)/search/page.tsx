"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Search as SearchIcon } from "lucide-react";
import MovieCard from "@/components/public/MovieCard";
import { publicBackendApiUrl } from "@/lib/backend-public-url";

type TmdbMultiHit = {
  id: number;
  media_type?: string;
  title?: string;
  name?: string;
  poster_path?: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
};

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
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TmdbMultiHit[]>([]);
  const [loading, setLoading] = useState(false);

  const debouncedQuery = useDebounce(query, 500);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q0 = params.get("q");
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
        const res = await fetch(
          publicBackendApiUrl(
            `/api/tmdb/search?query=${encodeURIComponent(debouncedQuery)}`,
          ),
        );
        if (!res.ok) throw new Error("Search failed");
        const data = await res.json();
        setResults(data.results || []);
      } catch (error) {
        console.error("Error searching:", error);
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
        <h1 className="text-3xl font-bold mb-6 text-center">Search</h1>
        <div className="max-w-xl mx-auto relative">
          <Input
            type="text"
            placeholder="Search movies and TV…"
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

        {!loading && query.trim() !== "" && results.length === 0 && (
          <div className="text-center text-muted-foreground my-12">
            No titles found for &quot;{query}&quot;.
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {results.map((item) => (
            <MovieCard
              key={`${item.media_type}-${item.id}`}
              id={item.id}
              title={(item.title ?? item.name ?? "").trim() || "Untitled"}
              posterPath={item.poster_path ?? null}
              releaseDate={item.release_date ?? item.first_air_date}
              voteAverage={item.vote_average}
              mediaType={item.media_type === "tv" ? "tv" : "movie"}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
