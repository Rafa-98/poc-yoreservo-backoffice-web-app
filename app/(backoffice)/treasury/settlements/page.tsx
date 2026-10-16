import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SettlementsPage } from "@/_pages/treasury/settlements-page";
import {
  getExchangeRatesAction,
  getSettlementsAction,
} from "@/features/treasury/actions/treasury-actions";
import type { SettlementsKpis } from "@/features/treasury/model/types";
import { requireSession } from "@/shared/auth/index.server";
import { ROUTE_ALLOWED_ROLES, ROUTES } from "@/shared/config";
import { DEFAULT_BCV_USD_RATE } from "@/shared/lib";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("settlements");
  return {
    title: t("title"),
    description: t("subtitle"),
  };
}

const EMPTY_KPIS: SettlementsKpis = {
  gmv: 0,
  fee: 0,
  pendingAmount: 0,
  pendingCount: 0,
  disbursedAmount: 0,
  disbursedCount: 0,
  totalBatches: 0,
  completedBookingsCount: 0,
  cycleProgress: {
    completedCount: 0,
    totalCount: 0,
    percentage: 0,
    deadline: "—",
  },
};

export default async function Page() {
  const session = await requireSession(ROUTE_ALLOWED_ROLES[ROUTES.settlements]);

  const [settlementsRes, ratesRes] = await Promise.all([
    getSettlementsAction(),
    getExchangeRatesAction(),
  ]);

  const bcvRate =
    ratesRes.ok && ratesRes.data?.activeUsd
      ? ratesRes.data.activeUsd.rate
      : DEFAULT_BCV_USD_RATE;

  const initialBatches =
    settlementsRes.ok && settlementsRes.data ? settlementsRes.data.items : [];
  const initialKpis =
    settlementsRes.ok && settlementsRes.data
      ? settlementsRes.data.kpis
      : EMPTY_KPIS;

  const organizations =
    settlementsRes.ok && settlementsRes.data?.organizations?.length
      ? settlementsRes.data.organizations
      : Array.from(
          new Map(
            initialBatches.map((b) => [
              b.organizationId,
              { id: b.organizationId, name: b.organization?.tradeName },
            ]),
          ).values(),
        );

  return (
    <SettlementsPage
      initialBatches={initialBatches}
      initialKpis={initialKpis}
      organizations={organizations}
      bcvRate={bcvRate}
      userRole={session.user.role}
    />
  );
}
