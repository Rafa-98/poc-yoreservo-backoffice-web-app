"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/shared/ui/button";
import { VenueInlineCombobox } from "@/features/venues/ui/venue-inline-combobox";
import type { VenueItem } from "@/features/venues/model/types";
import type { ReservationFilter } from "../model/types";

interface ReservationsFilterBarProps {
  filter: ReservationFilter;
  onChangeFilter: (newFilter: Partial<ReservationFilter>) => void;
  onResetFilter: () => void;
  venues: Array<{
    id: string;
    organizationId?: string;
    organizationName?: string;
    organizationLegalName?: string | null;
    organizationRif?: string | null;
    name: string;
    referenceCurrencyCode?: string;
    spacesCount?: number;
  }>;
  totalSpacesCount?: number;
  sports: string[];
  bcvRate: number;
  bcvEurRate?: number;
  currencyCode?: string;
}

export function ReservationsFilterBar({
  filter,
  onChangeFilter,
  onResetFilter,
  venues,
  totalSpacesCount,
  sports,
  bcvRate,
  bcvEurRate,
  currencyCode = "USD",
}: ReservationsFilterBarProps) {
  const t = useTranslations("reservations.filters");
  const effectiveEurRate = bcvEurRate ?? bcvRate;

  const dateChips: Array<{
    key: NonNullable<ReservationFilter["dateFilter"]>;
    label: string;
  }> = [
    { key: "today", label: t("today") },
    { key: "tomorrow", label: t("tomorrow") },
    { key: "week", label: t("thisWeek") },
    { key: "month", label: t("thisMonth") },
    { key: "custom", label: `📅 ${t("customRange")}` },
  ];

  const activeDateFilter = filter.dateFilter || "week";

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm space-y-4">
      {/* QUICK DATE CHIPS ROW */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            {t("dateLabel")}
          </span>
          {dateChips.map((chip) => {
            const isActive = activeDateFilter === chip.key;
            return (
              <button
                key={chip.key}
                type="button"
                onClick={() => onChangeFilter({ dateFilter: chip.key })}
                className={`rounded-full px-3.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? "bg-accent/20 border border-accent text-foreground font-bold shadow-sm"
                    : "border border-border bg-muted/70 text-muted-foreground hover:text-foreground hover:border-foreground/30"
                }`}
                id={`chip-${chip.key}`}
              >
                {chip.label}
              </button>
            );
          })}

          {activeDateFilter === "custom" && (
            <div className="flex flex-wrap items-center gap-2 ml-1 rounded-xl border border-border bg-muted/40 px-3 py-1">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <span>{t("fromLabel")}</span>
                <input
                  type="date"
                  value={filter.customFromDate || ""}
                  onChange={(e) => {
                    const nextFrom = e.target.value;
                    const nextTo =
                      filter.customToDate && filter.customToDate < nextFrom
                        ? nextFrom
                        : filter.customToDate;
                    onChangeFilter({
                      dateFilter: "custom",
                      customFromDate: nextFrom,
                      customToDate: nextTo,
                    });
                  }}
                  className="rounded-lg border border-border bg-surface px-2 py-0.5 text-xs font-bold text-foreground focus:border-accent focus:outline-none"
                  id="filter-custom-from"
                />
              </label>
              <span className="text-muted-foreground text-xs">—</span>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <span>{t("toLabel")}</span>
                <input
                  type="date"
                  min={filter.customFromDate || undefined}
                  value={filter.customToDate || ""}
                  onChange={(e) =>
                    onChangeFilter({
                      dateFilter: "custom",
                      customToDate: e.target.value,
                    })
                  }
                  className="rounded-lg border border-border bg-surface px-2 py-0.5 text-xs font-bold text-foreground focus:border-accent focus:outline-none"
                  id="filter-custom-to"
                />
              </label>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {currencyCode === "MIXED" ? (
            <>
              <span className="rounded-xl border border-border bg-muted/60 px-3 py-1 text-xs font-bold text-foreground">
                Ref BCV USD: ${bcvRate.toFixed(2)} Bs.
              </span>
              <span className="rounded-xl border border-border bg-muted/60 px-3 py-1 text-xs font-bold text-foreground">
                Ref BCV EUR: €{effectiveEurRate.toFixed(2)} Bs.
              </span>
            </>
          ) : currencyCode === "EUR" ? (
            <span className="rounded-xl border border-border bg-muted/60 px-3 py-1 text-xs font-bold text-foreground">
              Ref BCV: €{effectiveEurRate.toFixed(2)} Bs. / EUR
            </span>
          ) : (
            <span className="rounded-xl border border-border bg-muted/60 px-3 py-1 text-xs font-bold text-foreground">
              Ref BCV: ${bcvRate.toFixed(2)} Bs. / USD
            </span>
          )}
        </div>
      </div>

      {/* DROPDOWN & SEARCH INPUTS ROW */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search Box */}
        <div className="relative min-w-[240px] flex-1 max-w-sm">
          <input
            type="text"
            id="search-input"
            value={filter.search || ""}
            onChange={(e) => onChangeFilter({ search: e.target.value })}
            placeholder={t("searchPlaceholder")}
            className="h-9 w-full rounded-xl border border-border bg-surface px-3.5 text-xs font-medium text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>

        {/* Cascading Organization -> Venue Combobox */}
        {venues.length > 0 && (
          <VenueInlineCombobox
            id="filter-venue"
            showLabel={false}
            venues={venues as unknown as VenueItem[]}
            totalSpacesOverride={totalSpacesCount}
            selectedOrganizationId={filter.organizationId || "ALL"}
            onSelectOrganizationId={(nextOrgId) =>
              onChangeFilter({
                organizationId: nextOrgId,
                venueId: "all",
              })
            }
            selectedVenueId={
              !filter.venueId || filter.venueId === "all"
                ? "ALL"
                : filter.venueId
            }
            onSelectVenueId={(nextVenueId) =>
              onChangeFilter({
                venueId: nextVenueId === "ALL" ? "all" : nextVenueId,
              })
            }
          />
        )}

        {/* Sport Dropdown */}
        <select
          id="filter-sport"
          value={filter.sport || "all"}
          onChange={(e) => onChangeFilter({ sport: e.target.value })}
          className="h-9 rounded-xl border border-border bg-surface px-3 text-xs font-semibold text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer"
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
          className="h-9 rounded-xl border border-border bg-surface px-3 text-xs font-semibold text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer"
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
          className="h-9 rounded-xl border border-border bg-surface px-3 text-xs font-semibold text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer"
        >
          <option value="all">{t("allStatuses")}</option>
          <option value="CONFIRMED">{t("statusConfirmed")}</option>
          <option value="PENDING_PAYMENT">{t("statusPending")}</option>
          <option value="COMPLETED">{t("statusCompleted")}</option>
          <option value="CANCELLED">{t("statusCancelled")}</option>
        </select>

        {/* Clear Filters CTA */}
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onResetFilter}
          id="btn-clear-filters"
          className="h-9 rounded-xl"
        >
          🔄 {t("btnClear")}
        </Button>
      </div>
    </div>
  );
}
