import React from 'react';
import Link from 'next/link';

// Pre-defined list of common TMDb genres with their IDs.
const GENRES = [
  { id: 28, name: 'Action' },
  { id: 12, name: 'Adventure' },
  { id: 16, name: 'Animation' },
  { id: 35, name: 'Comedy' },
  { id: 80, name: 'Crime' },
  { id: 99, name: 'Documentary' },
  { id: 18, name: 'Drama' },
  { id: 10751, name: 'Family' },
  { id: 14, name: 'Fantasy' },
  { id: 36, name: 'History' },
  { id: 27, name: 'Horror' },
  { id: 10402, name: 'Music' },
  { id: 9648, name: 'Mystery' },
  { id: 10749, name: 'Romance' },
  { id: 878, name: 'Science Fiction' },
  { id: 10770, name: 'TV Movie' },
  { id: 53, name: 'Thriller' },
  { id: 10752, name: 'War' },
  { id: 37, name: 'Western' }
];

export default function CategoriesPage() {
  return (
    <div className="w-full flex-1 container max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Browse Categories</h1>
        <p className="text-muted-foreground">Select a genre to explore movies.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {GENRES.map((genre) => (
          <Link 
            key={genre.id} 
            href={`/categories/${genre.id}?name=${encodeURIComponent(genre.name)}`}
            className="block h-full"
          >
            <div className="h-full bg-card hover:bg-accent hover:text-accent-foreground text-card-foreground p-6 rounded-lg border shadow-sm transition-colors text-center font-semibold text-lg flex items-center justify-center">
              {genre.name}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
