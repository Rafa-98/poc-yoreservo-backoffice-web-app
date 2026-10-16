"use client";

import Link from "next/link";
import { Zap, ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { ROUTES } from "@/shared/config";

interface DashboardAdminBannerProps {
  pendingPaymentsCount?: number;
  pendingSettlementBatchesCount?: number;
  pendingSettlementAmountUsd?: number;
}

export function DashboardAdminBanner({
  pendingPaymentsCount = 0,
  pendingSettlementBatchesCount = 0,
  pendingSettlementAmountUsd = 0,
}: DashboardAdminBannerProps) {
  const t = useTranslations("dashboard");
  const isAllClear =
    pendingPaymentsCount === 0 && pendingSettlementBatchesCount === 0;

  return (
    <div
      className={`rounded-2xl border p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xs ${
        isAllClear
          ? "border-emerald-500/30 bg-emerald-500/10 dark:bg-emerald-500/15"
          : "border-amber-500/30 bg-amber-500/10 dark:bg-amber-500/15"
      }`}
    >
      <div className="flex items-start gap-3.5">
        <div
          className={`flex size-10 items-center justify-center rounded-xl shrink-0 ${
            isAllClear
              ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
              : "bg-amber-500/20 text-amber-600 dark:text-amber-400"
          }`}
        >
          <Zap className="size-5" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-foreground">
            {isAllClear ? t("alerts.allClearTitle") : t("alerts.title")}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            {isAllClear
              ? t("alerts.allClearDesc")
              : t("alerts.descDynamic", {
                  payments: pendingPaymentsCount,
                  batches: pendingSettlementBatchesCount,
                  amount: pendingSettlementAmountUsd.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }),
                })}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0">
        <Link
          href={ROUTES.paymentsInbox}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 text-white font-bold text-xs shadow-xs hover:bg-amber-600 active:scale-98 transition-all flex-1 md:flex-initial"
        >
          <span>
            {t("actions.reviewPaymentsCount", { count: pendingPaymentsCount })}
          </span>
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
