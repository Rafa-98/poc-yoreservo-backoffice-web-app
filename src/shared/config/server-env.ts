import { z } from "zod";

function isValidTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

/**
 * Server-only environment variables (never prefixed with `NEXT_PUBLIC_`, so
 * Next.js never ships them to the browser). Import this file only from server
 * code: Server Actions, Server Components and `proxy.ts`.
 */
const serverEnvSchema = z.object({
  /** Base URL of the YoReservo NestJS backend. */
  API_BASE_URL: z
    .url()
    .default("http://localhost:4000")
    .transform((url) => url.replace(/\/+$/, "")),
  /**
   * IANA time zone in which "today" and "already started" are judged. It must
   * match the backend's `APP_TIMEZONE`, or the agenda could show a day the
   * backend already considers past.
   */
  BUSINESS_TIME_ZONE: z
    .string()
    .default("America/Caracas")
    .refine(isValidTimeZone, "must be a valid IANA time zone"),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cachedEnv: ServerEnv | undefined;

/** Reads and validates the server environment once (lazily, so a build never needs it). */
export function getServerEnv(): ServerEnv {
  if (cachedEnv) return cachedEnv;

  const parsed = serverEnvSchema.safeParse({
    API_BASE_URL: process.env.API_BASE_URL || undefined,
    BUSINESS_TIME_ZONE: process.env.BUSINESS_TIME_ZONE || undefined,
  });

  if (!parsed.success) {
    throw new Error(
      `Invalid server environment variables: ${z.prettifyError(parsed.error)}`,
    );
  }

  cachedEnv = parsed.data;
  return cachedEnv;
}
