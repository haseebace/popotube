"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";

interface MovieCardProps {
  id: number;
  title: string;
  posterPath: string | null;
  releaseDate?: string;
  voteAverage?: number;
  /** Defaults to movie (`/watch/[id]`). TV uses `/watch/tv/[id]`. */
  mediaType?: "movie" | "tv";
}

export default function MovieCard({
  id,
  title,
  posterPath,
  releaseDate,
  voteAverage,
  mediaType = "movie",
}: MovieCardProps) {
  const imageUrl = posterPath
    ? `https://image.tmdb.org/t/p/w500${posterPath}`
    : "/placeholder-poster.png"; // Make sure you have a placeholder or it will be broken image

  return (
    <motion.div
      className="w-full h-full p-2"
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 400, damping: 5 }}
    >
      <Link
        href={mediaType === "tv" ? `/watch/tv/${id}` : `/watch/${id}`}
        className="w-full block h-full group"
      >
        <div className="relative w-full aspect-[2/3] bg-muted rounded-xl md:rounded-2xl overflow-hidden shadow-lg border border-white/5">
          {/* The image now perfectly fills the container and respects the border radius */}
          <img
            src={imageUrl}
            alt={`${title} poster`}
            className="w-full h-full object-cover object-center"
            loading="lazy"
          />

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4 text-white">
            <h3 className="font-bold text-sm md:text-base line-clamp-2 leading-tight drop-shadow-lg">
              {title}
            </h3>
            <div className="flex items-center gap-3 mt-1 text-white/80 font-medium">
              {releaseDate && (
                <span className="text-xs">
                  {new Date(releaseDate).getFullYear()}
                </span>
              )}
              {voteAverage !== undefined && voteAverage > 0 && (
                <div className="flex items-center text-xs">
                  <span className="text-yellow-400 mr-1">★</span>{" "}
                  {voteAverage.toFixed(1)}
                </div>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
