"use client";

import React from "react";
import { useLocale, useTranslations } from "next-intl";
import type { SettlementDirection, SettlementFilter } from "../model/types";
import {
  OrganizationAdvancedSelector,
  type SelectableOrganizationItem,
} from "@/features/venues/ui/organization-advanced-selector";

interface SettlementsFilterBarProps {
  filter: SettlementFilter;
  onChangeFilter: (upd: Partial<SettlementFilter>) => void;
  organizations: SelectableOrganizationItem[];
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
  const isEn = useLocale().toLowerCase().startsWith("en");

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
                {isEn
                  ? "Payouts to Allies (YoReservo Custody)"
                  : "Liquidaciones a Aliados (Custodia YoReservo)"}
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                {isEn
                  ? "Payments collected into YoReservo accounts that are transferred to the Ally"
                  : "Pagos cobrados en cuentas de YoReservo que se transfieren al Aliado"}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className="rounded-full bg-surface border border-border px-2.5 py-0.5 text-[11px] font-bold text-foreground">
              {directionCounts.platformToAllyBatches}{" "}
              {directionCounts.platformToAllyBatches === 1
                ? isEn
                  ? "batch"
                  : "lote"
                : isEn
                  ? "batches"
                  : "lotes"}
            </span>
            {directionCounts.platformToAllyUnsettledUsd > 0 && (
              <span className="rounded-full bg-status-hold-bg border border-status-hold-border px-2 py-0.5 text-[10px] font-bold text-status-hold-fg">
                ⚡ ${directionCounts.platformToAllyUnsettledUsd.toFixed(2)}{" "}
                {isEn ? "unbatched" : "sin lote"}
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
                {isEn
                  ? "Commissions to YoReservo (Ally Direct Collection)"
                  : "Comisiones a YoReservo (Cobro Directo del Aliado)"}
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                {isEn
                  ? "Commissions generated when the client pays directly to the Ally"
                  : "Comisiones generadas cuando el cliente paga directo al Aliado"}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className="rounded-full bg-surface border border-border px-2.5 py-0.5 text-[11px] font-bold text-foreground">
              {directionCounts.allyToPlatformBatches}{" "}
              {directionCounts.allyToPlatformBatches === 1
                ? isEn
                  ? "batch"
                  : "lote"
                : isEn
                  ? "batches"
                  : "lotes"}
            </span>
            {directionCounts.allyToPlatformUnsettledUsd > 0 && (
              <span className="rounded-full bg-status-hold-bg border border-status-hold-border px-2 py-0.5 text-[10px] font-bold text-status-hold-fg">
                ⚡ ${directionCounts.allyToPlatformUnsettledUsd.toFixed(2)}{" "}
                {isEn ? "unbatched" : "sin lote"}
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
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
              🔍
            </span>
            <input
              type="text"
              id="settlements-search-input"
              value={filter.search}
              onChange={(e) => onChangeFilter({ search: e.target.value })}
              placeholder={t("searchPlaceholder")}
              className="form-input !pl-9 text-xs h-9"
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
              <option value="TODAY">📅 {isEn ? "Today" : "Hoy"}</option>
              <option value="YESTERDAY">📅 {isEn ? "Yesterday" : "Ayer"}</option>
              <option value="LAST_7_DAYS">
                📅 {isEn ? "Last 7 days" : "Últimos 7 días"}
              </option>
              <option value="THIS_MONTH">
                📅 {isEn ? "This month" : "Este mes"}
              </option>
              <option value="CUSTOM">
                📆 {isEn ? "Custom range" : "Rango personalizado"}
              </option>
              <option value="ALL">
                🗂️ {isEn ? "Full history" : "Histórico completo"}
              </option>
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
                aria-label={isEn ? "From" : "Desde"}
              />
              <span className="text-xs text-muted-foreground">→</span>
              <input
                type="date"
                value={filter.toDate || ""}
                onChange={(e) => onChangeFilter({ toDate: e.target.value })}
                className="form-input text-xs h-9 w-[135px]"
                aria-label={isEn ? "To" : "Hasta"}
              />
            </div>
          )}

          {/* Explicit Active Date Range Pill */}
          <div className="inline-flex items-center gap-1.5 rounded-lg bg-muted/60 border border-border px-2.5 py-1.5 text-[11px] font-semibold text-foreground">
            <span className="text-muted-foreground">
              {isEn ? "Active range:" : "Rango activo:"}
            </span>
            <span>{periodRangeLabel}</span>
          </div>

          {/* Advanced Org / Venue selector with Search & State/Mode/Currency filters */}
          {organizations.length > 1 && (
            <OrganizationAdvancedSelector
              id="settlements-org-filter"
              label={isEn ? "Organization:" : "Organización:"}
              organizations={organizations}
              selectedOrganizationId={filter.organizationId}
              onSelectOrganization={(orgId) =>
                onChangeFilter({ organizationId: orgId })
              }
              allowAll
              allLabel={isEn ? "All Organizations" : "Todas las Organizaciones"}
              selectedStateFilter={filter.stateFilter || "ALL"}
              onChangeStateFilter={(state) =>
                onChangeFilter({ stateFilter: state })
              }
            />
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
            {isEn ? "All" : "Todos"} ({counts.all})
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
            {isEn ? "Pending" : "Por Pagar"} ({counts.pending})
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
            {isEn ? "Paid" : "Pagados"} ({counts.disbursed})
          </button>
        </div>
      </div>
    </div>
  );
}
