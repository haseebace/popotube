import type { WatchSimilarMovie } from "@/components/public/watch/types";

/** TMDB list shape from /similar and /recommendations append_to_response. */
export type TMDBListMovie = {
  id: number;
  title: string;
  poster_path?: string | null;
  release_date?: string;
  genre_ids?: number[];
  vote_average?: number;
  vote_count?: number;
};

const MIN_VOTE_COUNT = 35;

function releaseYear(iso: string | undefined): number | null {
  if (!iso?.trim()) return null;
  const y = Number.parseInt(iso.slice(0, 4), 10);
  return Number.isFinite(y) ? y : null;
}

function genreOverlapScore(
  sourceIds: Set<number>,
  candidateIds: number[] | undefined,
): number {
  if (sourceIds.size === 0) return 0;
  if (!candidateIds?.length) return 0;
  let shared = 0;
  for (const id of candidateIds) {
    if (sourceIds.has(id)) shared += 1;
  }
  return shared / sourceIds.size;
}

/**
 * Merge TMDB similar + recommendations, dedupe by id, rank by genre fit, era proximity,
 * and rating signal. Falls back to vote_count if the ranked pool is short.
 */
export function rankSimilarMovies(
  currentId: number,
  currentReleaseDate: string | undefined,
  currentGenres: { id: number }[] | undefined,
  similarResults: TMDBListMovie[] | undefined,
  recommendationsResults: TMDBListMovie[] | undefined,
  limit = 8,
): WatchSimilarMovie[] {
  const sourceGenreIds = new Set(currentGenres?.map((g) => g.id) ?? []);
  const sourceYear = releaseYear(currentReleaseDate);

  const byId = new Map<number, TMDBListMovie>();
  for (const m of similarResults ?? []) {
    if (m.id !== currentId && m.title) byId.set(m.id, m);
  }
  for (const m of recommendationsResults ?? []) {
    if (m.id !== currentId && m.title && !byId.has(m.id)) {
      byId.set(m.id, m);
    }
  }

  const candidates = [...byId.values()].filter((m) => {
    if (m.vote_count != null && m.vote_count < MIN_VOTE_COUNT) return false;
    return true;
  });

  const softCandidates = [...byId.values()].filter(
    (m) => m.vote_count == null || m.vote_count >= 10,
  );

  const pool = candidates.length >= limit ? candidates : softCandidates;

  const scored = pool.map((m) => {
    const g = genreOverlapScore(sourceGenreIds, m.genre_ids);
    const y = releaseYear(m.release_date);
    let yearFit = 0.5;
    if (sourceYear != null && y != null) {
      const diff = Math.abs(sourceYear - y);
      yearFit = Math.max(0, 1 - Math.min(diff, 40) / 40);
    }
    const avg = m.vote_average ?? 5;
    const avgNorm = Math.min(10, Math.max(0, avg)) / 10;
    const vc = m.vote_count ?? 0;
    const reliability = Math.min(1.5, Math.log10(vc + 10) / 2);

    const score = 14 * g + 9 * yearFit + 3 * avgNorm + reliability;
    return { m, score };
  });

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return (b.m.vote_count ?? 0) - (a.m.vote_count ?? 0);
  });

  const picked = new Set<number>();
  const out: WatchSimilarMovie[] = [];

  for (const { m } of scored) {
    if (out.length >= limit) break;
    if (picked.has(m.id)) continue;
    picked.add(m.id);
    out.push({
      id: m.id,
      title: m.title,
      poster_path: m.poster_path,
      release_date: m.release_date,
    });
  }

  if (out.length < limit) {
    const rest = [...byId.values()]
      .filter((m) => !picked.has(m.id))
      .sort((a, b) => (b.vote_count ?? 0) - (a.vote_count ?? 0));
    for (const m of rest) {
      if (out.length >= limit) break;
      out.push({
        id: m.id,
        title: m.title,
        poster_path: m.poster_path,
        release_date: m.release_date,
      });
    }
  }

  return out;
}
