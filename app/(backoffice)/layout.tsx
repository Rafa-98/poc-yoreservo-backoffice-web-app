import type { ReactNode } from "react";
import { requireSession } from "@/shared/auth/index.server";
import { ROUTE_ALLOWED_ROLES, ROUTES } from "@/shared/config";
import { getPaymentsInboxAction } from "@/features/treasury/actions/treasury-actions";
import { AuthenticatedLayout } from "@/_app/layouts";
import { SidebarBadgeProvider } from "@/_app/layouts/app-sidebar";

export default async function BackofficeRootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await requireSession();

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
      <AuthenticatedLayout user={session.user}>
        {children}
      </AuthenticatedLayout>
    </SidebarBadgeProvider>
  );
}
