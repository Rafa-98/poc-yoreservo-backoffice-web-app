"use client";

import React from "react";
import { useTranslations } from "next-intl";
import type { ReservationKpis } from "../model/types";

interface ReservationsKpiStripProps {
  kpis: ReservationKpis;
  bcvRate: number;
}

export function ReservationsKpiStrip({ kpis, bcvRate }: ReservationsKpiStripProps) {
  const t = useTranslations("reservations.kpis");

  const formattedUsd = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(kpis.volumeUsd);

  const formattedVes = new Intl.NumberFormat("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(kpis.volumeVes > 0 ? kpis.volumeVes : kpis.volumeUsd * bcvRate);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Bookings */}
      <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {t("totalBookings")}
        </div>
        <div className="mt-2 font-display text-3xl font-extrabold text-foreground" id="kpi-total">
          {kpis.totalBookings}
        </div>
        <div className="mt-1 text-xs font-semibold text-accent">
          {t("totalGrowth")}
        </div>
      </div>

      {/* 2. Confirmed & Paid */}
      <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {t("confirmedPaid")}
        </div>
        <div className="mt-2 font-display text-3xl font-extrabold text-emerald-400" id="kpi-confirmed">
          {kpis.confirmedCount}
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          {t("confirmedDesc")}
        </div>
      </div>

      {/* 3. Walk-in Desk */}
      <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {t("walkInDesk")}
        </div>
        <div className="mt-2 font-display text-3xl font-extrabold text-sky-400" id="kpi-walkin">
          {kpis.walkinCount}
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          {t("walkInDesc")}
        </div>
      </div>

      {/* 4. Billing Volume */}
      <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {t("billingVolume")}
        </div>
        <div className="mt-2 font-display text-3xl font-extrabold text-accent" id="kpi-volume">
          {formattedUsd}
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          ≈ {formattedVes} Bs. (Ref: {bcvRate.toFixed(2)})
        </div>
      </div>
    </div>
  );
}
