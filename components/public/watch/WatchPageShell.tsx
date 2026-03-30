"use client";

import { useState, useMemo, useCallback } from "react";
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

  const handlePlay = useCallback(() => {
    if (!ingest.canPlay || !ingest.finalPlaybackUrl) {
      toast.message("Almost there", { description: ingest.message });
      return;
    }
    setPlayerOpen(true);
  }, [ingest.canPlay, ingest.finalPlaybackUrl, ingest.message]);

  const heroFooter = useMemo(() => {
    if (ingest.status?.status === "failed") {
      return (
        <p className="text-sm font-medium text-red-400/90">{ingest.message}</p>
      );
    }
    if (ingest.canPlay) return null;
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
      {ingest.finalPlaybackUrl && ingest.canPlay ? (
        <WatchNetflixPlayer
          open={playerOpen}
          onClose={() => setPlayerOpen(false)}
          src={ingest.finalPlaybackUrl}
          mimeType={guessVideoJsType(
            ingest.finalPlaybackUrl,
            ingest.isProxyType,
          )}
          poster={posterUrl}
          title={payload.title}
        />
      ) : null}
    </>
  );
}
