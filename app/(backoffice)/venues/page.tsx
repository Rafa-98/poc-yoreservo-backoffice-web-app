import React from "react";
import { Metadata } from "next";
import { requireSession } from "@/shared/auth/index.server";
import { ROUTE_ALLOWED_ROLES, ROUTES } from "@/shared/config";
import { DEFAULT_BCV_EUR_RATE, DEFAULT_BCV_USD_RATE } from "@/shared/lib";
import {
  getLocationsTreeAction,
  getOrganizationAction,
  getVenuesListAction,
} from "@/features/venues/actions/venues-actions";
import type { OrganizationData } from "@/features/venues/model/types";
import { getExchangeRatesAction } from "@/features/treasury/actions/treasury-actions";
import { VenuesPage } from "@/_pages/venues/venues-page";

export const metadata: Metadata = {
  title: "Directorio de Recintos Deportivos | YoReservo Backoffice",
  description:
    "Gestión de recintos, sedes deportivas, datos corporativos y condiciones comerciales de la organización aliada.",
};

export default async function Page() {
  await requireSession(ROUTE_ALLOWED_ROLES[ROUTES.venues]);

  const [orgRes, venuesRes, locsRes, ratesRes] = await Promise.all([
    getOrganizationAction(),
    getVenuesListAction(),
    getLocationsTreeAction(),
    getExchangeRatesAction(),
  ]);

  const org: OrganizationData =
    orgRes.ok && orgRes.data
      ? orgRes.data
      : {
          id: "",
          tradeName: "",
          legalName: "",
          rif: "",
          taxId: "",
          contactEmail: "",
          contactPhone: "",
          fiscalAddress: "",
          referenceCurrencyCode: "USD",
          payoutBank: "",
          payoutAccountNumber: "",
          payoutAccountType: "",
          payoutAccountHolder: "",
          commissionRate: 0.05,
          status: "ACTIVE",
          venuesCount: 0,
          spacesCount: 0,
        };

  const venues = venuesRes.ok && venuesRes.data ? venuesRes.data : [];
  const locationsTree = locsRes.ok && locsRes.data ? locsRes.data : [];
  const bcvRate =
    ratesRes.ok && ratesRes.data?.activeUsd
      ? ratesRes.data.activeUsd.rate
      : DEFAULT_BCV_USD_RATE;
  const bcvEurRate =
    ratesRes.ok && ratesRes.data?.activeEur
      ? ratesRes.data.activeEur.rate
      : DEFAULT_BCV_EUR_RATE;

  return (
    <VenuesPage
      initialOrg={org}
      initialVenues={venues}
      locationsTree={locationsTree}
      bcvRate={bcvRate}
      bcvEurRate={bcvEurRate}
    />
  );
}
