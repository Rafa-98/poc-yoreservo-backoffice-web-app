import React from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { requireSession } from "@/shared/auth/index.server";
import { ROUTE_ALLOWED_ROLES, ROUTES } from "@/shared/config";
import {
  DEFAULT_BCV_EUR_RATE,
  DEFAULT_BCV_USD_RATE,
  todayInTimezone,
} from "@/shared/lib";
import { getReservationsAction } from "@/features/reservations/actions/reservations-actions";
import { getCurrentWeekBounds } from "@/features/reservations/model/types";
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
  const session = await requireSession(ROUTE_ALLOWED_ROLES[ROUTES.reservations]);
  const todayIso = todayInTimezone("America/Caracas");
  const weekBounds = getCurrentWeekBounds(todayIso);

  const [resRes, venuesRes, ratesRes, spacesRes] = await Promise.all([
    getReservationsAction({
      fromDate: weekBounds.fromDate,
      toDate: weekBounds.toDate,
    }),
    getVenuesListAction(),
    getExchangeRatesAction(),
    getSpacesAction("ALL"),
  ]);

  const venues = venuesRes.ok && venuesRes.data ? venuesRes.data : [];

  const bcvRate =
    (resRes.ok && resRes.data?.activeUsdRate) ||
    (ratesRes.ok && ratesRes.data?.activeUsd ? ratesRes.data.activeUsd.rate : null) ||
    DEFAULT_BCV_USD_RATE;

  const bcvEurRate =
    (resRes.ok && resRes.data?.activeEurRate) ||
    (ratesRes.ok && ratesRes.data?.activeEur ? ratesRes.data.activeEur.rate : null) ||
    DEFAULT_BCV_EUR_RATE;

  const referenceCurrencyCode =
    (resRes.ok && resRes.data?.referenceCurrencyCode) ||
    venues[0]?.referenceCurrencyCode ||
    "USD";

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
          referenceCurrencyCode,
        };

  const rawSpaces = spacesRes?.ok && spacesRes.data ? spacesRes.data : [];

  const spaces = rawSpaces.map((s) => ({
    id: s.id,
    name: s.spaceNumber.toLowerCase().includes("cancha")
      ? s.spaceNumber
      : `Cancha ${s.spaceNumber}`,
    venueId: s.venueId,
    pricePerHour: s.pricePerHour,
  }));

  const mappedVenues = venues.map((v) => ({
    id: v.id,
    organizationId: v.organizationId,
    organizationName: v.organizationName,
    organizationLegalName: v.organizationLegalName,
    organizationRif: v.organizationRif,
    name: v.name,
    referenceCurrencyCode: v.referenceCurrencyCode || referenceCurrencyCode,
    spacesCount:
      v.spacesCount ??
      rawSpaces.filter((sp) => sp.venueId === v.id).length,
  }));

  return (
    <ReservationsPage
      initialReservations={initialReservations}
      initialKpis={initialKpis}
      venues={mappedVenues}
      spaces={spaces}
      bcvRate={bcvRate}
      bcvEurRate={bcvEurRate}
      referenceCurrencyCode={referenceCurrencyCode}
      userRole={session.user.role}
    />
  );
}
