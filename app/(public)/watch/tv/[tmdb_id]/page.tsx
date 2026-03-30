import Link from "next/link";
import type { Metadata } from "next";
import { Suspense } from "react";
import WatchTvSeriesExperience from "@/components/public/watch/WatchTvSeriesExperience";
import {
  defaultSeasonNumber,
  fetchTvDetails,
  fetchTvSeason,
  parseEpisodeFocusParam,
  resolveSeasonFromSearchParam,
  usTvContentRating,
  type TMDBTVDetails,
} from "@/lib/tmdb-tv";
import { rankSimilarTv } from "@/lib/watch-similar-tv";

function heroTeaser(tv: Pick<TMDBTVDetails, "tagline" | "overview">): string {
  if (tv.tagline?.trim()) return tv.tagline.trim();
  if (tv.overview?.trim()) {
    const t = tv.overview.trim();
    return t.length > 220 ? `${t.slice(0, 217)}…` : t;
  }
  return "";
}

function avgEpisodeMinutes(
  tv: Pick<TMDBTVDetails, "episode_run_time">,
): number | null {
  const arr = tv.episode_run_time;
  if (!arr?.length) return null;
  const sum = arr.reduce((a, b) => a + b, 0);
  return Math.round(sum / arr.length);
}

type Props = {
  params: Promise<{ tmdb_id: string }>;
  searchParams: Promise<{ season?: string; episode?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tmdb_id } = await params;
  const tv = await fetchTvDetails(tmdb_id);
  if (!tv) return { title: "Not found" };
  return {
    title: `${tv.name} — Series | PoPoTube`,
    description: tv.overview?.slice(0, 160) ?? undefined,
  };
}

export default async function WatchTvSeriesPage({
  params,
  searchParams,
}: Props) {
  const { tmdb_id } = await params;
  const sp = await searchParams;
  const tv = await fetchTvDetails(tmdb_id);

  if (!tv) {
    return (
      <div className="-mt-14 flex min-h-screen flex-col items-center justify-center gap-4 bg-surface px-6 font-body text-on-surface">
        <p className="label-md uppercase text-on-surface-variant">Catalogue</p>
        <h1 className="type-headline-lg font-bold uppercase tracking-tighter text-noir-primary">
          Series not found
        </h1>
        <Link
          href="/"
          className="label-md mt-2 uppercase text-noir-secondary underline-offset-4 transition-colors hover:text-noir-primary hover:underline"
        >
          Back to browse
        </Link>
      </div>
    );
  }

  const fallbackSeason = defaultSeasonNumber(tv.seasons);
  const seasonNum = resolveSeasonFromSearchParam(
    tv.seasons,
    sp.season,
    fallbackSeason,
  );
  const seasonPayload = await fetchTvSeason(String(tv.id), seasonNum);
  const initialEpisodes = seasonPayload?.episodes ?? [];
  const initialEpisodeFocus = parseEpisodeFocusParam(sp.episode);

  const similar = rankSimilarTv(
    tv.id,
    tv.first_air_date,
    tv.genres,
    tv.similar?.results,
    tv.recommendations?.results,
    8,
  );

  const starring = tv.credits?.cast?.filter((c) => c.name)?.slice(0, 5) ?? [];
  const createdByLine =
    tv.created_by
      ?.map((c) => c.name)
      .filter(Boolean)
      .join(", ") || null;

  const year = tv.first_air_date
    ? new Date(tv.first_air_date).getFullYear()
    : null;

  const firstEp = initialEpisodes[0];
  const pilotCtaLabel = `PLAY S${seasonNum}E${firstEp?.episode_number ?? 1}`;

  return (
    <Suspense
      fallback={
        <div className="-mt-14 min-h-screen bg-surface font-body text-on-surface" />
      }
    >
      <WatchTvSeriesExperience
        tvId={String(tv.id)}
        name={tv.name}
        overview={tv.overview}
        backdrop_path={tv.backdrop_path}
        poster_path={tv.poster_path}
        vote_average={tv.vote_average}
        first_air_date={tv.first_air_date}
        initialEpisodeFocus={initialEpisodeFocus}
        genreLine={tv.genres?.map((g) => g.name).join(" • ") || "—"}
        certification={usTvContentRating(tv)}
        year={year}
        avgEpisodeMinutes={avgEpisodeMinutes(tv)}
        createdByLine={createdByLine}
        starring={starring}
        similar={similar}
        seasons={tv.seasons ?? []}
        initialSeasonNumber={seasonNum}
        initialEpisodes={initialEpisodes}
        heroTeaser={heroTeaser(tv)}
        pilotCtaLabel={pilotCtaLabel}
      />
    </Suspense>
  );
}
