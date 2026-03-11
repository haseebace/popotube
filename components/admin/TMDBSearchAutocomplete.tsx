"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface TMDBMovie {
  id: number;
  title: string;
  release_date: string;
}

interface TMDBSearchAutocompleteProps {
  onSelect: (movie: TMDBMovie) => void;
}

export function TMDBSearchAutocomplete({ onSelect }: TMDBSearchAutocompleteProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TMDBMovie[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    const handler = setTimeout(async () => {
      if (!query.trim()) {
        setResults([]);
        setIsOpen(false);
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(`/api/tmdb/search?query=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.results?.slice(0, 5) || []);
          setIsOpen(true);
        }
      } catch (err) {
        console.error("Failed to fetch autocomplete", err);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(handler);
  }, [query]);

  return (
    <div ref={wrapperRef} className="relative w-full max-w-sm">
      <Input
        placeholder="Search TMDb for Movie..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => { if (results.length > 0) setIsOpen(true) }}
      />
      
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-full bg-popover text-popover-foreground border shadow-lg rounded-md z-50 overflow-hidden">
          {loading && <div className="p-3 text-sm text-muted-foreground">Searching...</div>}
          {!loading && results.length === 0 && (
            <div className="p-3 text-sm text-muted-foreground">No movies found.</div>
          )}
          {!loading && results.map((movie) => (
            <button
              key={movie.id}
              className="w-full text-left px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors border-b last:border-0"
              onClick={() => {
                onSelect(movie);
                setQuery(`${movie.title} (${movie.release_date?.substring(0,4) || 'Unknown'})`);
                setIsOpen(false);
              }}
            >
              <span className="font-semibold">{movie.title}</span> 
              <span className="text-muted-foreground ml-2">({movie.release_date?.substring(0,4)})</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
