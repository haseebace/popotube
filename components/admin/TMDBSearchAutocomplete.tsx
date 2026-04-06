"use client";

import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { publicBackendApiUrl } from "@/lib/backend-public-url";

interface TMDBMovie {
  id: number;
  title?: string;
  name?: string;
  release_date?: string;
  first_air_date?: string;
}

interface TMDBSearchAutocompleteProps {
  onSelect: (movie: TMDBMovie) => void;
  className?: string;
}

export function TMDBSearchAutocomplete({
  onSelect,
  className,
}: TMDBSearchAutocompleteProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TMDBMovie[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedTitle, setSelectedTitle] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function getDisplayTitle(movie: TMDBMovie): string {
    return (movie.title ?? movie.name ?? "").trim();
  }

  function getDisplayYear(movie: TMDBMovie): string {
    const date = movie.release_date ?? movie.first_air_date ?? "";
    return date ? date.substring(0, 4) : "";
  }

  // Debounced search
  useEffect(() => {
    const handler = setTimeout(async () => {
      // Don't search if query is empty or if it matches the already selected title
      if (!query.trim() || query === selectedTitle) {
        if (!query.trim()) {
          setResults([]);
          setIsOpen(false);
        }
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(
          publicBackendApiUrl(
            `/api/tmdb/search?query=${encodeURIComponent(query)}`,
          ),
        );
        if (res.ok) {
          const data = await res.json();
          const normalized = (data.results ?? [])
            .filter((movie: TMDBMovie) => getDisplayTitle(movie).length > 0)
            .slice(0, 5);
          setResults(normalized);
          setIsOpen(normalized.length > 0 || query.length > 2);
        }
      } catch (err) {
        console.error("Failed to fetch autocomplete", err);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(handler);
  }, [query, selectedTitle]);

  return (
    <div ref={wrapperRef} className={className || "relative w-full"}>
      <Input
        placeholder="Search TMDb for Movie..."
        className="h-10 border-muted-foreground/20 focus:border-primary"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => {
          if (results.length > 0 && query !== selectedTitle) setIsOpen(true);
        }}
      />

      {isOpen && query !== selectedTitle && (
        <div className="absolute top-full left-0 mt-1 w-full bg-popover text-popover-foreground border shadow-lg rounded-md z-50 overflow-hidden">
          {loading && (
            <div className="p-3 text-sm text-muted-foreground">
              Searching...
            </div>
          )}
          {!loading && results.length === 0 && query.length > 2 && (
            <div className="p-3 text-sm text-muted-foreground">
              No movies found.
            </div>
          )}
          {!loading &&
            results.map((movie) => (
              <button
                key={movie.id}
                className="w-full text-left px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors border-b last:border-0"
                onClick={() => {
                  const title = getDisplayTitle(movie);
                  const year = getDisplayYear(movie);
                  const fullTitle = year ? `${title} (${year})` : title;
                  setSelectedTitle(fullTitle);
                  setQuery(fullTitle);
                  onSelect(movie);
                  setIsOpen(false);
                  setResults([]);
                }}
              >
                <span className="font-semibold">{getDisplayTitle(movie)}</span>
                {getDisplayYear(movie) && (
                  <span className="text-muted-foreground ml-2">
                    ({getDisplayYear(movie)})
                  </span>
                )}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
