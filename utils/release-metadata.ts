/**
 * Maps @viren070/parse-torrent-title output into PoPoTube DB/UI fields.
 * Keep mapping logic in sync with backend/src/lib/release-metadata.ts.
 */
import { parseTorrentTitle } from '@viren070/parse-torrent-title';
import type { ParsedResult } from '@viren070/parse-torrent-title';

export interface ReleaseMetadata {
  quality: string;
  codec: string;
  source: string;
  seasonNumber: number | null;
  episodeNumber: number | null;
  releaseYear: number | null;
  releaseGroup: string | null;
  extras: Record<string, unknown>;
}

function normalizeResolution(raw?: string): string {
  if (!raw) return 'unknown';
  const r = raw.toLowerCase().trim();
  if (r === '4k' || r === '2160p' || r === 'uhd') return '2160p';
  if (r === '1080p' || r === '1080i' || r === '720p' || r === '480p') return r;
  if (/^\d+p$/i.test(raw)) return raw.toLowerCase();
  return 'unknown';
}

function normalizeCodec(raw?: string): string {
  if (!raw) return 'unknown';
  const c = raw.toLowerCase().replace(/[\s.-]/g, '');
  if (['x265', 'h265', 'hevc'].includes(c)) return 'HEVC';
  if (['x264', 'h264', 'avc'].includes(c)) return 'H.264';
  if (c === 'av1') return 'AV1';
  if (c === 'xvid' || c === 'divx') return raw.toUpperCase();
  return 'unknown';
}

function normalizeSource(parsed: ParsedResult): string {
  const q = (parsed.quality || '').toLowerCase().replace(/[\s.-]/g, '');
  const types = (parsed.releaseTypes || []).map((t) => t.toLowerCase());
  const haystack = [q, ...types].join(' ');

  if (/\bremux\b/.test(haystack) || q === 'remux') return 'Remux';
  if (q === 'webdl' || q === 'web-dl') return 'WEB-DL';
  if (q === 'webrip') return 'WEBRip';
  if (['bluray', 'bdrip', 'brrip', 'bmdrip', 'bdsr'].includes(q) || haystack.includes('bluray'))
    return 'Blu-Ray';
  if (q === 'dvdrip' || q === 'dvd') return 'DVDRIP';
  if (q === 'hdtv' || q === 'pdtv' || q === 'sdtv') return 'HDTV';
  if (q === 'hdrip') return 'HDRIP';
  if (q === 'cam' || q === 'hdcam') return 'CAM';
  if (q === 'ts' || q === 'telesync' || q === 'hdts') return 'TS';
  if (q === 'tc' || q === 'telecine') return 'TC';
  if (parsed.quality && parsed.quality !== 'unknown') {
    return parsed.quality.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/webdl/gi, 'WEB-DL');
  }
  return 'unknown';
}

function mapParsedResult(raw: ParsedResult): ReleaseMetadata {
  const quality = normalizeResolution(raw.resolution);
  const seasonNumber =
    raw.seasons && raw.seasons.length === 1 ? raw.seasons[0]! : null;
  const episodeNumber =
    raw.episodes && raw.episodes.length === 1 ? raw.episodes[0]! : null;

  let releaseYear: number | null = null;
  if (raw.year) {
    const y = parseInt(raw.year, 10);
    if (!Number.isNaN(y) && y >= 1900 && y <= 2100) releaseYear = y;
  }

  const extras: Record<string, unknown> = {};
  if (raw.hdr?.length) extras.hdr = raw.hdr;
  if (raw.audio?.length) extras.audio = raw.audio;
  if (raw.channels?.length) extras.channels = raw.channels;
  if (raw.languages?.length) extras.languages = raw.languages;
  if (raw.editions?.length) extras.editions = raw.editions;
  if (raw.releaseTypes?.length) extras.releaseTypes = raw.releaseTypes;
  if (raw.bitDepth) extras.bitDepth = raw.bitDepth;
  if (raw.episodeCode) extras.episodeCode = raw.episodeCode;
  if (raw.title) extras.parsedTitle = raw.title;
  if (raw.seasons && raw.seasons.length !== 1) extras.seasons = raw.seasons;
  if (raw.episodes && raw.episodes.length !== 1) extras.episodes = raw.episodes;
  if (raw.container) extras.container = raw.container;
  if (raw.network) extras.network = raw.network;

  return {
    quality,
    codec: normalizeCodec(raw.codec),
    source: normalizeSource(raw),
    seasonNumber,
    episodeNumber,
    releaseYear,
    releaseGroup: raw.group || null,
    extras,
  };
}

export function parseReleaseMetadata(title: string): ReleaseMetadata {
  return mapParsedResult(parseTorrentTitle(title));
}

/** @deprecated Use parseReleaseMetadata — kept for incremental migration */
export function parseTorrentMetadata(title: string) {
  const m = parseReleaseMetadata(title);
  return { quality: m.quality, codec: m.codec, source: m.source };
}

/** Single-episode TV label, or null for movies / ambiguous packs. */
export function formatSeasonEpisodeLabel(meta: ReleaseMetadata): string | null {
  if (meta.seasonNumber != null && meta.episodeNumber != null) {
    return `S${String(meta.seasonNumber).padStart(2, '0')}E${String(meta.episodeNumber).padStart(2, '0')}`;
  }
  return null;
}
