import React from "react";
import { Metadata } from "next";
import { requireSession } from "@/shared/auth/index.server";
import { ROUTE_ALLOWED_ROLES, ROUTES } from "@/shared/config";
import {
  getLocationsTreeAction,
  getVenuesListAction,
} from "@/features/venues/actions/venues-actions";
import { VenuesPage } from "@/_pages/venues/venues-page";

export const metadata: Metadata = {
  title: "Directorio de Recintos Deportivos | YoReservo Backoffice",
  description:
    "Gestión de recintos y sedes deportivas de la organización aliada.",
};

export default async function Page() {
  await requireSession(ROUTE_ALLOWED_ROLES[ROUTES.venues]);

  const [venuesRes, locsRes] = await Promise.all([
    getVenuesListAction(),
    getLocationsTreeAction(),
  ]);

  const venues = venuesRes.ok && venuesRes.data ? venuesRes.data : [];
  const locationsTree = locsRes.ok && locsRes.data ? locsRes.data : [];

  return (
    <VenuesPage
      initialVenues={venues}
      locationsTree={locationsTree}
    />
  );
}
