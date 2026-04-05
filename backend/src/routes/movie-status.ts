import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import {
  findBestVideoForTmdb,
  type FindVideoForTmdbOpts,
} from "../lib/video-reuse";
import {
  buildMediaflowPlaybackSource,
  buildMediaflowTranscodeHls,
  isMediaflowEnabled,
  playbackSourceToMediaflowColumn,
} from "../lib/mediaflow";
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
  const playbackSource =
    video.playback_source && typeof video.playback_source === "object"
      ? { ...(video.playback_source as Record<string, unknown>) }
      : null;
  const mediaflowPlayback =
    video.mediaflow_playback && typeof video.mediaflow_playback === "object"
      ? { ...(video.mediaflow_playback as Record<string, unknown>) }
      : null;

  const redactRdUrl = Boolean(
    mediaflowPlayback && (mediaflowPlayback as { url?: string }).url,
  );

  const playbackForClient =
    playbackSource && redactRdUrl
      ? { ...playbackSource, url: null }
      : playbackSource;

  return {
    ...video,
    stream_url: null,
    playback_source: playbackForClient,
    mediaflow_playback: mediaflowPlayback,
  };
}

type PlaybackSourceShape = {
  type?: string;
  url?: string;
  container?: string;
  codec?: string;
  source_type?: string;
  is_streamable?: boolean;
  mime_type?: string;
};

type MediaflowPlaybackShape = {
  type?: string;
  url?: string;
  container?: string;
  codec?: string;
};

function extensionFromUrl(raw: string): string {
  try {
    const url = new URL(raw);
    const filename = url.pathname.split("/").pop() || "";
    const ext = filename.split(".").pop()?.toLowerCase();
    return ext || "unknown";
  } catch {
    return "unknown";
  }
}

async function refreshEphemeralMediaflowUrlIfNeeded(
  video: Record<string, unknown>,
  log: FastifyInstance["log"],
): Promise<Record<string, unknown>> {
  if (!isMediaflowEnabled()) return video;

  const streamUrl =
    typeof video.stream_url === "string" ? video.stream_url : "";
  if (!streamUrl) return video;

  const mf =
    video.mediaflow_playback && typeof video.mediaflow_playback === "object"
      ? (video.mediaflow_playback as MediaflowPlaybackShape)
      : null;

  if (mf?.type === "mediaflow_transcode_hls") {
    try {
      const next = await buildMediaflowTranscodeHls({
        upstreamUrl: streamUrl,
        container: mf.container || extensionFromUrl(streamUrl),
        codec: mf.codec || "Unknown",
      });
      return { ...video, mediaflow_playback: next };
    } catch (err) {
      log.warn(
        { svc: "watch", err },
        "Movie-status: failed to refresh MediaFlow HLS URL; returning stored mediaflow_playback.",
      );
      return video;
    }
  }

  const playback =
    video.playback_source && typeof video.playback_source === "object"
      ? (video.playback_source as PlaybackSourceShape)
      : null;
  if (!playback) return video;

  const type = playback.type || "";
  if (type !== "mediaflow_stream" && type !== "mediaflow_transcode_hls") {
    return video;
  }

  try {
    const nextPlayback = await buildMediaflowPlaybackSource({
      upstreamUrl: streamUrl,
      container: playback.container || extensionFromUrl(streamUrl),
      codec: playback.codec || "Unknown",
    });
    if (type === "mediaflow_transcode_hls") {
      const column = playbackSourceToMediaflowColumn(nextPlayback);
      if (column) {
        return {
          ...video,
          mediaflow_playback: column,
          playback_source: {
            ...playback,
            type: "direct",
            url: streamUrl,
            source_type: "real_debrid",
            is_streamable: false,
          },
        };
      }
    }
    return { ...video, playback_source: { ...nextPlayback, type } };
  } catch (err) {
    log.warn(
      { svc: "watch", err },
      "Movie-status: failed to refresh MediaFlow URL; returning stored playback_source.",
    );
    return video;
  }
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
          "id, status, stream_url, playback_source, mediaflow_playback, progress, title, error_message, quality, codec, source, tmdb_id, bullmq_job_id, season_number, episode_number, release_year, release_group, release_parse_extras",
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

        const responseVideo = await refreshEphemeralMediaflowUrlIfNeeded(
          data,
          log,
        );

        return reply.send({
          exists: true,
          video: sanitizeVideoForPublic(responseVideo),
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
