import { GUEST_ONLY_ROUTES, ROUTES } from "@/shared/config";

/**
 * Returns `value` only when it is a safe, same-origin, in-app path.
 * Protects against open redirects such as `//evil.com` or `https://evil.com`.
 */
export function sanitizeRedirectPath(
  value: string | string[] | null | undefined,
  fallback: string = ROUTES.agenda,
): string {
  const candidate = Array.isArray(value) ? value[0] : value;

  if (!candidate) return fallback;
  if (!candidate.startsWith("/")) return fallback;
  if (candidate.startsWith("//") || candidate.includes("\\")) return fallback;

  // Never bounce the user back to a guest-only screen or removed /dashboard route after authenticating.
  const [pathname] = candidate.split(/[?#]/);
  if (
    pathname === ROUTES.root ||
    pathname === ROUTES.dashboard ||
    GUEST_ONLY_ROUTES.includes(pathname)
  ) {
    return fallback;
  }

  return candidate;
}
