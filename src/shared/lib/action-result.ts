import { z } from "zod";
import { isAppError } from "./app-error";

export type FieldErrors = Record<string, string[] | undefined>;

export interface ActionError {
  /** Stable code; the UI translates it via `errors.<code>` in `/locales`. */
  code: string;
  /**
   * Per-field validation keys (e.g. `validation.email.required`), keyed by
   * field name. They are translation keys, never final copy.
   */
  fieldErrors?: FieldErrors;
  /**
   * Backend correlation id (`x-correlation-id`) of the failed request, when
   * there is one. The UI shows it as a reference code for unexpected errors.
   */
  correlationId?: string;
}

/** Serializable result returned by every Server Action (never throw to the client). */
export type ActionResult<TData = undefined> =
  | { ok: true; data: TData }
  | { ok: false; error: ActionError };

export function ok<TData>(data: TData): ActionResult<TData>;
export function ok(): ActionResult<undefined>;
export function ok(data?: unknown): ActionResult<unknown> {
  return { ok: true, data };
}

export function fail(
  code: string,
  fieldErrors?: FieldErrors,
  correlationId?: string,
): ActionResult<never> {
  return { ok: false, error: { code, fieldErrors, correlationId } };
}

/**
 * Converts anything thrown inside a Server Action into a safe `ActionResult`.
 * - `ZodError`  -> field-level validation keys
 * - `AppError`  -> its own code (and the backend correlation id, if it has one)
 * - otherwise   -> logged on the server, `UNKNOWN_ERROR` for the user
 */
export function toActionError(error: unknown): ActionResult<never> {
  if (error instanceof z.ZodError) {
    return fail("VALIDATION_ERROR", z.flattenError(error).fieldErrors);
  }

  if (isAppError(error)) {
    return fail(error.code, undefined, error.correlationId);
  }

  console.error("[server-action] Unexpected error:", error);
  return fail("UNKNOWN_ERROR");
}
