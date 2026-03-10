import axios from 'axios';

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

export class RealDebridClient {
  private client: import('axios').AxiosInstance;

  constructor() {
    const apiKey = process.env.REAL_DEBRID_API_KEY;
    if (!apiKey || apiKey === 'your_real_debrid_api_key_here') {
      console.warn('REAL_DEBRID_API_KEY is not configured properly.');
    }

    this.client = axios.create({
      baseURL: RD_API_BASE,
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });
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
   * Tells Real-Debrid to start processing the largest video file inside the torrent.
   */
  async selectFiles(id: string): Promise<void> {
    const info = await this.getTorrentInfo(id);
    
    // Find the largest file (presumably the video we want)
    // Filter out obvious non-video files if possible, or just pick the largest.
    const videoExtensions = ['.mp4', '.mkv', '.avi', '.webm', '.mov'];
    
    let targetFiles = info.files.filter((f) => 
      videoExtensions.some((ext) => f.path.toLowerCase().endsWith(ext))
    );

    // If no video extensions match, fallback to just finding the largest file overall
    if (targetFiles.length === 0) {
      targetFiles = info.files;
    }

    if (targetFiles.length === 0) {
      throw new Error('No files found in torrent');
    }

    // Sort by largest bytes first
    targetFiles.sort((a, b) => b.bytes - a.bytes);
    const largestFile = targetFiles[0];

    const params = new URLSearchParams();
    params.append('files', largestFile.id.toString());
    
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
   * Cleans up the torrent from the user's Real-Debrid dashboard when finished.
   */
  async deleteTorrent(id: string): Promise<void> {
    await this.client.delete(`/torrents/delete/${id}`);
  }
}

export const rdClient = new RealDebridClient();
