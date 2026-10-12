import { getLocale, getTranslations } from "next-intl/server";
import { resolveLocalizedText, type LocalizedText } from "./localized-text";

/**
 * Async Server Component counterpart of `useLocalizedText()`:
 *
 *   const localize = await getLocalizedText();
 *   <h2>{localize(activity.name)}</h2>
 */
export async function getLocalizedText() {
  const [locale, t] = await Promise.all([
    getLocale(),
    getTranslations("common"),
  ]);
  const fallback = t("localized.unavailable");

  return (text: LocalizedText | null | undefined): string =>
    resolveLocalizedText(text, locale, fallback);
}
