import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { findBestVideoForTmdb } from "../lib/video-reuse";
import { sanitizeWatchFlowId } from "../lib/watch-flow-id";

export default async function (fastify: FastifyInstance) {
  fastify.get(
    "/api/movie-status",
    async (
      request: FastifyRequest<{
        Querystring: { tmdb_id?: string; watch_flow_id?: string };
      }>,
      reply: FastifyReply,
    ) => {
      try {
        const tmdbId = request.query.tmdb_id;
        if (!tmdbId) {
          return reply.status(400).send({ error: "tmdb_id is required" });
        }

        const tmdbNum = parseInt(tmdbId, 10);
        const watchFlowId = sanitizeWatchFlowId(request.query.watch_flow_id);
        const log = fastify.log.child({
          tmdb_id: tmdbNum,
          ...(watchFlowId ? { watch_flow_id: watchFlowId } : {}),
        });

        const data = await findBestVideoForTmdb(
          tmdbNum,
          "id, status, stream_url, playback_source, progress, title, error_message, quality, codec, source, tmdb_id, bullmq_job_id, season_number, episode_number, release_year, release_group, release_parse_extras",
        );

        if (watchFlowId) {
          log.info(
            {
              exists: Boolean(data),
              video_status: data?.status ?? null,
            },
            "watch: poll | movie-status",
          );
        }

        if (!data) {
          return reply.send({ exists: false });
        }

        return reply.send({ exists: true, video: data });
      } catch (err: unknown) {
        fastify.log.error(
          { err, tmdb_id: request.query.tmdb_id ?? null },
          "watch: poll | movie-status_failed",
        );
        const message =
          err instanceof Error ? err.message : "Internal server error";
        return reply.status(500).send({ error: message });
      }
    },
  );
}
