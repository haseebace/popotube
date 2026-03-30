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
            fastify.log.info(
              {
                tmdb_id,
                existing_video_id: existingVideo.id,
                existing_status: existingVideo.status,
              },
              "Reusing existing TMDB video before ingest insert",
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
              stream_url: existingVideo.stream_url || null,
              playback_source: existingVideo.playback_source || null,
            });
          }
        }

        const match = magnet.match(/urn:btih:([a-zA-Z0-9]+)/i);
        const info_hash = match ? match[1].toLowerCase() : null;

        if (!info_hash) {
          return reply.status(400).send({ error: "Invalid magnet link" });
        }

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
              fastify.log.error(
                { err: fetchError },
                "Error fetching existing record",
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
              const { data: updatedData, error: updateError } = await supabase
                .from("videos")
                .update({
                  status: "pending",
                  error_message: null,
                  progress: 0,
                  tmdb_id: tmdb_id || existingData.tmdb_id,
                  tmdb_media_type: retryMediaType,
                  ...mergedFields,
                })
                .eq("id", existingData.id)
                .select()
                .single();

              if (updateError || !updatedData) {
                return reply
                  .status(500)
                  .send({
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
                await supabase
                  .from("videos")
                  .update({
                    tmdb_id,
                    tmdb_media_type: patchMediaType,
                    ...patchFields,
                  })
                  .eq("id", existingData.id);
              }

              fastify.log.info(
                `🔄 [Ingest] Video ${existingData.id} already exists with status: ${existingData.status}. Skipping queue addition.`,
              );

              return reply.send({
                message: "Video already exists",
                status: existingData.status,
                videoId: existingData.id,
                jobId: existingData.bullmq_job_id || null,
              });
            }
          } else {
            fastify.log.error({ err: error }, "Database insert error");
            return reply.status(500).send({ error: "Database error" });
          }
        } else {
          videoRecord = data;
        }

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

        fastify.log.info(
          `📨 [Ingest] Successfully queued video ${videoRecord.id} into BullMQ as job ${job.id}`,
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
        fastify.log.error({ err }, "Exception in ingest route");
        return reply.status(500).send({ error: "Internal server error" });
      }
    },
  );
}
