import { DEFAULT_LOCALE } from "./config";

/**
 * Text translated into several languages, exactly as the backend sends it:
 * language code -> text, e.g. `{ es: "Fútbol", en: "Soccer" }`.
 *
 * The backend returns the whole map (it never resolves the language), so
 * switching the UI language re-renders from data already in memory instead of
 * refetching. In the Backoffice the same shape is also what the catalog
 * editors WRITE (activity types, activities, categories).
 */
export type LocalizedText = Readonly<Record<string, string>>;

/** Language used when the active one has no translation. */
export const BASE_LOCALE: string = DEFAULT_LOCALE;

/** A translation is usable only if it is a string with visible characters. */
function isUsable(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== "";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Picks the text to display from a translation map.
 *
 * Order of preference:
 *   1. The active language (`es-VE` also tries its base language `es`).
 *   2. The base language (`es`).
 *   3. The first translation the object has, in any language.
 *   4. `fallback`, when the object is empty or not a map at all.
 *
 * It never throws and never returns an empty string, so it is safe to call
 * with data that comes straight from the network (`null`, `undefined`,
 * arrays, empty or partially filled maps).
 *
 * `fallback` is required on purpose: user-facing copy must come from
 * `/locales`, so callers pass a translated string. Components should prefer
 * `useLocalizedText()` / `getLocalizedText()`, which do that for them.
 */
export function resolveLocalizedText(
  text: LocalizedText | null | undefined,
  locale: string,
  fallback: string,
): string {
  if (!isRecord(text)) return fallback;

  const active = locale.trim().toLowerCase();
  const activeLanguage = active.split(/[-_]/)[0];

  for (const code of [active, activeLanguage, BASE_LOCALE]) {
    const candidate = text[code];
    if (isUsable(candidate)) return candidate;
  }

  for (const candidate of Object.values(text)) {
    if (isUsable(candidate)) return candidate;
  }

  return fallback;
}
