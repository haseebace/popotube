import axios, { AxiosInstance } from 'axios';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const QBITTORRENT_URL = process.env.QBITTORRENT_URL || 'http://127.0.0.1:8080';
const QBITTORRENT_USERNAME = process.env.QBITTORRENT_USERNAME || 'admin';
const QBITTORRENT_PASSWORD = process.env.QBITTORRENT_PASSWORD || 'adminadmin';

class QBittorrentClient {
  public client: AxiosInstance;
  private cookie: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: QBITTORRENT_URL,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Referer': QBITTORRENT_URL,
        'Origin': QBITTORRENT_URL,
      },
    });
  }

  async login() {
    const params = new URLSearchParams();
    params.append('username', QBITTORRENT_USERNAME);
    params.append('password', QBITTORRENT_PASSWORD);

    const response = await this.client.post('/api/v2/auth/login', params, {
      headers: {
        'Referer': QBITTORRENT_URL,
      }
    });
    
    // Extract set-cookie
    const setCookieHeader = response.headers['set-cookie'];
    if (setCookieHeader && setCookieHeader.length > 0) {
      this.cookie = setCookieHeader[0].split(';')[0];
      this.client.defaults.headers.common['Cookie'] = this.cookie;
    }
  }

  async addMagnet(magnetUri: string) {
    if (!this.cookie) await this.login();
    const params = new URLSearchParams();
    params.append('urls', magnetUri);
    // You could also append 'savepath' if you want a specific directory

    await this.client.post('/api/v2/torrents/add', params);
  }

  async getTorrentInfo(infoHash: string) {
    if (!this.cookie) await this.login();
    const response = await this.client.get('/api/v2/torrents/info', {
      params: {
        hashes: infoHash
      }
    });
    return response.data;
  }

  async deleteTorrent(infoHash: string, deleteFiles: boolean = true) {
    if (!this.cookie) await this.login();
    const params = new URLSearchParams();
    params.append('hashes', infoHash);
    params.append('deleteFiles', deleteFiles.toString());

    await this.client.post('/api/v2/torrents/delete', params);
  }
}

export const qBittorrentClient = new QBittorrentClient();
