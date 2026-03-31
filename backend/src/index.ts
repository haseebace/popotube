import Fastify from "fastify";
import * as dotenv from "dotenv";
import path from "path";

// Load environment variables from .env
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

import "./queue/ingestion";
import { ingestionQueue } from "./queue/ingestion";
import ingestRoute from "./routes/ingest";
import cancelJobRoute from "./routes/cancel-job";
import triggerIngestionRoute from "./routes/trigger-ingestion";
import movieStatusRoute from "./routes/movie-status";
import libraryRoute from "./routes/library";
import streamRoute from "./routes/stream";
import settingsRoute from "./routes/settings";
import dashboardRoute from "./routes/dashboard";
import downloadsRoute from "./routes/downloads";
import forceHlsRoute from "./routes/force-hls";

import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { FastifyAdapter } from "@bull-board/fastify";
import fastifyReplyFrom from "@fastify/reply-from";

import { logger } from "./lib/logger";

const fastify = Fastify({
  loggerInstance: logger,
  // Avoid noisy lines for every poll (movie-status); errors are logged in onResponse.
  disableRequestLogging: true,
});

fastify.addHook("onRequest", async (request) => {
  (request as { _reqStartedAt?: number })._reqStartedAt = Date.now();
});

fastify.addHook("onResponse", (request, reply, done) => {
  if (reply.statusCode >= 400) {
    const started = (request as { _reqStartedAt?: number })._reqStartedAt;
    const responseTime =
      typeof started === "number" ? Date.now() - started : undefined;
    const pathOnly = request.url.split("?")[0];
    request.log.warn(
      {
        svc: "http",
        reqId: request.id,
        method: request.method,
        path: pathOnly,
        status: reply.statusCode,
        responseTime,
      },
      `HTTP ${reply.statusCode} — non-success response (query string omitted from logs).`,
    );
  }
  done();
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
fastify.register(forceHlsRoute);

const serverAdapter = new FastifyAdapter();
createBullBoard({
  queues: [new BullMQAdapter(ingestionQueue)],
  serverAdapter,
});
serverAdapter.setBasePath("/admin/queues");
fastify.register(serverAdapter.registerPlugin(), { prefix: "/admin/queues" });

fastify.get("/health", async (request, reply) => {
  return { status: "ok", timestamp: new Date().toISOString() };
});

const start = async () => {
  try {
    const port = process.env.PORT ? parseInt(process.env.PORT) : 3001;
    await fastify.listen({ port, host: "0.0.0.0" });
    fastify.log.info(`Server listening on port ${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
