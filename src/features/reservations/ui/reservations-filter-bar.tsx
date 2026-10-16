"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { TimeFormatToggle } from "@/shared/lib/time-format";
import { Button } from "@/shared/ui/button";
import type { ReservationFilter } from "../model/types";

interface ReservationsFilterBarProps {
  filter: ReservationFilter;
  onChangeFilter: (newFilter: Partial<ReservationFilter>) => void;
  onResetFilter: () => void;
  venues: Array<{ id: string; name: string }>;
  sports: string[];
  bcvRate: number;
}

export function ReservationsFilterBar({
  filter,
  onChangeFilter,
  onResetFilter,
  venues,
  sports,
  bcvRate,
}: ReservationsFilterBarProps) {
  const t = useTranslations("reservations.filters");

  const dateChips: Array<{ key: NonNullable<ReservationFilter["dateFilter"]>; label: string }> = [
    { key: "all", label: t("allDates") },
    { key: "today", label: t("today") },
    { key: "tomorrow", label: t("tomorrow") },
    { key: "week", label: t("thisWeek") },
    { key: "month", label: t("thisMonth") },
  ];

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm space-y-4">
      {/* QUICK DATE CHIPS ROW */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            {t("dateLabel")}
          </span>
          {dateChips.map((chip) => {
            const isActive = (filter.dateFilter || "all") === chip.key;
            return (
              <button
                key={chip.key}
                type="button"
                onClick={() => onChangeFilter({ dateFilter: chip.key })}
                className={`rounded-full px-3.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? "bg-accent/20 border border-accent text-accent font-bold shadow-sm"
                    : "border border-border bg-muted/70 text-muted-foreground hover:text-foreground hover:border-foreground/30"
                }`}
                id={`chip-${chip.key}`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2.5">
          <TimeFormatToggle size="xs" />
          <span className="rounded-xl border border-border bg-muted/60 px-3 py-1 text-xs font-bold text-foreground">
            {t("bcvRefBadge", { rate: bcvRate.toFixed(2) })}
          </span>
        </div>
      </div>

      {/* DROPDOWN & SEARCH INPUTS ROW */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search Box */}
          <div className="relative min-w-[260px] flex-1 max-w-sm">
            <input
              type="text"
              id="search-input"
              value={filter.search || ""}
              onChange={(e) => onChangeFilter({ search: e.target.value })}
              placeholder={t("searchPlaceholder")}
              className="w-full rounded-xl border border-border bg-surface px-3.5 py-2 text-xs font-medium text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          {/* Venue Dropdown */}
          <select
            id="filter-venue"
            value={filter.venueId || "all"}
            onChange={(e) => onChangeFilter({ venueId: e.target.value })}
            className="rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer"
          >
            <option value="all">{t("allVenues")}</option>
            {venues.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>

          {/* Sport Dropdown */}
          <select
            id="filter-sport"
            value={filter.sport || "all"}
            onChange={(e) => onChangeFilter({ sport: e.target.value })}
            className="rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer"
          >
            <option value="all">{t("allSports")}</option>
            {sports.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {/* Payment Method Dropdown */}
          <select
            id="filter-payment"
            value={filter.paymentMethod || "all"}
            onChange={(e) => onChangeFilter({ paymentMethod: e.target.value })}
            className="rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer"
          >
            <option value="all">{t("allPayments")}</option>
            <option value="pago_movil">{t("pagoMovil")}</option>
            <option value="cash">{t("cash")}</option>
            <option value="pos">{t("pos")}</option>
          </select>

          {/* Status Dropdown */}
          <select
            id="filter-status"
            value={filter.status || "all"}
            onChange={(e) => onChangeFilter({ status: e.target.value })}
            className="rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer"
          >
            <option value="all">{t("allStatuses")}</option>
            <option value="CONFIRMED">{t("statusConfirmed")}</option>
            <option value="PENDING_PAYMENT">{t("statusPending")}</option>
            <option value="COMPLETED">{t("statusCompleted")}</option>
            <option value="CANCELLED">{t("statusCancelled")}</option>
          </select>
        </div>

        {/* Clear Filters CTA */}
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onResetFilter}
          id="btn-clear-filters"
        >
          🔄 {t("btnClear")}
        </Button>
      </div>
    </div>
  );
}
