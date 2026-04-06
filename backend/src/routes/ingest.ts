import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
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
import {
  backfillVideoIdentityFksIfNeeded,
  resolveVideoIdentityInsertColumns,
} from "../lib/media-identity";
import { publicPlaybackSourceFromRow } from "../lib/playback-public";

interface IngestBody {
  magnet: string;
  size: number;
  title: string;
  tmdb_id?: number;
  quality?: string;
  codec?: string;
  source?: string;
}

export default async function (fastify: FastifyInstance) {
  fastify.post(
    "/api/ingest",
    async (
      request: FastifyRequest<{ Body: IngestBody }>,
      reply: FastifyReply,
    ) => {
      const log = fastify.log.child({ svc: "ingest" });
      try {
        const { magnet, size, title, tmdb_id, quality, codec, source } =
          request.body;

        if (!magnet || !size || !title) {
          return reply
            .status(400)
            .send({ error: "Missing required fields: magnet, size, title" });
        }

        const parsedCols = releaseMetadataToVideoColumns(
          await parseReleaseMetadata(title),
        );
        const buildVideoFields = (existing?: Record<string, unknown>) => {
          const merged = existing
            ? mergeVideoParseColumns(parsedCols, existing)
            : parsedCols;
          return {
            quality: quality?.trim() ? quality : merged.quality,
            codec: codec?.trim() ? codec : merged.codec,
            source: source?.trim() ? source : merged.source,
            season_number: merged.season_number,
            episode_number: merged.episode_number,
            release_year: merged.release_year,
            release_group: merged.release_group,
            release_parse_extras: merged.release_parse_extras,
          };
        };

        const videoFields = buildVideoFields();
        const tmdbMediaType =
          videoFields.season_number != null &&
          videoFields.episode_number != null
            ? "tv"
            : "movie";

        const findOpts: FindVideoForTmdbOpts =
          tmdbMediaType === "tv" &&
          typeof videoFields.season_number === "number" &&
          typeof videoFields.episode_number === "number"
            ? {
                mode: "tv_episode",
                seasonNumber: videoFields.season_number,
                episodeNumber: videoFields.episode_number,
              }
            : { mode: "movie" };

        if (tmdb_id) {
          const existingVideo = await findBestVideoForTmdb(
            tmdb_id,
            "*",
            findOpts,
          );
          if (existingVideo && isReusableVideoStatus(existingVideo.status)) {
            log.info(
              {
                tmdb_id,
                existing_video_id: existingVideo.id,
                existing_status: existingVideo.status,
              },
              "Admin ingest skipped — this TMDB title already has a reusable video row (completed or in progress).",
            );

            return reply.send({
              message:
                existingVideo.status === "completed"
                  ? "Video already available"
                  : "Video already in progress",
              status: existingVideo.status,
              videoId: existingVideo.id,
              jobId: existingVideo.bullmq_job_id || null,
              reusedExisting: true,
              stream_url: null,
              playback_source:
                publicPlaybackSourceFromRow(
                  existingVideo.stream_url,
                  existingVideo.playback_source,
                ) ?? null,
            });
          }
        }

        const match = magnet.match(/urn:btih:([a-zA-Z0-9]+)/i);
        const info_hash = match ? match[1].toLowerCase() : null;

        if (!info_hash) {
          return reply.status(400).send({ error: "Invalid magnet link" });
        }

        const ingestIdentity = await resolveVideoIdentityInsertColumns({
          tmdbId: tmdb_id ?? null,
          title,
          tmdbMediaType,
          seasonNumber: videoFields.season_number,
          episodeNumber: videoFields.episode_number,
          tmdbEpisodeId: null,
        });

        // Try to insert
        let videoRecord;
        const { data, error } = await supabase
          .from("videos")
          .insert({
            info_hash,
            title,
            magnet_uri: magnet,
            size_bytes: size,
            tmdb_id: tmdb_id || null,
            tmdb_media_type: tmdbMediaType,
            ...ingestIdentity,
            ...videoFields,
          })
          .select()
          .single();

        if (error) {
          // 23505 is PostgreSQL's unique_violation error code
          if (error.code === "23505") {
            // Fetch existing record
            const { data: existingData, error: fetchError } = await supabase
              .from("videos")
              .select("*")
              .eq("info_hash", info_hash)
              .single();

            if (fetchError || !existingData) {
              log.error(
                { err: fetchError },
                "Duplicate magnet hash but could not re-fetch existing row — internal error.",
              );
              return reply
                .status(500)
                .send({ error: "Internal server error resolving duplicate" });
            }

            if (
              existingData.status === "failed" ||
              existingData.status === "retrying"
            ) {
              // Reset status down to pending, clear errors, and continue to queue
              const mergedFields = buildVideoFields(existingData);
              const retryMediaType =
                mergedFields.season_number != null &&
                mergedFields.episode_number != null
                  ? "tv"
                  : "movie";
              const retryIdentity = await resolveVideoIdentityInsertColumns({
                tmdbId: (tmdb_id || existingData.tmdb_id) ?? null,
                title,
                tmdbMediaType: retryMediaType,
                seasonNumber: mergedFields.season_number,
                episodeNumber: mergedFields.episode_number,
                tmdbEpisodeId: null,
              });
              const { data: updatedData, error: updateError } = await supabase
                .from("videos")
                .update({
                  status: "pending",
                  error_message: null,
                  progress: 0,
                  tmdb_id: tmdb_id || existingData.tmdb_id,
                  tmdb_media_type: retryMediaType,
                  ...retryIdentity,
                  ...mergedFields,
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
              // Just implicitly update the DB record if it was missing the tmdb_id
              if (tmdb_id && !existingData.tmdb_id) {
                const patchFields = buildVideoFields(existingData);
                const patchMediaType =
                  patchFields.season_number != null &&
                  patchFields.episode_number != null
                    ? "tv"
                    : "movie";
                const patchIdentity = await resolveVideoIdentityInsertColumns({
                  tmdbId: tmdb_id,
                  title,
                  tmdbMediaType: patchMediaType,
                  seasonNumber: patchFields.season_number,
                  episodeNumber: patchFields.episode_number,
                  tmdbEpisodeId: null,
                });
                await supabase
                  .from("videos")
                  .update({
                    tmdb_id,
                    tmdb_media_type: patchMediaType,
                    ...patchIdentity,
                    ...patchFields,
                  })
                  .eq("id", existingData.id);
              }

              const backfillFields = buildVideoFields(existingData);
              await backfillVideoIdentityFksIfNeeded({
                ...existingData,
                tmdb_id: tmdb_id || existingData.tmdb_id,
                tmdb_media_type:
                  backfillFields.season_number != null &&
                  backfillFields.episode_number != null
                    ? "tv"
                    : "movie",
                title: existingData.title,
                season_number: backfillFields.season_number,
                episode_number: backfillFields.episode_number,
              });

              log.info(
                {
                  videoId: existingData.id,
                  video_status: existingData.status,
                },
                "Magnet already in library — not enqueueing another BullMQ job.",
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
              "Supabase insert failed for new video row.",
            );
            return reply.status(500).send({ error: "Database error" });
          }
        } else {
          videoRecord = data;
        }

        await backfillVideoIdentityFksIfNeeded(videoRecord);

        // Queue the job with resilience settings
        const job = await ingestionQueue.add(
          "download",
          {
            videoId: videoRecord.id,
            magnet_uri: videoRecord.magnet_uri,
          },
          {
            jobId: videoRecord.id,
            attempts: 3, // Retries up to 3 times
            backoff: {
              type: "exponential",
              delay: 5000, // 5s, 10s, 20s...
            },
          },
        );

        log.info(
          { videoId: videoRecord.id, jobId: job.id },
          "Video row created and BullMQ ingestion job enqueued.",
        );

        // Save the BullMQ job ID back to Supabase for reliable cancellation later
        await supabase
          .from("videos")
          .update({ bullmq_job_id: job.id })
          .eq("id", videoRecord.id);

        return reply.send({
          message: "Video submitted successfully",
          status: videoRecord.status,
          videoId: videoRecord.id,
          jobId: job.id,
        });
      } catch (err) {
        log.error({ err }, "Unhandled exception in legacy /api/ingest route.");
        return reply.status(500).send({ error: "Internal server error" });
      }
    },
  );
}
