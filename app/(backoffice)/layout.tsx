import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { requireSession } from "@/shared/auth/index.server";
import { ROUTE_ALLOWED_ROLES, ROUTES } from "@/shared/config";
import { getPaymentsInboxAction } from "@/features/treasury/actions/treasury-actions";
import { getVenuesListAction } from "@/features/venues/actions/venues-actions";
import type { VenueItem } from "@/features/venues/model/types";
import { AuthenticatedLayout } from "@/_app/layouts";
import { SidebarBadgeProvider } from "@/_app/layouts/app-sidebar";

export default async function BackofficeRootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await requireSession();
  const cookieStore = await cookies();
  const savedVenueCookie = cookieStore.get("yoreservo_active_venue")?.value;

  const isManagedLocked =
    session.user.role === "ALLY_VALIDATOR" && Boolean(session.user.managedVenueId);
  const initialActiveVenueId =
    isManagedLocked && session.user.managedVenueId
      ? session.user.managedVenueId
      : savedVenueCookie || "ALL";

  let initialVenues: VenueItem[] = [];
  if (
    session.user.role === "PLATFORM_ADMIN" ||
    session.user.role === "PLATFORM_ACCOUNTING" ||
    session.user.role === "ALLY_ADMIN" ||
    session.user.role === "ALLY_ACCOUNTING" ||
    session.user.role === "ALLY_VALIDATOR"
  ) {
    try {
      const venuesRes = await getVenuesListAction();
      if (venuesRes.ok && Array.isArray(venuesRes.data)) {
        initialVenues = venuesRes.data;
      }
    } catch {
      initialVenues = [];
    }
  }

  let pendingPaymentsCount = 0;
  if (ROUTE_ALLOWED_ROLES[ROUTES.paymentsInbox].includes(session.user.role)) {
    try {
      const todayIso = new Intl.DateTimeFormat("en-CA", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        timeZone: "America/Caracas",
      }).format(new Date());
      const fromDateObj = new Date(`${todayIso}T12:00:00Z`);
      fromDateObj.setUTCDate(fromDateObj.getUTCDate() - 6);
      const fromDateIso = fromDateObj.toISOString().slice(0, 10);

      const res = await getPaymentsInboxAction({
        status: "PENDING",
        venueId:
          initialActiveVenueId && initialActiveVenueId !== "ALL"
            ? initialActiveVenueId
            : undefined,
        fromDate: fromDateIso,
        toDate: todayIso,
      });
      if (res.ok && res.data) {
        pendingPaymentsCount = (res.data.items ?? []).filter(
          (p) => p.status === "PENDING",
        ).length;
      }
    } catch {
      pendingPaymentsCount = 0;
    }
  }

  return (
    <SidebarBadgeProvider pendingPaymentsCount={pendingPaymentsCount}>
      <AuthenticatedLayout
        user={session.user}
        initialVenues={initialVenues}
        initialActiveVenueId={initialActiveVenueId}
      >
        {children}
      </AuthenticatedLayout>
    </SidebarBadgeProvider>
  );
}
