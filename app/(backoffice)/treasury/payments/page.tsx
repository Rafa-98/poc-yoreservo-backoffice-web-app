import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PaymentsInboxPage } from "@/_pages/treasury/payments-inbox-page";
import { getPaymentsInboxAction } from "@/features/treasury/actions/treasury-actions";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("treasury.inbox");
  return {
    title: t("title"),
    description: t("subtitle"),
  };
}

export default async function Page() {
  const res = await getPaymentsInboxAction();

  const initialData = res.ok
    ? res.data
    : {
        items: [],
        total: 0,
        kpis: {
          pendingCount: 0,
          pendingAmountBs: 0,
          pendingAmountUsd: 0,
          verifiedTodayCount: 0,
          rejectedCount: 0,
          averageSpeedMin: "4.2 min",
        },
      };

  return <PaymentsInboxPage initialData={initialData} />;
}
