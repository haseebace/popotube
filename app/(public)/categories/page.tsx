import React from "react";
import Link from "next/link";

// Pre-defined list of common TMDb genres with their IDs.
const GENRES = [
  { id: 28, name: "Action" },
  { id: 12, name: "Adventure" },
  { id: 16, name: "Animation" },
  { id: 35, name: "Comedy" },
  { id: 80, name: "Crime" },
  { id: 99, name: "Documentary" },
  { id: 18, name: "Drama" },
  { id: 10751, name: "Family" },
  { id: 14, name: "Fantasy" },
  { id: 36, name: "History" },
  { id: 27, name: "Horror" },
  { id: 10402, name: "Music" },
  { id: 9648, name: "Mystery" },
  { id: 10749, name: "Romance" },
  { id: 878, name: "Science Fiction" },
  { id: 10770, name: "TV Movie" },
  { id: 53, name: "Thriller" },
  { id: 10752, name: "War" },
  { id: 37, name: "Western" },
];

export default function CategoriesPage() {
  return (
    <section className="-mt-14 min-h-screen bg-surface px-6 py-20 font-body text-on-surface antialiased md:px-12">
      <div className="mx-auto w-full max-w-[1440px]">
        <header className="mb-12 border-t border-noir-divider-subtle pt-8">
          <p className="label-md mb-3 text-on-surface-variant">Catalogue</p>
          <h1 className="text-4xl font-bold uppercase tracking-tighter text-noir-primary md:text-5xl">
            Browse Categories
          </h1>
          <p className="mt-3 max-w-2xl text-body-lg text-on-surface-variant">
            Select a genre to explore curated movie collections.
          </p>
        </header>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {GENRES.map((genre) => (
            <Link
              key={genre.id}
              href={`/categories/${genre.id}?name=${encodeURIComponent(genre.name)}`}
              className="group block rounded-noir bg-surface-container-low p-4 transition-colors duration-200 hover:bg-surface-container-high"
            >
              <div className="flex min-h-[88px] items-center justify-center rounded-noir border border-outline-variant/20 px-3 text-center">
                <span className="font-semibold uppercase tracking-[0.04em] text-noir-primary transition-colors group-hover:text-noir-secondary">
                  {genre.name}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
