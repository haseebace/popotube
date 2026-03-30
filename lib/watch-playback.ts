/**
 * Derive browser playback URL and transport hints from a videos row + playback_source.
 */

export type VideoRowLike = {
  id?: string;
  status?: string;
  progress?: number;
  error_message?: string | null;
  stream_url?: string | null;
  playback_source?: {
    url?: string | null;
    type?: string;
    is_streamable?: boolean;
    container?: string;
  } | null;
};

export function getFinalPlaybackUrl(
  status: VideoRowLike | null,
): string | null {
  if (!status) return null;
  let url = status.playback_source?.url || status.stream_url || null;
  if (status.playback_source?.type === "direct" && status.id) {
    url = `/api/proxy/stream/${status.id}`;
  }
  return url || null;
}

export function isProxyOrHlsSource(status: VideoRowLike | null): boolean {
  const t = status?.playback_source?.type;
  return t === "proxy" || t === "mediaflow";
}

export function canPlayInBrowser(status: VideoRowLike | null): boolean {
  if (!status) return false;
  const proxy = isProxyOrHlsSource(status);
  if (status.playback_source?.is_streamable === false && !proxy) return false;
  return true;
}

/** MIME type for Video.js source */
export function guessVideoJsType(src: string, isProxyOrHls: boolean): string {
  if (isProxyOrHls || /\.m3u8(\?|$)/i.test(src)) {
    return "application/x-mpegURL";
  }
  return "video/mp4";
}
