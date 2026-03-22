import Fastify from 'fastify';
import pino from 'pino';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import './queue/ingestion';
import { ingestionQueue } from './queue/ingestion';
import ingestRoute from './routes/ingest';
import cancelJobRoute from './routes/cancel-job';
import triggerIngestionRoute from './routes/trigger-ingestion';
import movieStatusRoute from './routes/movie-status';
import libraryRoute from './routes/library';
import streamRoute from './routes/stream';
import settingsRoute from './routes/settings';
import dashboardRoute from './routes/dashboard';
import downloadsRoute from './routes/downloads';

import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { FastifyAdapter } from '@bull-board/fastify';
import fastifyReplyFrom from '@fastify/reply-from';

import { logger } from './lib/logger';

const fastify = Fastify({
  loggerInstance: logger
});

fastify.register(fastifyReplyFrom);

fastify.register(ingestRoute);
fastify.register(cancelJobRoute);
fastify.register(triggerIngestionRoute);
fastify.register(movieStatusRoute);
fastify.register(libraryRoute);
fastify.register(streamRoute);
fastify.register(settingsRoute);
fastify.register(dashboardRoute);
fastify.register(downloadsRoute);


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
