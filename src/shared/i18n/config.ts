/** Supported UI languages. Add a new one here AND create `/locales/<code>/`. */
export const LOCALES = ["es", "en"] as const;

export type AppLocale = (typeof LOCALES)[number];

/** Spanish is the product default (YoReservo targets Venezuela first). */
export const DEFAULT_LOCALE: AppLocale = "es";

/** Cookie that remembers the user's language (no URL prefix is used). */
export const LOCALE_COOKIE_NAME = "NEXT_LOCALE";

export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

export function isAppLocale(value: unknown): value is AppLocale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}
