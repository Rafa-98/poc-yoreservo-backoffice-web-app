import React from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { requireSession } from "@/shared/auth/index.server";
import { ROUTE_ALLOWED_ROLES, ROUTES } from "@/shared/config";
import { DEFAULT_BCV_USD_RATE } from "@/shared/lib";
import { getReservationsAction } from "@/features/reservations/actions/reservations-actions";
import {
  getSpacesAction,
  getVenuesListAction,
} from "@/features/venues/actions/venues-actions";
import { getExchangeRatesAction } from "@/features/treasury/actions/treasury-actions";
import { ReservationsPage } from "@/_pages/reservations/reservations-page";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("reservations");
  return {
    title: `${t("title")} | YoReservo Backoffice`,
    description: t("subtitle"),
  };
}

export default async function Page() {
  await requireSession(ROUTE_ALLOWED_ROLES[ROUTES.reservations]);

  const [resRes, venuesRes, ratesRes] = await Promise.all([
    getReservationsAction(),
    getVenuesListAction(),
    getExchangeRatesAction(),
  ]);

  const venues = venuesRes.ok && venuesRes.data ? venuesRes.data : [];
  const bcvRate =
    ratesRes.ok && ratesRes.data?.activeUsd
      ? ratesRes.data.activeUsd.rate
      : DEFAULT_BCV_USD_RATE;

  const initialReservations = resRes.ok && resRes.data ? resRes.data.items : [];
  const initialKpis =
    resRes.ok && resRes.data
      ? resRes.data.kpis
      : {
          totalBookings: 0,
          confirmedCount: 0,
          walkinCount: 0,
          volumeUsd: 0,
          volumeVes: 0,
        };

  // Fetch spaces for the first venue or all venues
  const targetVenueId = venues[0]?.id || "";
  const spacesRes = targetVenueId ? await getSpacesAction(targetVenueId) : null;
  const rawSpaces = spacesRes?.ok && spacesRes.data ? spacesRes.data : [];

  const spaces = rawSpaces.map((s) => ({
    id: s.id,
    name: s.spaceNumber.toLowerCase().includes("cancha")
      ? s.spaceNumber
      : `Cancha ${s.spaceNumber}`,
    venueId: s.venueId,
    pricePerHour: s.pricePerHour,
  }));

  const mappedVenues = venues.map((v) => ({ id: v.id, name: v.name }));

  return (
    <ReservationsPage
      initialReservations={initialReservations}
      initialKpis={initialKpis}
      venues={mappedVenues}
      spaces={spaces}
      bcvRate={bcvRate}
    />
  );
}
