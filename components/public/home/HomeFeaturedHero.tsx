"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Play } from "lucide-react";
import {
  noirCtaPrimaryMotion,
  noirCtaSecondaryMotion,
  noirCtaRow,
} from "@/lib/noir-cta-styles";
import { springCta } from "@/lib/motion";

const easeNoir = [0.25, 0.1, 0.25, 1] as const;

const heroBackdropTransition = {
  opacity: { duration: 2.4, ease: [0.33, 0, 0.2, 1] as const },
  scale: { duration: 2, ease: [0.22, 1, 0.36, 1] as const },
};

const heroGradientTransition = {
  duration: 1.15,
  delay: 0.45,
  ease: [0.33, 0, 0.2, 1] as const,
};

export type FeaturedMovie = {
  id: number;
  title: string;
  overview?: string;
  backdrop_path?: string | null;
  vote_average?: number;
  release_date?: string;
};

type Props = {
  movie: FeaturedMovie;
  genreLine: string;
};

function titleWithMidBreak(title: string) {
  const words = title.trim().split(/\s+/);
  if (words.length <= 1) {
    return <>{title.toUpperCase()}</>;
  }
  const mid = Math.ceil(words.length / 2);
  const a = words.slice(0, mid).join(" ").toUpperCase();
  const b = words.slice(mid).join(" ").toUpperCase();
  return (
    <>
      {a}
      <br />
      {b}
    </>
  );
}

export default function HomeFeaturedHero({ movie, genreLine }: Props) {
  const backdropUrl = movie.backdrop_path
    ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}`
    : "";

  const tLabel = 0.35;
  const tTitle = 0.43;
  const tTeaser = 0.51;
  const tCta = 0.59;

  const fadeUp = (delay: number) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, ease: easeNoir, delay },
  });

  return (
    <motion.section
      className="relative h-[85svh] w-full overflow-hidden bg-surface-container-lowest md:h-[921px]"
      inherit={false}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: easeNoir }}
    >
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
            className="object-cover opacity-60 grayscale"
            sizes="100vw"
          />
        </motion.div>
      ) : null}
      <motion.div
        className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent"
        aria-hidden
        inherit={false}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={heroGradientTransition}
      />
      <div className="absolute bottom-0 left-0 z-10 w-full px-5 pb-16 md:px-12 md:pb-24">
        <div className="max-w-3xl space-y-6">
          <motion.div
            className="flex flex-wrap items-center gap-4"
            inherit={false}
            {...fadeUp(tLabel)}
          >
            <span className="rounded-noir bg-noir-primary px-3 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-noir-on-primary">
              Featured Selection
            </span>
            <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-noir-secondary">
              {genreLine}
            </span>
          </motion.div>
          <motion.h1
            className="text-4xl font-extrabold leading-tight tracking-tighter text-noir-primary sm:text-6xl md:text-8xl"
            inherit={false}
            {...fadeUp(tTitle)}
          >
            {titleWithMidBreak(movie.title)}
          </motion.h1>

          <motion.div
            className="flex items-center gap-4 label-md uppercase tracking-[0.1em] text-noir-secondary"
            inherit={false}
            {...fadeUp(tTitle + 0.04)}
          >
            {movie.release_date && (
              <span>{new Date(movie.release_date).getFullYear()}</span>
            )}
            {movie.vote_average ? (
              <span className="flex items-center gap-1">
                <span className="text-yellow-500 text-base -mt-0.5">★</span>
                {movie.vote_average.toFixed(1)}
              </span>
            ) : null}
          </motion.div>

          {movie.overview ? (
            <motion.p
              className="max-w-xl text-sm font-light leading-relaxed text-noir-secondary sm:text-lg"
              inherit={false}
              {...fadeUp(tTeaser)}
            >
              {movie.overview.length > 220
                ? `${movie.overview.slice(0, 217)}…`
                : movie.overview}
            </motion.p>
          ) : null}
          <motion.div className={noirCtaRow} inherit={false} {...fadeUp(tCta)}>
            <motion.div
              inherit={false}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={springCta}
            >
              <Link
                href={`/watch/${movie.id}`}
                className={noirCtaPrimaryMotion}
              >
                <Play
                  className="h-6 w-6 shrink-0 fill-noir-on-primary text-noir-on-primary"
                  aria-hidden
                />
                WATCH NOW
              </Link>
            </motion.div>
            <motion.div
              inherit={false}
              whileHover={{ scale: 1.02, opacity: 1 }}
              whileTap={{ scale: 0.96 }}
              transition={springCta}
            >
              <Link
                href={`/watch/${movie.id}`}
                className={noirCtaSecondaryMotion}
              >
                FILM DETAILS
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}
