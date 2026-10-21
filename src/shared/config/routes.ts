import {
  BACKOFFICE_ROLES,
  isBackofficeRole,
  normalizeBackofficeRole,
  type BackofficeRole,
} from "./roles";

export {
  BACKOFFICE_ROLES,
  isBackofficeRole,
  normalizeBackofficeRole,
  type BackofficeRole,
};

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

  // Module 4: organization, venues, courts & schedules
  organization: "/venues/organization",
  venues: "/venues",
  spaces: "/venues/spaces",
  schedules: "/venues/schedules",

  // Module 5: users (RBAC) & master catalogs
  users: "/users",
  catalogs: "/catalogs",
  support: "/support",
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
  ROUTES.support,
  ROUTES.profile,
];

/** Canonical RBAC matrix mapping each protected route to its permitted backoffice roles. */
export const ROUTE_ALLOWED_ROLES: Record<string, readonly BackofficeRole[]> = {
  [ROUTES.dashboard]: [
    "PLATFORM_ADMIN",
    "PLATFORM_ACCOUNTING",
    "ALLY_ADMIN",
    "ALLY_ACCOUNTING",
  ],
  [ROUTES.agenda]: [
    "PLATFORM_ADMIN",
    "PLATFORM_ACCOUNTING",
    "ALLY_ADMIN",
    "ALLY_ACCOUNTING",
    "ALLY_VALIDATOR",
  ],
  [ROUTES.reservations]: [
    "PLATFORM_ADMIN",
    "PLATFORM_ACCOUNTING",
    "ALLY_ADMIN",
    "ALLY_ACCOUNTING",
    "ALLY_VALIDATOR",
  ],
  [ROUTES.paymentsInbox]: [
    "PLATFORM_ADMIN",
    "PLATFORM_ACCOUNTING",
    "ALLY_ADMIN",
    "ALLY_ACCOUNTING",
  ],
  [ROUTES.exchangeRate]: [
    "PLATFORM_ADMIN",
    "PLATFORM_ACCOUNTING",
    "ALLY_ADMIN",
    "ALLY_ACCOUNTING",
  ],
  [ROUTES.settlements]: [
    "PLATFORM_ADMIN",
    "PLATFORM_ACCOUNTING",
    "ALLY_ADMIN",
    "ALLY_ACCOUNTING",
  ],
  "/treasury": [
    "PLATFORM_ADMIN",
    "PLATFORM_ACCOUNTING",
    "ALLY_ADMIN",
    "ALLY_ACCOUNTING",
  ],
  [ROUTES.organization]: [
    "PLATFORM_ADMIN",
    "PLATFORM_ACCOUNTING",
    "ALLY_ADMIN",
    "ALLY_ACCOUNTING",
  ],
  [ROUTES.spaces]: ["PLATFORM_ADMIN", "PLATFORM_ACCOUNTING", "ALLY_ADMIN"],
  [ROUTES.schedules]: ["PLATFORM_ADMIN", "PLATFORM_ACCOUNTING", "ALLY_ADMIN"],
  [ROUTES.venues]: ["PLATFORM_ADMIN", "PLATFORM_ACCOUNTING", "ALLY_ADMIN"],
  [ROUTES.users]: ["PLATFORM_ADMIN", "ALLY_ADMIN"],
  [ROUTES.catalogs]: ["PLATFORM_ADMIN", "ALLY_ADMIN"],
  [ROUTES.support]: [
    "PLATFORM_ADMIN",
    "PLATFORM_ACCOUNTING",
    "ALLY_ADMIN",
  ],
  [ROUTES.profile]: [
    "PLATFORM_ADMIN",
    "PLATFORM_ACCOUNTING",
    "ALLY_ADMIN",
    "ALLY_ACCOUNTING",
    "ALLY_VALIDATOR",
  ],
};

/** Default landing route after sign-in or unauthorized redirect based on the staff role. */
export function getDefaultRouteForRole(role?: BackofficeRole | string | null): AppRoute {
  const normalized = normalizeBackofficeRole(role);
  if (normalized === "ALLY_VALIDATOR") {
    return ROUTES.agenda;
  }
  return ROUTES.dashboard;
}

/** Returns true if the given backoffice role is permitted to access `pathname`. */
export function canRoleAccessPath(role: BackofficeRole, pathname: string): boolean {
  const normalized = normalizeBackofficeRole(role);
  if (!normalized) return false;

  const matchingEntries = Object.entries(ROUTE_ALLOWED_ROLES)
    .filter(([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`))
    .sort((a, b) => b[0].length - a[0].length);

  if (matchingEntries.length === 0) return true;
  const [, allowedRoles] = matchingEntries[0];
  return allowedRoles.includes(normalized);
}
