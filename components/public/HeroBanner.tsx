"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Play, Info } from 'lucide-react';

export default function HeroBanner() {
  const [movie, setMovie] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTrending() {
      try {
        const res = await fetch('/api/tmdb/trending?time_window=day');
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          setMovie(data.results[0]);
        }
      } catch (error) {
        console.error('Error fetching hero movie:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchTrending();
  }, []);

  if (loading || !movie) {
    return (
      <div className="w-full h-[60vh] md:h-[80vh] bg-muted animate-pulse flex items-center justify-center">
        <span className="text-muted-foreground">Loading...</span>
      </div>
    );
  }

  const backdropUrl = movie.backdrop_path 
    ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}` 
    : '';

  return (
    <div className="relative w-full h-[60vh] md:h-[80vh] flex items-center">
      {/* Background Image - moved down and repositioned */}
      <div 
        className="absolute inset-0 bg-cover bg-[center_top] bg-no-repeat mt-0"
        style={{ backgroundImage: `url(${backdropUrl})` }}
      />
      
      {/* Visual Overlays for Readability */}
      {/* Dark Gradient Overlay for left side text area */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/40 to-transparent" />
      
      {/* Bottom Fade Overlay (approximately 100px) */}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black via-black/60 to-transparent" />
      
      {/* Content */}
      <div className="container mx-auto px-4 z-10 w-full mb-10">
        <div className="max-w-2xl space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
            {movie.title || movie.name}
          </h1>
          <p className="text-lg md:text-xl text-white/90 line-clamp-3 drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]">
            {movie.overview}
          </p>
          <div className="flex items-center gap-3 pt-4">
            <Button size="lg" asChild className="font-semibold px-8">
              <Link href={`/watch/${movie.id}`}>
                <Play className="mr-2 h-5 w-5" />
                Play
              </Link>
            </Button>
            <Button size="lg" variant="secondary" asChild className="font-semibold px-8 bg-white/20 hover:bg-white/30 border-none text-white backdrop-blur-md">
              <Link href={`/watch/${movie.id}`}>
                <Info className="mr-2 h-5 w-5" />
                More Info
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

