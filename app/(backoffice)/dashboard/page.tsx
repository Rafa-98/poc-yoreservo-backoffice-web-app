import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ExecutiveDashboardPage } from "@/_pages/dashboard/executive-dashboard-page";
import { getDashboardSummaryAction } from "@/features/dashboard/actions/dashboard-actions";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("dashboard");
  return {
    title: `${t("title")} | YoReservo Backoffice`,
    description: t("subtitle"),
  };
}

export default async function Page() {
  const initialData = await getDashboardSummaryAction();

  return <ExecutiveDashboardPage initialData={initialData} />;
}
