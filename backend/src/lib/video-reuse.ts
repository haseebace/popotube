import { supabase } from "./supabase";

export type FindVideoForTmdbOpts =
  | { mode: "movie" }
  | { mode: "tv_episode"; seasonNumber: number; episodeNumber: number };

const STATUS_PRIORITY: Record<string, number> = {
  completed: 1000,
  exposing_http: 740,
  downloading_torrent: 720,
  pending: 700,
  submitted: 690,
  retrying: 500,
  failed: 100,
};

function getVideoPriority(video: Record<string, any>): number {
  let priority = STATUS_PRIORITY[video.status] ?? 0;

  if (video.status === "completed") {
    if (video.playback_source) priority += 120;
    if (video.stream_url) priority += 80;
  }

  if (typeof video.progress === "number") {
    priority += Math.min(video.progress, 100) / 100;
  }

  return priority;
}

function sortVideosByReusePriority(
  videos: Record<string, any>[],
): Record<string, any>[] {
  return [...videos].sort((a, b) => getVideoPriority(b) - getVideoPriority(a));
}

export function isReusableVideoStatus(status?: string): boolean {
  return Boolean(
    status &&
    [
      "completed",
      "exposing_http",
      "downloading_torrent",
      "pending",
      "submitted",
      "retrying",
    ].includes(status),
  );
}

async function findVideosByMovieFk(
  movieUuid: string,
  columns: string,
): Promise<Record<string, any>[] | null> {
  const { data, error } = await supabase
    .from("videos")
    .select(columns)
    .eq("movie_id", movieUuid);
  if (error) throw error;
  return data && data.length > 0 ? data : null;
}

async function findVideosByTvEpisodeFk(
  episodeUuid: string,
  columns: string,
): Promise<Record<string, any>[] | null> {
  const { data, error } = await supabase
    .from("videos")
    .select(columns)
    .eq("tv_episode_id", episodeUuid);
  if (error) throw error;
  return data && data.length > 0 ? data : null;
}

export async function findBestVideoForTmdb(
  tmdbId: number,
  columns: string = "*",
  opts: FindVideoForTmdbOpts = { mode: "movie" },
): Promise<Record<string, any> | null> {
  if (opts.mode === "movie") {
    const { data: movieRow, error: movieErr } = await supabase
      .from("movies")
      .select("id")
      .eq("tmdb_movie_id", tmdbId)
      .maybeSingle();
    if (movieErr) throw movieErr;
    if (movieRow?.id) {
      const byFk = await findVideosByMovieFk(movieRow.id as string, columns);
      if (byFk) {
        return sortVideosByReusePriority(byFk)[0] ?? null;
      }
    }
  } else {
    const { data: epRow, error: epErr } = await supabase
      .from("tv_episodes")
      .select("id")
      .eq("tmdb_series_id", tmdbId)
      .eq("season_number", opts.seasonNumber)
      .eq("episode_number", opts.episodeNumber)
      .maybeSingle();
    if (epErr) throw epErr;
    if (epRow?.id) {
      const byFk = await findVideosByTvEpisodeFk(epRow.id as string, columns);
      if (byFk) {
        return sortVideosByReusePriority(byFk)[0] ?? null;
      }
    }
  }

  let q = supabase.from("videos").select(columns).eq("tmdb_id", tmdbId);

  if (opts.mode === "tv_episode") {
    q = q
      .eq("tmdb_media_type", "tv")
      .eq("season_number", opts.seasonNumber)
      .eq("episode_number", opts.episodeNumber);
  } else {
    q = q
      .eq("tmdb_media_type", "movie")
      .is("season_number", null)
      .is("episode_number", null);
  }

  const { data, error } = await q;

  if (error) {
    throw error;
  }

  if (!data || data.length === 0) {
    return null;
  }

  return sortVideosByReusePriority(data)[0] ?? null;
}
