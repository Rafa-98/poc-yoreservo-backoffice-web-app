import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { backendRequest } from "@/shared/api/index.server";
import { parseApiResponse } from "@/shared/api";
import {
  ROUTES,
  SESSION_INVALID_QUERY,
  type BackofficeRole,
  BACKOFFICE_ROLES,
  getDefaultRouteForRole,
} from "@/shared/config";
import { AppError } from "@/shared/lib";
import {
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  accessCookieOptions,
  decodeAccessToken,
  refreshCookieOptions,
  type AuthTokens,
} from "./session-cookie";
import { sessionUserSchema, type Session, type SessionUser } from "./session-user";

/** Stores the tokens in HttpOnly cookies. Only callable from Server Actions / Route Handlers. */
export async function createSession(tokens: AuthTokens): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(
    ACCESS_COOKIE_NAME,
    tokens.accessToken,
    accessCookieOptions(tokens.accessExpiresIn),
  );
  cookieStore.set(
    REFRESH_COOKIE_NAME,
    tokens.refreshToken,
    refreshCookieOptions(tokens.refreshExpiresAt),
  );
}

export const setAuthCookies = createSession;

/** The access token of the current browser, if any. */
export async function getAccessToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(ACCESS_COOKIE_NAME)?.value ?? null;
}

/**
 * Reads the current session (deduplicated per request). `null` if signed out.
 *
 * The user comes from the backend (`GET /auth/me`), never from a cookie, so a
 * forged or stale cookie cannot impersonate anyone. `proxy.ts` has already
 * renewed an expired access token before this runs.
 */
export const getSession = cache(async (): Promise<Session | null> => {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_COOKIE_NAME)?.value;
  const claims = decodeAccessToken(accessToken);
  if (!accessToken || !claims) return null;

  // Optimistic check: if claim role is CLIENT, athletes cannot enter backoffice
  if (!(BACKOFFICE_ROLES as readonly string[]).includes(claims.role)) {
    return null;
  }

  const response = await backendRequest("/auth/me", { accessToken });
  // 401: token rejected. 404: the user no longer exists.
  if (response.status === 401 || response.status === 404) return null;
  if (!response.ok) {
    throw new AppError(
      "SERVICE_UNAVAILABLE",
      `GET /auth/me answered ${response.status}`,
      { correlationId: response.correlationId },
    );
  }

  try {
    const user = parseApiResponse(
      sessionUserSchema,
      response.body,
      "GET /auth/me",
      response.correlationId,
    );
    return { user, expiresAt: claims.exp * 1000 };
  } catch {
    // If user's role is not a valid BackofficeRole (e.g. CLIENT), parse will fail
    return null;
  }
});

/** Data Access Layer guard: use at the top of every protected Server Component / layout / Server Action. */
export async function requireSession(allowedRoles?: readonly BackofficeRole[]): Promise<Session> {
  const session = await getSession();
  if (!session) {
    redirect(
      `${ROUTES.login}?${SESSION_INVALID_QUERY.key}=${SESSION_INVALID_QUERY.value}`,
    );
  }

  if (allowedRoles && !allowedRoles.includes(session.user.role)) {
    // User does not have permission for this route: redirect to their role's default home
    redirect(getDefaultRouteForRole(session.user.role));
  }

  return session;
}

/**
 * Data Access Layer guard that returns both the authenticated SessionUser and the accessToken.
 * Always call this OUTSIDE (before) any try/catch block in Server Actions so Next.js NEXT_REDIRECT is never swallowed.
 */
export async function requireSessionWithToken(
  allowedRoles?: readonly BackofficeRole[],
): Promise<{ user: SessionUser; accessToken: string }> {
  const session = await requireSession(allowedRoles);
  const accessToken = (await getAccessToken()) ?? "";
  return { user: session.user, accessToken };
}

/** The refresh token of the current browser, if any. */
export async function readRefreshToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(REFRESH_COOKIE_NAME)?.value ?? null;
}

export const getRefreshToken = readRefreshToken;

/** Removes both auth cookies. Only callable from Server Actions / Route Handlers. */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ACCESS_COOKIE_NAME);
  cookieStore.delete(REFRESH_COOKIE_NAME);
}
