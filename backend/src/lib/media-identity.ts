import { supabase } from "./supabase";
import { logger } from "./logger";

function nowIso(): string {
  return new Date().toISOString();
}

/**
 * Upsert a TMDB movie identity row; returns its UUID.
 */
export async function ensureMovieRow(
  tmdbMovieId: number,
  title: string,
): Promise<string> {
  const safeTitle =
    title && String(title).trim().length > 0 ? String(title).trim() : "Unknown";
  const { data, error } = await supabase
    .from("movies")
    .upsert(
      {
        tmdb_movie_id: tmdbMovieId,
        title: safeTitle,
        updated_at: nowIso(),
      },
      { onConflict: "tmdb_movie_id" },
    )
    .select("id")
    .single();

  if (error || !data?.id) {
    throw error ?? new Error("ensureMovieRow: no id returned");
  }
  return data.id as string;
}

export type EnsureTvEpisodeOpts = {
  tmdbSeriesId: number;
  seasonNumber: number;
  episodeNumber: number;
  tmdbEpisodeId?: number | null;
  seriesTitle?: string;
};

/**
 * Upsert tv_series + tv_episodes for an episode; returns tv_episodes.id.
 */
export async function ensureTvEpisodeRow(
  opts: EnsureTvEpisodeOpts,
): Promise<string> {
  const {
    tmdbSeriesId,
    seasonNumber,
    episodeNumber,
    tmdbEpisodeId,
    seriesTitle,
  } = opts;
  const name =
    seriesTitle && String(seriesTitle).trim().length > 0
      ? String(seriesTitle).trim()
      : "";

  const { data: seriesRow, error: seriesErr } = await supabase
    .from("tv_series")
    .upsert(
      {
        tmdb_series_id: tmdbSeriesId,
        name,
        updated_at: nowIso(),
      },
      { onConflict: "tmdb_series_id" },
    )
    .select("id")
    .single();

  if (seriesErr || !seriesRow?.id) {
    throw seriesErr ?? new Error("ensureTvEpisodeRow: no series id");
  }

  const seriesId = seriesRow.id as string;

  const { data: epRow, error: epErr } = await supabase
    .from("tv_episodes")
    .upsert(
      {
        series_id: seriesId,
        tmdb_series_id: tmdbSeriesId,
        season_number: seasonNumber,
        episode_number: episodeNumber,
        tmdb_episode_id: tmdbEpisodeId ?? null,
        updated_at: nowIso(),
      },
      { onConflict: "series_id,season_number,episode_number" },
    )
    .select("id")
    .single();

  if (epErr || !epRow?.id) {
    throw epErr ?? new Error("ensureTvEpisodeRow: no episode id");
  }
  return epRow.id as string;
}

export type ResolveVideoIdentityOpts = {
  tmdbId: number | null | undefined;
  title: string;
  tmdbMediaType: "movie" | "tv";
  seasonNumber?: number | null;
  episodeNumber?: number | null;
  tmdbEpisodeId?: number | null;
};

/**
 * Columns to set on `videos.insert` / updates when TMDB context is known.
 */
export async function resolveVideoIdentityInsertColumns(
  opts: ResolveVideoIdentityOpts,
): Promise<{ movie_id?: string; tv_episode_id?: string }> {
  const {
    tmdbId,
    title,
    tmdbMediaType,
    seasonNumber,
    episodeNumber,
    tmdbEpisodeId,
  } = opts;
  if (tmdbId == null) return {};
  try {
    if (
      tmdbMediaType === "tv" &&
      seasonNumber != null &&
      episodeNumber != null
    ) {
      const tv_episode_id = await ensureTvEpisodeRow({
        tmdbSeriesId: tmdbId,
        seasonNumber,
        episodeNumber,
        seriesTitle: title,
        tmdbEpisodeId,
      });
      return { tv_episode_id };
    }
    if (tmdbMediaType === "movie") {
      const movie_id = await ensureMovieRow(tmdbId, title);
      return { movie_id };
    }
  } catch (err) {
    logger.warn(
      { err, svc: "media-identity", tmdbId, tmdbMediaType },
      "Identity upsert failed; video row will rely on legacy TMDB columns until backfill.",
    );
  }
  return {};
}

export type VideoRowLike = {
  id?: string;
  tmdb_id?: number | null;
  tmdb_media_type?: string | null;
  title?: string | null;
  season_number?: number | null;
  episode_number?: number | null;
  tmdb_episode_id?: number | null;
  movie_id?: string | null;
  tv_episode_id?: string | null;
};

/**
 * If a videos row is missing identity FKs but has TMDB context, upsert identity and patch the row.
 */
export async function backfillVideoIdentityFksIfNeeded(
  videoRecord: VideoRowLike,
): Promise<void> {
  const id = videoRecord.id;
  const tmdbId = videoRecord.tmdb_id;
  if (!id || tmdbId == null) return;

  const mediaType = videoRecord.tmdb_media_type;
  if (mediaType === "movie") {
    if (videoRecord.movie_id) return;
    const movieId = await ensureMovieRow(
      tmdbId,
      String(videoRecord.title ?? "Unknown"),
    );
    await supabase.from("videos").update({ movie_id: movieId }).eq("id", id);
    return;
  }

  if (mediaType === "tv") {
    if (videoRecord.tv_episode_id) return;
    const sn = videoRecord.season_number;
    const en = videoRecord.episode_number;
    if (sn == null || en == null) return;
    const epId = await ensureTvEpisodeRow({
      tmdbSeriesId: tmdbId,
      seasonNumber: sn,
      episodeNumber: en,
      tmdbEpisodeId: videoRecord.tmdb_episode_id,
      seriesTitle: videoRecord.title ?? undefined,
    });
    await supabase.from("videos").update({ tv_episode_id: epId }).eq("id", id);
  }
}
