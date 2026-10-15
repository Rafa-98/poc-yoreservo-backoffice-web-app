/**
 * Roles of the backend `UserRole` enum that may sign in to the Backoffice.
 * `CLIENT` is intentionally absent: athletes use `poc-yoreservo-client-web-app`.
 *
 * The UI must only ever show these values, never free-text role names
 * (see problem N in BACKOFFICE_SPECIFICATIONS.md).
 */
export const BACKOFFICE_ROLES = [
  "PLATFORM_ADMIN",
  "PLATFORM_ACCOUNTING",
  "ALLY_ADMIN",
  "ALLY_ACCOUNTING",
  "ALLY_VALIDATOR",
] as const;

export type BackofficeRole = (typeof BACKOFFICE_ROLES)[number];

const LEGACY_ROLE_MAP: Record<string, BackofficeRole> = {
  ADMIN: "PLATFORM_ADMIN",
  ACCOUNTING: "PLATFORM_ACCOUNTING",
  ALLY: "ALLY_ADMIN",
  VALIDATOR: "ALLY_VALIDATOR",
  PLATFORM_ADMIN: "PLATFORM_ADMIN",
  PLATFORM_ACCOUNTING: "PLATFORM_ACCOUNTING",
  ALLY_ADMIN: "ALLY_ADMIN",
  ALLY_ACCOUNTING: "ALLY_ACCOUNTING",
  ALLY_VALIDATOR: "ALLY_VALIDATOR",
};

/**
 * Maps legacy role names ("ADMIN", "ACCOUNTING", "ALLY", "VALIDATOR") as well as
 * canonical 6-role taxonomy names to a valid BackofficeRole, or null if invalid/CLIENT.
 */
export function normalizeBackofficeRole(
  role: string | null | undefined,
): BackofficeRole | null {
  if (!role || typeof role !== "string") return null;
  return LEGACY_ROLE_MAP[role.trim().toUpperCase()] ?? null;
}

export function isBackofficeRole(value: unknown): value is BackofficeRole {
  return typeof value === "string" && normalizeBackofficeRole(value) !== null;
}

/** Backend `GeneralStatus` (users, venues). Spaces use `EntityStatus` instead. */
export const GENERAL_STATUSES = ["ACTIVE", "INACTIVE", "IN_VERIFICATION"] as const;
export type GeneralStatus = (typeof GENERAL_STATUSES)[number];

/** Backend `EntityStatus` (bookable spaces). */
export const ENTITY_STATUSES = ["ENABLED", "DISABLED"] as const;
export type EntityStatus = (typeof ENTITY_STATUSES)[number];

