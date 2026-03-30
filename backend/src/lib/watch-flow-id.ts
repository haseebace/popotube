/** Max length for client-supplied watch session id (UUID fits). */
export const WATCH_FLOW_ID_MAX_LEN = 80;

/**
 * Accepts UUID v4 from crypto.randomUUID() or a short alphanumeric opaque id.
 * Rejects unexpected shapes to avoid log injection / oversized query params.
 */
export function sanitizeWatchFlowId(raw: unknown): string | undefined {
  if (typeof raw !== "string" || raw.length === 0) {
    return undefined;
  }
  if (raw.length > WATCH_FLOW_ID_MAX_LEN) {
    return undefined;
  }
  const uuidV4 =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const opaque = /^[a-zA-Z0-9_-]{8,64}$/;
  if (!uuidV4.test(raw) && !opaque.test(raw)) {
    return undefined;
  }
  return raw;
}
