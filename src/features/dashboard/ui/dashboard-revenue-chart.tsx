"use client";

import { useTranslations } from "next-intl";
import { useTimeFormat } from "@/shared/lib/time-format";
import type { TimeframeChartData } from "../model/types";

interface DashboardRevenueChartProps {
  data: TimeframeChartData;
  onBarClick?: (label: string, gmv: number, fee: number) => void;
}

export function DashboardRevenueChart({
  data,
  onBarClick,
}: DashboardRevenueChartProps) {
  const t = useTranslations("dashboard");
  const { formatTime } = useTimeFormat();

  const maxGmv = Math.max(...data.gmv, 1) * 1.15;

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs flex flex-col justify-between">
      {/* Header & Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/50">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-foreground">
            {t("chart.title")}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t("chart.subtitle")}
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold self-start sm:self-auto">
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-xs bg-emerald-500 inline-block" />
            <span className="text-muted-foreground">{t("chart.legendGmv")}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-xs bg-accent inline-block border border-accent/40" />
            <span className="text-muted-foreground">{t("chart.legendFee")}</span>
          </div>
        </div>
      </div>

      {/* Interactive Bar Chart Canvas */}
      <div className="relative w-full h-[220px] flex items-end gap-3 sm:gap-6 pt-6 pb-8 px-2 border-b border-border/40">
        {data.labels.map((lbl, idx) => {
          const gmv = data.gmv[idx];
          const fee = data.fee[idx];
          const gmvHeightPct = Math.max((gmv / maxGmv) * 100, 4);
          // Visual multiplier for 5% so the fee bar is clearly visible alongside large GMV
          const feeHeightPct = Math.max((fee / maxGmv) * 100 * 4, 3);
          const formattedLabel = formatTime(lbl);

          return (
            <div
              key={lbl}
              className="flex-1 flex flex-col items-center justify-end h-full relative group cursor-pointer"
              onClick={() => onBarClick?.(formattedLabel, gmv, fee)}
              title={t("chart.barTooltip", {
                label: formattedLabel,
                gmv: gmv.toFixed(2),
                fee: fee.toFixed(2),
              })}
            >
              {/* Tooltip on hover */}
              <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-foreground text-background text-[10px] font-bold py-1 px-2 rounded pointer-events-none shadow-md whitespace-nowrap z-20">
                ${gmv.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </div>

              {/* Bars side by side */}
              <div className="w-full max-w-[44px] flex items-end justify-center gap-1 sm:gap-1.5 h-full">
                <div
                  style={{ height: `${gmvHeightPct}%` }}
                  className="w-1/2 bg-emerald-500 rounded-t-sm hover:brightness-110 transition-all duration-300 shadow-2xs"
                />
                <div
                  style={{ height: `${feeHeightPct}%` }}
                  className="w-1/2 bg-accent rounded-t-sm hover:brightness-110 transition-all duration-300 border border-accent/40 shadow-2xs"
                />
              </div>

              {/* Label below */}
              <span className="absolute -bottom-6 text-[11px] font-semibold text-muted-foreground group-hover:text-foreground transition-colors whitespace-nowrap">
                {formattedLabel}
              </span>
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 text-xs text-muted-foreground">
        <div>
          <span>{t("chart.peakVolume")} </span>
          <strong className="text-foreground font-semibold">{formatTime(data.peakText)}</strong>
        </div>
        <div>
          <span>{t("chart.operatingMargin")} </span>
          <strong className="text-accent-foreground font-semibold">
            {t("chart.fixedMargin")}
          </strong>
        </div>
      </div>
    </div>
  );
}
