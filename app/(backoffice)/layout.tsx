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
      const res = await getPaymentsInboxAction({ status: "PENDING" });
      if (res.ok && res.data) {
        pendingPaymentsCount =
          res.data.kpis?.pendingCount ?? res.data.items?.length ?? 0;
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
