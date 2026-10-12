import { useTranslations } from "next-intl";

/**
 * Schemas and Server Actions never contain user-facing copy: they emit i18n
 * keys (`validation.email.required`) or error codes (`INVALID_CREDENTIALS`).
 * These hooks turn them into text in the active language, with safe fallbacks.
 */

interface LooseTranslator {
  (key: string, values?: Record<string, string | number>): string;
  has(key: string): boolean;
}

function useLooseTranslator(): LooseTranslator {
  return useTranslations() as unknown as LooseTranslator;
}

/** `validation.*` key coming from a Zod schema -> localized message. */
export function useValidationMessage() {
  const t = useLooseTranslator();

  return (key: string | undefined): string | undefined => {
    if (!key) return undefined;
    return t.has(key) ? t(key) : t("validation.invalid");
  };
}

/** Error `code` returned by a Server Action -> localized message. */
export function useErrorMessage() {
  const t = useLooseTranslator();

  return (code: string | undefined): string => {
    const key = `errors.${code}`;
    return code && t.has(key) ? t(key) : t("errors.UNKNOWN_ERROR");
  };
}
