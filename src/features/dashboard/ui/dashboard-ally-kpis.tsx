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

  const todayNet = allyKpis?.todayNetRevenue ?? 665.0;
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
            <span>{t("kpis.allyOccupancyBadge")}</span>
          </span>
        </div>
        <div className="font-display text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
          {allyKpis?.occupiedSlots !== undefined && allyKpis?.totalSlots !== undefined
            ? t("kpis.allyOccupancyDynamicCount", {
                occupied: allyKpis.occupiedSlots,
                total: allyKpis.totalSlots,
              })
            : t("kpis.allyOccupancyCount")}
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          {allyKpis?.availableWalkInSlots !== undefined
            ? t("kpis.allyOccupancyDynamicSub", {
                count: allyKpis.availableWalkInSlots,
              })
            : t("kpis.allyOccupancySub")}
        </div>
      </div>

      {/* Ally KPI 2: Net Revenue Today */}
      <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs border-l-4 border-l-accent">
        <div className="flex items-center justify-between text-muted-foreground mb-2">
          <span className="text-xs font-bold uppercase tracking-wider">
            {t("kpis.allyRev")}
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-accent/20 text-accent-foreground border border-accent/40">
            {t("kpis.allyRevBadge")}
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
          {allyKpis?.checkedInMatches !== undefined
            ? t("kpis.allyCheckinDynamicCount", {
                count: allyKpis.checkedInMatches,
              })
            : t("kpis.allyCheckinCount")}
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          {allyKpis?.playersOnCourt !== undefined
            ? t("kpis.allyCheckinDynamicSub", {
                count: allyKpis.playersOnCourt,
              })
            : t("kpis.allyCheckinSub")}
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
            <span>{allyKpis?.nextMatchCourt || t("kpis.court1Badge")}</span>
          </span>
        </div>
        <div className="font-display text-2xl sm:text-3xl font-extrabold text-foreground">
          {allyKpis?.nextMatchTime || t("kpis.allyNextTime")}
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          {allyKpis?.nextMatchDesc || t("kpis.allyNextDesc")}
        </div>
      </div>
    </div>
  );
}
