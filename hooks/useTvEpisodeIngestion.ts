"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { VideoRowLike } from "@/lib/watch-playback";
import {
  canPlayInBrowser,
  getFinalPlaybackUrl,
  isProxyOrHlsSource,
} from "@/lib/watch-playback";

const triggerIngestionLastPostAt = new Map<string, number>();
const TRIGGER_INGESTION_DEDUP_MS = 12_000;

function episodeKey(tvId: string, season: number, episode: number) {
  return `tv:${tvId}:${season}:${episode}`;
}

export type TvEpisodeIngestMeta = {
  title: string;
  first_air_date?: string | null;
};

export function useTvEpisodeIngestion(
  tvId: string,
  season: number,
  episode: number,
  meta: TvEpisodeIngestMeta,
  enabled: boolean,
): {
  status: VideoRowLike | null;
  loading: boolean;
  message: string;
  finalPlaybackUrl: string | null;
  isProxyType: boolean;
  streamReady: boolean;
  canPlay: boolean;
} {
  const [status, setStatus] = useState<VideoRowLike | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const pollStartedAtRef = useRef<number>(Date.now());
  const hlsFallbackAttemptedByVideoIdRef = useRef(new Set<string>());

  const [watchFlowId, setWatchFlowId] = useState(() => crypto.randomUUID());
  const prevTargetRef = useRef(`${tvId}:${season}:${episode}`);
  useEffect(() => {
    const next = `${tvId}:${season}:${episode}`;
    if (prevTargetRef.current !== next) {
      prevTargetRef.current = next;
      setWatchFlowId(crypto.randomUUID());
    }
  }, [tvId, season, episode]);

  const metaKey = useMemo(
    () => `${meta.title}|${meta.first_air_date ?? ""}`,
    [meta.title, meta.first_air_date],
  );

  const year = meta.first_air_date ? meta.first_air_date.substring(0, 4) : "";

  useEffect(() => {
    if (!enabled) {
      setStatus(null);
      setLoading(false);
      setMessage("");
      return;
    }

    let pollTimeout: ReturnType<typeof setTimeout> | null = null;
    let isActive = true;

    function scheduleNextPoll() {
      const elapsedMs = Date.now() - pollStartedAtRef.current;
      const nextDelay = elapsedMs < 15000 ? 1000 : 2500;
      pollTimeout = setTimeout(() => {
        void checkStatus();
      }, nextDelay);
    }

    async function checkStatus() {
      if (!isActive) return;

      try {
        const statusQs = new URLSearchParams({
          tmdb_id: tvId,
          watch_flow_id: watchFlowId,
          season: String(season),
          episode: String(episode),
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
          setMessage("Preparing this episode in the background…");
          const key = episodeKey(tvId, season, episode);
          const now = Date.now();
          const lastPost = triggerIngestionLastPostAt.get(key) ?? 0;
          const skipDuplicatePost = now - lastPost < TRIGGER_INGESTION_DEDUP_MS;

          if (!skipDuplicatePost) {
            triggerIngestionLastPostAt.set(key, now);
            const triggerRes = await fetch("/api/public/trigger-ingestion", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                tmdb_id: parseInt(tvId, 10),
                title: meta.title,
                year,
                watch_flow_id: watchFlowId,
                media_type: "tv",
                season_number: season,
                episode_number: episode,
              }),
            });

            if (!triggerRes.ok) {
              triggerIngestionLastPostAt.delete(key);
              const err = (await triggerRes.json().catch(() => ({}))) as {
                error?: string;
              };
              setMessage(err.error ?? "Could not start ingestion.");
              setLoading(false);
              return;
            }
          }

          setMessage("Setting up stream…");
          scheduleNextPoll();
        } else if (checkData.exists && checkData.video) {
          triggerIngestionLastPostAt.delete(episodeKey(tvId, season, episode));
          const vid = checkData.video;
          setStatus(vid);

          const url = getFinalPlaybackUrl(vid);
          const completed = vid.status === "completed" && !!url;

          if (completed) {
            if (canPlayInBrowser(vid)) {
              setLoading(false);
              setMessage("Ready to play");
            } else {
              const videoId = vid.id;
              if (
                videoId &&
                !hlsFallbackAttemptedByVideoIdRef.current.has(videoId)
              ) {
                hlsFallbackAttemptedByVideoIdRef.current.add(videoId);
                setMessage("Optimizing stream for browser playback…");
                const fallbackRes = await fetch("/api/public/force-hls", {
                  method: "POST",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({ video_id: videoId }),
                });
                if (fallbackRes.ok) {
                  scheduleNextPoll();
                  return;
                }
              }
              setLoading(false);
              setMessage(
                "File is ready but needs an external player for this format.",
              );
            }
          } else if (vid.status === "failed") {
            setLoading(false);
            setMessage(vid.error_message ?? "Ingestion failed.");
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
        }
      }
    }

    setLoading(true);
    setMessage("Checking availability…");
    pollStartedAtRef.current = Date.now();
    void checkStatus();

    return () => {
      isActive = false;
      if (pollTimeout) clearTimeout(pollTimeout);
    };
  }, [tvId, season, episode, metaKey, meta.title, year, watchFlowId, enabled]);

  const finalPlaybackUrl = getFinalPlaybackUrl(status);
  const isProxyType = isProxyOrHlsSource(status);
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
    streamReady,
    canPlay,
  };
}
