"use client";

import React from "react";
import { useTranslations } from "next-intl";
import type { SettlementsKpis } from "../model/types";

interface SettlementsKpiStripProps {
  kpis: SettlementsKpis;
  bcvRate: number;
}

export function SettlementsKpiStrip({ kpis, bcvRate }: SettlementsKpiStripProps) {
  const t = useTranslations("settlements");

  const gmvBs = kpis.gmv * bcvRate;
  const feeBs = kpis.fee * bcvRate;
  const pendingBs = kpis.pendingAmount * bcvRate;
  const disbursedBs = kpis.disbursedAmount * bcvRate;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Metric 1: GMV */}
      <div className="card p-5 border-l-4 border-l-status-available-fg flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {t("kpiGmvTitle")}
          </span>
          <span className="rounded-full bg-status-available-bg border border-status-available-border px-2 py-0.5 text-[11px] font-bold text-status-available-fg">
            ↑ +14.2%
          </span>
        </div>
        <div className="mt-3">
          <div className="font-display text-2xl font-black text-foreground">
            ${kpis.gmv.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>≈ Bs. {gmvBs.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <span>•</span>
            <span>{kpis.completedBookingsCount} {t("kpiGmvSub")}</span>
          </div>
        </div>
      </div>

      {/* Metric 2: Platform Fee */}
      <div className="card p-5 border-l-4 border-l-accent flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {t("kpiFeeTitle")}
          </span>
          <span className="rounded-full bg-accent/20 border border-accent/40 px-2 py-0.5 text-[11px] font-bold text-foreground">
            {t("kpiFeeBadge")}
          </span>
        </div>
        <div className="mt-3">
          <div className="font-display text-2xl font-black text-link">
            ${kpis.fee.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>≈ Bs. {feeBs.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <span>•</span>
            <span>{t("kpiFeeSub")}</span>
          </div>
        </div>
      </div>

      {/* Metric 3: Pending Payouts */}
      <div className="card p-5 border-l-4 border-l-status-hold-fg flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {t("kpiPendingTitle")}
          </span>
          <span className="rounded-full bg-status-hold-bg border border-status-hold-border px-2 py-0.5 text-[11px] font-bold text-status-hold-fg">
            {kpis.pendingCount} {t("kpiPendingBadge")}
          </span>
        </div>
        <div className="mt-3">
          <div className="font-display text-2xl font-black text-status-hold-fg">
            ${kpis.pendingAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>≈ Bs. {pendingBs.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <span>•</span>
            <span>{t("kpiPendingSub")}</span>
          </div>
        </div>
      </div>

      {/* Metric 4: Disbursed Payouts */}
      <div className="card p-5 border-l-4 border-l-status-confirmed-fg flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {t("kpiPaidTitle")}
          </span>
          <span className="rounded-full bg-status-confirmed-bg border border-status-confirmed-border px-2 py-0.5 text-[11px] font-bold text-status-confirmed-fg">
            {kpis.disbursedCount} {t("batches")}
          </span>
        </div>
        <div className="mt-3">
          <div className="font-display text-2xl font-black text-foreground">
            ${kpis.disbursedAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>≈ Bs. {disbursedBs.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <span>•</span>
            <span>{t("kpiPaidSub")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
