"use client";

import React, { useEffect, useState, useRef } from "react";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Hls from "hls.js";
import { ExternalPlayerDialog } from "@/components/public/ExternalPlayerDialog";
import { getFinalPlaybackUrl, isProxyOrHlsSource } from "@/lib/watch-playback";
import { publicBackendApiUrl } from "@/lib/backend-public-url";

export default function WatchClient({
  tmdbId,
  movieDetails,
}: {
  tmdbId: string;
  movieDetails: any;
}) {
  const [status, setStatus] = useState<any>(null); // video status in our db
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("Checking availability...");
  const videoRef = useRef<HTMLVideoElement>(null);
  const pollStartedAtRef = useRef<number>(Date.now());

  useEffect(() => {
    let pollTimeout: NodeJS.Timeout | null = null;
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
        const checkRes = await fetch(
          publicBackendApiUrl(`/api/movie-status?tmdb_id=${tmdbId}`),
        );
        if (!checkRes.ok) throw new Error("Failed to check status");
        const checkData = await checkRes.json();

        if (!checkData.exists) {
          // Cache Miss: Trigger Ingestion
          setMessage("Movie not prepared. Triggering secure ingestion...");
          const triggerRes = await fetch(
            publicBackendApiUrl("/api/trigger-ingestion"),
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                tmdb_id: parseInt(tmdbId, 10),
                title: movieDetails.title,
                year: movieDetails.release_date
                  ? movieDetails.release_date.substring(0, 4)
                  : "",
              }),
            },
          );

          if (!triggerRes.ok) {
            const err = await triggerRes.json();
            setMessage(`Failed to ingest: ${err.error}`);
            return; // Stop polling
          }

          // Ingestion started, begin polling
          setMessage("Setting up stream... (0%)");
          scheduleNextPoll();
        } else if (checkData.exists && checkData.video) {
          // Record exists
          const vid = checkData.video;
          setStatus(vid);

          if (vid.status === "completed" && getFinalPlaybackUrl(vid)) {
            setLoading(false); // Stop polling and show player
          } else if (vid.status === "failed") {
            setMessage(
              `Ingestion failed: ${vid.error_message || "Unknown error"}`,
            );
          } else {
            // Still processing
            setMessage(
              `Processing: ${vid.status.replace(/_/g, " ")}... (${vid.progress || 0}%)`,
            );
            scheduleNextPoll();
          }
        }
      } catch (error) {
        console.error("Error during watch intercept:", error);
        setMessage("An error occurred during status check.");
      }
    }

    // Run instantly
    pollStartedAtRef.current = Date.now();
    void checkStatus();

    return () => {
      isActive = false;
      if (pollTimeout) clearTimeout(pollTimeout);
    };
  }, [tmdbId, movieDetails]);

  const finalPlaybackUrl = getFinalPlaybackUrl(status);
  const isProxyType = isProxyOrHlsSource(status);

  useEffect(() => {
    if (!loading && finalPlaybackUrl && isProxyType && videoRef.current) {
      const video = videoRef.current;
      if (Hls.isSupported()) {
        const hls = new Hls({
          debug: false,
          enableWorker: true,
          lowLatencyMode: true,
        });
        hls.loadSource(finalPlaybackUrl);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch((e) => console.log("Auto-play prevented", e));
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.error("HLS Network Error, trying to recover...", data);
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.error("HLS Media Error, trying to recover...", data);
                hls.recoverMediaError();
                break;
              default:
                console.error("Fatal HLS Error, cannot recover.", data);
                hls.destroy();
                break;
            }
          }
        });

        return () => {
          hls.destroy();
        };
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        // Native Safari support
        video.src = finalPlaybackUrl;
        video.addEventListener("loadedmetadata", () => {
          video.play().catch((e) => console.log("Auto-play prevented", e));
        });
      }
    }
  }, [loading, finalPlaybackUrl, isProxyType]);

  if (!loading && finalPlaybackUrl) {
    return (
      <div className="space-y-4 w-full">
        <div className="flex flex-wrap items-center gap-2">
          {status.quality && status.quality !== "unknown" && (
            <Badge
              variant="outline"
              className="text-xs uppercase border-primary/20 bg-primary/5"
            >
              {status.quality}
            </Badge>
          )}
          {status.codec && status.codec !== "unknown" && (
            <Badge
              variant="outline"
              className="text-xs uppercase text-muted-foreground"
            >
              {status.codec}
            </Badge>
          )}
          {status.source && status.source !== "unknown" && (
            <Badge
              variant="outline"
              className="text-xs uppercase text-muted-foreground"
            >
              {status.source}
            </Badge>
          )}
        </div>
        <div className="w-full aspect-video bg-black rounded-lg overflow-hidden shadow-2xl relative flex items-center justify-center">
          {status?.playback_source?.is_streamable === false && !isProxyType ? (
            <div className="text-center p-8 space-y-4">
              <p className="text-muted-foreground">
                This file container ({status.playback_source.container}) cannot
                be played directly in the browser yet.
              </p>
              <p className="text-xs text-muted-foreground/50">
                This format is not reliably playable in the browser. Use an
                external player (VLC, IINA) or download and play locally.
              </p>
              <div className="flex flex-col items-center gap-3 pt-4">
                <div className="flex gap-3">
                  <ExternalPlayerDialog
                    playerName="VLC"
                    url={status?.playback_source?.url || status?.stream_url}
                    filename={movieDetails.title}
                  >
                    <button className="inline-block px-5 py-2.5 bg-[#FF8800] text-white rounded-md text-sm font-semibold hover:bg-[#E67A00] transition-colors shadow-lg active:scale-[0.98]">
                      ▶ Open in VLC
                    </button>
                  </ExternalPlayerDialog>

                  <ExternalPlayerDialog
                    playerName="IINA"
                    url={status?.playback_source?.url || status?.stream_url}
                    filename={movieDetails.title}
                  >
                    <button className="inline-block px-5 py-2.5 bg-zinc-800 text-white rounded-md text-sm font-semibold hover:bg-zinc-700 transition-colors shadow-lg active:scale-[0.98]">
                      ▶ Open in IINA (Mac)
                    </button>
                  </ExternalPlayerDialog>
                </div>
                <a
                  href={status?.playback_source?.url || status?.stream_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block mt-2 px-4 py-2 border-2 border-primary/20 bg-background text-foreground rounded-md text-xs font-medium hover:bg-primary/5 transition-colors"
                >
                  Download Raw File
                </a>
              </div>
            </div>
          ) : (
            <video
              ref={videoRef}
              controls
              autoPlay
              className="w-full h-full object-contain"
              src={!isProxyType ? finalPlaybackUrl : undefined}
              poster={movieDetails?.backdrop_path || movieDetails?.poster_path}
              crossOrigin="anonymous"
            >
              {/* Future-proof track integration for captions */}
              {status?.playback_source?.captions?.map(
                (cap: any, idx: number) => (
                  <track
                    key={idx}
                    kind="subtitles"
                    src={cap.url}
                    srcLang={cap.lang}
                    label={cap.label}
                    default={cap.default}
                  />
                ),
              )}
              Your browser does not support HTML5 video playback.
            </video>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full aspect-video bg-muted rounded-lg flex flex-col items-center justify-center p-8 text-center space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold">Preparing your stream</h2>
        <p className="text-muted-foreground">{message}</p>
      </div>
      <div className="w-full max-w-md">
        <Progress value={status?.progress || 0} className="w-full" />
      </div>
    </div>
  );
}
