"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/shared/ui/button";
import type { ReservationFilter } from "../model/types";

interface ReservationsFilterBarProps {
  filter: ReservationFilter;
  onChangeFilter: (newFilter: Partial<ReservationFilter>) => void;
  onResetFilter: () => void;
  venues: Array<{
    id: string;
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

  const [isVenueDropdownOpen, setIsVenueDropdownOpen] = useState(false);
  const [venueFilterQuery, setVenueFilterQuery] = useState("");
  const venueDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (
        venueDropdownRef.current &&
        !venueDropdownRef.current.contains(e.target as Node)
      ) {
        setIsVenueDropdownOpen(false);
        setVenueFilterQuery("");
      }
    }
    if (isVenueDropdownOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isVenueDropdownOpen]);

  const filteredVenueOptions = useMemo(() => {
    const q = venueFilterQuery.trim().toLowerCase();
    if (!q) return venues;
    return venues.filter((v) => v.name.toLowerCase().includes(q));
  }, [venues, venueFilterQuery]);

  const computedTotalSpaces = useMemo(() => {
    if (typeof totalSpacesCount === "number" && totalSpacesCount > 0) {
      return totalSpacesCount;
    }
    return venues.reduce((sum, v) => sum + (v.spacesCount ?? 0), 0);
  }, [totalSpacesCount, venues]);

  const activeVenueFilterName = useMemo(() => {
    const totalLabel =
      computedTotalSpaces === 1
        ? "1 cancha"
        : `${computedTotalSpaces} canchas`;
    if (!filter.venueId || filter.venueId === "all") {
      return `Todas las sedes (${totalLabel})`;
    }
    const found = venues.find((v) => v.id === filter.venueId);
    if (!found) return `Todas las sedes (${totalLabel})`;
    const count = found.spacesCount ?? 0;
    const countLabel = count === 1 ? "1 cancha" : `${count} canchas`;
    return `${found.name} (${countLabel})`;
  }, [filter.venueId, venues, computedTotalSpaces]);

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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search Box */}
          <div className="relative min-w-[240px] flex-1 max-w-sm">
            <input
              type="text"
              id="search-input"
              value={filter.search || ""}
              onChange={(e) => onChangeFilter({ search: e.target.value })}
              placeholder={t("searchPlaceholder")}
              className="w-full rounded-xl border border-border bg-surface px-3.5 py-2 text-xs font-medium text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          {/* Searchable Venue Combobox (matching /venues/spaces & /venues/schedules) */}
          {venues.length > 1 && (
            <div ref={venueDropdownRef} className="relative min-w-[250px]">
              <div
                className={`flex items-center gap-1.5 rounded-xl border bg-surface px-3 py-1.5 transition-all ${
                  isVenueDropdownOpen
                    ? "border-accent ring-2 ring-accent/25"
                    : "border-border hover:border-border-medium"
                }`}
              >
                <span className="text-xs select-none">📍</span>
                <input
                  type="text"
                  id="filter-venue"
                  value={
                    isVenueDropdownOpen
                      ? venueFilterQuery
                      : activeVenueFilterName
                  }
                  onFocus={() => {
                    setIsVenueDropdownOpen(true);
                    setVenueFilterQuery("");
                  }}
                  onChange={(e) => {
                    setIsVenueDropdownOpen(true);
                    setVenueFilterQuery(e.target.value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setIsVenueDropdownOpen(false);
                      setVenueFilterQuery("");
                    } else if (e.key === "Enter" && isVenueDropdownOpen) {
                      e.preventDefault();
                      if (filteredVenueOptions.length > 0) {
                        const first = filteredVenueOptions[0];
                        onChangeFilter({ venueId: first.id });
                        setIsVenueDropdownOpen(false);
                        setVenueFilterQuery("");
                      }
                    }
                  }}
                  placeholder="Escribir o elegir sede..."
                  aria-label="Filtrar por sede"
                  className="w-full min-w-0 border-none bg-transparent text-xs font-bold text-foreground outline-none placeholder:font-normal placeholder:text-muted-foreground"
                />
                {filter.venueId && filter.venueId !== "all" && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onChangeFilter({ venueId: "all" });
                      setVenueFilterQuery("");
                      setIsVenueDropdownOpen(false);
                    }}
                    title="Ver todas las sedes"
                    className="cursor-pointer rounded-md border-none bg-muted px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground hover:text-foreground"
                  >
                    ✕
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setIsVenueDropdownOpen((prev) => !prev);
                    setVenueFilterQuery("");
                  }}
                  className="cursor-pointer border-none bg-transparent px-1 text-xs text-muted-foreground"
                  aria-label="Abrir lista de sedes"
                >
                  ▾
                </button>
              </div>

              {isVenueDropdownOpen && (
                <div className="absolute right-0 left-0 z-30 mt-1 max-h-64 overflow-y-auto rounded-xl border border-border-medium bg-surface p-1.5 shadow-xl">
                  <button
                    type="button"
                    onClick={() => {
                      onChangeFilter({ venueId: "all" });
                      setIsVenueDropdownOpen(false);
                      setVenueFilterQuery("");
                    }}
                    className={`flex w-full cursor-pointer items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs font-bold transition-colors ${
                      !filter.venueId || filter.venueId === "all"
                        ? "bg-accent/20 text-foreground"
                        : "text-foreground hover:bg-muted"
                    }`}
                  >
                    <span>🌐 Todas las sedes</span>
                    <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                      {computedTotalSpaces === 1
                        ? "1 cancha"
                        : `${computedTotalSpaces} canchas`}
                    </span>
                  </button>

                  {filteredVenueOptions.length === 0 ? (
                    <div className="px-3 py-3 text-center text-xs text-muted-foreground">
                      No se encontró ninguna sede con «{venueFilterQuery}»
                    </div>
                  ) : (
                    filteredVenueOptions.map((v) => {
                      const isSelectedVenue = filter.venueId === v.id;
                      const count = v.spacesCount ?? 0;
                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => {
                            onChangeFilter({ venueId: v.id });
                            setIsVenueDropdownOpen(false);
                            setVenueFilterQuery("");
                          }}
                          className={`mt-0.5 flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold transition-colors ${
                            isSelectedVenue
                              ? "bg-accent/20 font-bold text-foreground"
                              : "text-foreground hover:bg-muted"
                          }`}
                        >
                          <span className="truncate">📍 {v.name}</span>
                          <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                            {count === 1 ? "1 cancha" : `${count} canchas`}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          )}

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
