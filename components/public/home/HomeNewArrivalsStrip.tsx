"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type WideCardMovie = {
  id: number;
  title: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string;
  subtitle: string;
};

type Props = {
  movies: WideCardMovie[];
};

export default function HomeNewArrivalsStrip({ movies }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <section className="pl-12">
      <div className="mb-8 flex items-end justify-between pr-12">
        <div>
          <span className="label-md mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500">
            03
          </span>
          <h2 className="text-3xl font-bold uppercase tracking-tight text-noir-primary">
            New Arrivals
          </h2>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="rounded-noir border border-outline-variant/30 p-2 transition-colors hover:bg-white/10"
            aria-label="Scroll left"
            onClick={() =>
              ref.current?.scrollBy({ left: -460, behavior: "smooth" })
            }
          >
            <ChevronLeft className="h-6 w-6 text-noir-primary" />
          </button>
          <button
            type="button"
            className="rounded-noir border border-outline-variant/30 p-2 transition-colors hover:bg-white/10"
            aria-label="Scroll right"
            onClick={() =>
              ref.current?.scrollBy({ left: 460, behavior: "smooth" })
            }
          >
            <ChevronRight className="h-6 w-6 text-noir-primary" />
          </button>
        </div>
      </div>
      <div
        ref={ref}
        className="no-scrollbar flex gap-6 overflow-x-auto pr-12"
      >
        {movies.map((m, i) => {
          const still = m.backdrop_path
            ? `https://image.tmdb.org/t/p/w780${m.backdrop_path}`
            : m.poster_path
              ? `https://image.tmdb.org/t/p/w780${m.poster_path}`
              : null;
          const badge = i % 2 === 0 ? "4K" : "HD";
          return (
            <Link
              key={m.id}
              href={`/watch/${m.id}`}
              className="group w-[440px] shrink-0 cursor-pointer"
            >
              <div className="relative mb-4 aspect-video overflow-hidden rounded-noir bg-surface-container">
                {still ? (
                  <Image
                    src={still}
                    alt={m.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes="440px"
                  />
                ) : null}
                <div className="absolute inset-0 bg-black/20 transition-colors group-hover:bg-black/0" />
                <span className="absolute right-3 top-3 shrink-0 rounded-noir bg-neutral-800 px-2 py-0.5 text-[10px] font-bold tracking-tighter text-white">
                  {badge}
                </span>
              </div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-bold uppercase tracking-tight text-noir-primary">
                    {m.title}
                  </h3>
                  <p className="mt-1 text-xs uppercase tracking-wider text-neutral-500">
                    {m.subtitle}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
