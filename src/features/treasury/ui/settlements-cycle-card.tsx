"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/shared/ui/button";
import type { SettlementsKpis } from "../model/types";

interface SettlementsCycleCardProps {
  kpis: SettlementsKpis;
  onFilterPending: () => void;
}

export function SettlementsCycleCard({
  kpis,
  onFilterPending,
}: SettlementsCycleCardProps) {
  const t = useTranslations("settlements");
  const { completedCount, totalCount, percentage, deadline } = kpis.cycleProgress;

  return (
    <div className="card p-5 bg-gradient-to-r from-surface to-muted/40 border border-border">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="font-display text-sm font-bold text-foreground">
              {t("cycleTitle")}
            </h2>
            <span className="rounded-full bg-status-available-bg border border-status-available-border px-2 py-0.5 text-[11px] font-bold text-status-available-fg">
              {t("badgeOnSchedule")}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {completedCount} {t("of")} {totalCount} {t("cycleDesc")} {deadline}.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm font-bold text-foreground">
              {percentage}% {t("cyclePercentage")}
            </div>
            <div className="text-[11px] text-muted-foreground">
              {completedCount} / {totalCount} {t("cycleProcessed")}
            </div>
          </div>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onFilterPending}
            className="text-xs"
            id="btn-view-pending-cycle"
          >
            <span>{t("btnViewPending")}</span>
            <span>→</span>
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted border border-border/50">
        <div
          className="h-full bg-gradient-to-r from-status-available-fg to-accent rounded-full transition-all duration-500"
          style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
        />
      </div>
    </div>
  );
}
