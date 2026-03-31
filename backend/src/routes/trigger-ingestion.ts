import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import axios from "axios";
import { supabase } from "../lib/supabase";
import { ingestionQueue } from "../queue/ingestion";
import {
  mergeVideoParseColumns,
  parseReleaseMetadata,
  releaseMetadataToVideoColumns,
} from "../lib/release-metadata";
import {
  findBestVideoForTmdb,
  isReusableVideoStatus,
  type FindVideoForTmdbOpts,
} from "../lib/video-reuse";
import { sanitizeWatchFlowId } from "../lib/watch-flow-id";

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL =
  process.env.TMDB_BASE_URL || "https://api.themoviedb.org/3";
const TORRENTIO_BASE_URL = "https://torrentio.strem.fun";

interface TriggerIngestionBody {
  tmdb_id: number;
  title: string;
  year?: string;
  /** From watch UI — same id as movie-status polls for log correlation */
  watch_flow_id?: string;
  /** TV episode: uses Torrentio series stream + season/episode on `videos` */
  media_type?: "movie" | "tv";
  season_number?: number;
  episode_number?: number;
}

interface TorrentioCandidate {
  title: string;
  sizeBytes: number;
  seeders: number;
  magnetUri: string | null;
  infoHash: string | null;
  source: string;
  quality: string;
  codec: string;
  releaseSource: string;
  details: string;
}

interface ScoredTorrentioCandidate extends TorrentioCandidate {
  score: number;
  scoreReasons: string[];
}

interface TorrentioStream {
  title?: string;
  name?: string;
  infoHash?: string;
}

class TorrentioRequestError extends Error {
  statusCode: number;
  upstreamStatus?: number;

  constructor(message: string, statusCode: number, upstreamStatus?: number) {
    super(message);
    this.name = "TorrentioRequestError";
    this.statusCode = statusCode;
    this.upstreamStatus = upstreamStatus;
  }
}

function buildReuseExistingVideoResponse(video: Record<string, any>) {
  return {
    message:
      video.status === "completed"
        ? "Video already available"
        : "Video already in progress",
    status: video.status,
    videoId: video.id,
    jobId: video.bullmq_job_id ?? null,
    reusedExisting: true,
    stream_url: null,
    playback_source: video.playback_source ?? null,
  };
}

function normalizeTitle(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function scoreTorrentResult(
  result: TorrentioCandidate,
  requestedTitle: string,
  requestedYear?: string,
): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  const normalizedRequestedTitle = normalizeTitle(requestedTitle);
  const normalizedResultTitle = normalizeTitle(result.title || "");
  const seeders = Number(result.seeders || 0);
  const sizeGB = Number(result.sizeBytes || 0) / (1024 * 1024 * 1024);
  const metadata = {
    quality: result.quality,
    codec: result.codec,
    source: result.releaseSource,
  };
  let score = seeders / Math.max(sizeGB, 0.25);

  if (normalizedResultTitle.includes(normalizedRequestedTitle)) {
    score += 120;
    reasons.push("title_match");
  } else {
    score -= 120;
    reasons.push("title_mismatch");
  }

  if (requestedYear) {
    const yearRegex = new RegExp(`\\b${requestedYear}\\b`);
    if (yearRegex.test(result.title || "")) {
      score += 40;
      reasons.push("year_match");
    } else {
      score -= 80;
      reasons.push("year_missing");
    }
  }

  if (metadata.quality === "2160p") {
    score -= 40;
    reasons.push("penalize_4k");
  } else if (metadata.quality === "1080p" || metadata.quality === "1080i") {
    score += 60;
    reasons.push("prefer_1080p");
  } else {
    score -= 500;
    reasons.push("below_1080p");
  }

  if (metadata.source === "Remux") {
    score -= 15;
    reasons.push("slight_remux_penalty");
  }

  if (metadata.source === "WEB-DL") {
    score += 40;
    reasons.push("prefer_webdl");
  } else if (metadata.source === "Blu-Ray") {
    score += 25;
    reasons.push("prefer_bluray");
  }

  if (metadata.codec === "HEVC" || metadata.codec === "AV1") {
    score += 12;
    reasons.push("efficient_codec");
  }

  if (
    metadata.source === "CAM" ||
    metadata.source === "TS" ||
    /\b(hdcam|hd-ts|telecine)\b/i.test(result.title || "")
  ) {
    score -= 400;
    reasons.push("reject_cam_quality");
  }

  if (/sample/i.test(result.title || "")) {
    score -= 300;
    reasons.push("sample_penalty");
  }

  if (sizeGB > 0 && sizeGB < 0.6) {
    score -= 150;
    reasons.push("too_small");
  } else if (sizeGB > 25) {
    score -= 80;
    reasons.push("too_large");
  }

  if (seeders <= 0) {
    score -= 200;
    reasons.push("no_seeders");
  } else if (seeders >= 25) {
    score += 25;
    reasons.push("healthy_seeders");
  }

  return {
    score: Number(score.toFixed(2)),
    reasons,
  };
}

function parseSizeToBytes(sizeStr: string): number {
  const match = sizeStr.match(/([0-9.]+)\s*(GB|MB|KB|B)/i);
  if (!match) return 0;

  const val = parseFloat(match[1]);
  const unit = match[2].toUpperCase();

  switch (unit) {
    case "GB":
      return Math.floor(val * 1024 * 1024 * 1024);
    case "MB":
      return Math.floor(val * 1024 * 1024);
    case "KB":
      return Math.floor(val * 1024);
    default:
      return Math.floor(val);
  }
}

async function resolveImdbIdFromTmdb(tmdbId: number): Promise<string | null> {
  if (!TMDB_API_KEY) {
    throw new Error("TMDB_API_KEY is not configured on the backend.");
  }

  const response = await axios.get(
    `${TMDB_BASE_URL}/movie/${tmdbId}/external_ids`,
    {
      params: {
        api_key: TMDB_API_KEY,
      },
      timeout: 10000,
    },
  );

  return response.data?.imdb_id || null;
}

async function resolveImdbIdFromTmdbTv(tmdbId: number): Promise<string | null> {
  if (!TMDB_API_KEY) {
    throw new Error("TMDB_API_KEY is not configured on the backend.");
  }

  const response = await axios.get(
    `${TMDB_BASE_URL}/tv/${tmdbId}/external_ids`,
    {
      params: {
        api_key: TMDB_API_KEY,
      },
      timeout: 10000,
    },
  );

  return response.data?.imdb_id || null;
}

async function fetchTorrentioCandidates(
  imdbId: string,
  kind: "movie" | "series",
  season?: number,
  episode?: number,
): Promise<TorrentioCandidate[]> {
  const path =
    kind === "movie"
      ? `movie/${imdbId}.json`
      : `series/${imdbId}:${season}:${episode}.json`;
  const torrentioUrl = `${TORRENTIO_BASE_URL}/providers=yts,eztv,rarbg,1337x,thepiratebay,kickasstorrents,torrent9,horriblesubs,nyaasi,tokyotosho,sukebei/stream/${path}`;
  let response;
  try {
    response = await axios.get<{ streams?: TorrentioStream[] }>(torrentioUrl, {
      timeout: 15000,
      headers: {
        "user-agent": "PoPoTube/1.0 (+https://github.com/haseebace/popotube)",
        accept: "application/json",
      },
    });
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const upstreamStatus = error.response?.status;
      if (upstreamStatus === 403) {
        throw new TorrentioRequestError(
          "Torrentio denied the request (HTTP 403).",
          503,
          upstreamStatus,
        );
      }
      if (upstreamStatus && upstreamStatus >= 500) {
        throw new TorrentioRequestError(
          "Torrentio is currently unavailable.",
          503,
          upstreamStatus,
        );
      }
      throw new TorrentioRequestError(
        "Torrentio request failed.",
        502,
        upstreamStatus,
      );
    }
    throw error;
  }
  const streams = response.data?.streams || [];

  return Promise.all(
    streams.map(async (stream) => {
      const rawTitle = String(stream.title || "").trim();
      const lines = rawTitle
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
      const streamName = String(stream.name || "").trim();
      // Torrentio puts size/seeders on line 2 and codec (e.g. x264) on line 3 — parsing only line 1 drops codec.
      const titleForParse =
        lines.length > 0 ? lines.join(" ") : streamName || "";
      const candidateTitle = titleForParse;
      const infoLine = lines[1] || "";
      const sizeMatch = infoLine.match(
        /(?:💾|size:)?\s*([0-9.]+\s*(GB|MB|KB|B))/i,
      );
      const seederMatch = infoLine.match(/(?:👤|S:)\s*([0-9]+)/i);
      const sizeStr = sizeMatch ? sizeMatch[1].trim() : "0 B";
      const metadata = await parseReleaseMetadata(candidateTitle);
      const normalizedInfoHash = stream.infoHash?.toLowerCase() || null;

      return {
        title: candidateTitle,
        sizeBytes: parseSizeToBytes(sizeStr),
        seeders: seederMatch ? parseInt(seederMatch[1], 10) : 0,
        magnetUri: normalizedInfoHash
          ? `magnet:?xt=urn:btih:${normalizedInfoHash}`
          : null,
        infoHash: normalizedInfoHash,
        source: stream.name || "torrentio",
        quality: metadata.quality,
        codec: metadata.codec,
        releaseSource: metadata.source,
        details: infoLine,
      };
    }),
  );
}

function compareScoredCandidates(
  a: ScoredTorrentioCandidate,
  b: ScoredTorrentioCandidate,
): number {
  if (a.score !== b.score) {
    return b.score - a.score;
  }

  if (a.seeders !== b.seeders) {
    return b.seeders - a.seeders;
  }

  return b.sizeBytes - a.sizeBytes;
}

export default async function (fastify: FastifyInstance) {
  fastify.post(
    "/api/trigger-ingestion",
    async (
      request: FastifyRequest<{ Body: TriggerIngestionBody }>,
      reply: FastifyReply,
    ) => {
      const startedAt = Date.now();
      try {
        const body = request.body as TriggerIngestionBody;
        const { tmdb_id, title, year, watch_flow_id } = body;

        if (!tmdb_id || !title) {
          return reply
            .status(400)
            .send({ error: "tmdb_id and title are required" });
        }

        const isTvEpisode =
          body.media_type === "tv" &&
          typeof body.season_number === "number" &&
          typeof body.episode_number === "number" &&
          body.season_number >= 0 &&
          body.episode_number >= 1;

        if (body.media_type === "tv" && !isTvEpisode) {
          return reply.status(400).send({
            error: "TV ingestion requires season_number and episode_number",
          });
        }

        const findOpts: FindVideoForTmdbOpts = isTvEpisode
          ? {
              mode: "tv_episode",
              seasonNumber: body.season_number!,
              episodeNumber: body.episode_number!,
            }
          : { mode: "movie" };

        const watchFlowId = sanitizeWatchFlowId(watch_flow_id);
        const log = fastify.log.child({
          svc: "watch",
          tmdb_id,
          ...(watchFlowId ? { watch_flow_id: watchFlowId } : {}),
          ...(isTvEpisode
            ? {
                season_number: body.season_number,
                episode_number: body.episode_number,
              }
            : {}),
        });

        const existingVideo = await findBestVideoForTmdb(
          tmdb_id,
          "*",
          findOpts,
        );
        if (existingVideo && isReusableVideoStatus(existingVideo.status)) {
          log.info(
            {
              existing_video_id: existingVideo.id,
              existing_status: existingVideo.status,
            },
            "Poster play: title already has a video in progress or done — skipping Torrentio (early check).",
          );

          return reply.send(buildReuseExistingVideoResponse(existingVideo));
        }

        if (!TMDB_API_KEY) {
          return reply
            .status(500)
            .send({ error: "TMDB API key not configured." });
        }

        const imdbLookupStartedAt = Date.now();
        const imdbId = isTvEpisode
          ? await resolveImdbIdFromTmdbTv(tmdb_id)
          : await resolveImdbIdFromTmdb(tmdb_id);
        log.info(
          {
            imdb_lookup_ms: Date.now() - imdbLookupStartedAt,
            imdb_id: imdbId,
          },
          "Resolved IMDb id from TMDB — next step is Torrentio magnet search.",
        );

        if (!imdbId) {
          return reply.status(404).send({
            error: isTvEpisode
              ? "Unable to resolve IMDB ID for this series."
              : "Unable to resolve IMDB ID for this movie.",
          });
        }

        // Concurrent triggers can both pass the first DB check; re-check before Torrentio.
        const videoBeforeTorrentio = await findBestVideoForTmdb(
          tmdb_id,
          "*",
          findOpts,
        );
        if (
          videoBeforeTorrentio &&
          isReusableVideoStatus(videoBeforeTorrentio.status)
        ) {
          log.info(
            {
              existing_video_id: videoBeforeTorrentio.id,
              existing_status: videoBeforeTorrentio.status,
            },
            "Race: another request created the video while we looked up IMDb — skipping Torrentio.",
          );
          return reply.send(
            buildReuseExistingVideoResponse(videoBeforeTorrentio),
          );
        }

        const torrentioStartedAt = Date.now();
        const candidates = isTvEpisode
          ? await fetchTorrentioCandidates(
              imdbId,
              "series",
              body.season_number,
              body.episode_number,
            )
          : await fetchTorrentioCandidates(imdbId, "movie");
        const validResults = candidates.filter(
          (candidate) =>
            candidate.magnetUri &&
            candidate.infoHash &&
            (candidate.quality === "1080p" ||
              candidate.quality === "1080i" ||
              candidate.quality === "2160p"),
        );

        if (validResults.length === 0) {
          return reply.status(404).send({
            error: isTvEpisode
              ? "No 1080p-or-higher Torrentio streams were found for this episode"
              : "No 1080p-or-higher Torrentio streams were found for this movie",
          });
        }

        // Rank valid Torrentio releases by score (metadata only; Real-Debrid runs in the worker).
        const scoredResults: ScoredTorrentioCandidate[] = validResults.map(
          (candidate) => {
            const { score, reasons } = scoreTorrentResult(
              candidate,
              title,
              year,
            );
            return { ...candidate, score, scoreReasons: reasons };
          },
        );

        const rankedResults = [...scoredResults].sort((a, b) =>
          compareScoredCandidates(a, b),
        );
        const bestResult = rankedResults[0];
        const parsedRelease = await parseReleaseMetadata(bestResult.title);
        const videoParseCols = releaseMetadataToVideoColumns(parsedRelease);

        const torrentioMs = Date.now() - torrentioStartedAt;
        log.info(
          {
            imdb_id: imdbId,
            torrentio_ms: torrentioMs,
            stream_count: candidates.length,
            valid_1080p_plus: validResults.length,
            best_info_hash: bestResult.infoHash,
            best_quality: bestResult.quality,
            best_seeders: bestResult.seeders,
            best_score: bestResult.score,
          },
          "Torrentio results scored — picked best 1080p+ release and prepared DB insert.",
        );

        const magnet = bestResult.magnetUri;
        const size = bestResult.sizeBytes;

        // Extract info_hash
        const match = magnet?.match(/urn:btih:([a-zA-Z0-9]+)/i);
        const info_hash = match ? match[1].toLowerCase() : null;

        if (!info_hash) {
          return reply
            .status(400)
            .send({ error: "Invalid magnet link extracted from Torrentio" });
        }

        const existingVideoAfterSearch = await findBestVideoForTmdb(
          tmdb_id,
          "*",
          findOpts,
        );
        if (
          existingVideoAfterSearch &&
          isReusableVideoStatus(existingVideoAfterSearch.status)
        ) {
          log.info(
            {
              existing_video_id: existingVideoAfterSearch.id,
              existing_status: existingVideoAfterSearch.status,
            },
            "Race after Torrentio: video row now exists — returning existing job instead of duplicate insert.",
          );

          return reply.send(
            buildReuseExistingVideoResponse(existingVideoAfterSearch),
          );
        }

        log.info(
          {
            info_hash,
          },
          "Inserting new videos row with chosen magnet and parsed release metadata.",
        );

        // 3. Insert or update DB
        let videoRecord;
        const tmdbMediaType = isTvEpisode ? "tv" : "movie";
        const { data, error } = await supabase
          .from("videos")
          .insert({
            info_hash,
            title,
            magnet_uri: magnet,
            size_bytes: size,
            tmdb_id,
            tmdb_media_type: tmdbMediaType,
            ...videoParseCols,
            ...(isTvEpisode
              ? {
                  season_number: body.season_number,
                  episode_number: body.episode_number,
                }
              : {}),
          })
          .select()
          .single();

        if (error) {
          if (error.code === "23505") {
            // PostgreSQL unique_violation
            const duplicateStartedAt = Date.now();
            const { data: existingData, error: fetchError } = await supabase
              .from("videos")
              .select("*")
              .eq("info_hash", info_hash)
              .single();

            log.info(
              {
                info_hash,
                duplicate_lookup_ms: Date.now() - duplicateStartedAt,
              },
              "Insert hit unique constraint on info_hash — loading existing torrent row to merge or return.",
            );

            if (fetchError || !existingData) {
              log.error(
                { err: fetchError },
                "Duplicate hash handling failed — could not read existing row from Supabase.",
              );
              return reply
                .status(500)
                .send({ error: "Internal server error resolving duplicate" });
            }

            if (
              existingData.status === "failed" ||
              existingData.status === "retrying"
            ) {
              const { data: updatedData, error: updateError } = await supabase
                .from("videos")
                .update({
                  status: "pending",
                  error_message: null,
                  progress: 0,
                  tmdb_id: tmdb_id || existingData.tmdb_id,
                  ...mergeVideoParseColumns(videoParseCols, existingData),
                  tmdb_media_type: tmdbMediaType,
                  ...(isTvEpisode
                    ? {
                        season_number: body.season_number,
                        episode_number: body.episode_number,
                      }
                    : {}),
                })
                .eq("id", existingData.id)
                .select()
                .single();

              if (updateError || !updatedData) {
                return reply.status(500).send({
                  error: "Internal error updating failed video record",
                });
              }
              videoRecord = updatedData;
            } else {
              if (tmdb_id && !existingData.tmdb_id) {
                await supabase
                  .from("videos")
                  .update({
                    tmdb_id,
                    ...mergeVideoParseColumns(videoParseCols, existingData),
                    tmdb_media_type: tmdbMediaType,
                    ...(isTvEpisode
                      ? {
                          season_number: body.season_number,
                          episode_number: body.episode_number,
                        }
                      : {}),
                  })
                  .eq("id", existingData.id);
              }

              log.info(
                {
                  info_hash,
                  videoId: existingData.id,
                  status: existingData.status,
                  total_ms: Date.now() - startedAt,
                },
                "Duplicate magnet: returning existing video (no new queue job).",
              );

              return reply.send({
                message: "Video already exists",
                status: existingData.status,
                videoId: existingData.id,
                jobId: existingData.bullmq_job_id || null,
              });
            }
          } else {
            log.error(
              { err: error },
              "Supabase insert failed while creating video from Torrentio result.",
            );
            return reply.status(500).send({ error: "Database error" });
          }
        } else {
          videoRecord = data;
        }

        // 4. Queue the job
        log.info(
          { videoId: videoRecord.id },
          "Enqueueing BullMQ ingestion job for new video row.",
        );
        const queueStartedAt = Date.now();
        const job = await ingestionQueue.add(
          "download",
          {
            videoId: videoRecord.id,
            magnet_uri: videoRecord.magnet_uri,
            ...(watchFlowId ? { watch_flow_id: watchFlowId } : {}),
          },
          {
            jobId: videoRecord.id,
            attempts: 3,
            backoff: {
              type: "exponential",
              delay: 5000,
            },
          },
        );

        log.info(
          {
            info_hash,
            videoId: videoRecord.id,
            jobId: job.id,
            queue_ms: Date.now() - queueStartedAt,
            total_ms: Date.now() - startedAt,
          },
          "✅ Poster-play pipeline done — ingestion worker will pull from Real-Debrid next.",
        );

        await supabase
          .from("videos")
          .update({ bullmq_job_id: job.id })
          .eq("id", videoRecord.id);

        return reply.send({
          success: true,
          message: "Ingestion triggered successfully",
          status: videoRecord.status,
          videoId: videoRecord.id,
          jobId: job.id,
        });
      } catch (err: unknown) {
        const e = err as { code?: string; name?: string };
        if (err instanceof TorrentioRequestError) {
          fastify.log.error(
            {
              svc: "watch",
              torrentio_status: err.upstreamStatus,
            },
            "Trigger ingestion failed while fetching Torrentio streams.",
          );
          return reply.status(err.statusCode).send({
            error:
              err.upstreamStatus === 403
                ? "Torrentio is blocking this server right now (HTTP 403). Try again later."
                : "Unable to fetch streams from Torrentio right now.",
          });
        }
        if (e.code === "ECONNABORTED" || e.name === "TimeoutError") {
          fastify.log.error(
            { svc: "watch" },
            "Trigger ingestion timed out waiting on TMDB or Torrentio — client should retry.",
          );
          return reply
            .status(504)
            .send({ error: "Torrentio/TMDB request timed out" });
        }
        fastify.log.error(
          { svc: "watch", err },
          "Trigger ingestion threw an unexpected error.",
        );
        return reply.status(500).send({ error: "Internal server error" });
      }
    },
  );
}
