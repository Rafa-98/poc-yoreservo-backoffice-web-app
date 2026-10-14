import { getDashboardSummaryAction } from "@/features/dashboard/actions/dashboard-actions";
import { ExecutiveDashboardPage } from "./executive-dashboard-page";

export { ExecutiveDashboardPage };

export async function DashboardPage() {
  const initialData = await getDashboardSummaryAction();
  return <ExecutiveDashboardPage initialData={initialData} />;
}
