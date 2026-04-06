import pino from "pino";
import pretty from "pino-pretty";

/** Never log axios `config.headers` (Bearer tokens). Applies when `err` is passed to the logger. */
function safeErrSerializer(err: unknown): Record<string, unknown> {
  if (!err || typeof err !== "object") {
    return { type: typeof err, detail: String(err) };
  }
  const e = err as Error & {
    code?: string;
    name?: string;
    config?: {
      method?: string;
      url?: string;
      baseURL?: string;
      headers?: Record<string, string | undefined>;
    };
    response?: { status?: number; statusText?: string; data?: unknown };
  };
  const cfg = e.config;
  const auth = cfg?.headers?.Authorization ?? cfg?.headers?.authorization ?? "";
  if (cfg && auth) {
    const data = e.response?.data;
    let rdBody: unknown = data;
    if (typeof rdBody === "string" && rdBody.length > 300) {
      rdBody = `${rdBody.slice(0, 300)}…`;
    }
    return {
      type: e.name ?? err.constructor?.name ?? "Error",
      message: e.message,
      code: e.code,
      axios: {
        status: e.response?.status,
        statusText: e.response?.statusText,
        method: cfg.method,
        url: cfg.url,
        baseURL: cfg.baseURL,
        rd_body: rdBody,
      },
    };
  }
  if (err instanceof Error) {
    return {
      type: err.name,
      message: err.message,
      stack: err.stack,
      code: (err as NodeJS.ErrnoException).code,
    };
  }
  return { type: "object", detail: "[non-Error]" };
}

const RESET = "\x1b[0m";

/** Per-service emoji + ANSI (bold) so scans are fast in the terminal */
const LOG_SVC = {
  queue: { emoji: "🧵", label: "Queue worker", ansi: "\x1b[33;1m" },
  watch: { emoji: "📺", label: "Watch API", ansi: "\x1b[36;1m" },
  rd: { emoji: "💿", label: "Real-Debrid", ansi: "\x1b[35;1m" },
  supabase: { emoji: "🗄️", label: "Supabase", ansi: "\x1b[32;1m" },
  redis: { emoji: "📮", label: "Redis", ansi: "\x1b[95;1m" },
  http: { emoji: "🌍", label: "HTTP", ansi: "\x1b[34;1m" },
  ingest: { emoji: "📥", label: "Ingest API", ansi: "\x1b[93;1m" },
  // Use a dark color so it's readable on light terminals.
  backend: { emoji: "⚙️", label: "Backend", ansi: "\x1b[30;1m" },
} as const;

export type LogSvc = keyof typeof LOG_SVC;

function resolveSvc(log: Record<string, unknown>, message: string): LogSvc {
  const raw = log.svc;
  if (typeof raw === "string" && raw in LOG_SVC) {
    return raw as LogSvc;
  }
  const msg = message;
  if (msg.includes("rd http") || msg.includes("[Real-Debrid]")) return "rd";
  if (msg.includes("[Supabase]")) return "supabase";
  if (msg.includes("[Redis]")) return "redis";
  if (
    msg.includes("Queue worker:") ||
    msg.includes("watch: worker") ||
    msg.includes("Ingestion step") ||
    msg.includes("Step complete") ||
    msg.includes("Step slower") ||
    msg.includes("Worker picked up job") ||
    msg.includes("Submitting magnet URI") ||
    msg.includes("Real-Debrid cloud download progress") ||
    msg.includes("Saved playback:") ||
    msg.includes("Ingestion job finished") ||
    msg.includes("BullMQ reported job") ||
    msg.includes("BullMQ job ")
  ) {
    return "queue";
  }
  if (
    msg.includes("watch: poll") ||
    msg.includes("watch: stream") ||
    msg.includes("watch: trigger")
  ) {
    return "watch";
  }
  if (msg.includes("http |")) return "http";
  if (
    msg.includes("[Ingest]") ||
    msg.includes("ingest route") ||
    msg.includes("Reusing existing TMDB")
  ) {
    return "ingest";
  }
  return "backend";
}

function serviceBadge(svc: LogSvc): string {
  const s = LOG_SVC[svc];
  return `${s.ansi}${s.emoji} ${s.label}${RESET}`;
}

/** Same hue as the badge — colors the log sentence; context/metrics stay default. */
function serviceColoredMessage(svc: LogSvc, message: string): string {
  const s = LOG_SVC[svc];
  return `${s.ansi}${message}${RESET}`;
}

function buildContextParts(log: Record<string, any>) {
  const context: string[] = [];
  const requestMethod = log.method ?? log.req?.method;
  const requestPath = log.path ?? log.req?.url;
  const statusCode =
    typeof log.status !== "undefined" ? log.status : log.res?.statusCode;

  if (log.reqId) context.push(`req=${log.reqId}`);
  if (log.watch_flow_id) context.push(`flow=${log.watch_flow_id}`);
  if (typeof log.tmdb_id !== "undefined") context.push(`tmdb=${log.tmdb_id}`);
  if (typeof log.season_number === "number")
    context.push(`S${log.season_number}`);
  if (typeof log.episode_number === "number")
    context.push(`E${log.episode_number}`);
  if (log.jobId) context.push(`job=${log.jobId}`);
  if (log.videoId && log.videoId !== log.jobId)
    context.push(`video=${log.videoId}`);
  if (typeof log.existing_video_id === "string")
    context.push(`existing=${log.existing_video_id}`);
  if (typeof log.imdb_id === "string") context.push(`imdb=${log.imdb_id}`);
  if (typeof log.upstream_host === "string")
    context.push(`upstream=${log.upstream_host}`);
  if (typeof log.filename === "string" && log.filename.length > 0) {
    const f = log.filename;
    context.push(`file=${f.length > 72 ? `${f.slice(0, 69)}…` : f}`);
  }
  if (log.step) context.push(`step=${log.step}`);
  if (requestMethod && requestPath) {
    context.push(`${String(requestMethod).toUpperCase()} ${requestPath}`);
  } else if (requestPath) {
    context.push(`path=${requestPath}`);
  }
  if (typeof statusCode !== "undefined") context.push(`status=${statusCode}`);
  if (log.rd_torrent_id) context.push(`rd=${log.rd_torrent_id}`);
  if (typeof log.info_hash === "string" && log.info_hash.length >= 8)
    context.push(
      `hash=${log.info_hash.slice(0, 12)}${log.info_hash.length > 12 ? "…" : ""}`,
    );
  if (log.source_type) context.push(`source=${log.source_type}`);

  return context;
}

function buildMetricParts(log: Record<string, any>) {
  const metrics: string[] = [];
  const responseTime =
    typeof log.responseTime === "number"
      ? log.responseTime
      : typeof log.response_time_ms === "number"
        ? log.response_time_ms
        : undefined;

  if (typeof log.duration_ms === "number")
    metrics.push(`duration=${log.duration_ms}ms`);
  if (typeof log.total_elapsed_ms === "number")
    metrics.push(`elapsed=${log.total_elapsed_ms}ms`);
  if (typeof log.total_duration_ms === "number")
    metrics.push(`total=${log.total_duration_ms}ms`);
  if (typeof log.queue_duration_ms === "number")
    metrics.push(`queue=${log.queue_duration_ms}ms`);
  if (typeof log.queue_ms === "number")
    metrics.push(`enqueue=${log.queue_ms}ms`);
  if (typeof log.duplicate_lookup_ms === "number")
    metrics.push(`dup_lookup=${log.duplicate_lookup_ms}ms`);
  if (typeof responseTime === "number")
    metrics.push(`response=${responseTime.toFixed(1)}ms`);
  if (typeof log.polls === "number") metrics.push(`polls=${log.polls}`);
  if (typeof log.exists === "boolean")
    metrics.push(`exists=${log.exists ? "yes" : "no"}`);
  if (log.video_status) metrics.push(`video_status=${log.video_status}`);
  if (typeof log.imdb_lookup_ms === "number")
    metrics.push(`imdb_lookup=${log.imdb_lookup_ms}ms`);
  if (typeof log.torrentio_ms === "number")
    metrics.push(`torrentio=${log.torrentio_ms}ms`);
  if (typeof log.stream_count === "number")
    metrics.push(`streams=${log.stream_count}`);
  if (typeof log.valid_1080p_plus === "number")
    metrics.push(`valid_1080p+=${log.valid_1080p_plus}`);
  if (typeof log.ti_eligible === "number")
    metrics.push(`ti_elig=${log.ti_eligible}`);
  if (typeof log.ti_skipped_total === "number")
    metrics.push(
      `ti_skip=${log.ti_skipped_total}(m:${log.ti_sk_magnet ?? 0}+r:${log.ti_sk_res ?? 0}+ts:${log.ti_sk_ts ?? 0})`,
    );
  if (typeof log.ti_pick_hash === "string" && log.ti_pick_hash.length > 0)
    metrics.push(`ti_pick=${log.ti_pick_hash}`);
  if (typeof log.ti_pick_score === "number")
    metrics.push(`ti_score=${log.ti_pick_score}`);
  if (
    typeof log.torrentio_pick_summary === "string" &&
    log.torrentio_pick_summary.length > 0
  ) {
    const s = log.torrentio_pick_summary;
    metrics.push(s.length > 380 ? `${s.slice(0, 377)}…` : s);
  }
  if (typeof log.best_score === "number")
    metrics.push(`best_score=${log.best_score}`);
  if (typeof log.best_seeders === "number")
    metrics.push(`seeders=${log.best_seeders}`);
  if (typeof log.rd_progress === "number")
    metrics.push(`rd_progress=${log.rd_progress}%`);
  if (typeof log.link_count === "number")
    metrics.push(`links=${log.link_count}`);
  if (typeof log.filesize === "number") metrics.push(`size=${log.filesize}`);
  if (log.rd_status) metrics.push(`rd_status=${log.rd_status}`);
  if (typeof log.streamable !== "undefined")
    metrics.push(`streamable=${Boolean(log.streamable)}`);
  if (log.playback_source_type)
    metrics.push(`playback=${log.playback_source_type}`);
  if (log.playback_type) metrics.push(`playback_type=${log.playback_type}`);
  if (typeof log.range === "string" && log.range.length > 0)
    metrics.push(`range=${log.range.slice(0, 40)}`);

  return metrics;
}

const prettyStream = pretty({
  // Disable pino-pretty's own level coloring to avoid "white on white" terminals.
  // We still apply ANSI colors ourselves in `serviceBadge` / `serviceColoredMessage`.
  colorize: false,
  translateTime: "SYS:standard",
  singleLine: true,
  levelFirst: true,
  errorLikeObjectKeys: ["err", "error"],
  ignore: [
    "pid",
    "hostname",
    "service",
    "svc",
    "reqId",
    "req",
    "res",
    "watch_flow_id",
    "tmdb_id",
    "season_number",
    "episode_number",
    "responseTime",
    "response_time_ms",
    "jobId",
    "videoId",
    "existing_video_id",
    "imdb_id",
    "upstream_host",
    "step",
    "method",
    "path",
    "status",
    "statusCode",
    "url",
    "rd_torrent_id",
    "source_type",
    "duration_ms",
    "total_elapsed_ms",
    "total_duration_ms",
    "total_ms",
    "queue_duration_ms",
    "queue_ms",
    "duplicate_lookup_ms",
    "polls",
    "rd_progress",
    "link_count",
    "filesize",
    "rd_status",
    "streamable",
    "filename",
    "playback_source_type",
    "playback_type",
    "exists",
    "video_status",
    "imdb_lookup_ms",
    "torrentio_ms",
    "stream_count",
    "valid_1080p_plus",
    "best_quality",
    "best_seeders",
    "best_score",
    "best_info_hash",
    "torrentio_stream_total",
    "torrentio_skipped_total",
    "torrentio_eligible",
    "torrentio_pick_summary",
    "ti_skipped_total",
    "ti_eligible",
    "ti_sk_magnet",
    "ti_sk_res",
    "ti_sk_ts",
    "ti_pick_hash",
    "ti_pick_score",
    "info_hash",
    "has_expected_key",
    "has_provided_key",
    "range",
    "source",
    "title",
    "display_title",
    "rd_progress_pct",
    "download_poll",
    "rd_progress_pct",
    "selected_count",
    "selection_mode",
    "file_ids",
    "reason",
  ].join(","),
  messageFormat: (log: Record<string, any>, messageKey: string) => {
    const message = String(log[messageKey] ?? "");
    const svc = resolveSvc(log, message);
    const badge = serviceBadge(svc);
    const messageTinted = serviceColoredMessage(svc, message);
    const context = buildContextParts(log);
    const metrics = buildMetricParts(log);

    return [badge, messageTinted, ...context, ...metrics]
      .filter(Boolean)
      .join(" │ ");
  },
});

export const logger = pino(
  {
    level: process.env.LOG_LEVEL || "info",
    base: {
      service: "backend",
    },
    serializers: {
      err: safeErrSerializer,
    },
  },
  prettyStream,
);
