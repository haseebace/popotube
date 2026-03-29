/**
 * Maps @viren070/parse-torrent-title output into PoPoTube DB/UI fields.
 * Keep mapping logic in sync with utils/release-metadata.ts (frontend).
 *
 * ESM-only dependency: `@viren070/parse-torrent-title` has no CJS export. TypeScript
 * with `module: commonjs` rewrites `import("pkg")` to `require("pkg")`, which fails at
 * runtime. Loading via `new Function` keeps a native dynamic `import()` in the emit.
 */
import type { ParsedResult } from '@viren070/parse-torrent-title';

type ParseTorrentTitleFn = (title: string) => ParsedResult;

const parserModule: Promise<ParseTorrentTitleFn> = new Function(
  'return import("@viren070/parse-torrent-title").then((m) => m.parseTorrentTitle)',
)() as Promise<ParseTorrentTitleFn>;

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

export async function parseReleaseMetadata(title: string): Promise<ReleaseMetadata> {
  const parseTorrentTitle = await parserModule;
  return mapParsedResult(parseTorrentTitle(title));
}

export type VideoParseColumns = {
  quality: string | null;
  codec: string | null;
  source: string | null;
  season_number: number | null;
  episode_number: number | null;
  release_year: number | null;
  release_group: string | null;
  release_parse_extras: Record<string, unknown> | null;
};

/** DB columns derived from release metadata (nulls for unknown / empty extras). */
export function releaseMetadataToVideoColumns(meta: ReleaseMetadata): VideoParseColumns {
  return {
    quality: meta.quality !== 'unknown' ? meta.quality : null,
    codec: meta.codec !== 'unknown' ? meta.codec : null,
    source: meta.source !== 'unknown' ? meta.source : null,
    season_number: meta.seasonNumber,
    episode_number: meta.episodeNumber,
    release_year: meta.releaseYear,
    release_group: meta.releaseGroup,
    release_parse_extras: Object.keys(meta.extras).length > 0 ? meta.extras : null,
  };
}

/** Prefer newly parsed values; keep existing row values when parse yields null. */
export function mergeVideoParseColumns(
  parsed: VideoParseColumns,
  existing: Partial<VideoParseColumns> | Record<string, unknown>
): VideoParseColumns {
  const e = existing as Partial<VideoParseColumns>;
  return {
    quality: parsed.quality ?? e.quality ?? null,
    codec: parsed.codec ?? e.codec ?? null,
    source: parsed.source ?? e.source ?? null,
    season_number: parsed.season_number ?? e.season_number ?? null,
    episode_number: parsed.episode_number ?? e.episode_number ?? null,
    release_year: parsed.release_year ?? e.release_year ?? null,
    release_group: parsed.release_group ?? e.release_group ?? null,
    release_parse_extras: parsed.release_parse_extras ?? e.release_parse_extras ?? null,
  };
}
