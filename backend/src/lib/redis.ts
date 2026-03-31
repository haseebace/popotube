import Redis from "ioredis";
import * as dotenv from "dotenv";
import path from "path";
import { logger } from "./logger";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  throw new Error("REDIS_URL environment variable is missing.");
}

export const connection = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
});

connection.on("error", (err) => {
  logger.error(
    { svc: "redis", err },
    "Redis connection error — BullMQ jobs and queues may stop processing until the broker is reachable again.",
  );
});

connection.on("connect", () => {
  logger.info(
    { svc: "redis" },
    "Redis connected — BullMQ ingestion queue can talk to the broker.",
  );
});
