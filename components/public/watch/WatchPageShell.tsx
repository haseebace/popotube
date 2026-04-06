"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import { toast } from "sonner";
import { ExternalPlayerDialog } from "@/components/public/ExternalPlayerDialog";
import { Progress } from "@/components/ui/progress";
import WatchMovieExperience from "@/components/public/watch/WatchMovieExperience";
import WatchNetflixPlayer from "@/components/public/watch/WatchNetflixPlayer";
import { useWatchIngestion } from "@/hooks/useWatchIngestion";
import {
  getPublicBackendUrl,
  publicBackendApiUrl,
} from "@/lib/backend-public-url";
import { noirCtaSecondaryMotion } from "@/lib/noir-cta-styles";
import { cn } from "@/lib/utils";
import { getFinalPlaybackUrl, getVideoJsMimeType } from "@/lib/watch-playback";
import type { VideoRowLike } from "@/lib/watch-playback";
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
    const streamPrefix = `${getPublicBackendUrl()}/api/stream/`;
    if (!raw.startsWith(streamPrefix)) return raw;
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
      const code = detail?.code ?? null;
      if (code === 3) {
        toast.message("This browser could not decode the stream", {
          description:
            "Try Safari or iOS, or open the file in an external player (VLC, IINA).",
        });
      }

      if (fallbackAttemptedRef.current) return;
      fallbackAttemptedRef.current = true;
      try {
        toast.message("Playback issue detected", {
          description: "Refreshing stream status…",
        });
        const qs = new URLSearchParams({
          tmdb_id: tmdbId,
          watch_flow_id: ingest.watchFlowId,
        });
        const res = await fetch(
          publicBackendApiUrl(`/api/movie-status?${qs.toString()}`),
        );
        if (!res.ok) throw new Error("Could not refresh playback");
        const payload = (await res.json()) as { video?: VideoRowLike };
        const newUrl = getFinalPlaybackUrl(payload.video ?? null);
        if (newUrl) {
          setOverridePlaybackUrl(newUrl);
          toast.message("Playback source updated", {
            description: "Retrying with the latest stream URL.",
          });
        }
      } catch {
        toast.message("Playback retry failed", {
          description: "Please try again in a few moments.",
        });
      }
    },
    [tmdbId, ingest.watchFlowId],
  );

  /** Direct HTTP(S) URL for VLC/IINA (normalized Real-Debrid from movie-status). */
  const externalDirectUrl = useMemo(() => {
    if (ingest.status?.status !== "completed") return null;
    const u = ingest.status.playback_source?.url;
    return typeof u === "string" && /^https?:\/\//i.test(u) ? u : null;
  }, [ingest.status]);

  const externalPlayerActions = useMemo(() => {
    if (!externalDirectUrl) return null;
    return (
      <>
        <ExternalPlayerDialog
          playerName="VLC"
          url={externalDirectUrl}
          filename={payload.title}
        >
          <button
            type="button"
            className={cn(
              noirCtaSecondaryMotion,
              "cursor-pointer text-xs uppercase tracking-wide md:text-sm",
            )}
          >
            Open in VLC
          </button>
        </ExternalPlayerDialog>
        <ExternalPlayerDialog
          playerName="IINA"
          url={externalDirectUrl}
          filename={payload.title}
        >
          <button
            type="button"
            className={cn(
              noirCtaSecondaryMotion,
              "cursor-pointer text-xs uppercase tracking-wide md:text-sm",
            )}
          >
            Open in IINA
          </button>
        </ExternalPlayerDialog>
      </>
    );
  }, [externalDirectUrl, payload.title]);

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
        externalPlayerActions={externalPlayerActions ?? undefined}
      />
      {playerSrc && ingest.canPlay ? (
        <WatchNetflixPlayer
          open={playerOpen}
          onClose={() => setPlayerOpen(false)}
          src={playerSrc}
          mimeType={getVideoJsMimeType(ingest.status, playerSrc)}
          poster={posterUrl}
          title={payload.title}
          onPlaybackError={handlePlaybackError}
        />
      ) : null}
    </>
  );
}
