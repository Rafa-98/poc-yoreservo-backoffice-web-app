"use client";

import { useTranslations } from "next-intl";
import type { RolePerspective, TimeframeKey } from "../model/types";

interface DashboardTimeframeBarProps {
  perspective: RolePerspective;
  timeframe: TimeframeKey;
  onSelectTimeframe: (tf: TimeframeKey) => void;
  bcvRate: number;
}

export function DashboardTimeframeBar({
  perspective,
  timeframe,
  onSelectTimeframe,
  bcvRate,
}: DashboardTimeframeBarProps) {
  const t = useTranslations("dashboard");

  const getPeriodText = () => {
    switch (timeframe) {
      case "HOY":
        return t("timeframes.todayPeriod");
      case "SEMANA":
        return t("timeframes.weekPeriod");
      case "MES":
        return t("timeframes.monthPeriod");
      case "ANO":
        return t("timeframes.yearPeriod");
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2 border-b border-border/60">
      <div>
        <h2 className="font-display text-lg sm:text-xl font-extrabold text-foreground">
          {perspective === "ADMIN"
            ? t("headings.globalOverview")
            : t("headings.allyOverview")}
        </h2>
        <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5 flex-wrap">
          <span>{t("headings.periodAnalyzed")}</span>
          <strong className="text-foreground font-semibold">{getPeriodText()}</strong>
          <span>•</span>
          <span>{t("headings.bcvRate")}</span>
          <strong className="text-foreground font-semibold">
            {bcvRate.toFixed(2)} Bs/USD
          </strong>
        </div>
      </div>

      {/* Timeframe Chips */}
      <div className="flex items-center gap-1.5 self-start sm:self-auto bg-surface-muted p-1 rounded-xl border border-border">
        <button
          type="button"
          onClick={() => onSelectTimeframe("HOY")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            timeframe === "HOY"
              ? "bg-forest-900 text-white dark:bg-accent/20 dark:text-accent-foreground dark:border dark:border-accent/30 font-bold shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {t("timeframes.today")}
        </button>

        <button
          type="button"
          onClick={() => onSelectTimeframe("SEMANA")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            timeframe === "SEMANA"
              ? "bg-forest-900 text-white dark:bg-accent/20 dark:text-accent-foreground dark:border dark:border-accent/30 font-bold shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {t("timeframes.week")}
        </button>

        <button
          type="button"
          onClick={() => onSelectTimeframe("MES")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            timeframe === "MES"
              ? "bg-forest-900 text-white dark:bg-accent/20 dark:text-accent-foreground dark:border dark:border-accent/30 font-bold shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {t("timeframes.month")}
        </button>

        <button
          type="button"
          onClick={() => onSelectTimeframe("ANO")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            timeframe === "ANO"
              ? "bg-forest-900 text-white dark:bg-accent/20 dark:text-accent-foreground dark:border dark:border-accent/30 font-bold shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {t("timeframes.year")}
        </button>
      </div>
    </div>
  );
}
