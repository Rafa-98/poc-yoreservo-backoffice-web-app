import React from "react";
import { Metadata } from "next";
import { requireSession } from "@/shared/auth/index.server";
import {
  getCategoriesAction,
  getOrganizationAction,
  getSpacesAction,
  getVenuesListAction,
} from "@/features/venues/actions/venues-actions";
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
  await requireSession();
  const params = await searchParams;

  const [venuesRes, catsRes, orgRes, ratesRes] = await Promise.all([
    getVenuesListAction(),
    getCategoriesAction(),
    getOrganizationAction(),
    getExchangeRatesAction(),
  ]);

  const venues = venuesRes.ok && venuesRes.data ? venuesRes.data : [];
  const categories = catsRes.ok && catsRes.data ? catsRes.data : [];
  const referenceCurrencyCode =
    orgRes.ok && orgRes.data ? orgRes.data.referenceCurrencyCode : "USD";
  const bcvRate =
    ratesRes.ok && ratesRes.data?.activeUsd ? ratesRes.data.activeUsd.rate : 41.0;

  const targetVenueId = params.venueId || venues[0]?.id || "";
  const spacesRes = targetVenueId ? await getSpacesAction(targetVenueId) : null;
  const spaces = spacesRes?.ok && spacesRes.data ? spacesRes.data : [];

  return (
    <SpacesPage
      initialVenues={venues}
      initialVenueId={targetVenueId}
      initialSpaces={spaces}
      categories={categories}
      bcvRate={bcvRate}
      referenceCurrencyCode={referenceCurrencyCode}
    />
  );
}
