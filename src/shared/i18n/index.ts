export {
  DEFAULT_LOCALE,
  LOCALES,
  LOCALE_COOKIE_NAME,
  isAppLocale,
  type AppLocale,
} from "./config";
export { setLocaleAction } from "./set-locale";
export { useErrorMessage, useValidationMessage } from "./translate";
export {
  BASE_LOCALE,
  resolveLocalizedText,
  type LocalizedText,
} from "./localized-text";
export { useLocalizedText } from "./use-localized-text";
