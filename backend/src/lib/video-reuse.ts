import { supabase } from './supabase';

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

  if (video.status === 'completed') {
    if (video.playback_source) priority += 120;
    if (video.stream_url) priority += 80;
  }

  if (typeof video.progress === 'number') {
    priority += Math.min(video.progress, 100) / 100;
  }

  return priority;
}

function sortVideosByReusePriority(videos: Record<string, any>[]): Record<string, any>[] {
  return [...videos].sort((a, b) => getVideoPriority(b) - getVideoPriority(a));
}

export function isReusableVideoStatus(status?: string): boolean {
  return Boolean(status && ['completed', 'exposing_http', 'downloading_torrent', 'pending', 'submitted', 'retrying'].includes(status));
}

export async function findBestVideoForTmdb(
  tmdbId: number,
  columns: string = '*'
): Promise<Record<string, any> | null> {
  const { data, error } = await supabase
    .from('videos')
    .select(columns)
    .eq('tmdb_id', tmdbId);

  if (error) {
    throw error;
  }

  if (!data || data.length === 0) {
    return null;
  }

  return sortVideosByReusePriority(data)[0] ?? null;
}
