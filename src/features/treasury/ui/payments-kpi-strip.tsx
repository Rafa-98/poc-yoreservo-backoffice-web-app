"use client";

import { useTranslations } from "next-intl";
import type { TreasuryKpis } from "../model/types";

interface PaymentsKpiStripProps {
  kpis: TreasuryKpis;
}

export function PaymentsKpiStrip({ kpis }: PaymentsKpiStripProps) {
  const t = useTranslations("treasury.inbox.kpi");

  return (
    <section className="agenda-kpi-strip grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 px-5 pb-5">
      {/* 1. Pending */}
      <div className="kpi-card-mini rounded-2xl border border-border bg-surface px-4.5 py-4">
        <span className="kpi-label text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          {t("pendingTitle")}
        </span>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-[22px] font-extrabold text-status-hold-fg">
            {t("pendingCount", { count: kpis.pendingCount })}
          </span>
          <span className="text-xs text-muted-foreground">
            {t("pendingAmount", {
              bs: kpis.pendingAmountBs.toLocaleString("es-VE", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }),
              usd: kpis.pendingAmountUsd.toFixed(2),
            })}
          </span>
        </div>
      </div>

      {/* 2. Verified Today */}
      <div className="kpi-card-mini rounded-2xl border border-border bg-surface px-4.5 py-4">
        <span className="kpi-label text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          {t("verifiedToday")}
        </span>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-[22px] font-extrabold text-status-available-fg">
            {t("verifiedCount", { count: kpis.verifiedTodayCount })}
          </span>
          <span className="badge badge-available rounded-md bg-status-available-bg px-2 py-0.5 text-[10px] font-bold text-status-available-fg">
            {kpis.approvalRatePct !== undefined
              ? `${kpis.approvalRatePct}% OK`
              : t("verifiedBadge")}
          </span>
        </div>
      </div>

      {/* 3. Rejected */}
      <div className="kpi-card-mini rounded-2xl border border-border bg-surface px-4.5 py-4">
        <span className="kpi-label text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          {t("rejected")}
        </span>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-[22px] font-extrabold text-status-cancelled-fg">
            {t("rejectedCount", { count: kpis.rejectedCount })}
          </span>
          <span className="text-xs text-muted-foreground">
            {t("rejectedSub")}
          </span>
        </div>
      </div>

      {/* 4. Speed */}
      <div className="kpi-card-mini rounded-2xl border border-border bg-surface px-4.5 py-4">
        <span className="kpi-label text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          {t("speed")}
        </span>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-[22px] font-extrabold text-link">
            {kpis.averageSpeedMin || "—"}
          </span>
          <span className="text-xs text-muted-foreground">
            {t("speedTarget")}
          </span>
        </div>
      </div>
    </section>
  );
}
