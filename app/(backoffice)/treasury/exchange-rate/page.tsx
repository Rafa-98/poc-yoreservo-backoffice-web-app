import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ExchangeRatePage } from "@/_pages/treasury/exchange-rate-page";
import { getExchangeRatesAction } from "@/features/treasury/actions/treasury-actions";
import { requireSession } from "@/shared/auth/index.server";
import { ROUTE_ALLOWED_ROLES, ROUTES } from "@/shared/config";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("treasury.rate");
  return {
    title: t("title"),
    description: t("subtitle"),
  };
}

export default async function Page() {
  const [session, ratesRes] = await Promise.all([
    requireSession(ROUTE_ALLOWED_ROLES[ROUTES.exchangeRate]),
    getExchangeRatesAction(),
  ]);

  const initialData = ratesRes.ok
    ? ratesRes.data
    : {
        activeUsd: null,
        activeEur: null,
        history: [],
        lastSync: "—",
        secondaryCurrencies: [],
      };

  const operatorName = session?.user?.name
    ? `${session.user.name} (${session.user.role})`
    : "YoReservo Tesorería (Backoffice)";

  return (
    <ExchangeRatePage
      initialData={initialData}
      operatorName={operatorName}
      userRole={session.user.role}
    />
  );
}
