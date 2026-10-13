import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ExchangeRatePage } from "@/_pages/treasury/exchange-rate-page";
import { getExchangeRatesAction } from "@/features/treasury/actions/treasury-actions";
import { requireSession } from "@/shared/auth/index.server";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("treasury.rate");
  return {
    title: t("title"),
    description: t("subtitle"),
  };
}

export default async function Page() {
  const [ratesRes, session] = await Promise.all([
    getExchangeRatesAction(),
    requireSession(),
  ]);

  const initialData = ratesRes.ok
    ? ratesRes.data
    : {
        activeUsd: null,
        activeEur: null,
        history: [],
        lastSync: "Hoy a las 09:00 AM",
        secondaryCurrencies: [
          { currency: "CNY", symbol: "¥", rate: "131,03 Bs." },
          { currency: "TRY", symbol: "₺", rate: "17,77 Bs." },
          { currency: "RUB", symbol: "₽", rate: "10,34 Bs." },
        ],
      };

  const operatorName = session?.user?.name
    ? `${session.user.name} (${session.user.role})`
    : "YoReservo Tesorería (Backoffice)";

  return <ExchangeRatePage initialData={initialData} operatorName={operatorName} />;
}
