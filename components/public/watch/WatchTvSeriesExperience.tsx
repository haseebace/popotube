"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { CirclePlay, Play, Plus } from "lucide-react";
import type { WatchSimilarTv } from "@/components/public/watch/types";
import WatchNetflixPlayer from "@/components/public/watch/WatchNetflixPlayer";
import { Progress } from "@/components/ui/progress";
import { useTvEpisodeIngestion } from "@/hooks/useTvEpisodeIngestion";
import {
  noirCtaPrimaryMotion,
  noirCtaSecondaryMotion,
  noirCtaRow,
} from "@/lib/noir-cta-styles";
import { springCta } from "@/lib/motion";
import { guessVideoJsType } from "@/lib/watch-playback";
import { cn } from "@/lib/utils";
import type { TMDBTVEpisode } from "@/lib/tmdb-tv";

const easeNoir = [0.25, 0.1, 0.25, 1] as const;

const inViewBlock = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-48px", amount: 0.12 },
  transition: { duration: 0.5, ease: "easeOut" as const },
};

type SeasonTab = {
  season_number: number;
  name: string;
  episode_count: number;
};

type Props = {
  tvId: string;
  name: string;
  overview?: string;
  backdrop_path?: string | null;
  poster_path?: string | null;
  vote_average?: number;
  first_air_date?: string;
  /** Deep-link scroll target from ?episode= */
  initialEpisodeFocus: number | null;
  genreLine: string;
  certification: string | null;
  year: number | null;
  avgEpisodeMinutes: number | null;
  createdByLine: string | null;
  starring: { id: number; name: string; character?: string }[];
  similar: WatchSimilarTv[];
  seasons: SeasonTab[];
  initialSeasonNumber: number;
  initialEpisodes: TMDBTVEpisode[];
  heroTeaser: string;
  /** e.g. PLAY S1E1 */
  pilotCtaLabel: string;
};

export default function WatchTvSeriesExperience({
  tvId,
  name,
  overview,
  backdrop_path,
  poster_path,
  vote_average,
  first_air_date,
  initialEpisodeFocus,
  genreLine,
  certification,
  year,
  avgEpisodeMinutes,
  createdByLine,
  starring,
  similar,
  seasons,
  initialSeasonNumber,
  initialEpisodes,
  heroTeaser,
  pilotCtaLabel,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const episodesSectionRef = useRef<HTMLDivElement | null>(null);
  const didScrollEpisodeRef = useRef(false);
  const [selectedSeason, setSelectedSeason] = useState(initialSeasonNumber);
  const [episodes, setEpisodes] = useState<TMDBTVEpisode[]>(initialEpisodes);
  const [loadingSeason, setLoadingSeason] = useState(false);
  const [playTarget, setPlayTarget] = useState<{
    season: number;
    episode: number;
    label: string;
  } | null>(null);
  const [playerOpen, setPlayerOpen] = useState(false);

  const syncSeasonEpisode = useCallback(
    (season: number, episodeNum: number | null) => {
      const p = new URLSearchParams(searchParams.toString());
      p.set("season", String(season));
      if (episodeNum != null && episodeNum >= 1)
        p.set("episode", String(episodeNum));
      else p.delete("episode");
      router.replace(`${pathname}?${p.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const episodeIngest = useTvEpisodeIngestion(
    tvId,
    playTarget?.season ?? 1,
    playTarget?.episode ?? 1,
    { title: name, first_air_date },
    playTarget != null,
  );

  const posterUrlForPlayer = useMemo(() => {
    const b = backdrop_path;
    const p = poster_path;
    if (b) return `https://image.tmdb.org/t/p/w1280${b}`;
    if (p) return `https://image.tmdb.org/t/p/w780${p}`;
    return null;
  }, [backdrop_path, poster_path]);

  const backdropUrl = backdrop_path
    ? `https://image.tmdb.org/t/p/original${backdrop_path}`
    : poster_path
      ? `https://image.tmdb.org/t/p/original${poster_path}`
      : "";

  const loadSeason = useCallback(
    async (seasonNumber: number) => {
      if (seasonNumber === initialSeasonNumber) {
        setEpisodes(initialEpisodes);
        return;
      }
      setLoadingSeason(true);
      try {
        const res = await fetch(
          `/api/tmdb/tv/season?tv_id=${encodeURIComponent(tvId)}&season_number=${seasonNumber}`,
        );
        if (!res.ok) return;
        const data = (await res.json()) as { episodes?: TMDBTVEpisode[] };
        setEpisodes(data.episodes ?? []);
      } finally {
        setLoadingSeason(false);
      }
    },
    [tvId, initialSeasonNumber, initialEpisodes],
  );

  const onSelectSeason = useCallback(
    (n: number) => {
      setSelectedSeason(n);
      void loadSeason(n);
      syncSeasonEpisode(n, null);
    },
    [loadSeason, syncSeasonEpisode],
  );

  const scrollToEpisodes = useCallback(() => {
    episodesSectionRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const scrollToEpisodesAndPilot = useCallback(() => {
    scrollToEpisodes();
    const first = episodes[0];
    if (first) syncSeasonEpisode(selectedSeason, first.episode_number);
  }, [scrollToEpisodes, episodes, syncSeasonEpisode, selectedSeason]);

  useEffect(() => {
    if (didScrollEpisodeRef.current || initialEpisodeFocus == null) return;
    didScrollEpisodeRef.current = true;
    const id = `episode-${initialSeasonNumber}-${initialEpisodeFocus}`;
    const t = window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 80);
    return () => window.clearTimeout(t);
  }, [initialSeasonNumber, initialEpisodeFocus]);

  const seasonTabs = useMemo(() => {
    return [...seasons].sort((a, b) => a.season_number - b.season_number);
  }, [seasons]);

  const fadeUp = (delay: number) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, ease: easeNoir, delay },
  });

  return (
    <motion.div
      className="-mt-14 min-h-screen bg-surface font-body text-on-surface antialiased tracking-tight selection:bg-cinema-primary selection:text-cinema-on-primary"
      inherit={false}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: easeNoir }}
    >
      <main className="min-h-screen">
        <section className="relative h-[921px] w-full overflow-hidden">
          <div className="absolute inset-0 bg-surface-container-lowest" />

          {backdropUrl ? (
            <motion.div
              className="absolute inset-0 overflow-hidden"
              inherit={false}
              initial={{ scale: 1.035, opacity: 0.28 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                opacity: { duration: 2.4, ease: [0.33, 0, 0.2, 1] as const },
                scale: { duration: 2, ease: [0.22, 1, 0.36, 1] as const },
              }}
            >
              <Image
                src={backdropUrl}
                alt={name}
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
            transition={{
              duration: 1.15,
              delay: 0.45,
              ease: [0.33, 0, 0.2, 1] as const,
            }}
          />

          <div className="absolute inset-0 flex flex-col justify-end px-8 pb-20 md:px-20">
            <div className="max-w-4xl space-y-6">
              <motion.div
                inherit={false}
                className="flex flex-wrap items-center gap-4"
                {...fadeUp(0.35)}
              >
                <span className="label-md rounded-noir border border-outline-variant/30 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-noir-secondary">
                  Series
                </span>
                {year ? (
                  <span className="label-md text-[10px] uppercase tracking-[0.2em] text-on-surface-variant">
                    {year}
                  </span>
                ) : null}
                {typeof vote_average === "number" ? (
                  <span className="label-md flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] text-on-surface-variant">
                    <span className="-mt-0.5 text-base text-yellow-500">★</span>
                    {vote_average.toFixed(1)}
                  </span>
                ) : null}
                {genreLine && genreLine !== "—" ? (
                  <span className="label-md text-[10px] uppercase tracking-[0.2em] text-on-surface-variant">
                    {genreLine}
                  </span>
                ) : null}
              </motion.div>

              <motion.h1
                inherit={false}
                className="text-5xl font-extrabold uppercase leading-none tracking-tighter text-noir-primary md:text-[3.5rem] md:leading-none md:tracking-[-0.02em]"
                {...fadeUp(0.43)}
              >
                {name}
              </motion.h1>

              {heroTeaser ? (
                <motion.p
                  inherit={false}
                  className="type-body-lg max-w-2xl font-light text-on-surface-variant"
                  {...fadeUp(0.51)}
                >
                  {heroTeaser}
                </motion.p>
              ) : null}

              <motion.div
                inherit={false}
                className={cn(noirCtaRow, "pt-2")}
                {...fadeUp(heroTeaser ? 0.59 : 0.51)}
              >
                <motion.button
                  type="button"
                  className={noirCtaPrimaryMotion}
                  inherit={false}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  transition={springCta}
                  onClick={scrollToEpisodesAndPilot}
                >
                  <Play
                    className="h-6 w-6 shrink-0 fill-noir-on-primary text-noir-on-primary"
                    aria-hidden
                  />
                  {pilotCtaLabel}
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
                  My Library
                </motion.button>
              </motion.div>
            </div>
          </div>
        </section>

        <motion.div
          ref={episodesSectionRef}
          role="region"
          aria-label="Episodes"
          className="bg-surface px-8 py-16 md:px-12 md:py-20"
          inherit={false}
          id="episodes"
          {...inViewBlock}
        >
          <div className="mx-auto max-w-7xl">
            <h2 className="type-headline-lg mb-10 font-bold uppercase tracking-tighter text-noir-primary">
              Episodes
            </h2>

            {seasonTabs.length === 0 ? (
              <p className="text-on-surface-variant">
                No season data from TMDB.
              </p>
            ) : (
              <>
                <div className="no-scrollbar mb-12 flex gap-8 overflow-x-auto border-b border-outline-variant/10">
                  {seasonTabs.map((s) => {
                    const active = selectedSeason === s.season_number;
                    return (
                      <button
                        key={s.season_number}
                        type="button"
                        onClick={() => onSelectSeason(s.season_number)}
                        className={cn(
                          "shrink-0 pb-4 text-xs font-bold uppercase tracking-widest transition-colors",
                          active
                            ? "border-b-2 border-white text-white"
                            : "border-b-2 border-transparent text-neutral-500 hover:text-white",
                        )}
                      >
                        {s.name?.trim() || `Season ${s.season_number}`}
                      </button>
                    );
                  })}
                </div>

                {loadingSeason ? (
                  <p className="py-8 text-sm text-on-surface-variant">
                    Loading episodes…
                  </p>
                ) : (
                  <ul className="space-y-4">
                    {episodes.map((ep) => {
                      const thumb = ep.still_path
                        ? `https://image.tmdb.org/t/p/w500${ep.still_path}`
                        : poster_path
                          ? `https://image.tmdb.org/t/p/w500${poster_path}`
                          : null;
                      const mins =
                        typeof ep.runtime === "number" && ep.runtime > 0
                          ? `${ep.runtime} MIN`
                          : "—";
                      const rowActive =
                        playTarget?.season === selectedSeason &&
                        playTarget.episode === ep.episode_number;
                      const showProgress =
                        rowActive &&
                        !episodeIngest.canPlay &&
                        episodeIngest.status?.status !== "failed";

                      const handleEpisodeActivate = () => {
                        const same =
                          playTarget?.season === selectedSeason &&
                          playTarget.episode === ep.episode_number;
                        if (
                          same &&
                          episodeIngest.canPlay &&
                          episodeIngest.finalPlaybackUrl
                        ) {
                          setPlayerOpen(true);
                          return;
                        }
                        if (same && episodeIngest.status?.status === "failed") {
                          setPlayTarget(null);
                          window.requestAnimationFrame(() => {
                            setPlayTarget({
                              season: selectedSeason,
                              episode: ep.episode_number,
                              label: ep.name || `Episode ${ep.episode_number}`,
                            });
                          });
                          syncSeasonEpisode(selectedSeason, ep.episode_number);
                          return;
                        }
                        if (same && !episodeIngest.canPlay) {
                          return;
                        }
                        setPlayTarget({
                          season: selectedSeason,
                          episode: ep.episode_number,
                          label: ep.name || `Episode ${ep.episode_number}`,
                        });
                        syncSeasonEpisode(selectedSeason, ep.episode_number);
                      };

                      return (
                        <li
                          key={ep.id}
                          id={`episode-${selectedSeason}-${ep.episode_number}`}
                        >
                          <button
                            type="button"
                            onClick={handleEpisodeActivate}
                            className={cn(
                              "group flex w-full cursor-pointer flex-col gap-6 rounded-noir p-4 text-left transition-colors duration-300 md:flex-row",
                              rowActive
                                ? "bg-surface-container hover:bg-surface-container-high"
                                : "bg-surface-container-low hover:bg-surface-container",
                            )}
                          >
                            <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-noir bg-surface-container md:w-64">
                              {thumb ? (
                                <Image
                                  src={thumb}
                                  alt=""
                                  fill
                                  className="object-cover grayscale transition-transform duration-500 group-hover:scale-105"
                                  sizes="(max-width: 768px) 100vw, 256px"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center bg-surface-container-high text-on-surface-variant">
                                  —
                                </div>
                              )}
                              <div
                                className={cn(
                                  "absolute inset-0 flex items-center justify-center transition-opacity",
                                  episodeIngest.canPlay && rowActive
                                    ? "bg-black/35 opacity-100"
                                    : "bg-black/0 opacity-0 group-hover:bg-black/40 group-hover:opacity-100",
                                )}
                              >
                                <CirclePlay
                                  className="h-14 w-14 text-white"
                                  strokeWidth={1.25}
                                  aria-hidden
                                />
                              </div>
                            </div>
                            <div className="min-w-0 flex-1 space-y-2 py-2">
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                <h3 className="text-xl font-bold tracking-tight text-white">
                                  {ep.name || `Episode ${ep.episode_number}`}
                                </h3>
                                <span className="label-md font-mono text-[10px] text-on-surface-variant">
                                  {mins}
                                </span>
                              </div>
                              {ep.overview ? (
                                <p className="max-w-3xl text-sm font-light leading-relaxed text-on-surface-variant">
                                  {ep.overview}
                                </p>
                              ) : null}
                              <div className="pt-2">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-outline-variant/60">
                                  Episode {ep.episode_number}
                                </span>
                              </div>
                              {rowActive &&
                              episodeIngest.status?.status === "failed" ? (
                                <p className="text-sm font-medium text-red-400/90">
                                  {episodeIngest.message}
                                </p>
                              ) : null}
                              {showProgress ? (
                                <div className="w-full max-w-md space-y-2 pt-2">
                                  <Progress
                                    value={episodeIngest.status?.progress ?? 0}
                                  />
                                  <p className="text-sm font-light leading-relaxed text-on-surface-variant">
                                    {episodeIngest.message}
                                  </p>
                                </div>
                              ) : null}
                              {rowActive &&
                              episodeIngest.canPlay &&
                              !playerOpen ? (
                                <p className="text-sm text-on-surface-variant">
                                  Press again to play in full screen.
                                </p>
                              ) : null}
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </>
            )}
          </div>
        </motion.div>

        <motion.section
          className="grid gap-8 bg-surface px-5 py-10 md:grid-cols-12 md:gap-12 md:px-20 md:py-16"
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
                  Episode length
                </h4>
                <p className="text-lg font-medium text-on-surface">
                  {avgEpisodeMinutes != null
                    ? `~${avgEpisodeMinutes} min`
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
            {createdByLine ? (
              <div className="border-t border-noir-divider-subtle pt-8">
                <h4 className="label-md mb-4 uppercase tracking-[0.1em] text-neutral-500">
                  Created by
                </h4>
                <p className="text-xl font-bold tracking-tight text-white">
                  {createdByLine}
                </p>
              </div>
            ) : null}
          </div>

          <div className="space-y-12 md:col-span-8">
            <div className="grid gap-12 md:grid-cols-2">
              {overview ? (
                <div className="rounded-noir bg-surface-container-low p-8">
                  <h4 className="label-md mb-6 uppercase text-on-surface-variant">
                    Synopsis
                  </h4>
                  <p className="type-body-lg font-light text-on-surface">
                    {overview}
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
                  More series you may like
                </p>
              </div>
            </motion.div>
            <div className="no-scrollbar flex gap-4 overflow-x-auto px-5 pb-8 md:gap-6 md:px-20">
              {similar.map((m, index) => {
                const poster = m.poster_path
                  ? `https://image.tmdb.org/t/p/w342${m.poster_path}`
                  : null;
                const y = m.first_air_date
                  ? new Date(m.first_air_date).getFullYear()
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
                      href={`/watch/tv/${m.id}`}
                      className="group block cursor-pointer"
                    >
                      <div className="relative mb-4 aspect-[2/3] overflow-hidden rounded-noir bg-surface-container">
                        {poster ? (
                          <>
                            <Image
                              src={poster}
                              alt={m.name}
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
                        {m.name}
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

      {episodeIngest.finalPlaybackUrl && episodeIngest.canPlay && playTarget ? (
        <WatchNetflixPlayer
          open={playerOpen}
          onClose={() => setPlayerOpen(false)}
          src={episodeIngest.finalPlaybackUrl}
          mimeType={guessVideoJsType(
            episodeIngest.finalPlaybackUrl,
            episodeIngest.isProxyType,
          )}
          poster={posterUrlForPlayer}
          title={`${name} — S${playTarget.season}E${playTarget.episode}`}
        />
      ) : null}

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
