import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { supabase } from "../lib/supabase";
import {
  buildMediaflowTranscodeHls,
  isMediaflowEnabled,
} from "../lib/mediaflow";

type ForceHlsBody = {
  video_id?: string;
};

function getInternalKey(): string {
  return (
    process.env.BACKEND_INTERNAL_API_KEY ||
    process.env.INTERNAL_API_KEY ||
    process.env.MEDIAFLOW_API_PASSWORD ||
    ""
  ).trim();
}

export default async function (fastify: FastifyInstance) {
  fastify.post(
    "/api/internal/force-hls",
    async (
      request: FastifyRequest<{ Body: ForceHlsBody }>,
      reply: FastifyReply,
    ) => {
      const expectedKey = getInternalKey();
      const providedKey = String(request.headers["x-internal-key"] || "");
      if (!expectedKey || providedKey !== expectedKey) {
        fastify.log.warn(
          {
            svc: "watch",
            has_expected_key: Boolean(expectedKey),
            has_provided_key: Boolean(providedKey),
          },
          "Force-HLS rejected — missing or wrong X-Internal-Key (backend internal route).",
        );
        return reply.status(401).send({ error: "Unauthorized" });
      }
      if (!isMediaflowEnabled()) {
        fastify.log.warn(
          { svc: "watch" },
          "Force-HLS skipped — Mediaflow is disabled or MEDIAFLOW_BASE_URL unset.",
        );
        return reply
          .status(409)
          .send({ error: "MediaFlow is disabled or not configured" });
      }

      const videoId = request.body?.video_id;
      if (!videoId) {
        fastify.log.warn(
          { svc: "watch" },
          "Force-HLS bad request — body.video_id is required.",
        );
        return reply.status(400).send({ error: "video_id is required" });
      }
      fastify.log.info(
        { svc: "watch", videoId },
        "Force-HLS requested — will rebuild Mediaflow transcode URL from stored Real-Debrid stream_url.",
      );

      const { data, error } = await supabase
        .from("videos")
        .select("id, status, stream_url, playback_source, codec")
        .eq("id", videoId)
        .single();

      if (error || !data) {
        fastify.log.warn(
          { svc: "watch", videoId },
          "Force-HLS — no video row for this id (check Supabase).",
        );
        return reply.status(404).send({ error: "Video not found" });
      }
      if (data.status !== "completed") {
        fastify.log.warn(
          { svc: "watch", videoId, video_status: data.status },
          "Force-HLS refused — video is not in completed state yet (ingestion still running or failed).",
        );
        return reply
          .status(409)
          .send({ error: "Video is not in completed state" });
      }

      const upstreamUrl = data.stream_url;
      if (!upstreamUrl) {
        fastify.log.warn(
          { svc: "watch", videoId },
          "Force-HLS refused — stream_url empty on row (nothing to point Mediaflow at).",
        );
        return reply
          .status(409)
          .send({ error: "No upstream stream URL available" });
      }

      const pbContainer = (
        data.playback_source as { container?: string } | null
      )?.container;
      const container =
        pbContainer && pbContainer !== "unknown" ? pbContainer : "mkv";

      const playback = await buildMediaflowTranscodeHls({
        upstreamUrl,
        container,
        codec:
          data.codec ||
          (data.playback_source as { codec?: string } | null)?.codec ||
          "Unknown",
      });

      const { error: updateErr } = await supabase
        .from("videos")
        .update({
          mediaflow_playback: playback,
        })
        .eq("id", videoId);

      if (updateErr) {
        fastify.log.error(
          { svc: "watch", err: updateErr, videoId },
          "Force-HLS — Supabase update of mediaflow_playback failed.",
        );
        return reply
          .status(500)
          .send({ error: "Failed to update MediaFlow playback" });
      }
      fastify.log.info(
        { svc: "watch", videoId, playback_type: "mediaflow_transcode_hls" },
        "Force-HLS done — mediaflow_playback holds HLS manifest; Real-Debrid URL unchanged in playback_source.",
      );

      return reply.send({
        success: true,
        mediaflow_playback: {
          type: playback.type,
          url: playback.url,
          mime_type: playback.mime_type,
        },
      });
    },
  );
}
