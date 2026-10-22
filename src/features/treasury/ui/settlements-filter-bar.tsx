"use client";

import React from "react";
import { useTranslations } from "next-intl";
import type { SettlementDirection, SettlementFilter } from "../model/types";

interface SettlementsFilterBarProps {
  filter: SettlementFilter;
  onChangeFilter: (upd: Partial<SettlementFilter>) => void;
  organizations: { id: string; name: string }[];
  periodRangeLabel: string;
  directionCounts: {
    platformToAllyBatches: number;
    platformToAllyUnsettledUsd: number;
    allyToPlatformBatches: number;
    allyToPlatformUnsettledUsd: number;
  };
  counts: {
    all: number;
    pending: number;
    disbursed: number;
  };
}

export function SettlementsFilterBar({
  filter,
  onChangeFilter,
  organizations,
  periodRangeLabel,
  directionCounts,
  counts,
}: SettlementsFilterBarProps) {
  const t = useTranslations("settlements");

  function handleSelectDirection(direction: SettlementDirection) {
    onChangeFilter({ direction });
  }

  return (
    <div className="card p-4 space-y-4 border border-border">
      {/* Row 1: Segmented Flow Direction Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => handleSelectDirection("PLATFORM_TO_ALLY")}
          id="tab-direction-platform-to-ally"
          className={`flex items-center justify-between gap-3 rounded-xl border p-3.5 text-left transition-all cursor-pointer ${
            filter.direction === "PLATFORM_TO_ALLY"
              ? "border-accent bg-accent/10 shadow-xs"
              : "border-border bg-surface hover:bg-muted/50"
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-lg">
              💸
            </span>
            <div>
              <div className="font-display text-xs sm:text-sm font-bold text-foreground">
                Liquidaciones a Aliados (Custodia YoReservo)
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                Pagos cobrados en cuentas de YoReservo que se transfieren al Aliado
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className="rounded-full bg-surface border border-border px-2.5 py-0.5 text-[11px] font-bold text-foreground">
              {directionCounts.platformToAllyBatches}{" "}
              {directionCounts.platformToAllyBatches === 1 ? "lote" : "lotes"}
            </span>
            {directionCounts.platformToAllyUnsettledUsd > 0 && (
              <span className="rounded-full bg-status-hold-bg border border-status-hold-border px-2 py-0.5 text-[10px] font-bold text-status-hold-fg">
                ⚡ ${directionCounts.platformToAllyUnsettledUsd.toFixed(2)} sin lote
              </span>
            )}
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleSelectDirection("ALLY_TO_PLATFORM")}
          id="tab-direction-ally-to-platform"
          className={`flex items-center justify-between gap-3 rounded-xl border p-3.5 text-left transition-all cursor-pointer ${
            filter.direction === "ALLY_TO_PLATFORM"
              ? "border-accent bg-accent/10 shadow-xs"
              : "border-border bg-surface hover:bg-muted/50"
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/30 text-lg">
              🧾
            </span>
            <div>
              <div className="font-display text-xs sm:text-sm font-bold text-foreground">
                Comisiones a YoReservo (Cobro Directo del Aliado)
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                Comisiones generadas cuando el cliente paga directo al Aliado
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className="rounded-full bg-surface border border-border px-2.5 py-0.5 text-[11px] font-bold text-foreground">
              {directionCounts.allyToPlatformBatches}{" "}
              {directionCounts.allyToPlatformBatches === 1 ? "lote" : "lotes"}
            </span>
            {directionCounts.allyToPlatformUnsettledUsd > 0 && (
              <span className="rounded-full bg-status-hold-bg border border-status-hold-border px-2 py-0.5 text-[10px] font-bold text-status-hold-fg">
                ⚡ ${directionCounts.allyToPlatformUnsettledUsd.toFixed(2)} sin lote
              </span>
            )}
          </div>
        </button>
      </div>

      {/* Row 2: Search, Date Range Filter, Organization Selector & Status Chips */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/60">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {/* Search */}
          <div className="relative flex-1 min-w-[210px] max-w-xs">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
              🔍
            </span>
            <input
              type="text"
              id="settlements-search-input"
              value={filter.search}
              onChange={(e) => onChangeFilter({ search: e.target.value })}
              placeholder={t("searchPlaceholder")}
              className="form-input pl-9 text-xs h-9"
            />
          </div>

          {/* Date Period Selector */}
          <div className="min-w-[180px]">
            <select
              value={filter.period}
              onChange={(e) => onChangeFilter({ period: e.target.value })}
              className="form-select text-xs font-semibold h-9"
              id="settlements-period-filter"
            >
              <option value="TODAY">📅 Hoy</option>
              <option value="YESTERDAY">📅 Ayer</option>
              <option value="LAST_7_DAYS">📅 Últimos 7 días</option>
              <option value="THIS_MONTH">📅 Este mes</option>
              <option value="CUSTOM">📆 Rango personalizado</option>
              <option value="ALL">🗂️ Histórico completo</option>
            </select>
          </div>

          {/* Custom Date Range Inputs */}
          {filter.period === "CUSTOM" && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={filter.fromDate || ""}
                onChange={(e) => onChangeFilter({ fromDate: e.target.value })}
                className="form-input text-xs h-9 w-[135px]"
                aria-label="Desde"
              />
              <span className="text-xs text-muted-foreground">→</span>
              <input
                type="date"
                value={filter.toDate || ""}
                onChange={(e) => onChangeFilter({ toDate: e.target.value })}
                className="form-input text-xs h-9 w-[135px]"
                aria-label="Hasta"
              />
            </div>
          )}

          {/* Explicit Active Date Range Pill */}
          <div className="inline-flex items-center gap-1.5 rounded-lg bg-muted/60 border border-border px-2.5 py-1.5 text-[11px] font-semibold text-foreground">
            <span className="text-muted-foreground">Rango activo:</span>
            <span>{periodRangeLabel}</span>
          </div>

          {/* Org / Venue selector */}
          {organizations.length > 1 && (
            <div className="min-w-[190px]">
              <select
                value={filter.organizationId}
                onChange={(e) =>
                  onChangeFilter({ organizationId: e.target.value })
                }
                className="form-select text-xs h-9"
                id="settlements-org-filter"
              >
                <option value="ALL">{t("filterAllVenues")}</option>
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Status Chips */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onChangeFilter({ status: "ALL" })}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filter.status === "ALL"
                ? "bg-accent text-accent-foreground shadow-xs"
                : "bg-surface border border-border text-muted-foreground hover:bg-muted"
            }`}
            id="chip-status-all"
          >
            Todos ({counts.all})
          </button>

          <button
            type="button"
            onClick={() => onChangeFilter({ status: "PENDING" })}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filter.status === "PENDING"
                ? "bg-status-hold-bg border border-status-hold-border text-status-hold-fg shadow-xs"
                : "bg-surface border border-border text-muted-foreground hover:bg-muted"
            }`}
            id="chip-status-pending"
          >
            Por Pagar ({counts.pending})
          </button>

          <button
            type="button"
            onClick={() => onChangeFilter({ status: "DISBURSED" })}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filter.status === "DISBURSED"
                ? "bg-status-confirmed-bg border border-status-confirmed-border text-status-confirmed-fg shadow-xs"
                : "bg-surface border border-border text-muted-foreground hover:bg-muted"
            }`}
            id="chip-status-disbursed"
          >
            Pagados ({counts.disbursed})
          </button>
        </div>
      </div>
    </div>
  );
}
