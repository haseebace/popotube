"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import type { VideoRowLike } from "@/lib/watch-playback";
import {
  canPlayInBrowser,
  getFinalPlaybackUrl,
  isProxyOrHlsSource,
} from "@/lib/watch-playback";
import { publicBackendApiUrl } from "@/lib/backend-public-url";

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
  /** Completed but not browser-playable — no transcoder; stop quickly and surface external player. */
  const unplayableCompletedPollsRef = useRef(0);

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
          publicBackendApiUrl(`/api/movie-status?${statusQs.toString()}`),
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
            const triggerRes = await fetch(
              publicBackendApiUrl("/api/trigger-ingestion"),
              {
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
              },
            );

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
              unplayableCompletedPollsRef.current = 0;
              setLoading(false);
              const hls = url && /\.m3u8(\?|$)/i.test(url);
              setMessage(
                hls
                  ? "Optimizing stream for browser playback…"
                  : "Ready to play",
              );
              stopPolling();
              return;
            }
            unplayableCompletedPollsRef.current += 1;
            if (unplayableCompletedPollsRef.current > 2) {
              setLoading(false);
              setMessage(
                "File is ready but needs an external player for this format.",
              );
              stopPolling();
              return;
            }
            setMessage("Checking playback options…");
            scheduleNextPoll();
          } else if (vid.status === "failed") {
            setLoading(false);
            setMessage(vid.error_message ?? "Ingestion failed.");
            stopPolling();
          } else {
            unplayableCompletedPollsRef.current = 0;
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
  const isTranscodeSource = Boolean(
    finalPlaybackUrl && /\.m3u8(\?|$)/i.test(finalPlaybackUrl),
  );
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
