import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { getServerEnv } from "@/shared/config/index.server";
import { DEFAULT_LOCALE, LOCALE_COOKIE_NAME, isAppLocale } from "./config";
import { MESSAGES } from "./messages";

/**
 * Resolves the active locale for every request from the `NEXT_LOCALE` cookie,
 * falling back to Spanish. Referenced by `next.config.ts` (next-intl plugin).
 */
export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE_NAME)?.value;
  const locale = isAppLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE;

  return {
    locale,
    messages: MESSAGES[locale],
    timeZone: getServerEnv().BUSINESS_TIME_ZONE,
  };
});
