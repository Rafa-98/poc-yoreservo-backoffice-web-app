import React from "react";
import { Metadata } from "next";
import { cookies } from "next/headers";
import { requireSession } from "@/shared/auth/index.server";
import { ROUTE_ALLOWED_ROLES, ROUTES } from "@/shared/config";
import { DEFAULT_BCV_EUR_RATE, DEFAULT_BCV_USD_RATE } from "@/shared/lib";
import {
  getCategoriesAction,
  getOrganizationAction,
  getSpacesAction,
  getVenuesListAction,
} from "@/features/venues/actions/venues-actions";
import { deriveOrganizationsFromVenues } from "@/features/venues/model/types";
import {
  getAmenitiesAction,
  getSurfacesAction,
} from "@/features/catalogs/actions/catalogs-actions";
import { getExchangeRatesAction } from "@/features/treasury/actions/treasury-actions";
import { SpacesPage } from "@/_pages/venues/spaces-page";

export const metadata: Metadata = {
  title: "Configurador de Canchas & Tarifas | YoReservo Backoffice",
  description:
    "Configuración de canchas, formatos deportivos, superficies, tarifas por hora y protección operativa de reservas.",
};

interface PageProps {
  searchParams: Promise<{ venueId?: string }>;
}

export default async function Page({ searchParams }: PageProps) {
  const session = await requireSession(ROUTE_ALLOWED_ROLES[ROUTES.spaces]);
  const params = await searchParams;
  const cookieStore = await cookies();
  const savedVenueCookie = cookieStore.get("yoreservo_active_venue")?.value;
  const savedOrgCookie = cookieStore.get("yoreservo_active_org")?.value;

  const [venuesRes, catsRes, orgRes, ratesRes, surfacesRes, amenitiesRes] =
    await Promise.all([
      getVenuesListAction(),
      getCategoriesAction(),
      getOrganizationAction(),
      getExchangeRatesAction(),
      getSurfacesAction(),
      getAmenitiesAction(),
    ]);

  const venues = venuesRes.ok && venuesRes.data ? venuesRes.data : [];
  const categories = catsRes.ok && catsRes.data ? catsRes.data : [];
  const surfaces = surfacesRes.ok && surfacesRes.data ? surfacesRes.data : [];
  const amenities =
    amenitiesRes.ok && amenitiesRes.data ? amenitiesRes.data : [];
  const referenceCurrencyCode =
    orgRes.ok && orgRes.data ? orgRes.data.referenceCurrencyCode : "USD";
  const isEur = referenceCurrencyCode === "EUR";
  const bcvRate = isEur
    ? ratesRes.ok && ratesRes.data?.activeEur
      ? ratesRes.data.activeEur.rate
      : DEFAULT_BCV_EUR_RATE
    : ratesRes.ok && ratesRes.data?.activeUsd
      ? ratesRes.data.activeUsd.rate
      : DEFAULT_BCV_USD_RATE;

  const isPlatformRole =
    session.user.role === "PLATFORM_ADMIN" ||
    session.user.role === "PLATFORM_ACCOUNTING";
  const orgs = deriveOrganizationsFromVenues(venues);
  const resolvedOrgId = isPlatformRole
    ? savedOrgCookie === "ALL" ||
      (savedOrgCookie && orgs.some((o) => o.id === savedOrgCookie))
      ? savedOrgCookie
      : orgs[0]?.id || "ALL"
    : orgs[0]?.id || "ALL";

  const targetVenueId = params.venueId || savedVenueCookie || "ALL";
  const queryVenueParam =
    targetVenueId === "ALL" && isPlatformRole && resolvedOrgId !== "ALL"
      ? `ORG:${resolvedOrgId}`
      : targetVenueId || venues[0]?.id || "";

  const spacesRes = queryVenueParam
    ? await getSpacesAction(queryVenueParam)
    : null;
  const spaces = spacesRes?.ok && spacesRes.data ? spacesRes.data : [];

  return (
    <SpacesPage
      initialVenues={venues}
      initialVenueId={targetVenueId}
      initialSpaces={spaces}
      categories={categories}
      surfaces={surfaces}
      amenities={amenities}
      bcvRate={bcvRate}
      referenceCurrencyCode={referenceCurrencyCode}
    />
  );
}
