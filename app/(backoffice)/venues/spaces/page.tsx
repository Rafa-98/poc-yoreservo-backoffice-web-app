import React from "react";
import { Metadata } from "next";
import { requireSession } from "@/shared/auth/index.server";
import { ROUTE_ALLOWED_ROLES, ROUTES } from "@/shared/config";
import { DEFAULT_BCV_EUR_RATE, DEFAULT_BCV_USD_RATE } from "@/shared/lib";
import {
  getCategoriesAction,
  getOrganizationAction,
  getSpacesAction,
  getVenuesListAction,
} from "@/features/venues/actions/venues-actions";
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
  await requireSession(ROUTE_ALLOWED_ROLES[ROUTES.spaces]);
  const params = await searchParams;

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

  const targetVenueId = params.venueId || venues[0]?.id || "";
  const spacesRes = targetVenueId ? await getSpacesAction(targetVenueId) : null;
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
