import type { TMDBListTv } from "@/lib/watch-similar-tv";

export type TMDBTVEpisode = {
  id: number;
  episode_number: number;
  name: string;
  overview: string;
  still_path: string | null;
  runtime: number | null;
};

export type TMDBTVSeasonResponse = {
  episodes: TMDBTVEpisode[];
};

export type TMDBTVDetails = {
  id: number;
  name: string;
  tagline?: string;
  overview?: string;
  backdrop_path?: string | null;
  poster_path?: string | null;
  vote_average?: number;
  first_air_date?: string;
  /** Typical episode lengths in minutes (TMDB may provide one or more). */
  episode_run_time?: number[];
  genres?: { id: number; name: string }[];
  number_of_seasons?: number;
  seasons?: Array<{
    season_number: number;
    name: string;
    episode_count: number;
  }>;
  credits?: {
    crew?: { id: number; name: string; job?: string }[];
    cast?: { id: number; name: string; character?: string }[];
  };
  content_ratings?: {
    results?: Array<{ iso_3166_1: string; rating: string }>;
  };
  similar?: { results?: TMDBListTv[] };
  recommendations?: { results?: TMDBListTv[] };
  created_by?: Array<{ id: number; name: string }>;
};

export async function fetchTvDetails(
  id: string,
): Promise<TMDBTVDetails | null> {
  const TMDB_API_KEY = process.env.TMDB_API_KEY;
  const TMDB_BASE_URL =
    process.env.TMDB_BASE_URL || "https://api.themoviedb.org/3";
  if (!TMDB_API_KEY) return null;
  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/tv/${encodeURIComponent(id)}?append_to_response=credits,similar,recommendations,content_ratings&language=en-US&api_key=${TMDB_API_KEY}`,
      { next: { revalidate: 3600 } },
    );
    if (!response.ok) return null;
    return (await response.json()) as TMDBTVDetails;
  } catch {
    return null;
  }
}

export async function fetchTvSeason(
  tvId: string,
  seasonNumber: number,
): Promise<TMDBTVSeasonResponse | null> {
  const TMDB_API_KEY = process.env.TMDB_API_KEY;
  const TMDB_BASE_URL =
    process.env.TMDB_BASE_URL || "https://api.themoviedb.org/3";
  if (!TMDB_API_KEY) return null;
  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/tv/${encodeURIComponent(tvId)}/season/${seasonNumber}?language=en-US&api_key=${TMDB_API_KEY}`,
      { next: { revalidate: 3600 } },
    );
    if (!response.ok) return null;
    return (await response.json()) as TMDBTVSeasonResponse;
  } catch {
    return null;
  }
}

export function defaultSeasonNumber(seasons: TMDBTVDetails["seasons"]): number {
  if (!seasons?.length) return 1;
  const ordered = [...seasons]
    .filter((s) => s.episode_count > 0)
    .sort((a, b) => a.season_number - b.season_number);
  const firstReal = ordered.find((s) => s.season_number > 0);
  if (firstReal) return firstReal.season_number;
  return ordered[0]?.season_number ?? 1;
}

export function usTvContentRating(tv: TMDBTVDetails): string | null {
  const us = tv.content_ratings?.results?.find((r) => r.iso_3166_1 === "US");
  return us?.rating?.trim() || null;
}

/** Resolve ?season= from URL when present and valid for this show; else `fallbackSeason`. */
export function resolveSeasonFromSearchParam(
  seasons: TMDBTVDetails["seasons"],
  seasonParam: string | undefined,
  fallbackSeason: number,
): number {
  if (!seasons?.length) return fallbackSeason;
  const raw = seasonParam?.trim();
  if (!raw) return fallbackSeason;
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 0) return fallbackSeason;
  return seasons.some((s) => s.season_number === n) ? n : fallbackSeason;
}

/** Parse ?episode= for deep-link focus (1-based). */
export function parseEpisodeFocusParam(
  episodeParam: string | undefined,
): number | null {
  const raw = episodeParam?.trim();
  if (!raw) return null;
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1) return null;
  return n;
}
