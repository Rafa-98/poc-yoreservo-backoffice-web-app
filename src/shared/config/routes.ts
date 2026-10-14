import type { BackofficeRole } from "./roles";

/**
 * Single source of truth for application routes.
 * Never hard-code a path string elsewhere: import it from here.
 *
 * These are the screens blueprinted in
 * `poc-yoreservo-templates/backoffice-ui-designs/backoffice_modules.md`.
 */
export const ROUTES = {
  root: "/",

  // Module 1: authentication
  login: "/login",
  recoverPassword: "/recover-password",
  setPassword: "/set-password",
  profile: "/profile",

  // Module 8: dashboard
  dashboard: "/dashboard",

  // Module 2: operations hub
  agenda: "/agenda",

  // Module 6: bookings ledger & check-in
  reservations: "/reservations",

  // Module 3 + 7: finance & treasury
  paymentsInbox: "/treasury/payments",
  exchangeRate: "/treasury/exchange-rate",
  settlements: "/treasury/settlements",

  // Module 4: venues, courts & schedules
  venues: "/venues",
  spaces: "/venues/spaces",
  schedules: "/venues/schedules",

  // Module 5: users (RBAC) & master catalogs
  users: "/users",
  catalogs: "/catalogs",
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];

/** Query-string key used to remember where the user wanted to go before logging in. */
export const REDIRECT_QUERY_KEY = "next";

/**
 * Appended to the login URL when the backend rejects a session that still
 * looks valid (e.g. the user was deactivated). The proxy then clears the auth
 * cookies instead of bouncing the user back to a protected route.
 */
export const SESSION_INVALID_QUERY = { key: "session", value: "invalid" } as const;

/** Routes that only make sense for anonymous visitors (authenticated users are sent to their default route). */
export const GUEST_ONLY_ROUTES: readonly string[] = [
  ROUTES.login,
  ROUTES.recoverPassword,
  ROUTES.setPassword,
];

/** Routes that require an active Backoffice staff session. */
export const PROTECTED_ROUTE_PREFIXES: readonly string[] = [
  ROUTES.dashboard,
  ROUTES.agenda,
  ROUTES.reservations,
  "/treasury",
  ROUTES.venues,
  ROUTES.users,
  ROUTES.catalogs,
  ROUTES.profile,
];

/** Canonical RBAC matrix mapping each protected route to its permitted backoffice roles. */
export const ROUTE_ALLOWED_ROLES: Record<string, readonly BackofficeRole[]> = {
  [ROUTES.dashboard]: ["ADMIN", "ALLY", "ACCOUNTING"],
  [ROUTES.agenda]: ["ADMIN", "ALLY", "VALIDATOR"],
  [ROUTES.reservations]: ["ADMIN", "ALLY", "VALIDATOR", "ACCOUNTING"],
  [ROUTES.paymentsInbox]: ["ADMIN", "ALLY", "ACCOUNTING"],
  [ROUTES.exchangeRate]: ["ADMIN", "ALLY", "ACCOUNTING"],
  [ROUTES.settlements]: ["ADMIN", "ALLY", "ACCOUNTING"],
  "/treasury": ["ADMIN", "ALLY", "ACCOUNTING"],
  [ROUTES.spaces]: ["ADMIN", "ALLY", "ACCOUNTING"],
  [ROUTES.schedules]: ["ADMIN", "ALLY", "ACCOUNTING"],
  [ROUTES.venues]: ["ADMIN", "ALLY", "ACCOUNTING"],
  [ROUTES.users]: ["ADMIN", "ALLY"],
  [ROUTES.catalogs]: ["ADMIN", "ALLY"],
  [ROUTES.profile]: ["ADMIN", "ALLY", "VALIDATOR", "ACCOUNTING"],
};

/** Default landing route after sign-in or unauthorized redirect based on the staff role. */
export function getDefaultRouteForRole(role?: BackofficeRole | null): AppRoute {
  if (role === "VALIDATOR") {
    return ROUTES.agenda;
  }
  return ROUTES.dashboard;
}

/** Returns true if the given backoffice role is permitted to access `pathname`. */
export function canRoleAccessPath(role: BackofficeRole, pathname: string): boolean {
  const matchingEntries = Object.entries(ROUTE_ALLOWED_ROLES)
    .filter(([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`))
    .sort((a, b) => b[0].length - a[0].length);

  if (matchingEntries.length === 0) return true;
  const [, allowedRoles] = matchingEntries[0];
  return allowedRoles.includes(role);
}


