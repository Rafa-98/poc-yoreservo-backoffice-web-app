import { backendRequest } from "@/shared/api/index.server";
import { parseApiResponse } from "@/shared/api";
import { authTokensResponseSchema, buildAuthTokens } from "./auth-tokens";
import type { AuthTokens } from "./session-cookie";

export type RefreshResult =
  | { kind: "refreshed"; tokens: AuthTokens }
  | { kind: "rejected" }
  | { kind: "unavailable" };

const inFlightRefreshes = new Map<string, Promise<RefreshResult>>();
const RESULT_REUSE_WINDOW_MS = 30_000;

async function performRefresh(refreshToken: string): Promise<RefreshResult> {
  try {
    const response = await backendRequest("/auth/refresh", {
      method: "POST",
      refreshToken,
    });

    if (response.status === 401 || response.status === 403) {
      return { kind: "rejected" };
    }
    if (!response.ok) {
      console.error(
        `[auth] Token refresh answered ${response.status} (correlationId=${response.correlationId})`,
      );
      return { kind: "unavailable" };
    }

    const body = parseApiResponse(
      authTokensResponseSchema,
      response.body,
      "POST /auth/refresh",
      response.correlationId,
    );
    return {
      kind: "refreshed",
      tokens: buildAuthTokens(body, response.refreshCookie),
    };
  } catch (error) {
    console.error("[auth] Token refresh failed:", error);
    return { kind: "unavailable" };
  }
}

/** Exchanges a refresh token for a new token pair. Never throws. */
export function refreshTokens(refreshToken: string): Promise<RefreshResult> {
  const existing = inFlightRefreshes.get(refreshToken);
  if (existing) return existing;

  const refresh = performRefresh(refreshToken);
  inFlightRefreshes.set(refreshToken, refresh);

  void refresh.then((result) => {
    const keepFor = result.kind === "unavailable" ? 0 : RESULT_REUSE_WINDOW_MS;
    setTimeout(() => inFlightRefreshes.delete(refreshToken), keepFor);
  });

  return refresh;
}
