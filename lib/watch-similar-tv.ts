import type { WatchSimilarTv } from "@/components/public/watch/types";

export type TMDBListTv = {
  id: number;
  name: string;
  poster_path?: string | null;
  first_air_date?: string;
  genre_ids?: number[];
  vote_average?: number;
  vote_count?: number;
};

const MIN_VOTE_COUNT = 35;

function airYear(iso: string | undefined): number | null {
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

export function rankSimilarTv(
  currentId: number,
  currentFirstAirDate: string | undefined,
  currentGenres: { id: number }[] | undefined,
  similarResults: TMDBListTv[] | undefined,
  recommendationsResults: TMDBListTv[] | undefined,
  limit = 8,
): WatchSimilarTv[] {
  const sourceGenreIds = new Set(currentGenres?.map((g) => g.id) ?? []);
  const sourceYear = airYear(currentFirstAirDate);

  const byId = new Map<number, TMDBListTv>();
  for (const s of similarResults ?? []) {
    if (s.id !== currentId && s.name) byId.set(s.id, s);
  }
  for (const s of recommendationsResults ?? []) {
    if (s.id !== currentId && s.name && !byId.has(s.id)) {
      byId.set(s.id, s);
    }
  }

  const candidates = [...byId.values()].filter((s) => {
    if (s.vote_count != null && s.vote_count < MIN_VOTE_COUNT) return false;
    return true;
  });

  const softCandidates = [...byId.values()].filter(
    (s) => s.vote_count == null || s.vote_count >= 10,
  );

  const pool = candidates.length >= limit ? candidates : softCandidates;

  const scored = pool.map((s) => {
    const g = genreOverlapScore(sourceGenreIds, s.genre_ids);
    const y = airYear(s.first_air_date);
    let yearFit = 0.5;
    if (sourceYear != null && y != null) {
      const diff = Math.abs(sourceYear - y);
      yearFit = Math.max(0, 1 - Math.min(diff, 40) / 40);
    }
    const avg = s.vote_average ?? 5;
    const avgNorm = Math.min(10, Math.max(0, avg)) / 10;
    const score = g * 0.45 + yearFit * 0.35 + avgNorm * 0.2;
    return { s, score };
  });

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map(({ s }) => ({
    id: s.id,
    name: s.name,
    poster_path: s.poster_path ?? null,
    first_air_date: s.first_air_date,
  }));
}
