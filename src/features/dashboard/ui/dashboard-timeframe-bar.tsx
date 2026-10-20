"use client";

import { useLocale, useTranslations } from "next-intl";
import type { AllyKpisData, RolePerspective, TimeframeKey } from "../model/types";

interface DashboardTimeframeBarProps {
  perspective: RolePerspective;
  timeframe: TimeframeKey;
  onSelectTimeframe: (tf: TimeframeKey) => void;
  bcvRate: number;
  allyKpis?: AllyKpisData;
}

export function DashboardTimeframeBar({
  perspective,
  timeframe,
  onSelectTimeframe,
  bcvRate,
  allyKpis,
}: DashboardTimeframeBarProps) {
  const t = useTranslations("dashboard");
  const locale = useLocale();

  const getPeriodText = () => {
    const now = new Date();
    const loc = locale === "en" ? "en-US" : "es-VE";
    switch (timeframe) {
      case "HOY": {
        const formatted = new Intl.DateTimeFormat(loc, {
          day: "numeric",
          month: "long",
          year: "numeric",
        }).format(now);
        return formatted;
      }
      case "SEMANA": {
        const day = now.getDay();
        const diffToMon = (day + 6) % 7;
        const mon = new Date(now);
        mon.setDate(now.getDate() - diffToMon);
        const sun = new Date(mon);
        sun.setDate(mon.getDate() + 6);
        const startStr = new Intl.DateTimeFormat(loc, {
          day: "2-digit",
          month: "short",
        }).format(mon);
        const endStr = new Intl.DateTimeFormat(loc, {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }).format(sun);
        return `${startStr} - ${endStr}`;
      }
      case "MES": {
        const formatted = new Intl.DateTimeFormat(loc, {
          month: "long",
          year: "numeric",
        }).format(now);
        return formatted.charAt(0).toUpperCase() + formatted.slice(1);
      }
      case "ANO":
        return `${now.getFullYear()}`;
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2 border-b border-border/60">
      <div>
        <h2 className="font-display text-lg sm:text-xl font-extrabold text-foreground">
          {perspective === "ADMIN"
            ? t("headings.globalOverview")
            : t("headings.allyOverviewDynamic", {
                org: allyKpis?.organizationName || t("headings.defaultOrg"),
                count: allyKpis?.venuesCount ?? 0,
              })}
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
      <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
        <div className="flex items-center gap-1.5 bg-surface-muted p-1 rounded-xl border border-border">
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
    </div>
  );
}
