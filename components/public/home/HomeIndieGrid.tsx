"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

const easeNoir = [0.25, 0.1, 0.25, 1] as const;

export type GridMovie = {
  id: number;
  title: string;
  overview?: string;
  backdrop_path?: string | null;
  poster_path?: string | null;
};

type Props = {
  large: GridMovie;
  smallTop: GridMovie;
  smallBottom: GridMovie;
};

function overviewTeaser(text: string | undefined, maxLen = 120) {
  if (!text?.trim()) return null;
  const t = text.trim();
  return t.length > maxLen ? `${t.slice(0, maxLen - 1)}…` : t;
}

export default function HomeIndieGrid({ large, smallTop, smallBottom }: Props) {
  const largeSrc = large.backdrop_path
    ? `https://image.tmdb.org/t/p/w780${large.backdrop_path}`
    : large.poster_path
      ? `https://image.tmdb.org/t/p/w780${large.poster_path}`
      : null;
  const topSrc = smallTop.backdrop_path
    ? `https://image.tmdb.org/t/p/w500${smallTop.backdrop_path}`
    : smallTop.poster_path
      ? `https://image.tmdb.org/t/p/w500${smallTop.poster_path}`
      : null;
  const botSrc = smallBottom.backdrop_path
    ? `https://image.tmdb.org/t/p/w500${smallBottom.backdrop_path}`
    : smallBottom.poster_path
      ? `https://image.tmdb.org/t/p/w500${smallBottom.poster_path}`
      : null;

  return (
    <motion.section
      className="px-5 md:px-12"
      inherit={false}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-48px", amount: 0.12 }}
      transition={{ duration: 0.5, ease: easeNoir }}
    >
      <div className="mb-12">
        <motion.span
          className="label-md mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500"
          inherit={false}
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, ease: easeNoir, delay: 0.1 }}
        >
          02
        </motion.span>
        <motion.h2
          className="text-3xl font-bold uppercase tracking-tight text-noir-primary"
          inherit={false}
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, ease: easeNoir, delay: 0.15 }}
        >
          Indie Cinema
        </motion.h2>
      </div>
      <div className="grid grid-cols-1 gap-4 md:h-[600px] md:gap-6 md:grid-cols-12">
        <motion.div
          className="col-span-1 md:col-span-7"
          inherit={false}
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-48px" }}
          transition={{ duration: 0.6, ease: easeNoir, delay: 0.2 }}
        >
          <Link
            href={`/watch/${large.id}`}
            className="group relative block h-[280px] w-full overflow-hidden rounded-noir bg-surface-container-low md:h-full"
          >
            {largeSrc ? (
              <Image
                src={largeSrc}
                alt={large.title}
                fill
                className="object-cover transition-transform duration-1000 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 58vw"
              />
            ) : null}
            <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-transparent to-transparent p-8">
              <span className="label-md mb-2 text-xs font-bold uppercase tracking-[0.1em] text-noir-primary">
                Director&apos;s Cut
              </span>
              <h3 className="text-2xl font-bold uppercase tracking-tighter text-noir-primary md:text-4xl">
                {large.title}
              </h3>
              {large.overview ? (
                <p className="mt-2 line-clamp-2 max-w-md text-neutral-300">
                  {large.overview}
                </p>
              ) : null}
            </div>
          </Link>
        </motion.div>
        <div className="col-span-1 grid grid-rows-2 gap-4 md:col-span-5 md:gap-6">
          <motion.div
            className="relative min-h-0"
            inherit={false}
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-48px" }}
            transition={{ duration: 0.5, ease: easeNoir, delay: 0.3 }}
          >
            <Link
              href={`/watch/${smallTop.id}`}
              className="group relative block h-[200px] w-full overflow-hidden rounded-noir bg-surface-container-low md:h-full"
            >
              {topSrc ? (
                <Image
                  src={topSrc}
                  alt={smallTop.title}
                  fill
                  className="object-cover transition-transform duration-1000 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 40vw"
                />
              ) : null}
              <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/85 via-black/35 to-transparent p-6 transition-opacity group-hover:from-black/75">
                <span className="label-md mb-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-noir-primary">
                  Spotlight
                </span>
                <h3 className="text-xl font-bold uppercase tracking-tight text-noir-primary">
                  {smallTop.title}
                </h3>
                {smallTop.overview ? (
                  <p className="mt-1.5 line-clamp-2 text-sm leading-snug text-neutral-300">
                    {overviewTeaser(smallTop.overview, 110)}
                  </p>
                ) : null}
              </div>
            </Link>
          </motion.div>
          <motion.div
            className="relative min-h-0"
            inherit={false}
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-48px" }}
            transition={{ duration: 0.5, ease: easeNoir, delay: 0.4 }}
          >
            <Link
              href={`/watch/${smallBottom.id}`}
              className="group relative block h-[200px] w-full overflow-hidden rounded-noir bg-surface-container-low md:h-full"
            >
              {botSrc ? (
                <Image
                  src={botSrc}
                  alt={smallBottom.title}
                  fill
                  className="object-cover transition-transform duration-1000 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 40vw"
                />
              ) : null}
              <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/85 via-black/35 to-transparent p-6 transition-opacity group-hover:from-black/75">
                <span className="label-md mb-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-noir-primary">
                  Staff pick
                </span>
                <h3 className="text-xl font-bold uppercase tracking-tight text-noir-primary">
                  {smallBottom.title}
                </h3>
                {smallBottom.overview ? (
                  <p className="mt-1.5 line-clamp-2 text-sm leading-snug text-neutral-300">
                    {overviewTeaser(smallBottom.overview, 110)}
                  </p>
                ) : null}
              </div>
            </Link>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}
