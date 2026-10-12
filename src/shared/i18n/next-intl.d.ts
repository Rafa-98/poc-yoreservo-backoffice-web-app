import type { AppLocale } from "./config";
import type { AppMessages } from "./messages";

/** Makes `t()` keys, locales and values type-safe across the whole app. */
declare module "next-intl" {
  interface AppConfig {
    Locale: AppLocale;
    Messages: AppMessages;
  }
}
