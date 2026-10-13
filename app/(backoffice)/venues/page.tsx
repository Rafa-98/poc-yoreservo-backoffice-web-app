import React from "react";
import { Metadata } from "next";
import { requireSession } from "@/shared/auth/index.server";
import {
  getLocationsTreeAction,
  getOrganizationAction,
  getVenuesListAction,
} from "@/features/venues/actions/venues-actions";
import { getExchangeRatesAction } from "@/features/treasury/actions/treasury-actions";
import { VenuesPage } from "@/_pages/venues/venues-page";

export const metadata: Metadata = {
  title: "Directorio de Recintos Deportivos | YoReservo Backoffice",
  description:
    "Gestión de recintos, sedes deportivas, datos corporativos y condiciones comerciales de la organización aliada.",
};

export default async function Page() {
  await requireSession();

  const [orgRes, venuesRes, locsRes, ratesRes] = await Promise.all([
    getOrganizationAction(),
    getVenuesListAction(),
    getLocationsTreeAction(),
    getExchangeRatesAction(),
  ]);

  const org =
    orgRes.ok && orgRes.data
      ? orgRes.data
      : {
          id: "default-org",
          tradeName: "San Agustín Sport Complex",
          legalName: "Club Deportivo San Agustín C.A.",
          rif: "J-40123456-7",
          contactEmail: "aliado@sanagustin.com",
          contactPhone: "+58 212 9912044",
          fiscalAddress: "Av. Páez, El Paraíso, Caracas",
          referenceCurrencyCode: "USD",
          payoutBank: "0102 - Banco de Venezuela",
          payoutAccountNumber: "01020000000000000001",
          payoutAccountType: "Corriente",
          payoutAccountHolder: "Club Deportivo San Agustín C.A.",
          commissionRate: 0.05,
          status: "ACTIVE",
          venuesCount: 1,
          spacesCount: 4,
        };

  const venues = venuesRes.ok && venuesRes.data ? venuesRes.data : [];
  const locationsTree = locsRes.ok && locsRes.data ? locsRes.data : [];
  const bcvRate =
    ratesRes.ok && ratesRes.data?.activeUsd ? ratesRes.data.activeUsd.rate : 41.0;

  return (
    <VenuesPage
      initialOrg={org}
      initialVenues={venues}
      locationsTree={locationsTree}
      bcvRate={bcvRate}
    />
  );
}
