"use client";

import { useTranslations } from "next-intl";
import { Clock } from "lucide-react";
import type { SportDistributionItem, SportsDistributionData } from "../model/types";

interface DashboardSportsDistributionProps {
  data?: SportsDistributionData;
}

export function DashboardSportsDistribution({
  data,
}: DashboardSportsDistributionProps) {
  const t = useTranslations("dashboard");

  const items = data?.items ?? [];

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs flex flex-col justify-between">
      <div>
        <h3 className="text-sm sm:text-base font-bold text-foreground mb-4">
          {t("sports.title")}
        </h3>

        {items.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            {t("sports.emptySports")}
          </div>
        ) : (
          <div className="space-y-3.5">
            {items.map((item) => {
              const label =
                item.label ||
                item.name ||
                (item.labelKey ? t(item.labelKey as any) : item.key);
              const barClass = item.barColorClass || "bg-accent";
              const textClass = item.textColorClass || "text-accent-foreground";

              return (
                <div key={item.id || item.key}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="font-semibold text-foreground">
                      {label}
                    </span>
                    <strong className={`${textClass} font-bold`}>
                      {item.percentage}% ({item.count.toLocaleString("en-US")})
                    </strong>
                  </div>
                  <div className="w-full h-2 bg-surface-muted rounded-full overflow-hidden border border-border/40">
                    <div
                      style={{
                        width: `${Math.min(100, Math.max(0, item.percentage))}%`,
                      }}
                      className={`h-full ${barClass} rounded-full`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Peak Hours Box */}
      <div className="bg-surface-muted border border-border rounded-xl p-3.5 mt-4">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
          <Clock className="size-3.5 text-accent-foreground" />
          <span>{t("sports.peakHoursTitle")}</span>
        </div>
        <div className="font-display text-base sm:text-lg font-extrabold text-foreground mt-1">
          {data?.peakHoursTime || t("sports.noPeakActivity")}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {data?.peakHoursSub || t("sports.noPeakSub")}
        </p>
      </div>
    </div>
  );
}
