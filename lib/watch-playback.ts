/**
 * Derive browser playback URL and transport hints from a videos row + playback_source + mediaflow_playback.
 */

export type MediaflowPlaybackRow = {
  type?: string;
  url?: string | null;
  mime_type?: string;
  container?: string;
};

export type VideoRowLike = {
  id?: string;
  status?: string;
  progress?: number;
  error_message?: string | null;
  stream_url?: string | null;
  mediaflow_playback?: MediaflowPlaybackRow | null;
  playback_source?: {
    url?: string | null;
    type?: string;
    is_streamable?: boolean;
    container?: string;
  } | null;
};

function legacyHlsUrl(status: VideoRowLike | null): string | null {
  const t = status?.playback_source?.type;
  if (t === "mediaflow_transcode_hls" && status?.playback_source?.url) {
    return status.playback_source.url;
  }
  return null;
}

export function getFinalPlaybackUrl(
  status: VideoRowLike | null,
): string | null {
  if (!status) return null;
  const mf = status.mediaflow_playback;
  if (mf?.url && mf.type === "mediaflow_transcode_hls") {
    return mf.url;
  }
  const legacy = legacyHlsUrl(status);
  if (legacy) return legacy;
  if (status.playback_source?.type === "direct" && status.id) {
    return `/api/proxy/stream/${status.id}`;
  }
  return status.playback_source?.url || status.stream_url || null;
}

export function isProxyOrHlsSource(status: VideoRowLike | null): boolean {
  if (!status) return false;
  if (
    status.mediaflow_playback?.url &&
    status.mediaflow_playback?.type === "mediaflow_transcode_hls"
  ) {
    return true;
  }
  const t = status?.playback_source?.type;
  return (
    t === "proxy" ||
    t === "mediaflow" ||
    t === "mediaflow_transcode_hls" ||
    t === "mediaflow_stream"
  );
}

export function canPlayInBrowser(status: VideoRowLike | null): boolean {
  if (!status) return false;
  if (
    status.mediaflow_playback?.type === "mediaflow_transcode_hls" &&
    status.mediaflow_playback?.url
  ) {
    return true;
  }
  if (legacyHlsUrl(status)) return true;
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

export function isHlsMimeOrUrl(mimeType: string, src: string): boolean {
  return (
    mimeType.includes("mpegURL") ||
    mimeType.includes("mpegurl") ||
    /\.m3u8(\?|$)/i.test(src)
  );
}

/**
 * Safari / iOS WebKit: use native HLS instead of MSE+VHS — often required for
 * multichannel AAC and avoids Chrome-style MEDIA_ERR_DECODE on some Mediaflow outputs.
 */
export function preferNativeHlsPlayback(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/i.test(ua)) return true;
  return (
    /Safari/i.test(ua) &&
    !/Chrome|Chromium|CriOS|Edg|Firefox|FxiOS|OPR|Android/i.test(ua)
  );
}
