"use client";

import { useTranslations } from "next-intl";
import { TrendingUp, Clock } from "lucide-react";
import type { AllyKpisData } from "../model/types";

interface DashboardAllyKpisProps {
  bcvRate: number;
  pendingCheckInCount: number;
  allyKpis?: AllyKpisData;
}

export function DashboardAllyKpis({
  bcvRate,
  pendingCheckInCount,
  allyKpis,
}: DashboardAllyKpisProps) {
  const t = useTranslations("dashboard");

  const todayNet = allyKpis?.todayNetRevenue ?? 0;
  const occupiedSlots = allyKpis?.occupiedSlots ?? 0;
  const totalSlots = allyKpis?.totalSlots ?? 0;
  const availableWalkInSlots = allyKpis?.availableWalkInSlots ?? 0;
  const occupancyPeakText =
    allyKpis?.occupancyPeakPct ||
    (allyKpis?.occupancyPct !== undefined
      ? `${allyKpis.occupancyPct.toFixed(1)}%`
      : "0.0%");
  const netSharePct = allyKpis?.netSharePct ?? 95;
  const checkedInMatches = allyKpis?.checkedInMatches ?? 0;
  const playersOnCourt = allyKpis?.playersOnCourt ?? 0;

  const formatBs = (val: number) =>
    `≈ Bs. ${(val * bcvRate).toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Ally KPI 1: Occupancy */}
      <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs border-l-4 border-l-emerald-500">
        <div className="flex items-center justify-between text-muted-foreground mb-2">
          <span className="text-xs font-bold uppercase tracking-wider">
            {t("kpis.allyOccupancy")}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
            <TrendingUp className="size-3" />
            <span>
              {t("kpis.allyOccupancyBadgeDynamic", { pct: occupancyPeakText })}
            </span>
          </span>
        </div>
        <div className="font-display text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
          {t("kpis.allyOccupancyDynamicCount", {
            occupied: occupiedSlots,
            total: totalSlots,
          })}
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          {t("kpis.allyOccupancyDynamicSub", {
            count: availableWalkInSlots,
          })}
        </div>
      </div>

      {/* Ally KPI 2: Net Revenue Today */}
      <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs border-l-4 border-l-accent">
        <div className="flex items-center justify-between text-muted-foreground mb-2">
          <span className="text-xs font-bold uppercase tracking-wider">
            {t("kpis.allyRev")}
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-accent/20 text-link border border-accent/40">
            {t("kpis.allyRevBadgeDynamic", { pct: netSharePct })}
          </span>
        </div>
        <div className="font-display text-2xl sm:text-3xl font-extrabold text-foreground">
          ${todayNet.toFixed(2)}
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          <span>{formatBs(todayNet)}</span> • <span>{t("kpis.allyRevSub")}</span>
        </div>
      </div>

      {/* Ally KPI 3: Check-in Queue */}
      <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs border-l-4 border-l-amber-500">
        <div className="flex items-center justify-between text-muted-foreground mb-2">
          <span className="text-xs font-bold uppercase tracking-wider">
            {t("kpis.allyCheckin")}
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400">
            {t("kpis.allyCheckinPending", { count: pendingCheckInCount })}
          </span>
        </div>
        <div className="font-display text-2xl sm:text-3xl font-extrabold text-foreground">
          {t("kpis.allyCheckinDynamicCount", {
            count: checkedInMatches,
          })}
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          {t("kpis.allyCheckinDynamicSub", {
            count: playersOnCourt,
          })}
        </div>
      </div>

      {/* Ally KPI 4: Next Match Countdown */}
      <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs border-l-4 border-l-blue-500">
        <div className="flex items-center justify-between text-muted-foreground mb-2">
          <span className="text-xs font-bold uppercase tracking-wider">
            {t("kpis.allyNext")}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400">
            <Clock className="size-3" />
            <span>{allyKpis?.nextMatchCourt || "—"}</span>
          </span>
        </div>
        <div className="font-display text-2xl sm:text-3xl font-extrabold text-foreground">
          {allyKpis?.nextMatchTime || t("kpis.noUpcomingMatch")}
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          {allyKpis?.nextMatchDesc ||
            allyKpis?.nextCheckInText ||
            t("kpis.noUpcomingDesc")}
        </div>
      </div>
    </div>
  );
}
