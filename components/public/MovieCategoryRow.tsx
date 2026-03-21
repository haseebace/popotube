"use client";

import React, { useEffect, useState, useRef } from 'react';
import MovieCard from './MovieCard';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MovieCategoryRowProps {
  title: string;
  endpoint: string;
  badge?: { label: string; color: string }; // Optional platform badge
}

export default function MovieCategoryRow({ title, endpoint, badge }: MovieCategoryRowProps) {
  const [movies, setMovies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(endpoint);
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        if (data.results) {
          setMovies(data.results.slice(0, 10)); // Just 10 logic for now
        }
      } catch (error) {
        console.error(`Error fetching category ${title}:`, error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [endpoint, title]);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  if (loading || movies.length === 0) {
    return (
      <div className="w-full py-8 space-y-4">
        <div className="flex items-center gap-3 px-4 md:px-8 mb-4">
          <h2 className="text-2xl font-bold">{title}</h2>
          {badge && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: badge.color, color: '#fff' }}>
              {badge.label}
            </span>
          )}
        </div>
        <div className="flex px-4 md:px-8 space-x-4 overflow-hidden">
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="w-[120px] md:w-48 h-[180px] md:h-[288px] bg-muted animate-pulse rounded-xl flex-shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-8 group/row relative flex flex-col items-center">
      <div className="container max-w-full px-4 md:px-8">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-2xl font-bold">{title}</h2>
          {badge && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: badge.color, color: '#fff' }}>
              {badge.label}
            </span>
          )}
        </div>
      </div>

      <div className="relative w-full">
        {/* Scroll Buttons */}
        <Button
          variant="outline"
          size="icon"
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 hidden md:flex opacity-0 group-hover/row:opacity-100 transition-opacity bg-background/80 hover:bg-background"
          onClick={scrollLeft}
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>

        <div 
          className="flex overflow-x-auto gap-4 px-4 md:px-8 pb-4 snap-x snap-mandatory hide-scrollbar style-scrollbar"
          ref={scrollContainerRef}
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {movies.map((movie) => (
             <div key={movie.id} className="w-[120px] md:w-48 flex-shrink-0 snap-start">
               <MovieCard
                 id={movie.id}
                 title={movie.title || movie.name}
                 posterPath={movie.poster_path}
                 releaseDate={movie.release_date || movie.first_air_date}
                 voteAverage={movie.vote_average}
               />
             </div>
          ))}
        </div>

        <Button
          variant="outline"
          size="icon"
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 hidden md:flex opacity-0 group-hover/row:opacity-100 transition-opacity bg-background/80 hover:bg-background"
          onClick={scrollRight}
        >
          <ChevronRight className="h-6 w-6" />
        </Button>
      </div>

      {/* Hide scrollbar injected style */}
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}} />
    </div>
  );
}
