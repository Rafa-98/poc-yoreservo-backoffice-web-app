"use server";

import { cookies } from "next/headers";
import { z } from "zod";
import {
  LOCALES,
  LOCALE_COOKIE_MAX_AGE,
  LOCALE_COOKIE_NAME,
} from "./config";

const localeSchema = z.enum(LOCALES);

/**
 * Persists the user's language. Because a cookie is written from a Server
 * Action, Next.js refreshes the current route and the UI re-renders in the new
 * language without a full page reload.
 */
export async function setLocaleAction(input: unknown): Promise<boolean> {
  const parsed = localeSchema.safeParse(input);
  if (!parsed.success) return false;

  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE_NAME, parsed.data, {
    path: "/",
    maxAge: LOCALE_COOKIE_MAX_AGE,
    sameSite: "lax",
  });
  return true;
}
