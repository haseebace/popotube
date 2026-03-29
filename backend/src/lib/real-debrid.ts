import axios from 'axios';
import http from 'http';
import https from 'https';
import { logger } from './logger';

const RD_API_BASE = 'https://api.real-debrid.com/rest/1.0';

export interface RDFile {
  id: number;
  path: string;
  bytes: number;
  selected: number;
}

export interface RDTorrentInfo {
  id: string;
  filename: string;
  hash: string;
  bytes: number;
  host: string;
  split: number;
  progress: number;
  status: string; // magnet_error, magnet_conversion, waiting_files_selection, queued, downloading, downloaded, error, virus, compressing, uploading, dead
  added: string;
  files: RDFile[];
  links: string[];
  ended?: string;
  speed?: number;
  seeders?: number;
}

export interface RDUnrestrictLink {
  id: string;
  filename: string;
  mimeType: string;
  filesize: number;
  link: string;
  host: string;
  chunks: number;
  crc: number;
  download: string;
  streamable: number;
}

export interface RDInstantAvailabilityFile {
  fileId: number;
  filename: string;
  filesize: number;
}

export interface RDInstantAvailabilityVariant {
  files: RDInstantAvailabilityFile[];
}

export interface RDInstantAvailabilityHost {
  host: string;
  variants: RDInstantAvailabilityVariant[];
}

export interface RDInstantAvailabilityResult {
  hash: string;
  isInstantAvailable: boolean;
  hosts: Record<string, RDInstantAvailabilityHost>;
  instantFileVariants: RDInstantAvailabilityVariant[];
}

type RDInstantAvailabilityResponse = Record<
  string,
  Record<
    string,
    Array<Record<string, { filename?: string; filesize?: number }>>
  >
>;

const VIDEO_EXTENSIONS = ['.mp4', '.mkv', '.avi', '.webm', '.mov', '.m4v', '.ts', '.m2ts'];
const LOW_VALUE_PATH_PATTERNS = [
  /\bsample\b/i,
  /\btrailer\b/i,
  /\bpreview\b/i,
  /\bextras?\b/i,
  /\bfeaturettes?\b/i,
  /\bbehind[ ._-]?the[ ._-]?scenes\b/i,
  /\bdeleted[ ._-]?scenes\b/i,
  /\binterview\b/i,
  /\bproof\b/i,
  /\breadme\b/i,
  /\bnfo\b/i,
];

function getPathSegments(path: string): string[] {
  return path.toLowerCase().split('/').filter(Boolean);
}

function normalizeTitle(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function titleMatchScore(path: string, expectedTitle?: string): number {
  if (!expectedTitle) return 0;

  const normalizedExpected = normalizeTitle(expectedTitle);
  if (!normalizedExpected) return 0;

  const normalizedPath = normalizeTitle(path);
  if (!normalizedPath) return 0;

  if (normalizedPath.includes(normalizedExpected)) {
    return 350;
  }

  const expectedTokens = normalizedExpected.split(' ').filter((token) => token.length >= 3);
  if (!expectedTokens.length) return 0;

  const matchedTokens = expectedTokens.filter((token) => normalizedPath.includes(token)).length;
  const coverage = matchedTokens / expectedTokens.length;

  if (coverage >= 0.8) return 220;
  if (coverage >= 0.5) return 120;
  if (coverage >= 0.3) return 50;
  return 0;
}

function isVideoFile(path: string): boolean {
  const lower = path.toLowerCase();
  return VIDEO_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

function normalizeInstantAvailabilityResponse(
  hash: string,
  payload: RDInstantAvailabilityResponse | null | undefined
): RDInstantAvailabilityResult {
  const normalizedHash = hash.toLowerCase();
  const hashEntry = payload?.[normalizedHash] ?? payload?.[hash] ?? {};
  const hosts = Object.entries(hashEntry).reduce<Record<string, RDInstantAvailabilityHost>>(
    (acc, [host, variants]) => {
      const normalizedVariants = Array.isArray(variants)
        ? variants
            .map((variant) => {
              const files = Object.entries(variant || {})
                .map(([fileId, fileInfo]) => ({
                  fileId: Number(fileId),
                  filename: fileInfo?.filename || '',
                  filesize: Number(fileInfo?.filesize || 0),
                }))
                .filter((file) => Number.isFinite(file.fileId) && file.fileId > 0);

              return files.length > 0 ? { files } : null;
            })
            .filter((variant): variant is RDInstantAvailabilityVariant => Boolean(variant))
        : [];

      acc[host] = {
        host,
        variants: normalizedVariants,
      };

      return acc;
    },
    {}
  );

  const instantFileVariants = hosts.rd?.variants ?? [];

  return {
    hash: normalizedHash,
    isInstantAvailable: instantFileVariants.length > 0,
    hosts,
    instantFileVariants,
  };
}

function scoreRdFile(file: RDFile, expectedTitle?: string): number {
  const lowerPath = file.path.toLowerCase();
  const segments = getPathSegments(file.path);
  const fileName = segments[segments.length - 1] || lowerPath;
  let score = 0;

  if (isVideoFile(lowerPath)) {
    score += 400;
  } else {
    score -= 500;
  }

  if (file.bytes >= 500 * 1024 * 1024) score += 200;
  else if (file.bytes >= 200 * 1024 * 1024) score += 100;
  else if (file.bytes <= 50 * 1024 * 1024) score -= 300;
  else if (file.bytes <= 150 * 1024 * 1024) score -= 150;

  score += Math.min(file.bytes / (1024 * 1024 * 1024), 20) * 15;

  for (const pattern of LOW_VALUE_PATH_PATTERNS) {
    if (pattern.test(lowerPath)) {
      score -= 600;
    }
  }

  if (/\b(cd|disc|disk|part)[ ._-]?[0-9]+\b/i.test(fileName)) score -= 250;
  if (/\bbonus\b/i.test(lowerPath)) score -= 400;
  if (/\bmovie\b/i.test(fileName)) score += 100;
  if (/\bmain\b/i.test(fileName)) score += 50;
  score += titleMatchScore(file.path, expectedTitle);

  return score;
}

export class RealDebridClient {
  private client: import('axios').AxiosInstance;
  private cachedKey: string | null = null;
  private lastFetch: number = 0;
  private readonly httpAgent = new http.Agent({
    keepAlive: true,
    maxSockets: 25,
  });
  private readonly httpsAgent = new https.Agent({
    keepAlive: true,
    maxSockets: 25,
  });

  constructor() {
    this.client = axios.create({
      baseURL: RD_API_BASE,
      timeout: 15000,
      httpAgent: this.httpAgent,
      httpsAgent: this.httpsAgent,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      },
    });

    // Intercept outbound requests to dynamically inject the API key from Database or Env
    this.client.interceptors.request.use(async (config: any) => {
      config.metadata = {
        startedAt: Date.now(),
      };
      const apiKey = await this.getApiKey();
      if (apiKey && apiKey !== 'your_real_debrid_api_key_here') {
        config.headers.Authorization = `Bearer ${apiKey}`;
      } else {
        logger.warn('⚠️ [Real-Debrid] API Key missing during request execution.');
      }
      return config;
    });

    this.client.interceptors.response.use(
      (response: any) => {
        const startedAt = response.config.metadata?.startedAt;
        const durationMs = typeof startedAt === 'number' ? Date.now() - startedAt : undefined;
        const logLevel: 'info' | 'warn' = typeof durationMs === 'number' && durationMs >= 2000 ? 'warn' : 'info';

        logger[logLevel]({
          method: response.config.method?.toUpperCase(),
          path: response.config.url,
          status: response.status,
          duration_ms: durationMs,
        }, logLevel === 'warn' ? 'Real-Debrid API request completed slowly' : 'Real-Debrid API request completed');

        return response;
      },
      (error: any) => {
        const startedAt = error.config?.metadata?.startedAt;
        const durationMs = typeof startedAt === 'number' ? Date.now() - startedAt : undefined;

        logger.error({
          err: error,
          method: error.config?.method?.toUpperCase(),
          path: error.config?.url,
          status: error.response?.status,
          duration_ms: durationMs,
        }, 'Real-Debrid API request failed');

        return Promise.reject(error);
      }
    );
  }

  private async getApiKey(): Promise<string | undefined> {
    const now = Date.now();
    // 60-second rolling token cache to protect database limits
    if (this.cachedKey && (now - this.lastFetch < 60000)) {
      return this.cachedKey || undefined;
    }
    
    try {
      const { supabase } = await import('./supabase');
      const { data, error } = await supabase.from('app_settings')
        .select('value')
        .eq('key', 'REAL_DEBRID_API_KEY')
        .maybeSingle();

      if (!error && data?.value) {
        this.cachedKey = data.value;
        this.lastFetch = now;
        return this.cachedKey || undefined;
      }
    } catch (e) {
      // Safe fail
    }

    // Fallback to absolute Env configuration
    return process.env.REAL_DEBRID_API_KEY || undefined;
  }

  /**
   * Adds a magnet to Real-Debrid and returns the torrent ID.
   */
  async addMagnet(magnet: string): Promise<string> {
    const params = new URLSearchParams();
    params.append('magnet', magnet);
    
    const response = await this.client.post('/torrents/addMagnet', params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data.id;
  }

  /**
   * Gets information about a torrent, including its status and files.
   */
  async getTorrentInfo(id: string): Promise<RDTorrentInfo> {
    const response = await this.client.get(`/torrents/info/${id}`);
    return response.data;
  }

  /**
   * Checks whether a torrent hash is instantly available on Real-Debrid.
   */
  async getInstantAvailability(hash: string, timeoutMs: number = 2500): Promise<RDInstantAvailabilityResult> {
    const normalizedHash = hash.toLowerCase();
    const response = await this.client.get<RDInstantAvailabilityResponse>(
      `/torrents/instantAvailability/${normalizedHash}`,
      {
        timeout: timeoutMs,
      }
    );

    return normalizeInstantAvailabilityResponse(normalizedHash, response.data);
  }

  /**
   * Fetch a list of active and recent torrents from Real-Debrid.
   */
  async getTorrents(page: number = 1, limit: number = 50): Promise<{ data: any[], total: number }> {
    const response = await this.client.get('/torrents', {
      params: {
        page,
        limit
      }
    });
    return {
      data: response.data,
      total: parseInt(response.headers['x-total-count'] || '0', 10)
    };
  }

  /**
   * Tells Real-Debrid to start processing the best candidate video file inside the torrent.
   */
  async selectFiles(id: string, info?: RDTorrentInfo, expectedTitle?: string): Promise<void> {
    const torrentInfo = info ?? await this.getTorrentInfo(id);

    if (!torrentInfo.files.length) {
      throw new Error('No files found in torrent');
    }

    // 1. Identify valid candidates (Video files that aren't samples/trailers/extras)
    const candidates = torrentInfo.files
      .map(file => ({
        file,
        score: scoreRdFile(file, expectedTitle)
      }))
      .filter(item => item.score > 0) // Filters low-value/non-video content using our existing ranking engine
      .sort((a, b) => b.file.bytes - a.file.bytes); // Sort by size descending

    if (candidates.length === 0) {
      throw new Error('No suitable video content found in this torrent.');
    }

    // 2. Selection logic: Select all files over 500MB, or just the largest if all are small
    const MIN_SIZE_BYTES = 500 * 1024 * 1024;
    let selectedIds: number[] = [];

    const largeFiles = candidates.filter(c => c.file.bytes >= MIN_SIZE_BYTES);

    if (largeFiles.length > 0) {
      // If there are large files, we take all of them (multi-part movies, or full seasons)
      selectedIds = largeFiles.map(c => c.file.id);
    } else {
      // Fallback: Just the single largest candidate from the available list
      selectedIds = [candidates[0].file.id];
    }

    logger.info({
      rd_torrent_id: id,
      selected_count: selectedIds.length,
      selection_mode: largeFiles.length > 0 ? 'multi-large-files' : 'single-largest-fallback',
      file_ids: selectedIds,
    }, 'Determining Real-Debrid file selection list');

    const params = new URLSearchParams();
    params.append('files', selectedIds.join(','));
    
    await this.client.post(`/torrents/selectFiles/${id}`, params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
  }

  /**
   * Converts the raw Real-Debrid file URL into a high-speed, direct HTTP download link.
   */
  async unrestrictLink(link: string): Promise<RDUnrestrictLink> {
    const params = new URLSearchParams();
    params.append('link', link);
    
    const response = await this.client.post('/unrestrict/link', params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  }

  /**
   * Fetches Real-Debrid authentication scope information (username, premium status)
   */
  async getUser(): Promise<any> {
    const response = await this.client.get('/user');
    return response.data;
  }

  /**
   * Cleans up the torrent from the user's Real-Debrid dashboard when finished.
   */
  async deleteTorrent(id: string): Promise<void> {
    await this.client.delete(`/torrents/delete/${id}`);
  }

  /**
   * Fetch a list of user downloads from Real-Debrid.
   */
  async getDownloads(page: number = 1, limit: number = 50): Promise<{ data: any[], total: number }> {
    const response = await this.client.get('/downloads', {
      params: {
        page,
        limit
      }
    });
    return {
      data: response.data,
      total: parseInt(response.headers['x-total-count'] || '0', 10)
    };
  }

  /**
   * Deletes a link from the user's downloads list.
   */
  async deleteDownload(id: string): Promise<void> {
    await this.client.delete(`/downloads/delete/${id}`);
  }
}

export const rdClient = new RealDebridClient();
