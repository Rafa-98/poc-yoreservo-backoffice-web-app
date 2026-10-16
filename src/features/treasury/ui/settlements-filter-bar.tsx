"use client";

import React from "react";
import { useTranslations } from "next-intl";
import type { SettlementFilter } from "../model/types";

interface SettlementsFilterBarProps {
  filter: SettlementFilter;
  onChangeFilter: (upd: Partial<SettlementFilter>) => void;
  organizations: { id: string; name: string }[];
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
  counts,
}: SettlementsFilterBarProps) {
  const t = useTranslations("settlements");
  const tOverrides = useTranslations("treasury.settlementsOverrides");

  return (
    <div className="card p-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Search & Selectors */}
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* Search */}
          <div className="relative flex-1 min-w-[240px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
              🔍
            </span>
            <input
              type="text"
              id="settlements-search-input"
              value={filter.search}
              onChange={(e) => onChangeFilter({ search: e.target.value })}
              placeholder={t("searchPlaceholder")}
              className="form-input pl-9 text-xs h-10"
            />
          </div>

          {/* Period selector */}
          <div className="min-w-[220px]">
            <select
              value={filter.period}
              onChange={(e) => onChangeFilter({ period: e.target.value })}
              className="form-select text-xs font-semibold h-10"
              id="settlements-period-filter"
            >
              <option value="ALL">{tOverrides("periodAll")}</option>
              <option value="CURRENT_MONTH">{tOverrides("periodCurrentMonth")}</option>
              <option value="PREV_MONTH">{tOverrides("periodPrevMonth")}</option>
              <option value="LAST_90_DAYS">{tOverrides("periodLast90Days")}</option>
            </select>
          </div>

          {/* Org / Venue selector */}
          <div className="min-w-[200px]">
            <select
              value={filter.organizationId}
              onChange={(e) => onChangeFilter({ organizationId: e.target.value })}
              className="form-select text-xs h-10"
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
        </div>

        {/* Status Chips */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onChangeFilter({ status: "ALL" })}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filter.status === "ALL"
                ? "bg-accent text-accent-foreground shadow-sm"
                : "bg-surface border border-border text-muted-foreground hover:bg-muted"
            }`}
            id="chip-status-all"
          >
            {t("chipAll")} ({counts.all})
          </button>

          <button
            type="button"
            onClick={() => onChangeFilter({ status: "PENDING" })}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filter.status === "PENDING"
                ? "bg-status-hold-bg border border-status-hold-border text-status-hold-fg shadow-sm"
                : "bg-surface border border-border text-muted-foreground hover:bg-muted"
            }`}
            id="chip-status-pending"
          >
            {t("chipPending")} ({counts.pending})
          </button>

          <button
            type="button"
            onClick={() => onChangeFilter({ status: "DISBURSED" })}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filter.status === "DISBURSED"
                ? "bg-status-confirmed-bg border border-status-confirmed-border text-status-confirmed-fg shadow-sm"
                : "bg-surface border border-border text-muted-foreground hover:bg-muted"
            }`}
            id="chip-status-disbursed"
          >
            {t("chipDisbursed")} ({counts.disbursed})
          </button>
        </div>
      </div>
    </div>
  );
}
