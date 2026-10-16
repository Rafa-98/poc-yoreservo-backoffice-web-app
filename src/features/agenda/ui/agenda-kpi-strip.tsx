"use client";

import { useTranslations } from "next-intl";
import {
  CalendarDays,
  Clock,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { DEFAULT_BCV_USD_RATE, useTimeFormat } from "@/shared/lib";
import type { CourtSpace } from "../model/types";

export interface AgendaKpiStripProps {
  spaces: CourtSpace[];
  bcvRate?: number;
  totalAvailableSlots?: number;
}

export function AgendaKpiStrip({
  spaces,
  bcvRate = DEFAULT_BCV_USD_RATE,
  totalAvailableSlots,
}: AgendaKpiStripProps) {
  const t = useTranslations("agenda");
  const { formatTime } = useTimeFormat();

  // Calculate statistics
  let totalSlots = 0;
  let occupiedSlots = 0;
  let totalBookings = 0;
  let paidBookings = 0;
  let totalRevenue = 0;
  let nextMatchTime: string | null = null;
  let nextMatchCourt: string | null = null;

  const nowMinutes =
    new Date().getHours() * 60 + new Date().getMinutes();

  spaces.forEach((space) => {
    // Total shifts for space
    space.shifts.forEach((shift) => {
      const [openH] = shift.openTime.split(":").map(Number);
      const [closeH] = shift.closeTime.split(":").map(Number);
      const count = Math.max(1, closeH - openH);
      totalSlots += count;
    });

    // Reservations
    space.reservations.forEach((r) => {
      totalBookings++;
      const [sH] = r.startTime.split(":").map(Number);
      const [eH] = r.endTime.split(":").map(Number);
      occupiedSlots += Math.max(1, eH - sH);
      totalRevenue += r.totalAmount;
      if (r.status === "CONFIRMED" || r.status === "COMPLETED") {
        paidBookings++;
      }

      // Check next match
      const [rH, rM] = r.startTime.split(":").map(Number);
      const rMinutes = rH * 60 + rM;
      if (rMinutes >= nowMinutes) {
        if (
          !nextMatchTime ||
          rMinutes <
            Number(nextMatchTime.split(":")[0]) * 60 +
              Number(nextMatchTime.split(":")[1])
        ) {
          nextMatchTime = r.startTime;
          nextMatchCourt = space.spaceNumber;
        }
      }
    });

    // Space Blocks
    space.blocks.forEach((b) => {
      const [bsH] = b.startTime.split(":").map(Number);
      const [beH] = b.endTime.split(":").map(Number);
      occupiedSlots += Math.max(1, beH - bsH);
    });
  });

  const resolvedTotalSlots = totalAvailableSlots ?? totalSlots;
  const occupancyRate =
    resolvedTotalSlots > 0
      ? Math.round((occupiedSlots / resolvedTotalSlots) * 100)
      : 0;
  const revenueVes = Math.round(totalRevenue * bcvRate);

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
      {/* 1. Occupancy */}
      <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs">
        <div className="flex items-center justify-between text-muted-foreground mb-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider">
            {t("kpiOccupancy")}
          </span>
          <div className="flex size-7 items-center justify-center rounded-lg bg-status-available-bg text-status-available-fg">
            <TrendingUp className="size-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-display text-2xl font-bold text-status-available-fg">
            {occupancyRate}%
          </span>
          <span className="text-xs text-muted-foreground font-medium">
            {occupiedSlots} / {Math.max(occupiedSlots, resolvedTotalSlots)}{" "}
            {t("kpiSlotsUnit")}
          </span>
        </div>
      </div>

      {/* 2. Reservations */}
      <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs">
        <div className="flex items-center justify-between text-muted-foreground mb-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider">
            {t("kpiReservations")}
          </span>
          <div className="flex size-7 items-center justify-center rounded-lg bg-blue-500/15 text-blue-600">
            <CalendarDays className="size-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-display text-2xl font-bold text-foreground">
            {t("kpiMatchesCount", { count: totalBookings })}
          </span>
          <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-[10px] font-bold text-blue-600">
            {t("kpiPaidCount", { count: paidBookings })}
          </span>
        </div>
      </div>

      {/* 3. Revenue */}
      <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs">
        <div className="flex items-center justify-between text-muted-foreground mb-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider">
            {t("kpiRevenue")}
          </span>
          <div className="flex size-7 items-center justify-center rounded-lg bg-accent/20 text-accent-foreground">
            <DollarSign className="size-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-display text-2xl font-bold text-link">
            ${totalRevenue.toFixed(2)}
          </span>
          <span className="text-xs text-muted-foreground font-medium">
            Bs. {revenueVes.toLocaleString("es-VE")}
          </span>
        </div>
      </div>

      {/* 4. Next Match */}
      <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs">
        <div className="flex items-center justify-between text-muted-foreground mb-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider">
            {t("kpiNextMatch")}
          </span>
          <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600">
            <Clock className="size-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-display text-base sm:text-lg font-bold text-foreground truncate">
            {nextMatchTime
              ? `${formatTime(nextMatchTime)} • ${nextMatchCourt}`
              : t("kpiNoMatches")}
          </span>
          {nextMatchTime && (
            <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300">
              {t("kpiUpcomingBadge")}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}

