import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import {
  findBestVideoForTmdb,
  type FindVideoForTmdbOpts,
} from "../lib/video-reuse";
import { publicPlaybackSourceFromRow } from "../lib/playback-public";
import { sanitizeWatchFlowId } from "../lib/watch-flow-id";

function parseTvEpisodeOpts(
  seasonRaw?: string,
  episodeRaw?: string,
): FindVideoForTmdbOpts {
  const season = seasonRaw != null ? parseInt(seasonRaw, 10) : NaN;
  const episode = episodeRaw != null ? parseInt(episodeRaw, 10) : NaN;
  if (
    Number.isFinite(season) &&
    Number.isFinite(episode) &&
    season >= 0 &&
    episode >= 1
  ) {
    return {
      mode: "tv_episode",
      seasonNumber: season,
      episodeNumber: episode,
    };
  }
  return { mode: "movie" };
}

function sanitizeVideoForPublic(
  video: Record<string, unknown>,
): Record<string, unknown> {
  const playbackSource = publicPlaybackSourceFromRow(
    video.stream_url,
    video.playback_source,
  );

  return {
    ...video,
    stream_url: null,
    playback_source: playbackSource,
  };
}

export default async function (fastify: FastifyInstance) {
  fastify.get(
    "/api/movie-status",
    async (
      request: FastifyRequest<{
        Querystring: {
          tmdb_id?: string;
          watch_flow_id?: string;
          season?: string;
          episode?: string;
        };
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
        const findOpts = parseTvEpisodeOpts(
          request.query.season,
          request.query.episode,
        );
        const log = fastify.log.child({
          svc: "watch",
          tmdb_id: tmdbNum,
          ...(watchFlowId ? { watch_flow_id: watchFlowId } : {}),
        });

        const data = await findBestVideoForTmdb(
          tmdbNum,
          "id, status, stream_url, playback_source, progress, title, error_message, quality, codec, source, tmdb_id, bullmq_job_id, season_number, episode_number, release_year, release_group, release_parse_extras",
          findOpts,
        );

        if (watchFlowId) {
          const fields = {
            exists: Boolean(data),
            video_status: data?.status ?? null,
          };
          log.info(
            fields,
            "Watch UI poll — returning whether this title’s video exists and its current status.",
          );
        }

        if (!data) {
          return reply.send({ exists: false });
        }

        return reply.send({
          exists: true,
          video: sanitizeVideoForPublic(data),
        });
      } catch (err: unknown) {
        fastify.log.error(
          { svc: "watch", err, tmdb_id: request.query.tmdb_id ?? null },
          "Movie-status endpoint failed — client poll will see an error.",
        );
        const message =
          err instanceof Error ? err.message : "Internal server error";
        return reply.status(500).send({ error: message });
      }
    },
  );
}
