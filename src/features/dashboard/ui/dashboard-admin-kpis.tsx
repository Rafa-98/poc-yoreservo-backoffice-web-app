"use client";

import { useTranslations } from "next-intl";
import { TrendingUp } from "lucide-react";
import type { TimeframeKey, TimeframeChartData } from "../model/types";

interface DashboardAdminKpisProps {
  timeframe: TimeframeKey;
  chartData: TimeframeChartData;
  bcvRate: number;
}

export function DashboardAdminKpis({
  timeframe,
  chartData,
  bcvRate,
}: DashboardAdminKpisProps) {
  const t = useTranslations("dashboard");

  const totalGmv = chartData.gmv.reduce((a, b) => a + b, 0);
  const totalFee = chartData.fee.reduce((a, b) => a + b, 0);

  const getBookingsCount = () => {
    switch (timeframe) {
      case "HOY":
        return "84";
      case "SEMANA":
        return "612";
      case "MES":
        return "2,840";
      case "ANO":
        return "28,940";
    }
  };

  const formatCurrency = (val: number) =>
    `$${val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const formatBs = (val: number) =>
    `≈ Bs. ${(val * bcvRate).toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* KPI 1: GMV */}
      <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs border-l-4 border-l-emerald-500">
        <div className="flex items-center justify-between text-muted-foreground mb-2">
          <span className="text-xs font-bold uppercase tracking-wider">
            {t("kpis.adminGmv")}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
            <TrendingUp className="size-3" />
            <span>+18.4%</span>
          </span>
        </div>
        <div className="font-display text-2xl sm:text-3xl font-extrabold text-foreground">
          {formatCurrency(totalGmv)}
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          <span>{formatBs(totalGmv)}</span> • <span>{t("kpis.adminGmvSub")}</span>
        </div>
      </div>

      {/* KPI 2: Platform Fee */}
      <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs border-l-4 border-l-accent">
        <div className="flex items-center justify-between text-muted-foreground mb-2">
          <span className="text-xs font-bold uppercase tracking-wider">
            {t("kpis.adminFee")}
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-accent/20 text-accent-foreground border border-accent/40">
            {t("kpis.adminFeeBadge")}
          </span>
        </div>
        <div className="font-display text-2xl sm:text-3xl font-extrabold text-accent-foreground">
          {formatCurrency(totalFee)}
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          <span>{formatBs(totalFee)}</span> • <span>{t("kpis.adminFeeSub")}</span>
        </div>
      </div>

      {/* KPI 3: Bookings */}
      <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs border-l-4 border-l-blue-500">
        <div className="flex items-center justify-between text-muted-foreground mb-2">
          <span className="text-xs font-bold uppercase tracking-wider">
            {t("kpis.adminBookings")}
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400">
            {t("kpis.adminBookingsBadge")}
          </span>
        </div>
        <div className="font-display text-2xl sm:text-3xl font-extrabold text-foreground">
          {getBookingsCount()}
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          {t("kpis.adminBookingsSub")}
        </div>
      </div>

      {/* KPI 4: Active Venues */}
      <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs border-l-4 border-l-purple-500">
        <div className="flex items-center justify-between text-muted-foreground mb-2">
          <span className="text-xs font-bold uppercase tracking-wider">
            {t("kpis.adminVenues")}
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-purple-500/15 text-purple-600 dark:text-purple-400">
            {t("kpis.adminVenuesBadge")}
          </span>
        </div>
        <div className="font-display text-2xl sm:text-3xl font-extrabold text-foreground">
          {t("kpis.adminVenuesCount")}
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          {t("kpis.adminVenuesSub")}
        </div>
      </div>
    </div>
  );
}
