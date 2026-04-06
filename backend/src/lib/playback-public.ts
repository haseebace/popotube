/**
 * Public API / stream proxy helpers: prefer canonical Real-Debrid `stream_url` over
 * stale URLs that may remain in `playback_source` (e.g. legacy MediaFlow HLS).
 */

export function isHttpsHttpUrl(value: unknown): boolean {
  if (typeof value !== "string") return false;
  const s = value.trim();
  if (!s) return false;
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function trimHttpsUrl(value: string): string | null {
  const t = value.trim();
  return isHttpsHttpUrl(t) ? t : null;
}

function isRealDebridHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return h === "real-debrid.com" || h.endsWith(".real-debrid.com");
}

/**
 * Legacy transcoder / MediaFlow / non-RD HLS — must not be exposed in public JSON or used as stream upstream.
 */
export function isLegacyOrUnsupportedTranscoderUrl(url: string): boolean {
  const s = url.trim();
  if (!s) return false;
  if (/mediaflow/i.test(s)) return true;
  try {
    const u = new URL(s);
    const pathAndQuery = `${u.pathname}${u.search}`.toLowerCase();
    if (pathAndQuery.includes("mediaflow")) return true;
    if (/\.m3u8(\?|$)/i.test(s) && !isRealDebridHost(u.hostname)) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

function pickCanonicalPlaybackUrl(
  streamUrlRow: string | null | undefined,
  playback: unknown,
): string | null {
  const streamCandidate =
    typeof streamUrlRow === "string" ? trimHttpsUrl(streamUrlRow) : null;

  let playbackCandidate: string | null = null;
  if (playback && typeof playback === "object") {
    const u = (playback as { url?: unknown }).url;
    if (typeof u === "string" && u.trim()) {
      playbackCandidate = trimHttpsUrl(u.trim());
    }
  }

  const take = (candidate: string | null) =>
    candidate && !isLegacyOrUnsupportedTranscoderUrl(candidate)
      ? candidate
      : null;

  return take(streamCandidate) ?? take(playbackCandidate);
}

/** Upstream URL for `GET /api/stream/:id` — Real-Debrid / direct first; never legacy MF HLS. */
export function pickUpstreamStreamUrlFromRow(
  playback: unknown,
  streamUrlRow: string | null | undefined,
): string | null {
  return pickCanonicalPlaybackUrl(streamUrlRow, playback);
}

/**
 * Shape returned to browsers: prefer `stream_url`, then non-legacy `playback_source.url`.
 * Stale MediaFlow / external HLS URLs are stripped so clients only see a usable direct URL when one exists.
 */
export function publicPlaybackSourceFromRow(
  streamUrl: unknown,
  playback: unknown,
): Record<string, unknown> | null {
  if (!playback || typeof playback !== "object") return null;
  const p = { ...(playback as Record<string, unknown>) };
  const canonical = pickCanonicalPlaybackUrl(
    typeof streamUrl === "string" ? streamUrl : undefined,
    playback,
  );

  if (canonical) {
    return {
      ...p,
      url: canonical,
      type: "direct",
      source_type: "real_debrid",
    };
  }

  delete p.url;
  p.type = "direct";
  p.source_type = "real_debrid";
  return p;
}
