import Fastify from 'fastify';
import pino from 'pino';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import './queue/ingestion';
import { ingestionQueue } from './queue/ingestion';
import bunnyDownloadRoute from './routes/bunny-download';
import cancelJobRoute from './routes/cancel-job';

import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { FastifyAdapter } from '@bull-board/fastify';

import { logger } from './lib/logger';

const fastify = Fastify({
  loggerInstance: logger
});

fastify.register(bunnyDownloadRoute);
fastify.register(cancelJobRoute);

const serverAdapter = new FastifyAdapter();
createBullBoard({
  queues: [new BullMQAdapter(ingestionQueue)],
  serverAdapter,
});
serverAdapter.setBasePath('/admin/queues');
fastify.register(serverAdapter.registerPlugin(), { prefix: '/admin/queues' });

fastify.get('/health', async (request, reply) => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

const start = async () => {
  try {
    const port = process.env.PORT ? parseInt(process.env.PORT) : 3001;
    await fastify.listen({ port, host: '0.0.0.0' });
    fastify.log.info(`Server listening on port ${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
