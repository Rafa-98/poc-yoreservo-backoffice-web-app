import esCommon from "@locales/es/common.json";
import esErrors from "@locales/es/errors.json";
import esHome from "@locales/es/home.json";
import esMeta from "@locales/es/meta.json";
import esStatus from "@locales/es/status.json";
import esValidation from "@locales/es/validation.json";
import esAuth from "@locales/es/auth.json";
import esShell from "@locales/es/shell.json";
import esAgenda from "@locales/es/agenda.json";
import esTreasury from "@locales/es/treasury.json";
import esVenues from "@locales/es/venues.json";
import esUsers from "@locales/es/users.json";
import esCatalogs from "@locales/es/catalogs.json";
import esReservations from "@locales/es/reservations.json";
import esSettlements from "@locales/es/settlements.json";
import esDashboard from "@locales/es/dashboard.json";
import esProfile from "@locales/es/profile.json";

import enCommon from "@locales/en/common.json";
import enErrors from "@locales/en/errors.json";
import enHome from "@locales/en/home.json";
import enMeta from "@locales/en/meta.json";
import enStatus from "@locales/en/status.json";
import enValidation from "@locales/en/validation.json";
import enAuth from "@locales/en/auth.json";
import enShell from "@locales/en/shell.json";
import enAgenda from "@locales/en/agenda.json";
import enTreasury from "@locales/en/treasury.json";
import enVenues from "@locales/en/venues.json";
import enUsers from "@locales/en/users.json";
import enCatalogs from "@locales/en/catalogs.json";
import enReservations from "@locales/en/reservations.json";
import enSettlements from "@locales/en/settlements.json";
import enDashboard from "@locales/en/dashboard.json";
import enProfile from "@locales/en/profile.json";

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
  auth: esAuth,
  shell: esShell,
  agenda: esAgenda,
  treasury: esTreasury,
  venues: esVenues,
  users: esUsers,
  catalogs: esCatalogs,
  reservations: esReservations,
  settlements: esSettlements,
  dashboard: esDashboard,
  profile: esProfile,
};

export type AppMessages = typeof es;

const en: AppMessages = {
  common: enCommon,
  validation: enValidation,
  errors: enErrors,
  status: enStatus,
  home: enHome,
  meta: enMeta,
  auth: enAuth,
  shell: enShell,
  agenda: enAgenda,
  treasury: enTreasury,
  venues: enVenues,
  users: enUsers,
  catalogs: enCatalogs,
  reservations: enReservations,
  settlements: enSettlements,
  dashboard: enDashboard,
  profile: enProfile,
};

export const MESSAGES: Record<AppLocale, AppMessages> = { es, en };
