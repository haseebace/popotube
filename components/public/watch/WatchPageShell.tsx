"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import WatchMovieExperience from "@/components/public/watch/WatchMovieExperience";
import WatchNetflixPlayer from "@/components/public/watch/WatchNetflixPlayer";
import { useWatchIngestion } from "@/hooks/useWatchIngestion";
import { guessVideoJsType } from "@/lib/watch-playback";
import type { WatchMoviePayload } from "@/components/public/watch/types";

export type WatchPageShellProps = {
  tmdbId: string;
  ingestMeta: { title: string; release_date?: string | null };
  payload: WatchMoviePayload;
  teaser: string;
  certification: string | null;
  year: number | null;
  genreLine: string;
  directorName: string | null;
};

/**
 * Starts ingestion when the user lands on /watch/[id] (e.g. from a poster), then
 * opens a Video.js fullscreen player when they press Play.
 */
export default function WatchPageShell({
  tmdbId,
  ingestMeta,
  payload,
  teaser,
  certification,
  year,
  genreLine,
  directorName,
}: WatchPageShellProps) {
  const ingest = useWatchIngestion(tmdbId, ingestMeta);
  const [playerOpen, setPlayerOpen] = useState(false);
  const [overridePlaybackUrl, setOverridePlaybackUrl] = useState<string | null>(
    null,
  );
  const fallbackAttemptedRef = useRef(false);

  const posterUrl = useMemo(() => {
    const b = payload.backdrop_path;
    const p = payload.poster_path;
    if (b) return `https://image.tmdb.org/t/p/w1280${b}`;
    if (p) return `https://image.tmdb.org/t/p/w780${p}`;
    return null;
  }, [payload.backdrop_path, payload.poster_path]);

  const playLabel =
    ingest.status?.status === "failed"
      ? "Unavailable"
      : ingest.canPlay
        ? "Play"
        : "Preparing…";

  const playerSrc = useMemo(() => {
    const raw = overridePlaybackUrl || ingest.finalPlaybackUrl || null;
    if (!raw) return null;
    if (!raw.startsWith("/api/proxy/stream/")) return raw;
    const sep = raw.includes("?") ? "&" : "?";
    return `${raw}${sep}watch_flow_id=${encodeURIComponent(ingest.watchFlowId)}`;
  }, [ingest.finalPlaybackUrl, ingest.watchFlowId, overridePlaybackUrl]);

  const handlePlay = useCallback(() => {
    if (!ingest.canPlay || !ingest.finalPlaybackUrl) {
      toast.message("Almost there", { description: ingest.message });
      return;
    }
    setPlayerOpen(true);
  }, [ingest.canPlay, ingest.finalPlaybackUrl, ingest.message]);

  const handlePlaybackError = useCallback(
    async (detail?: { code: number | null }) => {
      const sourceType = ingest.status?.playback_source?.type;
      const code = detail?.code ?? null;

      // Mediaflow transcode often passes through 5.1 AAC; Chrome MSE frequently throws
      // MEDIA_ERR_DECODE (3) on that mux. Native HLS (Safari) or stereo audio on the server fixes it.
      if (code === 3 && sourceType === "mediaflow_transcode_hls") {
        toast.message("This browser could not decode the stream", {
          description:
            "Surround (5.1) AAC in these HLS segments often fails in Chromium browsers. Try Safari or iOS, or configure Mediaflow to downmix audio to stereo AAC.",
        });
        return;
      }

      if (fallbackAttemptedRef.current) return;
      const videoId = ingest.status?.id;
      if (!videoId) return;
      fallbackAttemptedRef.current = true;
      try {
        toast.message("Playback issue detected", {
          description:
            sourceType === "mediaflow_transcode_hls"
              ? "Refreshing MediaFlow stream…"
              : "Switching to browser-safe stream…",
        });
        const res = await fetch("/api/public/force-hls", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ video_id: videoId }),
        });
        if (!res.ok) {
          throw new Error("Could not switch playback source");
        }
        const payload = (await res.json()) as {
          playback_source?: { url?: string };
        };
        const newUrl = payload.playback_source?.url;
        if (newUrl) {
          setOverridePlaybackUrl(newUrl);
          toast.message("Playback source updated", {
            description:
              sourceType === "mediaflow_transcode_hls"
                ? "Retrying with a fresh MediaFlow stream URL."
                : "Retrying with optimized stream.",
          });
        }
      } catch {
        toast.message("Playback retry failed", {
          description: "Please try again in a few moments.",
        });
      }
    },
    [ingest.status?.id, ingest.status?.playback_source?.type],
  );

  const heroFooter = useMemo(() => {
    if (ingest.status?.status === "failed") {
      return (
        <p className="text-sm font-medium text-red-400/90">{ingest.message}</p>
      );
    }
    if (ingest.canPlay) {
      if (!ingest.isTranscodeSource) return null;
      return (
        <p className="text-sm font-light leading-relaxed text-on-surface-variant">
          Optimizing stream for browser playback. First frame can take a few
          seconds.
        </p>
      );
    }
    return (
      <div className="space-y-3">
        <p className="text-sm font-light leading-relaxed text-on-surface-variant">
          {ingest.message}
        </p>
        <div className="w-full max-w-md">
          <Progress value={ingest.status?.progress ?? 0} />
        </div>
      </div>
    );
  }, [
    ingest.canPlay,
    ingest.message,
    ingest.isTranscodeSource,
    ingest.status?.progress,
    ingest.status?.status,
  ]);

  return (
    <>
      <WatchMovieExperience
        payload={payload}
        teaser={teaser}
        certification={certification}
        year={year}
        genreLine={genreLine}
        directorName={directorName}
        onPlayClick={handlePlay}
        playButtonLabel={playLabel}
        playButtonDisabled={ingest.status?.status === "failed"}
        heroFooter={heroFooter}
      />
      {playerSrc && ingest.canPlay ? (
        <WatchNetflixPlayer
          open={playerOpen}
          onClose={() => setPlayerOpen(false)}
          src={playerSrc}
          mimeType={guessVideoJsType(
            playerSrc,
            overridePlaybackUrl ? true : ingest.isProxyType,
          )}
          poster={posterUrl}
          title={payload.title}
          onPlaybackError={handlePlaybackError}
        />
      ) : null}
    </>
  );
}
