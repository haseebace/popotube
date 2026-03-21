import axios from 'axios';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const BUNNY_API_KEY = process.env.BUNNY_API_KEY;
const BUNNY_LIBRARY_ID = process.env.BUNNY_LIBRARY_ID;

import { logger } from './logger';

if (!BUNNY_API_KEY || !BUNNY_LIBRARY_ID) {
  logger.warn('WARNING: Missing BUNNY_API_KEY or BUNNY_LIBRARY_ID in .env');
}

const cdnApi = axios.create({
  baseURL: `https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}/videos`,
  headers: {
    'AccessKey': BUNNY_API_KEY,
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
});

export const cdnStreamClient = {
  /**
   * Tells Bunny to fetch a video from a given URL to ingest.
   */
  async fetchVideo(url: string, title?: string): Promise<any> {
    const payload: any = { url };
    if (title) payload.title = title;

    try {
      const response = await cdnApi.post('/fetch', payload);
      logger.info(`🌐 [CDN] Raw Fetch Response for url: ${url}`, response.data);
      return response.data;
    } catch (err: any) {
      logger.error({ err }, `❌ [CDN] Fetch API Error details: ${err.response?.data || err.message}`);
      throw err;
    }
  },

  /**
   * Gets the details of a video, including its encoding status.
   */
  async getVideoDetails(videoId: string) {
    const response = await cdnApi.get(`/${videoId}`);
    return response.data;
  }
};
