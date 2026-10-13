"use client";

import Link from "next/link";
import { Zap, ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { ROUTES } from "@/shared/config";

export function DashboardAdminBanner() {
  const t = useTranslations("dashboard");

  return (
    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 dark:bg-amber-500/15 p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xs">
      <div className="flex items-start gap-3.5">
        <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
          <Zap className="size-5" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-foreground">
            {t("alerts.title")}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            {t("alerts.desc")}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0">
        <Link
          href={ROUTES.paymentsInbox}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 text-white font-bold text-xs shadow-xs hover:bg-amber-600 active:scale-98 transition-all flex-1 md:flex-initial"
        >
          <span>{t("actions.reviewPayments")}</span>
          <ArrowRight className="size-3.5" />
        </Link>
        <Link
          href={ROUTES.settlements}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-border bg-surface text-foreground font-semibold text-xs shadow-2xs hover:bg-surface-muted active:scale-98 transition-all flex-1 md:flex-initial"
        >
          <span>{t("actions.reviewSettlements")}</span>
          <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </div>
  );
}
