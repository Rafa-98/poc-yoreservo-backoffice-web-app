import { z } from "zod";
import { AppError } from "@/shared/lib";
import type { BackendRefreshCookie } from "@/shared/api";
import type { AuthTokens } from "./session-cookie";

/** Token part of the backend's `AuthResponse` (login, refresh). */
export const authTokensResponseSchema = z.object({
  accessToken: z.string().min(1),
  /** Access token lifetime in seconds. */
  expiresIn: z.number().int().positive(),
});

/**
 * Combines the JSON body (access token) and the `Set-Cookie` header (refresh
 * token) of a backend auth response into one `AuthTokens` value.
 */
export function buildAuthTokens(
  body: z.infer<typeof authTokensResponseSchema>,
  refreshCookie: BackendRefreshCookie | null,
): AuthTokens {
  if (refreshCookie?.kind !== "set") {
    throw new AppError(
      "INVALID_SERVER_RESPONSE",
      "The backend did not return a refresh token cookie",
    );
  }

  return {
    accessToken: body.accessToken,
    accessExpiresIn: body.expiresIn,
    refreshToken: refreshCookie.value,
    refreshExpiresAt: refreshCookie.expiresAt,
  };
}
