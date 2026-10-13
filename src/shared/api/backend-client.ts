import { AppError } from "@/shared/lib";
import { getServerEnv } from "@/shared/config/index.server";
import {
  BACKEND_REFRESH_COOKIE_NAME,
  parseBackendRefreshCookie,
  type BackendRefreshCookie,
} from "./backend-refresh-cookie";
import { CORRELATION_ID_HEADER, newCorrelationId } from "./correlation-id";

const REQUEST_TIMEOUT_MS = 10_000;

export interface BackendRequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  /** JSON body (serialized here). */
  body?: unknown;
  /** Sent as `Authorization: Bearer <accessToken>`. */
  accessToken?: string;
  /** Sent as the backend's refresh-token cookie (`/auth/refresh`, `/auth/logout`). */
  refreshToken?: string;
  /** Forwarded so the backend can record the device of the session. */
  userAgent?: string | null;
  /**
   * Sent as `x-correlation-id`. Generated when omitted, so every backend call
   * can be traced in both our logs and the backend's.
   */
  correlationId?: string;
}

export interface BackendResponse {
  status: number;
  ok: boolean;
  /** Parsed JSON body, or `null` when it is empty or not JSON. */
  body: unknown;
  /** The refresh cookie the backend set (or cleared) in this response, if any. */
  refreshCookie: BackendRefreshCookie | null;
  /** Correlation id the backend used for this request. */
  correlationId: string;
}

/**
 * Server-side `fetch` wrapper for the YoReservo NestJS backend.
 * Transport only: never throws on HTTP error status (callers handle status/body)
 * and throws `AppError("SERVICE_UNAVAILABLE")` when the backend cannot be reached.
 * Never call it directly from the browser.
 */
export async function backendRequest(
  path: string,
  options: BackendRequestOptions = {},
): Promise<BackendResponse> {
  const { method = "GET", body, accessToken, refreshToken, userAgent } = options;
  const sentCorrelationId = options.correlationId ?? newCorrelationId();

  const headers = new Headers({
    Accept: "application/json",
    [CORRELATION_ID_HEADER]: sentCorrelationId,
  });
  if (body !== undefined) headers.set("Content-Type", "application/json");
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
  if (refreshToken) {
    headers.set("Cookie", `${BACKEND_REFRESH_COOKIE_NAME}=${refreshToken}`);
  }
  if (userAgent) headers.set("User-Agent", userAgent);

  let response: Response;
  try {
    response = await fetch(`${getServerEnv().API_BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    console.error(
      `[api] ${method} ${path} failed (correlationId=${sentCorrelationId}):`,
      error,
    );
    throw new AppError(
      "SERVICE_UNAVAILABLE",
      `The backend is unreachable (${method} ${path})`,
      { cause: error, correlationId: sentCorrelationId },
    );
  }

  const text = await response.text();
  let parsedBody: unknown = null;
  if (text) {
    try {
      parsedBody = JSON.parse(text);
    } catch {
      parsedBody = null;
    }
  }

  return {
    status: response.status,
    ok: response.ok,
    body: parsedBody,
    refreshCookie: parseBackendRefreshCookie(response.headers.getSetCookie()),
    correlationId:
      response.headers.get(CORRELATION_ID_HEADER) ?? sentCorrelationId,
  };
}
