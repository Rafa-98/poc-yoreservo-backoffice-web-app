import React from "react";
import { Metadata } from "next";
import { requireSession } from "@/shared/auth/index.server";
import { ROUTE_ALLOWED_ROLES, ROUTES } from "@/shared/config";
import {
  getAmenitiesAction,
  getSurfacesAction,
  getTaxonomyAction,
} from "@/features/catalogs/actions/catalogs-actions";
import { CatalogsPage } from "@/_pages/catalogs/catalogs-page";

export const metadata: Metadata = {
  title: "Catálogos Maestros & Taxonomía Deportiva | YoReservo Backoffice",
  description:
    "Gestión de taxonomía multideporte, formatos de juego, especificaciones de superficie y catálogo de amenidades.",
};

export default async function Page() {
  await requireSession(ROUTE_ALLOWED_ROLES[ROUTES.catalogs]);

  const [taxonomyRes, surfacesRes, amenitiesRes] = await Promise.all([
    getTaxonomyAction(),
    getSurfacesAction(),
    getAmenitiesAction(),
  ]);

  const taxonomy = taxonomyRes.ok && taxonomyRes.data ? taxonomyRes.data : [];
  const surfaces = surfacesRes.ok && surfacesRes.data ? surfacesRes.data : [];
  const amenities = amenitiesRes.ok && amenitiesRes.data ? amenitiesRes.data : [];

  return (
    <CatalogsPage
      initialTaxonomy={taxonomy}
      initialSurfaces={surfaces}
      initialAmenities={amenities}
    />
  );
}
