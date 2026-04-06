/** JSON shape stored in `videos.playback_source` for Real-Debrid-backed playback. */
export type PlaybackSourceType = "direct" | "proxy";

export type PlaybackSource = {
  type: PlaybackSourceType;
  url: string;
  codec: string;
  container: string;
  mime_type: string;
  is_streamable: boolean;
  source_type: "real_debrid";
};

export function isContainerBrowserSafe(container: string): boolean {
  const c = container.toLowerCase();
  return c === "mp4" || c === "webm";
}
