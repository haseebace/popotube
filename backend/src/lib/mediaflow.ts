import axios from "axios";

export type PlaybackSourceType =
  | "direct"
  | "proxy"
  | "mediaflow"
  | "mediaflow_stream"
  | "mediaflow_transcode_hls";

export type PlaybackSource = {
  type: PlaybackSourceType;
  url: string;
  codec: string;
  container: string;
  mime_type: string;
  is_streamable: boolean;
  source_type: "real_debrid" | "mediaflow";
};

/** Persisted JSON in `videos.mediaflow_playback` — HLS transcode only (not RD URL). */
export type MediaflowPlaybackColumn = {
  type: "mediaflow_transcode_hls";
  url: string;
  codec: string;
  container: string;
  mime_type: string;
  source_type: "mediaflow";
};

export type MediaflowProbeResult = {
  enabled: boolean;
  baseUrl: string | null;
  healthOk: boolean;
  healthStatus: string | null;
  publicIp: string | null;
  /** False when GET /_token_/... returns FastAPI 404 — usually MediaFlow container missing API_PASSWORD env */
  encryptedPathWorks: boolean | null;
  encryptedPathHint?: string;
  error?: string;
};

type GenerateUrlPayload = {
  mediaflow_proxy_url: string;
  endpoint: string;
  destination_url: string;
  query_params?: Record<string, unknown>;
  request_headers?: Record<string, string>;
  filename?: string;
  api_password?: string;
  base64_encode_destination?: boolean;
};

type GenerateUrlResponse = {
  encoded_url?: string;
};

const MEDIAFLOW_BASE_URL = process.env.MEDIAFLOW_BASE_URL?.trim() || "";
const MEDIAFLOW_API_PASSWORD = process.env.MEDIAFLOW_API_PASSWORD?.trim() || "";
const MEDIAFLOW_ENABLED = process.env.MEDIAFLOW_ENABLED === "true";
const MEDIAFLOW_ALLOWED_UPSTREAM_HOSTS = (
  process.env.MEDIAFLOW_ALLOWED_UPSTREAM_HOSTS || ""
)
  .split(",")
  .map((v) => v.trim().toLowerCase())
  .filter(Boolean);

function normalizeBaseUrl(input: string): string {
  return input.replace(/\/+$/, "");
}

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function sanitizeForLog(url: string): string {
  try {
    const u = new URL(url);
    u.search = "";
    return u.toString();
  } catch {
    return "[invalid-url]";
  }
}

function makeGeneratePayload(
  endpoint: string,
  destinationUrl: string,
  filename?: string,
): GenerateUrlPayload {
  const payload: GenerateUrlPayload = {
    mediaflow_proxy_url: normalizeBaseUrl(MEDIAFLOW_BASE_URL),
    endpoint,
    destination_url: destinationUrl,
    base64_encode_destination: true,
  };
  if (MEDIAFLOW_API_PASSWORD) payload.api_password = MEDIAFLOW_API_PASSWORD;
  if (filename) payload.filename = filename;
  return payload;
}

async function generateEncodedUrl(
  endpoint: string,
  destinationUrl: string,
  filename?: string,
): Promise<string> {
  const payload = makeGeneratePayload(endpoint, destinationUrl, filename);
  const res = await axios.post<GenerateUrlResponse>(
    `${normalizeBaseUrl(MEDIAFLOW_BASE_URL)}/generate_encrypted_or_encoded_url`,
    payload,
    { timeout: 12000 },
  );
  const encodedUrl = res.data?.encoded_url;
  if (!encodedUrl || typeof encodedUrl !== "string") {
    throw new Error("MediaFlow returned no encoded URL");
  }
  return encodedUrl;
}

export function isMediaflowEnabled(): boolean {
  return MEDIAFLOW_ENABLED && Boolean(MEDIAFLOW_BASE_URL);
}

export function isContainerBrowserSafe(container: string): boolean {
  const c = container.toLowerCase();
  return c === "mp4" || c === "webm";
}

export function assertAllowedMediaflowUpstream(url: string): void {
  if (!MEDIAFLOW_ALLOWED_UPSTREAM_HOSTS.length) return;
  const parsed = new URL(url);
  const host = parsed.hostname.toLowerCase();
  const allowed = MEDIAFLOW_ALLOWED_UPSTREAM_HOSTS.some(
    (candidate) => host === candidate || host.endsWith(`.${candidate}`),
  );
  if (!allowed) {
    throw new Error(`Upstream host is not allowed: ${host}`);
  }
}

/**
 * HLS transcode manifest only — for containers that are not browser-safe (e.g. mkv).
 * Browser-safe files (mp4/webm) should use direct Real-Debrid + `/api/proxy/stream/:id` instead.
 */
export async function buildMediaflowTranscodeHls(params: {
  upstreamUrl: string;
  container: string;
  codec: string;
}): Promise<MediaflowPlaybackColumn> {
  const { upstreamUrl, container, codec } = params;
  if (!isValidHttpUrl(upstreamUrl)) {
    throw new Error("Invalid upstream URL for MediaFlow");
  }
  if (!isMediaflowEnabled()) {
    throw new Error("MediaFlow is disabled or not configured");
  }
  assertAllowedMediaflowUpstream(upstreamUrl);

  const url = await generateEncodedUrl(
    "/proxy/transcode/playlist.m3u8",
    upstreamUrl,
    undefined,
  );

  return {
    type: "mediaflow_transcode_hls",
    url,
    codec: codec || "Unknown",
    container,
    mime_type: "application/x-mpegURL",
    source_type: "mediaflow",
  };
}

export function playbackSourceToMediaflowColumn(
  p: PlaybackSource,
): MediaflowPlaybackColumn | null {
  if (p.type !== "mediaflow_transcode_hls") return null;
  return {
    type: "mediaflow_transcode_hls",
    url: p.url,
    codec: p.codec,
    container: p.container,
    mime_type: p.mime_type,
    source_type: "mediaflow",
  };
}

export async function buildMediaflowPlaybackSource(params: {
  upstreamUrl: string;
  container: string;
  codec: string;
  filename?: string;
}): Promise<PlaybackSource> {
  const { upstreamUrl, container, codec, filename } = params;
  if (!isValidHttpUrl(upstreamUrl)) {
    throw new Error("Invalid upstream URL for MediaFlow");
  }
  if (!isMediaflowEnabled()) {
    throw new Error("MediaFlow is disabled or not configured");
  }
  assertAllowedMediaflowUpstream(upstreamUrl);

  const isStreamable = isContainerBrowserSafe(container);
  const endpoint = isStreamable
    ? "/proxy/stream"
    : "/proxy/transcode/playlist.m3u8";
  const type: PlaybackSourceType = isStreamable
    ? "mediaflow_stream"
    : "mediaflow_transcode_hls";
  const mimeType = isStreamable
    ? `video/${container}`
    : "application/x-mpegURL";
  // For HLS transcode endpoints, passing `filename` can produce
  // `/playlist.m3u8/<filename>` paths that MediaFlow does not serve (404).
  // Keep filename only for direct stream proxy URLs.
  const url = await generateEncodedUrl(
    endpoint,
    upstreamUrl,
    isStreamable ? filename : undefined,
  );

  return {
    type,
    url,
    codec: codec || "Unknown",
    container,
    mime_type: mimeType,
    is_streamable: true,
    source_type: "mediaflow",
  };
}

/**
 * MediaFlow only strips /_token_/... in EncryptionMiddleware when the *server* has API_PASSWORD
 * set at startup. POST /generate_encrypted_or_encoded_url can still 200 using body api_password,
 * but token GETs then 404 with {"detail":"Not Found"} if the server env is missing.
 */
async function probeMediaflowEncryptedPath(baseUrl: string): Promise<{
  ok: boolean;
  hint?: string;
}> {
  if (!MEDIAFLOW_API_PASSWORD) {
    return {
      ok: false,
      hint: "MEDIAFLOW_API_PASSWORD is empty — cannot mint test token; set it to match MediaFlow API_PASSWORD.",
    };
  }

  try {
    const gen = await axios.post<{ encoded_url?: string }>(
      `${baseUrl}/generate_encrypted_or_encoded_url`,
      {
        mediaflow_proxy_url: baseUrl,
        endpoint: "/proxy/transcode/playlist.m3u8",
        destination_url: "https://example.com/",
        base64_encode_destination: true,
        api_password: MEDIAFLOW_API_PASSWORD,
      },
      { timeout: 12000 },
    );
    const encodedUrl = gen.data?.encoded_url;
    if (!encodedUrl || typeof encodedUrl !== "string") {
      return {
        ok: false,
        hint: "generate_encrypted_or_encoded_url returned no encoded_url",
      };
    }

    const res = await axios.get(encodedUrl, {
      timeout: 15000,
      maxRedirects: 5,
      validateStatus: () => true,
    });

    const ct = String(res.headers["content-type"] || "");
    const detail =
      res.data &&
      typeof res.data === "object" &&
      "detail" in res.data &&
      (res.data as { detail?: unknown }).detail;

    if (
      res.status === 404 &&
      ct.includes("application/json") &&
      detail === "Not Found"
    ) {
      return {
        ok: false,
        hint: "Token URL returned FastAPI 404. Set environment variable API_PASSWORD on the MediaFlow container (Coolify) to the same value as MEDIAFLOW_API_PASSWORD, then redeploy MediaFlow. Optional behind a reverse proxy: FORWARDED_ALLOW_IPS=*",
      };
    }

    return { ok: true };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false, hint: message };
  }
}

export async function probeMediaflow(): Promise<MediaflowProbeResult> {
  if (!isMediaflowEnabled()) {
    return {
      enabled: false,
      baseUrl: MEDIAFLOW_BASE_URL || null,
      healthOk: false,
      healthStatus: null,
      publicIp: null,
      encryptedPathWorks: null,
    };
  }

  const baseUrl = normalizeBaseUrl(MEDIAFLOW_BASE_URL);
  try {
    const [healthRes, ipRes] = await Promise.all([
      axios.get<{ status?: string }>(`${baseUrl}/health`, { timeout: 8000 }),
      axios.get<{ ip?: string }>(`${baseUrl}/proxy/ip`, {
        params: MEDIAFLOW_API_PASSWORD
          ? { api_password: MEDIAFLOW_API_PASSWORD }
          : undefined,
        timeout: 8000,
      }),
    ]);

    const healthOk = healthRes.status === 200;
    let encryptedPathWorks: boolean | null = null;
    let encryptedPathHint: string | undefined;

    if (healthOk) {
      const enc = await probeMediaflowEncryptedPath(baseUrl);
      encryptedPathWorks = enc.ok;
      if (!enc.ok && enc.hint) encryptedPathHint = enc.hint;
    }

    return {
      enabled: true,
      baseUrl,
      healthOk,
      healthStatus: healthRes.data?.status ?? null,
      publicIp: ipRes.data?.ip ?? null,
      encryptedPathWorks,
      encryptedPathHint,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return {
      enabled: true,
      baseUrl: sanitizeForLog(baseUrl),
      healthOk: false,
      healthStatus: null,
      publicIp: null,
      encryptedPathWorks: null,
      error: message,
    };
  }
}
