import Redis from 'ioredis';
import * as dotenv from 'dotenv';
import path from 'path';
import { logger } from './logger';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  throw new Error('REDIS_URL environment variable is missing.');
}

export const connection = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
});

connection.on('error', (err) => {
  logger.error({ err }, '🚨 [Redis] Connection error:');
});

connection.on('connect', () => {
  logger.info('🟢 [Redis] Connected to managed instance successfully.');
});
