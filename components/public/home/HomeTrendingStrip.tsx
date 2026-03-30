"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const easeNoir = [0.25, 0.1, 0.25, 1] as const;

export type StripMovie = {
  id: number;
  title: string;
  poster_path?: string | null;
  release_date?: string;
  genre_ids?: number[];
  /** Precomputed on the server (genre / year). */
  subtitle: string;
};

type Props = {
  sectionIndex: string;
  title: string;
  movies: StripMovie[];
};

export default function HomeTrendingStrip({
  sectionIndex,
  title,
  movies,
}: Props) {
  return (
    <motion.section
      className="pl-12"
      inherit={false}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-48px", amount: 0.12 }}
      transition={{ duration: 0.5, ease: easeNoir }}
    >
      <div className="mb-8 flex items-end justify-between pr-12">
        <div>
          <motion.span
            className="label-md mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500"
            inherit={false}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, ease: easeNoir, delay: 0.1 }}
          >
            {sectionIndex}
          </motion.span>
          <motion.h2
            className="text-3xl font-bold uppercase tracking-tight text-noir-primary"
            inherit={false}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, ease: easeNoir, delay: 0.15 }}
          >
            {title}
          </motion.h2>
        </div>
        <motion.div
          inherit={false}
          initial={{ opacity: 0, x: -10 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, ease: easeNoir, delay: 0.2 }}
        >
          <Link
            href="/categories"
            className="flex items-center gap-2 text-xs uppercase tracking-[0.1em] text-neutral-400 transition-colors hover:text-white"
          >
            View All
            <ArrowRight className="h-4 w-4" strokeWidth={2} aria-hidden />
          </Link>
        </motion.div>
      </div>
      <div className="no-scrollbar flex gap-6 overflow-x-auto pr-12">
        {movies.map((m, index) => {
          const poster = m.poster_path
            ? `https://image.tmdb.org/t/p/w500${m.poster_path}`
            : null;
          return (
            <motion.div
              key={m.id}
              inherit={false}
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-48px", amount: 0.1 }}
              transition={{
                duration: 0.4,
                ease: easeNoir,
                delay: 0.1 + index * 0.05,
              }}
            >
              <Link
                href={`/watch/${m.id}`}
                className="group w-[320px] shrink-0 cursor-pointer block"
              >
                <div className="relative mb-4 aspect-[2/3] overflow-hidden rounded-noir bg-surface-container">
                  {poster ? (
                    <Image
                      src={poster}
                      alt={m.title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                      sizes="320px"
                    />
                  ) : null}
                  <div className="absolute inset-0 bg-black/20 transition-colors group-hover:bg-black/0" />
                </div>
                <h3 className="font-bold uppercase tracking-tight text-noir-primary">
                  {m.title}
                </h3>
                <p className="mt-1 text-xs uppercase tracking-wider text-neutral-500">
                  {m.subtitle}
                </p>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
}
