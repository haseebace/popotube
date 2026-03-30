"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Play, Plus } from "lucide-react";
import {
  noirCtaPrimaryMotion,
  noirCtaSecondaryMotion,
  noirCtaRow,
} from "@/lib/noir-cta-styles";
import { springCta } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { WatchMoviePayload } from "./types";

const easeNoir = [0.25, 0.1, 0.25, 1] as const;

/** Hero backdrop — slower opacity + gentle zoom (PRD §4.1, softened). */
const heroBackdropTransition = {
  opacity: { duration: 2.4, ease: [0.33, 0, 0.2, 1] as const },
  scale: { duration: 2, ease: [0.22, 1, 0.36, 1] as const },
};

const heroGradientTransition = {
  duration: 1.15,
  delay: 0.45,
  ease: [0.33, 0, 0.2, 1] as const,
};

type Props = {
  payload: WatchMoviePayload;
  teaser: string;
  certification: string | null;
  year: number | null;
  genreLine: string;
  directorName: string | null;
  /** Wired on watch page: starts Video.js / ingestion flow */
  onPlayClick?: () => void;
  playButtonLabel?: string;
  /** Dim / block play when title failed or unavailable */
  playButtonDisabled?: boolean;
  /** e.g. ingestion progress under hero CTAs */
  heroFooter?: ReactNode;
};

export default function WatchMovieExperience({
  payload: movie,
  teaser,
  certification,
  year,
  genreLine,
  directorName,
  onPlayClick,
  playButtonLabel = "PLAY",
  playButtonDisabled = false,
  heroFooter,
}: Props) {
  const backdropUrl = movie.backdrop_path
    ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}`
    : "";
  const starring =
    movie.credits?.cast?.filter((c) => c.name)?.slice(0, 5) ?? [];
  const similar = movie.similar.slice(0, 8);

  const tLabel = 0.35;
  const tTitle = 0.43;
  const tTeaser = 0.51;
  const tCta = teaser ? 0.59 : 0.51;

  const fadeUp = (delay: number) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, ease: easeNoir, delay },
  });

  const inViewBlock = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-48px", amount: 0.12 },
    transition: { duration: 0.5, ease: "easeOut" as const },
  };

  return (
    <motion.div
      className="-mt-14 min-h-screen bg-surface font-body text-on-surface antialiased tracking-tight selection:bg-cinema-primary selection:text-cinema-on-primary"
      inherit={false}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: easeNoir }}
    >
      <main className="min-h-screen">
        <section className="relative h-[85svh] w-full overflow-hidden md:h-[921px]">
          <div className="absolute inset-0 bg-surface-container-lowest" />

          {backdropUrl ? (
            <motion.div
              className="absolute inset-0 overflow-hidden"
              inherit={false}
              initial={{ scale: 1.035, opacity: 0.28 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={heroBackdropTransition}
            >
              <Image
                src={backdropUrl}
                alt={movie.title}
                fill
                priority
                className="object-cover grayscale"
                sizes="100vw"
              />
            </motion.div>
          ) : null}

          <motion.div
            className="hero-gradient absolute inset-0"
            aria-hidden
            inherit={false}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={heroGradientTransition}
          />

          <div className="absolute inset-0 flex flex-col justify-end px-5 pb-14 md:px-20 md:pb-20">
            <div className="max-w-4xl space-y-6">
              <motion.span
                inherit={false}
                className="label-md uppercase tracking-[0.2em] text-noir-secondary"
                {...fadeUp(tLabel)}
              >
                {genreLine && genreLine !== "—"
                  ? genreLine
                  : "FEATURED PRESENTATION"}
              </motion.span>
              <motion.h1
                inherit={false}
                className="text-5xl font-extrabold uppercase leading-none tracking-tighter text-noir-primary md:text-[3.5rem] md:leading-none md:tracking-[-0.02em]"
                {...fadeUp(tTitle)}
              >
                {movie.title}
              </motion.h1>

              <motion.div
                inherit={false}
                className="flex items-center gap-4 label-md uppercase tracking-[0.1em] text-noir-secondary"
                {...fadeUp(tTitle + 0.04)}
              >
                {year && <span>{year}</span>}
                {movie.vote_average ? (
                  <span className="flex items-center gap-1">
                    <span className="text-yellow-500 text-base -mt-0.5">★</span>
                    {movie.vote_average.toFixed(1)}
                  </span>
                ) : null}
                {movie.runtime ? <span>{movie.runtime} MIN</span> : null}
                {certification ? (
                  <span className="rounded-sm border border-noir-secondary/30 px-1.5 py-0.5">
                    {certification}
                  </span>
                ) : null}
              </motion.div>

              {teaser ? (
                <motion.p
                  inherit={false}
                  className="type-body-lg max-w-2xl font-light text-on-surface-variant"
                  {...fadeUp(tTeaser)}
                >
                  {teaser}
                </motion.p>
              ) : null}
              <motion.div
                inherit={false}
                className={noirCtaRow}
                {...fadeUp(tCta)}
              >
                <motion.button
                  type="button"
                  className={cn(
                    noirCtaPrimaryMotion,
                    playButtonDisabled && "pointer-events-none opacity-45",
                  )}
                  inherit={false}
                  whileHover={playButtonDisabled ? undefined : { scale: 1.03 }}
                  whileTap={playButtonDisabled ? undefined : { scale: 0.97 }}
                  transition={springCta}
                  onClick={() => onPlayClick?.()}
                >
                  <Play
                    className="h-6 w-6 shrink-0 fill-noir-on-primary text-noir-on-primary"
                    aria-hidden
                  />
                  {playButtonLabel}
                </motion.button>
                <motion.button
                  type="button"
                  className={noirCtaSecondaryMotion}
                  inherit={false}
                  whileHover={{ scale: 1.02, opacity: 1 }}
                  whileTap={{ scale: 0.96 }}
                  transition={springCta}
                >
                  <Plus
                    className="h-6 w-6 shrink-0 text-noir-primary"
                    strokeWidth={2}
                    aria-hidden
                  />
                  WATCHLIST
                </motion.button>
              </motion.div>
              {heroFooter ? (
                <div className="mt-8 max-w-2xl">{heroFooter}</div>
              ) : null}
            </div>
          </div>
        </section>

        <motion.section
          className="grid gap-8 bg-surface px-5 py-10 md:gap-12 md:px-20 md:py-16 md:grid-cols-12"
          inherit={false}
          {...inViewBlock}
        >
          <div className="space-y-12 md:col-span-4">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h4 className="label-md mb-2 uppercase text-on-surface-variant">
                  Year
                </h4>
                <p className="text-lg font-medium text-on-surface">
                  {year ?? "—"}
                </p>
              </div>
              <div>
                <h4 className="label-md mb-2 uppercase text-on-surface-variant">
                  Genre
                </h4>
                <p className="text-lg font-medium text-on-surface">
                  {genreLine}
                </p>
              </div>
              <div>
                <h4 className="label-md mb-2 uppercase text-on-surface-variant">
                  Duration
                </h4>
                <p className="text-lg font-medium text-on-surface">
                  {movie.runtime != null && movie.runtime > 0
                    ? `${movie.runtime} Min`
                    : "—"}
                </p>
              </div>
              <div>
                <h4 className="label-md mb-2 uppercase text-on-surface-variant">
                  Rating
                </h4>
                <p className="text-lg font-medium text-on-surface">
                  {certification ?? "—"}
                </p>
              </div>
            </div>
            {directorName ? (
              <div className="border-t border-noir-divider-subtle pt-8">
                <h4 className="label-md mb-4 uppercase tracking-[0.1em] text-neutral-500">
                  Direction
                </h4>
                <p className="text-xl font-bold tracking-tight text-white">
                  {directorName}
                </p>
              </div>
            ) : null}
          </div>

          <div className="space-y-12 md:col-span-8">
            <div className="grid gap-12 md:grid-cols-2">
              {movie.overview ? (
                <div className="rounded-noir bg-surface-container-low p-8">
                  <h4 className="label-md mb-6 uppercase text-on-surface-variant">
                    Synopsis
                  </h4>
                  <p className="type-body-lg font-light text-on-surface">
                    {movie.overview}
                  </p>
                </div>
              ) : (
                <div className="rounded-noir bg-surface-container-low p-8">
                  <h4 className="label-md mb-6 uppercase text-on-surface-variant">
                    Synopsis
                  </h4>
                  <p className="type-body-lg font-light text-on-surface-variant">
                    No overview available.
                  </p>
                </div>
              )}
              <div className="space-y-6">
                <h4 className="label-md uppercase text-on-surface-variant">
                  Starring
                </h4>
                {starring.length > 0 ? (
                  <ul className="space-y-4">
                    {starring.map((c, index) => (
                      <motion.li
                        key={c.id}
                        inherit={false}
                        className="flex items-end justify-between gap-4 border-b border-noir-divider-faint pb-2"
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.2 }}
                        transition={{
                          duration: 0.45,
                          ease: easeNoir,
                          delay: index * 0.05,
                        }}
                      >
                        <span className="font-medium text-on-surface">
                          {c.name}
                        </span>
                        <span className="label-md text-on-surface-variant">
                          {c.character?.trim() ? `As ${c.character}` : "—"}
                        </span>
                      </motion.li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-on-surface-variant">No cast listed.</p>
                )}
              </div>
            </div>
          </div>
        </motion.section>

        {similar.length > 0 ? (
          <section className="bg-surface-container-lowest py-24">
            <motion.div
              className="mb-8 flex items-end justify-between px-5 md:mb-12 md:px-20"
              inherit={false}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-64px", amount: 0.2 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <div>
                <h2 className="type-headline-lg font-bold uppercase tracking-tighter text-noir-primary">
                  Recommended
                </h2>
                <p className="label-md mt-1 text-on-surface-variant">
                  Curated selection for enthusiasts
                </p>
              </div>
            </motion.div>
            <div className="no-scrollbar flex gap-4 overflow-x-auto px-5 pb-8 md:gap-6 md:px-20">
              {similar.map((m, index) => {
                const poster = m.poster_path
                  ? `https://image.tmdb.org/t/p/w342${m.poster_path}`
                  : null;
                const y = m.release_date
                  ? new Date(m.release_date).getFullYear()
                  : "—";
                return (
                  <motion.div
                    key={m.id}
                    inherit={false}
                    className="w-64 shrink-0 md:w-80"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true, margin: "-80px", amount: 0.08 }}
                    transition={{
                      duration: 0.4,
                      ease: "easeOut",
                      delay: 0.1 + index * 0.06,
                    }}
                  >
                    <Link
                      href={`/watch/${m.id}`}
                      className="group block cursor-pointer"
                    >
                      <div className="relative mb-4 aspect-[2/3] overflow-hidden rounded-noir bg-surface-container">
                        {poster ? (
                          <>
                            <Image
                              src={poster}
                              alt={m.title}
                              fill
                              className="object-cover grayscale transition-transform duration-700 ease-out group-hover:scale-110"
                              sizes="(max-width: 768px) 256px, 320px"
                            />
                            <div
                              className="pointer-events-none absolute inset-0 bg-black/20 transition-colors duration-300 group-hover:bg-black/0"
                              aria-hidden
                            />
                          </>
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-surface-container-high text-on-surface-variant">
                            No art
                          </div>
                        )}
                      </div>
                      <h3 className="font-bold uppercase tracking-tight text-noir-primary">
                        {m.title}
                      </h3>
                      <p className="label-md text-on-surface-variant">
                        {y} • Similar title
                      </p>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </section>
        ) : null}
      </main>

      <footer className="w-full bg-surface font-body text-xs uppercase tracking-[0.1em]">
        <div className="flex w-full flex-col items-center justify-between gap-8 px-5 py-12 md:px-12 md:py-16 md:flex-row">
          <div className="text-on-surface-variant">
            © {new Date().getFullYear()} PoPoTube. All rights reserved.
          </div>
          <div className="flex gap-8 text-on-surface-variant">
            <span>Terms</span>
            <span>Privacy</span>
          </div>
        </div>
      </footer>
    </motion.div>
  );
}
