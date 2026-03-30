"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import type { StreamingProvider } from "@/lib/streaming-providers";
import type {
  ProviderCatalogMovie,
  ProviderCatalogPage,
} from "@/lib/tmdb-provider-catalog";
import {
  inViewViewport,
  recommendedHeader,
  springCardHover,
} from "@/lib/motion";

const easeNoir = [0.25, 0.1, 0.25, 1] as const;

type Props = {
  provider: StreamingProvider;
  initial: ProviderCatalogPage;
};

export default function StreamingCatalogExperience({
  provider,
  initial,
}: Props) {
  const [movies, setMovies] = useState<ProviderCatalogMovie[]>(initial.results);
  const [page, setPage] = useState(initial.page);
  const [totalPages, setTotalPages] = useState(initial.total_pages);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const loadMore = useCallback(async () => {
    if (loading || page >= totalPages) return;
    const next = page + 1;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/tmdb/discover?with_watch_providers=${provider.tmdbProviderId}&watch_region=US&page=${next}`,
      );
      if (!res.ok) return;
      const data = (await res.json()) as {
        results?: ProviderCatalogMovie[];
        page?: number;
        total_pages?: number;
      };
      setMovies((prev) => [...prev, ...(data.results ?? [])]);
      setPage(data.page ?? next);
      if (typeof data.total_pages === "number") setTotalPages(data.total_pages);
    } finally {
      setLoading(false);
    }
  }, [loading, page, totalPages, provider.tmdbProviderId]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            void loadMore();
          }
        }
      },
      { root: null, rootMargin: "480px 0px", threshold: 0.01 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [loadMore]);

  return (
    <div className="-mt-14 min-h-screen bg-surface pb-24 pt-28 font-body text-on-surface antialiased tracking-tight">
      <div className="mx-auto max-w-[1600px] px-8">
        <motion.header
          className="mb-14"
          inherit={false}
          variants={recommendedHeader}
          initial="hidden"
          whileInView="show"
          viewport={inViewViewport}
        >
          <motion.span
            className="label-md mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500"
            inherit={false}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: easeNoir, delay: 0.08 }}
          >
            Catalog
          </motion.span>
          <motion.h1
            className="text-4xl font-black uppercase tracking-tight text-noir-primary md:text-5xl"
            inherit={false}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: easeNoir, delay: 0.12 }}
          >
            {provider.name}
          </motion.h1>
          <motion.p
            className="mt-4 max-w-2xl text-sm leading-relaxed text-neutral-400"
            inherit={false}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: easeNoir, delay: 0.18 }}
          >
            Popular movies available to stream on {provider.name} in the US (via
            TMDb watch providers).
          </motion.p>
        </motion.header>

        {movies.length === 0 ? (
          <p className="py-16 text-center text-neutral-500">
            No titles found for this provider in the catalog.
          </p>
        ) : (
          <>
            <ul className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {movies.map((movie, index) => {
                const poster = movie.poster_path
                  ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                  : null;
                const year = movie.release_date?.split("-")[0] ?? "—";
                return (
                  <motion.li
                    key={movie.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.4,
                      ease: easeNoir,
                      delay: Math.min(index * 0.04, 0.72),
                    }}
                  >
                    <Link
                      href={`/watch/${movie.id}`}
                      className="group block cursor-pointer"
                    >
                      <motion.div
                        className="relative mb-3 aspect-[2/3] overflow-hidden rounded-noir bg-surface-container"
                        whileHover={{ scale: 1.02 }}
                        transition={springCardHover}
                      >
                        {poster ? (
                          <Image
                            src={poster}
                            alt={movie.title}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                          />
                        ) : null}
                        <div className="absolute inset-0 bg-black/15 transition-colors group-hover:bg-black/0" />
                      </motion.div>
                      <h2 className="line-clamp-2 font-bold uppercase tracking-tight text-noir-primary">
                        {movie.title}
                      </h2>
                      <p className="mt-1 text-xs uppercase tracking-wider text-neutral-500">
                        {year}
                        {typeof movie.vote_average === "number"
                          ? ` · ${movie.vote_average.toFixed(1)}`
                          : ""}
                      </p>
                    </Link>
                  </motion.li>
                );
              })}
            </ul>

            {(page < totalPages || loading) && (
              <div className="mt-12 flex justify-center">
                <div
                  ref={sentinelRef}
                  className="rounded-noir border border-outline-variant/20 bg-surface-container-low px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-400"
                >
                  {loading ? "Loading more…" : "Scroll to load more"}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
