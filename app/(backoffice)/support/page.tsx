import { requireSession } from "@/shared/auth/index.server";
import { ROUTE_ALLOWED_ROLES, ROUTES } from "@/shared/config";
import { getSupportTicketsAction } from "@/features/support/actions/support-actions";
import { SupportTicketsPage } from "@/_pages/support/support-tickets-page";

export const dynamic = "force-dynamic";

export default async function SupportRoute() {
  const session = await requireSession(ROUTE_ALLOWED_ROLES[ROUTES.support]);
  const res = await getSupportTicketsAction();

  const initialData = res.ok
    ? res.data
    : {
        kpis: {
          totalCount: 0,
          openCount: 0,
          inProgressCount: 0,
          resolvedCount: 0,
          feedbackCount: 0,
          bugReportCount: 0,
          averageRating: null,
        },
        items: [],
      };

  return (
    <SupportTicketsPage
      initialData={initialData}
      userRole={session.user.role}
    />
  );
}

