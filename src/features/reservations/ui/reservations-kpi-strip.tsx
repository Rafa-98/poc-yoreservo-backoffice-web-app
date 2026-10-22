"use client";

import React from "react";
import { useTranslations } from "next-intl";
import type { BackofficeRole } from "@/shared/config";
import type { ReservationKpis } from "../model/types";

interface ReservationsKpiStripProps {
  kpis: ReservationKpis;
  bcvRate: number;
  bcvEurRate?: number;
  currencyCode?: string;
  userRole?: BackofficeRole;
}

export function ReservationsKpiStrip({
  kpis,
  bcvRate,
  bcvEurRate,
  currencyCode = "USD",
  userRole,
}: ReservationsKpiStripProps) {
  const t = useTranslations("reservations.kpis");
  const isValidator = userRole === "ALLY_VALIDATOR";
  const isEur = currencyCode === "EUR";
  const effectiveRate = isEur ? (bcvEurRate ?? bcvRate) : bcvRate;

  const formattedRef = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: isEur ? "EUR" : "USD",
  }).format(kpis.volumeUsd);

  const formattedVes = new Intl.NumberFormat("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(
    kpis.volumeVes > 0 ? kpis.volumeVes : kpis.volumeUsd * effectiveRate,
  );

  return (
    <div
      className={`grid grid-cols-1 gap-4 ${
        isValidator
          ? "sm:grid-cols-3"
          : "sm:grid-cols-2 lg:grid-cols-4"
      }`}
    >
      {/* 1. Total Bookings */}
      <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {t("totalBookings")}
        </div>
        <div
          className="mt-2 font-display text-3xl font-extrabold text-foreground"
          id="kpi-total"
        >
          {kpis.totalBookings}
        </div>
        <div className="mt-1 text-xs font-semibold text-accent">
          {t("totalConfirmedRatio", {
            confirmed: kpis.confirmedCount,
            total: kpis.totalBookings,
          })}
        </div>
      </div>

      {/* 2. Confirmed & Paid */}
      <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {t("confirmedPaid")}
        </div>
        <div
          className="mt-2 font-display text-3xl font-extrabold text-emerald-400"
          id="kpi-confirmed"
        >
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
        <div
          className="mt-2 font-display text-3xl font-extrabold text-sky-400"
          id="kpi-walkin"
        >
          {kpis.walkinCount}
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          {t("walkInDesc")}
        </div>
      </div>

      {/* 4. Billing Volume — Hidden for ALLY_VALIDATOR */}
      {!isValidator && (
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {t("billingVolume")} ({isEur ? "EUR" : "USD"})
          </div>
          <div
            className="mt-2 font-display text-3xl font-extrabold text-accent"
            id="kpi-volume"
          >
            {formattedRef}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            ≈ {formattedVes} Bs. (Ref: {effectiveRate.toFixed(2)} Bs./
            {isEur ? "EUR" : "USD"})
          </div>
        </div>
      )}
    </div>
  );
}
