/**
 * Derive browser playback URL and transport hints from a videos row + playback_source.
 * Playback goes through Fastify `GET /api/stream/:id` whenever the row has a stored upstream URL
 * (no separate MediaFlow column).
 */

import { getPublicBackendUrl } from "@/lib/backend-public-url";

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
    mime_type?: string | null;
  } | null;
};

/**
 * Prefer the backend byte proxy when we have a row id and any stored playback URL so:
 * - the browser hits one origin (CORS, cookies)
 * - Real-Debrid URLs stay off the client JSON when we normalize on the server later
 * - legacy rows still proxy whatever URL is stored in `playback_source`
 */
export function getFinalPlaybackUrl(
  status: VideoRowLike | null,
): string | null {
  if (!status) return null;
  const url = status.playback_source?.url;
  if (status.id && typeof url === "string" && url.length > 0) {
    return `${getPublicBackendUrl()}/api/stream/${status.id}`;
  }
  return url || status.stream_url || null;
}

export function isProxyOrHlsSource(status: VideoRowLike | null): boolean {
  if (!status) return false;
  const t = status?.playback_source?.type;
  if (t === "proxy") return true;
  const u = status.playback_source?.url ?? "";
  return /\.m3u8(\?|$)/i.test(u);
}

export function canPlayInBrowser(status: VideoRowLike | null): boolean {
  if (!status) return false;
  const proxy = isProxyOrHlsSource(status);
  if (status.playback_source?.is_streamable === false && !proxy) return false;
  return true;
}

/**
 * Pick the correct Video.js MIME type using the API row when the src is our `/api/stream/:id` proxy.
 * Fixes WebM and other containers that were incorrectly labeled as `video/mp4`.
 */
export function getVideoJsMimeType(
  status: VideoRowLike | null,
  src: string,
): string {
  if (!src) return "video/mp4";
  if (/\.m3u8(\?|$)/i.test(src)) {
    return "application/x-mpegURL";
  }
  if (isProxyOrHlsSource(status)) {
    return "application/x-mpegURL";
  }
  const declared = status?.playback_source?.mime_type?.trim();
  if (declared && /^video\//i.test(declared)) {
    return declared;
  }
  const c = status?.playback_source?.container?.toLowerCase();
  if (c === "webm") return "video/webm";
  if (c === "mp4" || c === "m4v") return "video/mp4";
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
 * multichannel AAC and avoids Chrome-style MEDIA_ERR_DECODE on some HLS outputs.
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
