/**
 * Roles of the backend `UserRole` enum that may sign in to the Backoffice.
 * `CLIENT` is intentionally absent: athletes use `poc-yoreservo-client-web-app`.
 *
 * The UI must only ever show these values, never free-text role names
 * (see problem N in BACKOFFICE_SPECIFICATIONS.md).
 */
export const BACKOFFICE_ROLES = ["ADMIN", "ALLY", "ACCOUNTING", "VALIDATOR"] as const;

export type BackofficeRole = (typeof BACKOFFICE_ROLES)[number];

export function isBackofficeRole(value: unknown): value is BackofficeRole {
  return (
    typeof value === "string" && (BACKOFFICE_ROLES as readonly string[]).includes(value)
  );
}

/** Backend `GeneralStatus` (users, venues). Spaces use `EntityStatus` instead. */
export const GENERAL_STATUSES = ["ACTIVE", "INACTIVE", "IN_VERIFICATION"] as const;
export type GeneralStatus = (typeof GENERAL_STATUSES)[number];

/** Backend `EntityStatus` (bookable spaces). */
export const ENTITY_STATUSES = ["ENABLED", "DISABLED"] as const;
export type EntityStatus = (typeof ENTITY_STATUSES)[number];
