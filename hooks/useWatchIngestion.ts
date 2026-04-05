"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import type { VideoRowLike } from "@/lib/watch-playback";
import {
  canPlayInBrowser,
  getFinalPlaybackUrl,
  isProxyOrHlsSource,
} from "@/lib/watch-playback";

/**
 * Avoid duplicate POST /trigger-ingestion when two polls both see `exists: false`
 * (e.g. React Strict Mode or fast re-renders) before the first insert lands.
 */
const triggerIngestionLastPostAt = new Map<string, number>();
const TRIGGER_INGESTION_DEDUP_MS = 12_000;
const activeWatchPollLoops = new Set<string>();

export type IngestMovieMeta = {
  title: string;
  release_date?: string | null;
};

export function useWatchIngestion(
  tmdbId: string,
  movie: IngestMovieMeta,
): {
  status: VideoRowLike | null;
  loading: boolean;
  message: string;
  finalPlaybackUrl: string | null;
  isProxyType: boolean;
  isTranscodeSource: boolean;
  streamReady: boolean;
  canPlay: boolean;
  watchFlowId: string;
} {
  const [status, setStatus] = useState<VideoRowLike | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("Checking availability…");
  const pollStartedAtRef = useRef<number>(Date.now());
  const hlsFallbackAttemptedByVideoIdRef = useRef(new Set<string>());

  /** New id when `tmdbId` changes — ties polls, trigger POST, and worker logs */
  const [watchFlowId, setWatchFlowId] = useState(() => crypto.randomUUID());
  const prevTmdbIdRef = useRef(tmdbId);
  useEffect(() => {
    if (prevTmdbIdRef.current !== tmdbId) {
      prevTmdbIdRef.current = tmdbId;
      setWatchFlowId(crypto.randomUUID());
    }
  }, [tmdbId]);

  const metaKey = useMemo(
    () => `${movie.title}|${movie.release_date ?? ""}`,
    [movie.title, movie.release_date],
  );

  useEffect(() => {
    if (activeWatchPollLoops.has(watchFlowId)) {
      return;
    }
    activeWatchPollLoops.add(watchFlowId);

    let pollTimeout: ReturnType<typeof setTimeout> | null = null;
    let isActive = true;
    let inFlight = false;
    let pollingStopped = false;

    function stopPolling() {
      pollingStopped = true;
      if (pollTimeout) {
        clearTimeout(pollTimeout);
        pollTimeout = null;
      }
    }

    function scheduleNextPoll() {
      if (!isActive || pollingStopped) return;
      const elapsedMs = Date.now() - pollStartedAtRef.current;
      const nextDelay = elapsedMs < 15000 ? 1000 : 2500;
      pollTimeout = setTimeout(() => {
        void checkStatus();
      }, nextDelay);
    }

    async function checkStatus() {
      if (!isActive || pollingStopped || inFlight) return;
      inFlight = true;

      try {
        const statusQs = new URLSearchParams({
          tmdb_id: tmdbId,
          watch_flow_id: watchFlowId,
        });
        const checkRes = await fetch(
          `/api/public/movie-status?${statusQs.toString()}`,
        );
        if (!checkRes.ok) throw new Error("Failed to check status");
        const checkData = (await checkRes.json()) as {
          exists?: boolean;
          video?: VideoRowLike;
        };

        if (!checkData.exists) {
          setMessage("Preparing this title in the background…");
          const now = Date.now();
          const lastPost = triggerIngestionLastPostAt.get(tmdbId) ?? 0;
          const skipDuplicatePost = now - lastPost < TRIGGER_INGESTION_DEDUP_MS;

          if (!skipDuplicatePost) {
            triggerIngestionLastPostAt.set(tmdbId, now);
            const triggerRes = await fetch("/api/public/trigger-ingestion", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                tmdb_id: parseInt(tmdbId, 10),
                title: movie.title,
                year: movie.release_date
                  ? movie.release_date.substring(0, 4)
                  : "",
                watch_flow_id: watchFlowId,
              }),
            });

            if (!triggerRes.ok) {
              triggerIngestionLastPostAt.delete(tmdbId);
              const err = (await triggerRes.json().catch(() => ({}))) as {
                error?: string;
              };
              setMessage(err.error ?? "Could not start ingestion.");
              setLoading(false);
              stopPolling();
              return;
            }
          }

          setMessage("Setting up stream…");
          scheduleNextPoll();
        } else if (checkData.exists && checkData.video) {
          triggerIngestionLastPostAt.delete(tmdbId);
          const vid = checkData.video;
          setStatus(vid);

          const url = getFinalPlaybackUrl(vid);
          const completed = vid.status === "completed" && !!url;

          if (completed) {
            if (canPlayInBrowser(vid)) {
              setLoading(false);
              const isHlsTranscode =
                vid.mediaflow_playback?.type === "mediaflow_transcode_hls" ||
                vid.playback_source?.type === "mediaflow_transcode_hls";
              if (isHlsTranscode) {
                setMessage("Optimizing stream for browser playback…");
              } else {
                setMessage("Ready to play");
              }
              stopPolling();
              return;
            } else {
              const videoId = vid.id;
              if (
                videoId &&
                !hlsFallbackAttemptedByVideoIdRef.current.has(videoId)
              ) {
                hlsFallbackAttemptedByVideoIdRef.current.add(videoId);
                console.info("[watch] force-hls fallback start", {
                  videoId,
                  playbackType:
                    vid.mediaflow_playback?.type ??
                    vid.playback_source?.type ??
                    null,
                  container: vid.playback_source?.container ?? null,
                });
                setMessage("Optimizing stream for browser playback…");
                const fallbackRes = await fetch("/api/public/force-hls", {
                  method: "POST",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({ video_id: videoId }),
                });
                if (fallbackRes.ok) {
                  console.info("[watch] force-hls fallback success", {
                    videoId,
                  });
                  scheduleNextPoll();
                } else {
                  const fallbackError = await fallbackRes
                    .json()
                    .catch(() => ({}) as Record<string, unknown>);
                  console.warn("[watch] force-hls fallback failed", {
                    videoId,
                    status: fallbackRes.status,
                    fallbackError,
                  });
                  setLoading(false);
                  setMessage(
                    "File is ready but needs an external player for this format.",
                  );
                  stopPolling();
                }
              } else {
                if (videoId) {
                  console.info("[watch] force-hls fallback already attempted", {
                    videoId,
                  });
                }
                setLoading(false);
                setMessage(
                  "File is ready but needs an external player for this format.",
                );
                stopPolling();
              }
            }
          } else if (vid.status === "failed") {
            setLoading(false);
            setMessage(vid.error_message ?? "Ingestion failed.");
            stopPolling();
          } else {
            setMessage(
              `Processing: ${(vid.status ?? "pending").replace(/_/g, " ")}… (${vid.progress ?? 0}%)`,
            );
            scheduleNextPoll();
          }
        }
      } catch {
        if (isActive) {
          setMessage("Something went wrong while checking status.");
          setLoading(false);
          stopPolling();
        }
      } finally {
        inFlight = false;
      }
    }

    pollStartedAtRef.current = Date.now();
    void checkStatus();

    return () => {
      isActive = false;
      stopPolling();
      activeWatchPollLoops.delete(watchFlowId);
    };
  }, [tmdbId, metaKey, movie.title, movie.release_date, watchFlowId]);

  const finalPlaybackUrl = getFinalPlaybackUrl(status);
  const isProxyType = isProxyOrHlsSource(status);
  const isTranscodeSource =
    status?.mediaflow_playback?.type === "mediaflow_transcode_hls" ||
    status?.playback_source?.type === "mediaflow_transcode_hls";
  const streamReady =
    !loading &&
    !!finalPlaybackUrl &&
    status?.status === "completed" &&
    canPlayInBrowser(status);
  const canPlay = streamReady;

  return {
    status,
    loading,
    message,
    finalPlaybackUrl,
    isProxyType,
    isTranscodeSource,
    streamReady,
    canPlay,
    watchFlowId,
  };
}
