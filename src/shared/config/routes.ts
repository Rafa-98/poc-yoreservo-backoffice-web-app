/**
 * Single source of truth for application routes.
 * Never hard-code a path string elsewhere: import it from here.
 *
 * These are the screens blueprinted in
 * `poc-yoreservo-templates/backoffice-ui-designs/backoffice_modules.md`.
 * Declaring a path here does NOT mean the screen exists yet.
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

/** Routes that only make sense for anonymous visitors (authenticated users are sent to the dashboard). */
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

