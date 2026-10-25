import React from "react";
import { Metadata } from "next";
import { requireSession } from "@/shared/auth/index.server";
import { ROUTE_ALLOWED_ROLES, ROUTES } from "@/shared/config";
import { DEFAULT_BCV_EUR_RATE, DEFAULT_BCV_USD_RATE } from "@/shared/lib";
import {
  getOrganizationAction,
  getVenuesListAction,
} from "@/features/venues/actions/venues-actions";
import { getExchangeRatesAction } from "@/features/treasury/actions/treasury-actions";
import { PlatformSettingsPage } from "@/_pages/platform/platform-settings-page";

export const metadata: Metadata = {
  title: "YoReservo (Super Organización & Custodia) | YoReservo Backoffice",
  description:
    "Ficha corporativa de YoReservo Oficial, sedes propias, métodos de pago en Custodia YoReservo y canales oficiales de soporte directo para atletas.",
};

export default async function Page() {
  const session = await requireSession(ROUTE_ALLOWED_ROLES[ROUTES.platform]);

  const [orgRes, venuesRes, ratesRes] = await Promise.all([
    getOrganizationAction("PLATFORM"),
    getVenuesListAction(),
    getExchangeRatesAction(),
  ]);

  const platformOrg = orgRes.ok ? orgRes.data : undefined;

  const platformVenues =
    venuesRes.ok && Array.isArray(venuesRes.data)
      ? venuesRes.data.filter(
          (v) =>
            v.isPlatformOrg ||
            (platformOrg?.id && v.organizationId === platformOrg.id),
        )
      : [];

  const platformPaymentMethodConfigs =
    orgRes.ok && orgRes.data?.platformPaymentMethodConfigs
      ? orgRes.data.platformPaymentMethodConfigs
      : [];

  const platformConfig =
    orgRes.ok && orgRes.data?.platformConfig
      ? orgRes.data.platformConfig
      : undefined;

  const bcvRate =
    ratesRes.ok && ratesRes.data?.activeUsd
      ? ratesRes.data.activeUsd.rate
      : DEFAULT_BCV_USD_RATE;
  const bcvEurRate =
    ratesRes.ok && ratesRes.data?.activeEur
      ? ratesRes.data.activeEur.rate
      : DEFAULT_BCV_EUR_RATE;

  return (
    <PlatformSettingsPage
      initialPlatformOrg={platformOrg}
      initialPlatformVenues={platformVenues}
      initialPaymentMethods={platformPaymentMethodConfigs}
      initialPlatformConfig={platformConfig}
      bcvRate={bcvRate}
      bcvEurRate={bcvEurRate}
      userRole={session.user.role}
    />
  );
}

