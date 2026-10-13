"use client";

import { useTranslations } from "next-intl";
import { Clock } from "lucide-react";

export function DashboardSportsDistribution() {
  const t = useTranslations("dashboard");

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs flex flex-col justify-between">
      <div>
        <h3 className="text-sm sm:text-base font-bold text-foreground mb-4">
          {t("sports.title")}
        </h3>

        {/* Sport 1: Pádel */}
        <div className="mb-3.5">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="font-semibold text-foreground">
              {t("sports.padel")}
            </span>
            <strong className="text-accent-foreground font-bold">
              {t("sports.padelCount")}
            </strong>
          </div>
          <div className="w-full h-2 bg-surface-muted rounded-full overflow-hidden border border-border/40">
            <div
              style={{ width: "48%" }}
              className="h-full bg-accent rounded-full"
            />
          </div>
        </div>

        {/* Sport 2: Fútbol */}
        <div className="mb-3.5">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="font-semibold text-foreground">
              {t("sports.futbol")}
            </span>
            <strong className="text-emerald-600 dark:text-emerald-400 font-bold">
              {t("sports.futbolCount")}
            </strong>
          </div>
          <div className="w-full h-2 bg-surface-muted rounded-full overflow-hidden border border-border/40">
            <div
              style={{ width: "34%" }}
              className="h-full bg-emerald-500 rounded-full"
            />
          </div>
        </div>

        {/* Sport 3: Tenis */}
        <div className="mb-3.5">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="font-semibold text-foreground">
              {t("sports.tennis")}
            </span>
            <strong className="text-blue-600 dark:text-blue-400 font-bold">
              {t("sports.tennisCount")}
            </strong>
          </div>
          <div className="w-full h-2 bg-surface-muted rounded-full overflow-hidden border border-border/40">
            <div
              style={{ width: "12%" }}
              className="h-full bg-blue-500 rounded-full"
            />
          </div>
        </div>

        {/* Sport 4: Baloncesto & Pickleball */}
        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="font-semibold text-foreground">
              {t("sports.other")}
            </span>
            <strong className="text-purple-600 dark:text-purple-400 font-bold">
              {t("sports.otherCount")}
            </strong>
          </div>
          <div className="w-full h-2 bg-surface-muted rounded-full overflow-hidden border border-border/40">
            <div
              style={{ width: "6%" }}
              className="h-full bg-purple-500 rounded-full"
            />
          </div>
        </div>
      </div>

      {/* Peak Hours Box */}
      <div className="bg-surface-muted border border-border rounded-xl p-3.5 mt-4">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
          <Clock className="size-3.5 text-accent-foreground" />
          <span>{t("sports.peakHoursTitle")}</span>
        </div>
        <div className="font-display text-base sm:text-lg font-extrabold text-foreground mt-1">
          {t("sports.peakHoursTime")}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {t("sports.peakHoursSub")}
        </p>
      </div>
    </div>
  );
}
