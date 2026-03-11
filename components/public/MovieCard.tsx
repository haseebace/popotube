import React from 'react';
import Link from 'next/link';

interface MovieCardProps {
  id: number;
  title: string;
  posterPath: string | null;
  releaseDate?: string;
  voteAverage?: number;
}

export default function MovieCard({ id, title, posterPath, releaseDate, voteAverage }: MovieCardProps) {
  const imageUrl = posterPath
    ? `https://image.tmdb.org/t/p/w500${posterPath}`
    : '/placeholder-poster.png'; // Make sure you have a placeholder or it will be broken image

  return (
    <div className="w-full flex justify-center p-2 group">
      <Link href={`/watch/${id}`} className="w-full block transition-transform duration-200 hover:scale-105">
        <div className="relative w-full aspect-[2/3] bg-muted rounded-xl md:rounded-2xl overflow-hidden shadow-md">
          {/* The image now perfectly fills the container and respects the border radius */}
          <img 
            src={imageUrl} 
            alt={`${title} poster`} 
            className="w-full h-full object-cover object-center" 
            loading="lazy" 
          />
          
          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4 text-white">
            <h3 className="font-semibold text-sm line-clamp-2">{title}</h3>
            {releaseDate && (
              <p className="text-xs text-gray-300 mt-1">{new Date(releaseDate).getFullYear()}</p>
            )}
            {voteAverage !== undefined && voteAverage > 0 && (
              <div className="mt-2 flex items-center text-xs font-medium">
                <span className="text-yellow-400 mr-1">★</span> {voteAverage.toFixed(1)}
              </div>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
