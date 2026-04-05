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
    if (video.mediaflow_playback) priority += 100;
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

export async function findBestVideoForTmdb(
  tmdbId: number,
  columns: string = "*",
  opts: FindVideoForTmdbOpts = { mode: "movie" },
): Promise<Record<string, any> | null> {
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
