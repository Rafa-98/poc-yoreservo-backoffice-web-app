import React from "react";
import { Metadata } from "next";
import { cookies } from "next/headers";
import { requireSession } from "@/shared/auth/index.server";
import { ROUTE_ALLOWED_ROLES, ROUTES } from "@/shared/config";
import {
  getSpaceSchedulesAction,
  getSpacesAction,
  getVenuesListAction,
} from "@/features/venues/actions/venues-actions";
import { deriveOrganizationsFromVenues } from "@/features/venues/model/types";
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
  const session = await requireSession(ROUTE_ALLOWED_ROLES[ROUTES.schedules]);
  const params = await searchParams;
  const cookieStore = await cookies();
  const savedOrgCookie = cookieStore.get("yoreservo_active_org")?.value;
  const savedVenueCookie = cookieStore.get("yoreservo_active_venue")?.value;

  const [venuesRes, spacesRes] = await Promise.all([
    getVenuesListAction(),
    getSpacesAction("ALL"),
  ]);

  const venues = venuesRes.ok && venuesRes.data ? venuesRes.data : [];
  const spaces = spacesRes.ok && spacesRes.data ? spacesRes.data : [];

  const isPlatformRole =
    session.user.role === "PLATFORM_ADMIN" ||
    session.user.role === "PLATFORM_ACCOUNTING";
  const orgs = deriveOrganizationsFromVenues(venues);
  const resolvedOrgId = isPlatformRole
    ? savedOrgCookie === "ALL" ||
      (savedOrgCookie && orgs.some((o) => o.id === savedOrgCookie))
      ? savedOrgCookie
      : orgs[0]?.id || "ALL"
    : orgs[0]?.id || "ALL";

  const orgVenueIds =
    resolvedOrgId && resolvedOrgId !== "ALL"
      ? new Set(
          venues
            .filter((v) => v.organizationId === resolvedOrgId)
            .map((v) => v.id),
        )
      : null;

  const matchedSpaceById = params.spaceId
    ? spaces.find((s) => s.id === params.spaceId)
    : undefined;
  const effectiveVenueParam =
    params.venueId ||
    (savedVenueCookie && savedVenueCookie !== "ALL"
      ? savedVenueCookie
      : undefined);
  const matchedSpaceByVenue =
    !matchedSpaceById && effectiveVenueParam
      ? spaces.find((s) => s.venueId === effectiveVenueParam)
      : undefined;
  const matchedSpaceByOrg =
    !matchedSpaceById && !matchedSpaceByVenue && orgVenueIds
      ? spaces.find((s) => orgVenueIds.has(s.venueId))
      : undefined;

  const targetSpace =
    matchedSpaceById ||
    matchedSpaceByVenue ||
    matchedSpaceByOrg ||
    spaces[0];
  const targetSpaceId = targetSpace?.id || "";
  const targetVenueId =
    targetSpace?.venueId || effectiveVenueParam || venues[0]?.id || "";

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
