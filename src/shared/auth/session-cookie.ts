import { z } from "zod";
import { backofficeRoleSchema } from "./session-user";

export const ACCESS_COOKIE_NAME = "yoreservo_access";
export const REFRESH_COOKIE_NAME = "yoreservo_refresh";

/** An access token is renewed this long before it expires (clock skew + latency). */
export const ACCESS_REFRESH_MARGIN_SECONDS = 30;

export interface AuthTokens {
  accessToken: string;
  /** Access token lifetime in seconds. */
  accessExpiresIn: number;
  refreshToken: string;
  refreshExpiresAt: Date;
}

export interface AuthCookieOptions {
  httpOnly: true;
  sameSite: "lax";
  secure: boolean;
  path: string;
  maxAge?: number;
  expires?: Date;
}

const baseCookieOptions = () =>
  ({
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  }) as const;

export function accessCookieOptions(expiresInSeconds: number): AuthCookieOptions {
  return { ...baseCookieOptions(), maxAge: expiresInSeconds };
}

export function refreshCookieOptions(expiresAt: Date): AuthCookieOptions {
  return { ...baseCookieOptions(), expires: expiresAt };
}

const accessClaimsSchema = z.object({
  sub: z.string().uuid(),
  role: z.string(),
  sid: z.string().min(1),
  /** Expiration as a Unix timestamp in seconds. */
  exp: z.number().int().positive(),
});
export type AccessClaims = z.infer<typeof accessClaimsSchema>;

function fromBase64Url(value: string): string {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/**
 * Reads the claims of an access token WITHOUT verifying its signature.
 * Good enough for optimistic routing in `proxy.ts`; the backend verifies
 * the token on every request and `getSession` confirms it through `GET /auth/me`.
 */
export function decodeAccessToken(
  token: string | undefined | null,
): AccessClaims | null {
  const payload = token?.split(".")[1];
  if (!payload) return null;

  try {
    const parsed = accessClaimsSchema.safeParse(JSON.parse(fromBase64Url(payload)));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/** True when the token decodes and does not need renewing yet. */
export function isAccessTokenFresh(token: string | undefined | null): boolean {
  const claims = decodeAccessToken(token);
  if (!claims) return false;
  return claims.exp * 1000 - Date.now() > ACCESS_REFRESH_MARGIN_SECONDS * 1000;
}
