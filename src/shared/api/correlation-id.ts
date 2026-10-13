/**
 * Header the backend uses to trace a request across logs and services. We send
 * our own id on every backend call and read the backend's echo of it.
 */
export const CORRELATION_ID_HEADER = "x-correlation-id";

/** A fresh id for a backend call (uuid v4, accepted as-is by the backend). */
export function newCorrelationId(): string {
  return crypto.randomUUID();
}
