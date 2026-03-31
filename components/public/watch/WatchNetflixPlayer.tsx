"use client";

import { useEffect, useRef, useCallback } from "react";
import videojs from "video.js";
import { X } from "lucide-react";
import { motion } from "framer-motion";
import { springCta } from "@/lib/motion";
import { isHlsMimeOrUrl, preferNativeHlsPlayback } from "@/lib/watch-playback";

type VideoJsPlayer = ReturnType<typeof videojs>;

export type PlaybackErrorDetail = {
  /** HTMLMediaError / Video.js: 1 aborted, 2 network, 3 decode, 4 src not supported */
  code: number | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  src: string;
  mimeType: string;
  poster?: string | null;
  title: string;
  onPlaybackError?: (detail?: PlaybackErrorDetail) => void;
};

/**
 * Full-viewport Video.js player with controls; requests browser fullscreen when opened (Netflix-style).
 */
export default function WatchNetflixPlayer({
  open,
  onClose,
  src,
  mimeType,
  poster,
  title,
  onPlaybackError,
}: Props) {
  const keepControlsVisible = process.env.NODE_ENV !== "production";
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<VideoJsPlayer | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const handleClose = useCallback(() => {
    const player = playerRef.current;
    try {
      player?.pause();
    } catch {
      /* ignore */
    }

    // exitFullscreen can reject asynchronously when the tab/document is not active.
    try {
      if (
        document.fullscreenElement &&
        typeof player?.exitFullscreen === "function"
      ) {
        void Promise.resolve(player.exitFullscreen()).catch(() => {});
      }
    } catch {
      /* ignore */
    }
    onCloseRef.current();
  }, []);

  useEffect(() => {
    if (!open) {
      document.body.style.overflow = "";
      return;
    }
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open || !src) return;
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    playerRef.current = null;

    void (async () => {
      await import("video.js/dist/video-js.css");
      if (cancelled || !container) return;

      container.innerHTML = "";
      const el = document.createElement("video");
      el.className =
        "video-js vjs-big-play-centered vjs-16-9 watch-netflix-player";
      el.setAttribute("playsinline", "true");
      el.setAttribute("crossorigin", "anonymous");
      container.appendChild(el);

      const isHls = isHlsMimeOrUrl(mimeType, src);
      // For direct MP4/WebM: prefer native playback (avoid VHS/MSE).
      // For HLS on Safari/iOS: prefer native HLS. Other browsers can use VHS+MSE.
      const useNativeHls = isHls && preferNativeHlsPlayback();

      const player = videojs(el, {
        controls: true,
        fluid: true,
        responsive: true,
        fill: true,
        preload: "auto",
        // For debugging (dev), keep the control bar visible.
        inactivityTimeout: keepControlsVisible ? 0 : 1800,
        controlBar: {
          // Keep the control bar intentionally minimal to avoid multi-row clutter.
          // (Progress stays as its own row via CSS in `app/globals.css`.)
          children: [
            "playToggle",
            "volumePanel",
            "currentTimeDisplay",
            "timeDivider",
            "durationDisplay",
            "progressControl",
            "fullscreenToggle",
          ],
          // Keep volume UI from resizing the control row; slider is shown as overlay via CSS.
          volumePanel: { inline: false },
          pictureInPictureToggle: false,
          remainingTimeDisplay: false,
        },
        userActions: {
          hotkeys: true,
        },
        sources: [{ src, type: mimeType }],
        poster: poster || undefined,
        html5: {
          vhs: isHls
            ? { overrideNative: !useNativeHls }
            : { overrideNative: false },
          nativeAudioTracks: false,
          nativeVideoTracks: false,
        },
      });

      playerRef.current = player;

      player.ready(() => {
        if (cancelled) return;
        void Promise.resolve(player.play()).catch(() => {});
        try {
          if (typeof player.requestFullscreen === "function") {
            void Promise.resolve(player.requestFullscreen()).catch(() => {
              const v = el as HTMLVideoElement;
              void v.requestFullscreen?.().catch(() => {});
            });
          } else {
            void (el as HTMLVideoElement).requestFullscreen?.().catch(() => {});
          }
        } catch {
          /* ignore */
        }
      });

      player.on("error", () => {
        const mediaErr = player.error();
        if (keepControlsVisible && mediaErr) {
          console.warn(
            "[videojs] playback error",
            mediaErr.code,
            mediaErr.message,
          );
        }
        onPlaybackError?.({ code: mediaErr?.code ?? null });
      });
    })();

    return () => {
      cancelled = true;
      const p = playerRef.current;
      playerRef.current = null;
      if (p) {
        try {
          p.dispose();
        } catch {
          /* ignore */
        }
      }
      container.innerHTML = "";
    };
  }, [open, src, mimeType, poster, onPlaybackError]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[240] flex flex-col bg-black"
      role="dialog"
      aria-label={`Now playing: ${title}`}
    >
      <div className="relative flex min-h-0 flex-1 flex-col pt-14">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-[255] h-28 bg-gradient-to-b from-black/85 to-transparent"
          aria-hidden
        />
        <div className="absolute inset-x-0 top-0 z-[260] flex h-14 items-center px-6">
          <motion.button
            type="button"
            onClick={handleClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-colors hover:bg-white/20"
            aria-label="Close player"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={springCta}
          >
            <X className="h-5 w-5" strokeWidth={2} />
          </motion.button>
          <div className="pointer-events-none ml-4 min-w-0 flex-1 truncate text-sm font-semibold uppercase tracking-[0.14em] text-white/90">
            {title}
          </div>
        </div>
        <div
          ref={containerRef}
          className={`watch-netflix-vjs mx-auto w-full max-w-[100vw] flex-1 px-4 pb-6${keepControlsVisible ? " watch-netflix-vjs--debug" : ""}`}
        />
      </div>
    </div>
  );
}
