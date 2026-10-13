"use client";

import { useTranslations } from "next-intl";
import { Calendar as CalendarIcon } from "lucide-react";

export interface AgendaControlsBarProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  selectedSport: string;
  onSportChange: (sport: string) => void;
  sportsList: { key: string; label: string; count: number }[];
  totalCourtsCount: number;
}

export function AgendaControlsBar({
  selectedDate,
  onDateChange,
  selectedSport,
  onSportChange,
  sportsList,
  totalCourtsCount,
}: AgendaControlsBarProps) {
  const t = useTranslations("agenda");

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  const dayAfter = new Date();
  dayAfter.setDate(today.getDate() + 2);
  const dayAfterStr = dayAfter.toISOString().split("T")[0];

  const formatDateDisplay = (dateObj: Date) => {
    return dateObj.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
    });
  };

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Date Selector Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-xl border border-border bg-background p-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => onDateChange(todayStr)}
              className={`rounded-lg px-3 py-1.5 transition-all ${
                selectedDate === todayStr
                  ? "bg-accent text-accent-foreground font-bold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("dateToday")} ({formatDateDisplay(today)})
            </button>
            <button
              type="button"
              onClick={() => onDateChange(tomorrowStr)}
              className={`rounded-lg px-3 py-1.5 transition-all ${
                selectedDate === tomorrowStr
                  ? "bg-accent text-accent-foreground font-bold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("dateTomorrow")} ({formatDateDisplay(tomorrow)})
            </button>
            <button
              type="button"
              onClick={() => onDateChange(dayAfterStr)}
              className={`rounded-lg px-3 py-1.5 transition-all ${
                selectedDate === dayAfterStr
                  ? "bg-accent text-accent-foreground font-bold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {formatDateDisplay(dayAfter)}
            </button>
          </div>

          {/* Date Picker Input */}
          <div className="relative flex items-center">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => e.target.value && onDateChange(e.target.value)}
              className="h-9 rounded-xl border border-border bg-surface px-3 py-1 text-xs font-semibold text-foreground focus:border-accent focus:outline-none cursor-pointer"
            />
          </div>
        </div>

        {/* Live Legend Chips */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-status-available-bg border border-dashed border-status-available-border" />
            <span className="text-muted-foreground font-medium">{t("statusAvail")}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-status-confirmed-bg border border-status-confirmed-border" />
            <span className="text-muted-foreground font-medium">{t("statusConf")}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-status-hold-bg border border-status-hold-border" />
            <span className="text-muted-foreground font-medium">{t("statusHold")}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-status-completed-bg border border-status-completed-border" />
            <span className="text-muted-foreground font-medium">{t("statusComp")}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-status-blocked-bg border border-status-blocked-border" />
            <span className="text-muted-foreground font-medium">{t("statusBlock")}</span>
          </div>
        </div>
      </div>

      {/* Sport Category Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 border-t border-border pt-3">
        <button
          type="button"
          onClick={() => onSportChange("all")}
          className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
            selectedSport === "all"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "border border-border bg-background text-muted-foreground hover:border-border-medium hover:text-foreground"
          }`}
        >
          {t("filterAll")} ({totalCourtsCount})
        </button>

        {sportsList.map((sport) => {
          const isActive = selectedSport === sport.key;
          return (
            <button
              key={sport.key}
              type="button"
              onClick={() => onSportChange(sport.key)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "border border-border bg-background text-muted-foreground hover:border-border-medium hover:text-foreground"
              }`}
            >
              {sport.label} ({sport.count})
            </button>
          );
        })}
      </div>
    </section>
  );
}
