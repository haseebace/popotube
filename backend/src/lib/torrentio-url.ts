/**
 * Torrentio stream list origin. Override when Cloudflare (or similar) blocks
 * your server's datacenter IP — point at a small HTTPS relay on another network.
 *
 * Full request path is: `{base}/providers=.../stream/movie/{imdb}.json` (see trigger-ingestion).
 */
const DEFAULT_TORRENTIO_BASE = "https://torrentio.strem.fun";

export function getTorrentioBaseUrl(): string {
  const raw = process.env.TORRENTIO_BASE_URL?.trim();
  if (!raw) return DEFAULT_TORRENTIO_BASE;
  try {
    const u = new URL(raw);
    if (u.protocol !== "http:" && u.protocol !== "https:") {
      return DEFAULT_TORRENTIO_BASE;
    }
    const path = u.pathname.replace(/\/+$/, "") || "";
    return path ? `${u.origin}${path}` : u.origin;
  } catch {
    return DEFAULT_TORRENTIO_BASE;
  }
}
