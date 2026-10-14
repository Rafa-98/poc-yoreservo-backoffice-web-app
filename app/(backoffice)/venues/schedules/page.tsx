import React from "react";
import { Metadata } from "next";
import { requireSession } from "@/shared/auth/index.server";
import { ROUTE_ALLOWED_ROLES, ROUTES } from "@/shared/config";
import {
  getSpaceSchedulesAction,
  getSpacesAction,
  getVenuesListAction,
} from "@/features/venues/actions/venues-actions";
import { SchedulesPage } from "@/_pages/venues/schedules-page";

export const metadata: Metadata = {
  title: "Turnos Semanales & Horarios | YoReservo Backoffice",
  description:
    "Configuración visual de horarios de apertura, turnos partidos (split-shifts) y sincronización de recintos deportivos.",
};

interface PageProps {
  searchParams: Promise<{ venueId?: string; spaceId?: string }>;
}

export default async function Page({ searchParams }: PageProps) {
  await requireSession(ROUTE_ALLOWED_ROLES[ROUTES.schedules]);
  const params = await searchParams;

  const venuesRes = await getVenuesListAction();
  const venues = venuesRes.ok && venuesRes.data ? venuesRes.data : [];

  const targetVenueId = params.venueId || venues[0]?.id || "";
  const spacesRes = targetVenueId ? await getSpacesAction(targetVenueId) : null;
  const spaces = spacesRes?.ok && spacesRes.data ? spacesRes.data : [];

  const targetSpaceId = params.spaceId || spaces[0]?.id || "";
  const schedulesRes = targetSpaceId
    ? await getSpaceSchedulesAction(targetSpaceId)
    : null;
  const initialSchedules =
    schedulesRes?.ok && schedulesRes.data ? schedulesRes.data : null;

  return (
    <SchedulesPage
      initialVenues={venues}
      initialVenueId={targetVenueId}
      initialSpaces={spaces}
      initialSpaceId={targetSpaceId}
      initialSchedules={initialSchedules}
    />
  );
}
