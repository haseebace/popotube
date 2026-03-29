"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Play, ChevronRight, Volume2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type HeroMovie = {
  id: number;
  title?: string;
  name?: string;
  overview?: string;
  backdrop_path?: string | null;
};

export default function HeroBanner() {
  const [movies, setMovies] = useState<HeroMovie[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTrending() {
      try {
        const res = await fetch("/api/tmdb/trending?time_window=day");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          setMovies(data.results.slice(0, 5)); // Top 5 for carousel
        }
      } catch (error) {
        console.error("Error fetching hero movie:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchTrending();
  }, []);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % movies.length);
  }, [movies.length]);

  useEffect(() => {
    if (movies.length === 0) return;
    const interval = setInterval(handleNext, 5000);
    return () => clearInterval(interval);
  }, [movies.length, handleNext]);

  if (loading || movies.length === 0) {
    return (
      <div className="w-full h-[85vh] md:h-[95vh] bg-muted animate-pulse flex items-center justify-center">
        <span className="text-muted-foreground text-xl font-medium">Preparing Premiere...</span>
      </div>
    );
  }

  const movie = movies[currentIndex];
  const backdropUrl = movie.backdrop_path
    ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}`
    : "";

  return (
    <div className="relative w-full h-[85vh] md:h-[95vh] flex items-center overflow-hidden bg-black">
      {/* Background Image Carousel with Fade */}
      <AnimatePresence mode="wait">
        <motion.div
          key={movie.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${backdropUrl})` }}
        />
      </AnimatePresence>

      {/* Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/20 to-transparent z-[1]" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-black/30 z-[1]" />
      <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-background via-background/60 to-transparent z-[2]" />

      {/* Content */}
      <div className="container mx-auto px-6 z-10 w-full mb-12">
        <div className="max-w-3xl space-y-6 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={movie.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/10 text-xs font-semibold text-white uppercase tracking-wider">
                Trending Premiere
              </div>

              <h1 className="text-5xl md:text-8xl font-black text-white leading-[0.9] tracking-tight drop-shadow-2xl">
                {movie.title || movie.name}
              </h1>

              <p className="text-lg md:text-xl text-white/80 max-w-xl line-clamp-3 font-medium">
                {movie.overview}
              </p>

              <div className="flex items-center gap-4 pt-4">
                <Button
                  size="lg"
                  asChild
                  className="rounded-full bg-white text-black hover:bg-white/90 px-8 h-14 font-bold text-lg"
                >
                  <Link href={`/watch/${movie.id}`}>
                    <Play className="mr-2 h-6 w-6 fill-current" />
                    Watch Now
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  asChild
                  className="rounded-full bg-black/30 text-white border-white/40 hover:bg-white/10 px-8 h-14 font-bold text-lg backdrop-blur-md"
                >
                  <Link href={`/watch/${movie.id}`}>
                    More Info <ChevronRight className="ml-2 h-6 w-6" />
                  </Link>
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Right Side Navigation Arrow */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 pr-6 z-20 hidden md:flex flex-col items-center gap-8">
        <motion.button
          whileHover={{ scale: 1.1, x: 5 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleNext}
          className="p-2 text-white/60 hover:text-white transition-colors cursor-pointer"
        >
          <ChevronRight className="h-12 w-12" />
        </motion.button>
      </div>

      {/* Bottom Progress Controls */}
      <div className="absolute bottom-20 right-12 z-20 flex items-center gap-6">
        <button className="p-3 rounded-full border border-white/20 bg-black/20 text-white/60 hover:text-white transition-colors backdrop-blur-sm">
          <Volume2 className="h-5 w-5" />
        </button>

        <div className="flex gap-1.5 pt-1">
          {movies.map((_, i) => (
            <motion.div
              key={i}
              className="h-[3px] w-12 bg-white"
              animate={{ opacity: i === currentIndex ? 1 : 0.3 }}
              transition={{ duration: 0.3 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
