import axios from 'axios';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const BUNNY_API_KEY = process.env.BUNNY_API_KEY;
const BUNNY_LIBRARY_ID = process.env.BUNNY_LIBRARY_ID;

if (!BUNNY_API_KEY || !BUNNY_LIBRARY_ID) {
  console.warn('WARNING: Missing BUNNY_API_KEY or BUNNY_LIBRARY_ID in .env');
}

const bunnyApi = axios.create({
  baseURL: `https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}/videos`,
  headers: {
    'AccessKey': BUNNY_API_KEY,
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
});

export const bunnyStreamClient = {
  /**
   * Tells Bunny to fetch a video from a given URL to ingest.
   */
  async fetchVideo(url: string, title?: string): Promise<any> {
    const payload: any = { url };
    if (title) payload.title = title;

    try {
      const response = await bunnyApi.post('/fetch', payload);
      console.log('Bunny RAW Fetch Response:', response.data);
      return response.data;
    } catch (err: any) {
      console.error('Bunny Fetch API Error:', err.response?.data || err.message);
      throw err;
    }
  },

  /**
   * Gets the details of a video, including its encoding status.
   */
  async getVideoDetails(videoId: string) {
    const response = await bunnyApi.get(`/${videoId}`);
    return response.data;
  }
};
