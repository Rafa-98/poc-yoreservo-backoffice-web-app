import { useLocale, useTranslations } from "next-intl";
import { resolveLocalizedText, type LocalizedText } from "./localized-text";

/**
 * Client/sync-server hook: returns `(text) => string` bound to the active UI
 * language, using the translated "not available" copy as the last resort.
 *
 * The translations live in the data the backend returned, so changing the
 * language only re-renders; nothing is refetched.
 */
export function useLocalizedText() {
  const locale = useLocale();
  const t = useTranslations("common");
  const fallback = t("localized.unavailable");

  return (text: LocalizedText | null | undefined): string =>
    resolveLocalizedText(text, locale, fallback);
}
