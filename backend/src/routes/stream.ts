import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { pickUpstreamStreamUrlFromRow } from "../lib/playback-public";
import { supabase } from "../lib/supabase";
import { sanitizeWatchFlowId } from "../lib/watch-flow-id";

type PlaybackSourceShape = {
  url?: string | null;
  mime_type?: string | null;
};

export default async function (fastify: FastifyInstance) {
  fastify.get(
    "/api/stream/:videoId",
    async (
      request: FastifyRequest<{
        Params: { videoId: string };
        Querystring: { watch_flow_id?: string };
      }>,
      reply: FastifyReply,
    ) => {
      try {
        const { videoId } = request.params;
        const watchFlowId = sanitizeWatchFlowId(request.query.watch_flow_id);
        const rangeHeader = request.headers.range ?? null;
        const log = fastify.log.child({
          svc: "watch",
          videoId,
          ...(watchFlowId ? { watch_flow_id: watchFlowId } : {}),
        });

        const { data, error } = await supabase
          .from("videos")
          .select("playback_source, stream_url")
          .eq("id", videoId)
          .single();

        if (error || !data) {
          return reply.code(404).send({ error: "Video stream not found" });
        }

        const streamUrl = pickUpstreamStreamUrlFromRow(
          data.playback_source,
          data.stream_url as string | null | undefined,
        );
        if (!streamUrl) {
          return reply.code(404).send({ error: "Stream URL not available" });
        }

        const playback = data.playback_source as PlaybackSourceShape | null;

        let upstreamHost = "invalid-url";
        try {
          upstreamHost = new URL(streamUrl).hostname;
        } catch {
          /* keep label */
        }

        log.info(
          {
            range: rangeHeader ?? undefined,
            upstream_host: upstreamHost,
          },
          "⏩ Stream proxy — piping bytes from stored playback URL to the browser (host only logged, not full signed URL).",
        );

        // Forward request transparently while scrubbing the content-disposition
        // header from Real-Debrid so the browser's native video player handles it in-line
        return reply.from(streamUrl, {
          rewriteRequestHeaders: (request, headers) => {
            return headers;
          },
          rewriteHeaders: (headers) => {
            const newHeaders = { ...headers };
            delete newHeaders["content-disposition"];
            const ct = String(newHeaders["content-type"] ?? "").trim();
            const hint = playback?.mime_type?.trim() ?? "";
            if (
              hint &&
              /^video\//i.test(hint) &&
              (!ct || ct === "application/octet-stream")
            ) {
              newHeaders["content-type"] = hint;
            }
            return newHeaders;
          },
        });
      } catch (err) {
        fastify.log.error(
          { svc: "watch", err },
          "Stream proxy crashed — client gets 500.",
        );
        return reply.code(500).send({ error: "Internal Server Error" });
      }
    },
  );
}
