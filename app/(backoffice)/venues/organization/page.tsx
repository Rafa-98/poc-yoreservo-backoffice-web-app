import React from "react";
import { Metadata } from "next";
import { cookies } from "next/headers";
import { requireSession } from "@/shared/auth/index.server";
import { ROUTE_ALLOWED_ROLES, ROUTES } from "@/shared/config";
import { DEFAULT_BCV_EUR_RATE, DEFAULT_BCV_USD_RATE } from "@/shared/lib";
import {
  getOrganizationAction,
  getVenuesListAction,
} from "@/features/venues/actions/venues-actions";
import type { OrganizationData } from "@/features/venues/model/types";
import { getExchangeRatesAction } from "@/features/treasury/actions/treasury-actions";
import { OrganizationPage } from "@/_pages/venues/organization-page";

export const metadata: Metadata = {
  title: "Organización & Modalidad de Cobro | YoReservo Backoffice",
  description:
    "Gestión de datos corporativos, fiscales, cuentas bancarias de liquidación y modalidad de cobro de reservas.",
};

interface PageProps {
  searchParams?: Promise<{ organizationId?: string }>;
}

export default async function Page({ searchParams }: PageProps) {
  const session = await requireSession(ROUTE_ALLOWED_ROLES[ROUTES.organization]);
  const params = searchParams ? await searchParams : undefined;
  const cookieStore = await cookies();
  const savedOrgCookie = cookieStore.get("yoreservo_active_org")?.value;
  const targetOrgId =
    params?.organizationId ||
    (savedOrgCookie && savedOrgCookie !== "ALL" ? savedOrgCookie : undefined);

  const [orgRes, venuesRes, ratesRes] = await Promise.all([
    getOrganizationAction(targetOrgId),
    getVenuesListAction(),
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
          paymentCollectionMode: "PLATFORM_CUSTODY",
          manualCommissionRate: 0.05,
          minimumMonthlyFee: 20,
          isBookingPaused: false,
          status: "ACTIVE",
          venuesCount: 0,
          spacesCount: 0,
        };

  const venues = venuesRes.ok && venuesRes.data ? venuesRes.data : [];
  const bcvRate =
    ratesRes.ok && ratesRes.data?.activeUsd
      ? ratesRes.data.activeUsd.rate
      : DEFAULT_BCV_USD_RATE;
  const bcvEurRate =
    ratesRes.ok && ratesRes.data?.activeEur
      ? ratesRes.data.activeEur.rate
      : DEFAULT_BCV_EUR_RATE;

  return (
    <OrganizationPage
      initialOrg={org}
      initialVenues={venues}
      bcvRate={bcvRate}
      bcvEurRate={bcvEurRate}
      userRole={session.user.role}
    />
  );
}

