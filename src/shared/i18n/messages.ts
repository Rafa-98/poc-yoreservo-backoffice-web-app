import esCommon from "@locales/es/common.json";
import esErrors from "@locales/es/errors.json";
import esHome from "@locales/es/home.json";
import esMeta from "@locales/es/meta.json";
import esStatus from "@locales/es/status.json";
import esValidation from "@locales/es/validation.json";

import enCommon from "@locales/en/common.json";
import enErrors from "@locales/en/errors.json";
import enHome from "@locales/en/home.json";
import enMeta from "@locales/en/meta.json";
import enStatus from "@locales/en/status.json";
import enValidation from "@locales/en/validation.json";

import type { AppLocale } from "./config";

/**
 * Every `/locales/<lang>/<namespace>.json` file becomes a top-level namespace
 * named after the file (`t("common.actions.retry")`). Static imports keep the
 * bundler and TypeScript fully aware of the keys.
 *
 * Spanish is the reference shape: `en` is typed against it, so a missing or
 * extra key in English is a compile error.
 *
 * Adding a namespace: create the JSON file in BOTH languages, import them here
 * and add them to both objects below.
 */
const es = {
  common: esCommon,
  validation: esValidation,
  errors: esErrors,
  status: esStatus,
  home: esHome,
  meta: esMeta,
};

export type AppMessages = typeof es;

const en: AppMessages = {
  common: enCommon,
  validation: enValidation,
  errors: enErrors,
  status: enStatus,
  home: enHome,
  meta: enMeta,
};

export const MESSAGES: Record<AppLocale, AppMessages> = { es, en };
