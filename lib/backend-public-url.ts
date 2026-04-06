/**
 * Browser-facing Fastify origin. Client components only see NEXT_PUBLIC_* env at runtime.
 * Server-side can fall back to BACKEND_URL (e.g. same host in Docker).
 */
export function getPublicBackendUrl(): string {
  const raw =
    (typeof process !== "undefined" &&
      (process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL)) ||
    "http://127.0.0.1:3001";
  return raw.replace(/\/$/, "");
}

/** Absolute URL to Fastify API path (path must start with `/api/`). */
export function publicBackendApiUrl(apiPath: string): string {
  const base = getPublicBackendUrl();
  const path = apiPath.startsWith("/") ? apiPath : `/${apiPath}`;
  return `${base}${path}`;
}
