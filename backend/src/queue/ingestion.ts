import { Queue, Worker, UnrecoverableError } from "bullmq";
import { connection } from "../lib/redis";
import { rdClient } from "../lib/real-debrid";
import { supabase } from "../lib/supabase";
import type { Logger } from "pino";
import { logger } from "../lib/logger";
import { sanitizeWatchFlowId } from "../lib/watch-flow-id";
import {
  buildMediaflowTranscodeHls,
  isContainerBrowserSafe,
  isMediaflowEnabled,
  type MediaflowPlaybackColumn,
  type PlaybackSource,
} from "../lib/mediaflow";
import { parseReleaseMetadata } from "../lib/release-metadata";

export const INGESTION_QUEUE_NAME = "ingestionQueue";
const RD_CONVERSION_POLL_MS = 750;
const RD_DOWNLOAD_POLL_FAST_MS = 1000;
const RD_DOWNLOAD_POLL_SLOW_MS = 2500;
const STEP_WARN_THRESHOLD_MS: Record<string, number> = {
  rd_add_magnet: 1500,
  rd_wait_for_conversion: 3000,
  rd_select_files: 1500,
  rd_wait_for_download: 5000,
  rd_refresh_completed_links: 1500,
  rd_unrestrict_link: 2000,
};

/** Short human label for `step` — easier to scan than internal keys */
const STEP_LABEL: Record<string, string> = {
  rd_add_magnet: "RD: add magnet",
  rd_wait_for_conversion: "RD: magnet → torrent",
  rd_select_files: "RD: pick file",
  rd_wait_for_download: "RD: download to cloud",
  rd_refresh_completed_links: "RD: refresh links",
  rd_unrestrict_link: "RD: unrestrict link",
};

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createStepTimer(
  log: Logger,
  jobId: string | undefined,
  videoId: string,
) {
  const jobStartedAt = Date.now();

  return {
    step(label: string) {
      const stepStartedAt = Date.now();

      return {
        finish(extra: Record<string, unknown> = {}) {
          const durationMs = Date.now() - stepStartedAt;
          const thresholdMs = STEP_WARN_THRESHOLD_MS[label] ?? 3000;
          const logLevel: "info" | "warn" =
            durationMs >= thresholdMs ? "warn" : "info";

          const labelText = STEP_LABEL[label] ?? label;
          log[logLevel](
            {
              jobId,
              videoId,
              step: label,
              duration_ms: durationMs,
              total_elapsed_ms: Date.now() - jobStartedAt,
              ...extra,
            },
            durationMs >= thresholdMs
              ? `Step slower than usual — ${labelText} (still OK)`
              : `Step complete — ${labelText}`,
          );
        },
      };
    },
    total(extra: Record<string, unknown> = {}) {
      const totalElapsedMs = Date.now() - jobStartedAt;
      const logLevel: "info" | "warn" =
        totalElapsedMs >= 15000 ? "warn" : "info";

      log[logLevel](
        {
          jobId,
          videoId,
          total_elapsed_ms: totalElapsedMs,
          ...extra,
        },
        totalElapsedMs >= 15000
          ? "⏱️ Ingestion job finished (slow — large file or busy Real-Debrid)."
          : "✅ Ingestion job finished successfully.",
      );
    },
  };
}

// Initialize the Queue
export const ingestionQueue = new Queue(INGESTION_QUEUE_NAME, {
  connection: connection as any,
});

// Basic Worker for the Ingestion Queue
export const ingestionWorker = new Worker(
  INGESTION_QUEUE_NAME,
  async (job) => {
    const { videoId, magnet_uri, watch_flow_id } = job.data as {
      videoId: string;
      magnet_uri: string;
      watch_flow_id?: string;
    };
    const wf = sanitizeWatchFlowId(watch_flow_id);
    const log = wf
      ? logger.child({ svc: "queue", watch_flow_id: wf })
      : logger.child({ svc: "queue" });
    let stepLog: Logger = log;
    let rdTorrentId: string | null = null;

    try {
      // Fetch video from DB
      const { data: videoRecord, error: fetchErr } = await supabase
        .from("videos")
        .select("*")
        .eq("id", videoId)
        .single();

      if (fetchErr || !videoRecord) {
        if (fetchErr?.code === "PGRST116") {
          log.info(
            { jobId: job.id, videoId },
            "Video row was deleted — stopping worker quietly (nothing to process).",
          );
          return; // Stop processing silently
        }
        log.error(
          { err: fetchErr, jobId: job.id, videoId },
          "Could not load video row from database — ingestion aborted.",
        );
        throw new Error(
          `Failed to fetch video record ${videoId}: ${fetchErr?.message || "No record found"}`,
        );
      }

      stepLog =
        videoRecord.tmdb_id != null
          ? log.child({ tmdb_id: videoRecord.tmdb_id })
          : log;
      stepLog.info(
        { jobId: job.id, videoId },
        "▶️ Worker picked up job — will add magnet to Real-Debrid and wait for cloud copy.",
      );
      const timing = createStepTimer(stepLog, job.id, videoId);

      // Update status to downloading_torrent
      await supabase
        .from("videos")
        .update({ status: "downloading_torrent" })
        .eq("id", videoId);

      // Phase 3.1: Send to Real-Debrid
      const addMagnetStep = timing.step("rd_add_magnet");
      stepLog.info(
        { jobId: job.id },
        "Submitting magnet URI to Real-Debrid (torrent added to your RD account).",
      );
      rdTorrentId = await rdClient.addMagnet(magnet_uri);
      addMagnetStep.finish({ rd_torrent_id: rdTorrentId });

      // Wait for Real-Debrid to convert magnet and prepare files
      let isWaitingFiles = false;
      let torrentInfo;
      let conversionPolls = 0;
      const conversionStep = timing.step("rd_wait_for_conversion");

      while (!isWaitingFiles) {
        if (conversionPolls > 0) {
          await wait(RD_CONVERSION_POLL_MS);
        }
        torrentInfo = await rdClient.getTorrentInfo(rdTorrentId);
        conversionPolls++;

        if (torrentInfo.status === "waiting_files_selection") {
          isWaitingFiles = true;
        } else if (
          torrentInfo.status === "downloaded" ||
          torrentInfo.status === "downloading" ||
          torrentInfo.status === "queued"
        ) {
          isWaitingFiles = true;
        } else if (
          torrentInfo.status === "magnet_error" ||
          torrentInfo.status === "error" ||
          torrentInfo.status === "dead"
        ) {
          throw new Error(
            `Real-Debrid error: Torrent is ${torrentInfo.status}`,
          );
        }
      }
      conversionStep.finish({
        polls: conversionPolls,
        rd_status: torrentInfo?.status,
      });

      // Select Files (if needed)
      if (torrentInfo!.status === "waiting_files_selection") {
        const selectFilesStep = timing.step("rd_select_files");
        await rdClient.selectFiles(rdTorrentId, torrentInfo, videoRecord.title);
        selectFilesStep.finish({
          total_files: torrentInfo?.files?.length ?? 0,
        });
      }

      // Poll for download completion on Real-Debrid
      let isComplete = false;
      let downloadPolls = 0;
      let lastLoggedProgressWhole = -1;
      let lastProgressLogAtPoll = 0;
      const downloadStep = timing.step("rd_wait_for_download");
      while (!isComplete) {
        if (downloadPolls > 0) {
          const pollDelay =
            downloadPolls <= 5
              ? RD_DOWNLOAD_POLL_FAST_MS
              : RD_DOWNLOAD_POLL_SLOW_MS;
          await wait(pollDelay);
        }

        torrentInfo = await rdClient.getTorrentInfo(rdTorrentId);
        downloadPolls++;

        const progressPercentage = parseFloat(
          (torrentInfo.progress || 0).toFixed(2),
        );
        const wholePct = Math.floor(progressPercentage);
        const shouldLogProgress =
          downloadPolls === 1 ||
          wholePct !== lastLoggedProgressWhole ||
          downloadPolls - lastProgressLogAtPoll >= 12;
        if (shouldLogProgress) {
          lastLoggedProgressWhole = wholePct;
          lastProgressLogAtPoll = downloadPolls;
          stepLog.debug(
            {
              jobId: job.id,
              rd_progress_pct: progressPercentage,
              rd_status: torrentInfo.status,
              download_poll: downloadPolls,
            },
            "Real-Debrid cloud download progress (polling RD until status is downloaded).",
          );
        }

        // Map 0-100% torrent progress to 0-50% global progress
        const globalProgress = parseFloat(
          (progressPercentage * 0.5).toFixed(2),
        );
        await supabase
          .from("videos")
          .update({ progress: globalProgress })
          .eq("id", videoId);

        if (torrentInfo.status === "downloaded") {
          isComplete = true;
        } else if (
          torrentInfo.status === "error" ||
          torrentInfo.status === "virus" ||
          torrentInfo.status === "dead"
        ) {
          throw new Error(`Real-Debrid download failed: ${torrentInfo.status}`);
        }
      }
      downloadStep.finish({
        polls: downloadPolls,
        rd_status: torrentInfo?.status,
        rd_progress: torrentInfo?.progress ?? 0,
      });

      // Phase 3.2: Unrestrict the Link
      await supabase
        .from("videos")
        .update({ status: "exposing_http", progress: 50 })
        .eq("id", videoId);

      // Get the finalized links from torrentInfo
      const finalizedLinkStep = timing.step("rd_refresh_completed_links");
      torrentInfo = await rdClient.getTorrentInfo(rdTorrentId);
      finalizedLinkStep.finish({
        link_count: torrentInfo?.links?.length ?? 0,
      });
      if (!torrentInfo.links || torrentInfo.links.length === 0) {
        throw new Error(
          "Real-Debrid provided no download links after completion.",
        );
      }

      // In Real-Debrid, we only selected one target file, so there should be 1 link we care about
      const unrestrictStep = timing.step("rd_unrestrict_link");
      const unrestrictData = await rdClient.unrestrictLink(
        torrentInfo.links[0],
      );
      const fullDownloadUrl = unrestrictData.download;
      unrestrictStep.finish({
        filename: unrestrictData.filename,
        streamable: Boolean(unrestrictData.streamable),
        filesize: unrestrictData.filesize,
      });

      // Codec on the row comes from Torrentio title at insert; RD filename is authoritative when that was empty/wrong.
      const filenameForParse =
        unrestrictData.filename.replace(/\.[^/.]+$/, "") ||
        unrestrictData.filename;
      const existingCodec = String(videoRecord.codec ?? "").trim();
      let resolvedCodec: string | null =
        existingCodec && existingCodec.toLowerCase() !== "unknown"
          ? existingCodec
          : null;
      if (!resolvedCodec) {
        const fromFile = await parseReleaseMetadata(filenameForParse);
        if (fromFile.codec !== "unknown") resolvedCodec = fromFile.codec;
      }
      const codecLabel =
        resolvedCodec && resolvedCodec !== "unknown"
          ? resolvedCodec
          : "Unknown";

      // Mark the title as playback-ready (MediaFlow preferred; direct RD fallback)
      const containerExt =
        unrestrictData.filename.split(".").pop()?.toLowerCase() || "unknown";
      const isStreamable = isContainerBrowserSafe(containerExt);
      const directPlaybackSource: PlaybackSource = {
        type: "direct",
        url: fullDownloadUrl,
        codec: codecLabel,
        container: containerExt,
        mime_type: unrestrictData.mimeType || "video/mp4",
        is_streamable: isStreamable,
        source_type: "real_debrid",
      };

      let mediaflowPlayback: MediaflowPlaybackColumn | null = null;
      if (!isStreamable && isMediaflowEnabled()) {
        try {
          mediaflowPlayback = await buildMediaflowTranscodeHls({
            upstreamUrl: fullDownloadUrl,
            container: containerExt,
            codec: codecLabel,
          });
        } catch (mediaflowErr) {
          log.warn(
            {
              err: mediaflowErr,
              jobId: job.id,
              videoId,
              source_type: "mediaflow",
            },
            "⚠️ MediaFlow HLS URL build failed — playback_source still holds Real-Debrid; browser may need external player.",
          );
        }
      }

      const playbackExplanation = mediaflowPlayback
        ? "✅ Saved Real-Debrid URL in playback_source; MediaFlow HLS manifest in mediaflow_playback (transcode)."
        : isStreamable
          ? "✅ Saved playback: Real-Debrid + app stream proxy — one egress IP to RD; browser uses /api/proxy/stream."
          : "✅ Saved playback: Real-Debrid only (no MediaFlow HLS) — may need external player for this container.";

      log.info(
        {
          jobId: job.id,
          videoId,
          playback_source_type: directPlaybackSource.type,
          mediaflow_playback: Boolean(mediaflowPlayback),
          container: containerExt,
          filename: unrestrictData.filename,
          streamable: isStreamable,
        },
        playbackExplanation,
      );

      await supabase
        .from("videos")
        .update({
          status: "completed",
          progress: 100,
          stream_url: fullDownloadUrl,
          playback_source: directPlaybackSource,
          mediaflow_playback: mediaflowPlayback,
          ...(resolvedCodec && resolvedCodec !== "unknown"
            ? { codec: resolvedCodec }
            : {}),
        })
        .eq("id", videoId);

      timing.total({
        rd_torrent_id: rdTorrentId,
        playback_source_type: directPlaybackSource.type,
        source_type: directPlaybackSource.source_type,
        filename: unrestrictData.filename,
        filesize: unrestrictData.filesize,
      });

      return {
        status: "success",
        videoId,
        stream_url: fullDownloadUrl,
        playback_source: directPlaybackSource,
      };
    } catch (err: unknown) {
      const e = err as { name?: string; message?: string };
      const msg = e.message ?? "Unknown error occurred";
      if (
        e.name === "UnrecoverableError" ||
        msg.includes("Job cancelled") ||
        msg.includes("Job stopped")
      ) {
        return;
      }

      stepLog.error(
        {
          err,
          jobId: job.id,
          attempt: job.attemptsMade + 1,
        },
        "Ingestion worker crashed or rejected — job will retry or mark video failed per BullMQ rules.",
      );

      const maxAttempts = job.opts.attempts || 1;
      const isLastAttempt = job.attemptsMade >= maxAttempts - 1;

      if (isLastAttempt) {
        await supabase
          .from("videos")
          .update({
            status: "failed",
            error_message: msg,
          })
          .eq("id", videoId);

        // We no longer delete the Real-Debrid torrent here (Task 5.2)
      } else {
        await supabase
          .from("videos")
          .update({
            status: "retrying",
            error_message: `Attempt ${job.attemptsMade + 1} failed: ${msg}. Retrying...`,
          })
          .eq("id", videoId);
      }

      throw err;
    }
  },
  {
    connection: connection as any,
    concurrency: 5,
    lockDuration: 5 * 60 * 1000,
    lockRenewTime: 2 * 60 * 1000,
  },
);

ingestionWorker.on("completed", (job) => {
  const data = job.data as {
    watch_flow_id?: string;
    videoId?: string;
  };
  const wf = sanitizeWatchFlowId(data?.watch_flow_id);
  const log = wf
    ? logger.child({ svc: "queue", watch_flow_id: wf })
    : logger.child({ svc: "queue" });
  log.debug(
    { jobId: job.id, videoId: data.videoId },
    "BullMQ reported job completed (worker finished without throwing).",
  );
});

ingestionWorker.on("failed", (job, err) => {
  const data = job?.data as
    | { watch_flow_id?: string; videoId?: string }
    | undefined;
  const wf = sanitizeWatchFlowId(data?.watch_flow_id);
  const log = wf
    ? logger.child({ svc: "queue", watch_flow_id: wf })
    : logger.child({ svc: "queue" });
  if (
    err.name === "UnrecoverableError" ||
    err.message.includes("Job cancelled")
  ) {
    log.info(
      { jobId: job?.id, videoId: data?.videoId, reason: err.message },
      "BullMQ job cancelled or stopped intentionally — not treated as a failure.",
    );
  } else {
    log.error(
      { err, jobId: job?.id, videoId: data?.videoId },
      "BullMQ job failed after retries — check error and video row status in Supabase.",
    );
  }
});
