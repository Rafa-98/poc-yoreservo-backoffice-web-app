/**
 * The NestJS backend delivers its refresh token in an HttpOnly cookie. The web
 * app talks to the backend from the server, so it has to read that `Set-Cookie`
 * header itself and re-issue the token as its own cookie.
 */
export const BACKEND_REFRESH_COOKIE_NAME = "refresh_token";

export type BackendRefreshCookie =
  | { kind: "set"; value: string; expiresAt: Date }
  | { kind: "cleared" };

/**
 * Extracts the backend refresh cookie from the `Set-Cookie` headers of a response.
 * Returns `null` when the response does not touch it (or it is malformed).
 */
export function parseBackendRefreshCookie(
  setCookieHeaders: readonly string[],
): BackendRefreshCookie | null {
  for (const header of setCookieHeaders) {
    const [pair, ...attributes] = header.split(";").map((part) => part.trim());
    const separator = pair.indexOf("=");
    if (separator === -1) continue;
    if (pair.slice(0, separator) !== BACKEND_REFRESH_COOKIE_NAME) continue;

    const value = pair.slice(separator + 1);
    if (!value) return { kind: "cleared" };

    const expires = attributes.find((attribute) =>
      attribute.toLowerCase().startsWith("expires="),
    );
    const expiresAt = new Date(expires?.slice("expires=".length) ?? "");
    if (Number.isNaN(expiresAt.getTime())) return null;

    return { kind: "set", value, expiresAt };
  }

  return null;
}
