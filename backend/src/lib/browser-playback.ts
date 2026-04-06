/**
 * Mirrors frontend `lib/watch-playback.ts` `canPlayInBrowser` for server-side decisions.
 */

type VideoRow = Record<string, unknown>;

function isProxyOrHlsSource(status: VideoRow): boolean {
  const t = (status.playback_source as { type?: string } | null)?.type;
  return (
    t === "proxy" ||
    /\.m3u8(\?|$)/i.test(
      String((status.playback_source as { url?: string } | null)?.url ?? ""),
    )
  );
}

export function canPlayInBrowserServer(status: VideoRow | null): boolean {
  if (!status) return false;
  const ps = status.playback_source as { is_streamable?: boolean } | null;
  const proxy = isProxyOrHlsSource(status);
  if (ps?.is_streamable === false && !proxy) return false;
  return true;
}
