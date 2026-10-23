import { NextResponse, type NextRequest } from "next/server";
import {
  GUEST_ONLY_ROUTES,
  PROTECTED_ROUTE_PREFIXES,
  REDIRECT_QUERY_KEY,
  ROUTES,
  SESSION_INVALID_QUERY,
  canRoleAccessPath,
  getDefaultRouteForRole,
  isBackofficeRole,
  type BackofficeRole,
} from "@/shared/config";
import {
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  accessCookieOptions,
  decodeAccessToken,
  isAccessTokenFresh,
  refreshCookieOptions,
  refreshTokens,
  type AuthTokens,
} from "@/shared/auth/index.proxy";

/** What this request changes in the browser's auth cookies. */
type CookieChange =
  | { kind: "store"; tokens: AuthTokens }
  | { kind: "clear" }
  | null;

/**
 * Route protection and silent token renewal (runs before rendering).
 */
export async function proxy(request: NextRequest) {
  const { pathname, search, searchParams } = request.nextUrl;

  const isGuestOnly = GUEST_ONLY_ROUTES.includes(pathname);
  const isProtected = PROTECTED_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  // The Data Access Layer says the backend rejected the cookies: wipe them.
  const sessionRejected =
    isGuestOnly &&
    searchParams.get(SESSION_INVALID_QUERY.key) === SESSION_INVALID_QUERY.value;

  let change: CookieChange = sessionRejected ? { kind: "clear" } : null;
  let isAuthenticated = false;
  let userRole: BackofficeRole | null = null;

  if (!sessionRejected) {
    const accessToken = request.cookies.get(ACCESS_COOKIE_NAME)?.value;
    const refreshToken = request.cookies.get(REFRESH_COOKIE_NAME)?.value;

    if (isAccessTokenFresh(accessToken)) {
      const claims = decodeAccessToken(accessToken);
      // Strictly prevent CLIENT role from backoffice
      if (claims && isBackofficeRole(claims.role)) {
        isAuthenticated = true;
        userRole = claims.role;
      } else {
        change = { kind: "clear" };
      }
    } else if (refreshToken) {
      const result = await refreshTokens(refreshToken);
      if (result.kind === "refreshed") {
        const claims = decodeAccessToken(result.tokens.accessToken);
        if (claims && isBackofficeRole(claims.role)) {
          change = { kind: "store", tokens: result.tokens };
          isAuthenticated = true;
          userRole = claims.role;
        } else {
          change = { kind: "clear" };
        }
      } else if (result.kind === "rejected") {
        change = { kind: "clear" };
      }
    } else if (accessToken) {
      change = { kind: "clear" };
    }
  }

  const defaultLandingRoute = getDefaultRouteForRole(userRole);

  // Root or legacy /dashboard redirect
  if (
    pathname === ROUTES.root ||
    pathname === ROUTES.dashboard ||
    pathname.startsWith(`${ROUTES.dashboard}/`)
  ) {
    const targetUrl = new URL(
      isAuthenticated ? defaultLandingRoute : ROUTES.login,
      request.url,
    );
    return withCookieChange(NextResponse.redirect(targetUrl), change);
  }

  if (isProtected && !isAuthenticated) {
    const loginUrl = new URL(ROUTES.login, request.url);
    loginUrl.searchParams.set(REDIRECT_QUERY_KEY, `${pathname}${search}`);
    return withCookieChange(NextResponse.redirect(loginUrl), change);
  }

  if (isGuestOnly && isAuthenticated) {
    return withCookieChange(
      NextResponse.redirect(new URL(defaultLandingRoute, request.url)),
      change,
    );
  }

  if (isProtected && isAuthenticated && userRole && !canRoleAccessPath(userRole, pathname)) {
    return withCookieChange(
      NextResponse.redirect(new URL(defaultLandingRoute, request.url)),
      change,
    );
  }

  copyChangeToRequest(request, change);
  return withCookieChange(NextResponse.next({ request }), change);
}

function withCookieChange<TResponse extends NextResponse>(
  response: TResponse,
  change: CookieChange,
): TResponse {
  if (change?.kind === "store") {
    const { tokens } = change;
    response.cookies.set(
      ACCESS_COOKIE_NAME,
      tokens.accessToken,
      accessCookieOptions(tokens.accessExpiresIn),
    );
    response.cookies.set(
      REFRESH_COOKIE_NAME,
      tokens.refreshToken,
      refreshCookieOptions(tokens.refreshExpiresAt),
    );
  } else if (change?.kind === "clear") {
    response.cookies.delete(ACCESS_COOKIE_NAME);
    response.cookies.delete(REFRESH_COOKIE_NAME);
  }
  return response;
}

function copyChangeToRequest(request: NextRequest, change: CookieChange): void {
  if (change?.kind === "store") {
    request.cookies.set(ACCESS_COOKIE_NAME, change.tokens.accessToken);
    request.cookies.set(REFRESH_COOKIE_NAME, change.tokens.refreshToken);
  } else if (change?.kind === "clear") {
    request.cookies.delete(ACCESS_COOKIE_NAME);
    request.cookies.delete(REFRESH_COOKIE_NAME);
  }
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|manifest\\.webmanifest|sw\\.js|offline\\.html|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico)$).*)",
  ],
};
