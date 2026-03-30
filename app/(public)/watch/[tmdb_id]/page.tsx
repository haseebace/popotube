import React from "react";
import Link from "next/link";
import WatchPageShell from "@/components/public/watch/WatchPageShell";
import type { WatchMoviePayload } from "@/components/public/watch/types";
import {
  rankSimilarMovies,
  type TMDBListMovie,
} from "@/lib/watch-similar-movies";

type TMDBGenre = {
  id: number;
  name: string;
};

type TMDBCrewMember = {
  id: number;
  name: string;
  job?: string;
};

type TMDBCastMember = {
  id: number;
  name: string;
  character?: string;
};

type TMDBReleaseDatesResult = {
  iso_3166_1: string;
  release_dates: Array<{ certification: string }>;
};

type TMDBMovieDetails = {
  id: number;
  title: string;
  tagline?: string;
  overview?: string;
  backdrop_path?: string | null;
  poster_path?: string | null;
  vote_average?: number;
  runtime?: number;
  release_date?: string;
  genres?: TMDBGenre[];
  credits?: {
    crew?: TMDBCrewMember[];
    cast?: TMDBCastMember[];
  };
  release_dates?: {
    results?: TMDBReleaseDatesResult[];
  };
  similar?: {
    results?: TMDBListMovie[];
  };
  recommendations?: {
    results?: TMDBListMovie[];
  };
};

function usCertification(movie: TMDBMovieDetails): string | null {
  const us = movie.release_dates?.results?.find((r) => r.iso_3166_1 === "US");
  const withCert = us?.release_dates?.find((d) => d.certification?.trim());
  return withCert?.certification?.trim() || null;
}

async function getMovieDetails(id: string) {
  const TMDB_API_KEY = process.env.TMDB_API_KEY;
  const TMDB_BASE_URL =
    process.env.TMDB_BASE_URL || "https://api.themoviedb.org/3";
  if (!TMDB_API_KEY) return null;
  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/movie/${id}?append_to_response=credits,videos,release_dates,similar,recommendations&language=en-US&api_key=${TMDB_API_KEY}`,
      { next: { revalidate: 3600 } },
    );
    if (!response.ok) return null;
    return (await response.json()) as TMDBMovieDetails;
  } catch {
    return null;
  }
}

function heroTeaser(movie: TMDBMovieDetails): string {
  if (movie.tagline?.trim()) return movie.tagline.trim();
  if (movie.overview?.trim()) {
    const t = movie.overview.trim();
    return t.length > 220 ? `${t.slice(0, 217)}…` : t;
  }
  return "";
}

function toPayload(movie: TMDBMovieDetails): WatchMoviePayload {
  const similar = rankSimilarMovies(
    movie.id,
    movie.release_date,
    movie.genres,
    movie.similar?.results,
    movie.recommendations?.results,
    8,
  );
  return {
    id: movie.id,
    title: movie.title,
    tagline: movie.tagline,
    overview: movie.overview,
    backdrop_path: movie.backdrop_path,
    poster_path: movie.poster_path,
    vote_average: movie.vote_average,
    runtime: movie.runtime,
    release_date: movie.release_date,
    genres: movie.genres,
    credits: movie.credits,
    release_dates: movie.release_dates,
    similar,
  };
}

export default async function WatchPage({
  params,
}: {
  params: Promise<{ tmdb_id: string }>;
}) {
  const { tmdb_id } = await params;
  const movie = await getMovieDetails(tmdb_id);

  if (!movie) {
    return (
      <div className="-mt-14 flex min-h-screen flex-col items-center justify-center gap-4 bg-surface px-6 font-body text-on-surface">
        <p className="label-md uppercase text-on-surface-variant">Catalogue</p>
        <h1 className="type-headline-lg font-bold uppercase tracking-tighter text-noir-primary">
          Title not found
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

  const director = movie.credits?.crew?.find((c) => c.job === "Director");

  return (
    <WatchPageShell
      tmdbId={tmdb_id}
      ingestMeta={{
        title: movie.title,
        release_date: movie.release_date,
      }}
      payload={toPayload(movie)}
      teaser={heroTeaser(movie)}
      certification={usCertification(movie)}
      year={
        movie.release_date ? new Date(movie.release_date).getFullYear() : null
      }
      genreLine={movie.genres?.map((g) => g.name).join(" / ") || "—"}
      directorName={director?.name ?? null}
    />
  );
}
