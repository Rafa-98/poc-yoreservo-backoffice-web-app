"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Clock, Maximize2, Moon, Sun, Sunrise } from "lucide-react";
import {
  addDaysToIsoDate,
  DEFAULT_VENUE_TIMEZONE,
  getBrowserTimezone,
  getTimezoneOffsetLabel,
  isTimezoneDifferentFromBrowser,
  todayInTimezone,
} from "@/shared/lib";

export type AgendaDayPart = "all" | "morning" | "afternoon" | "night";

export interface AgendaControlsBarProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  selectedSport: string;
  onSportChange: (sport: string) => void;
  selectedDayPart: AgendaDayPart;
  onDayPartChange: (dayPart: AgendaDayPart) => void;
  sportsList: { key: string; label: string; count: number }[];
  totalCourtsCount: number;
  venueTimezone?: string;
  onOpenFullscreen?: () => void;
}

export function AgendaControlsBar({
  selectedDate,
  onDateChange,
  selectedSport,
  onSportChange,
  selectedDayPart,
  onDayPartChange,
  sportsList,
  totalCourtsCount,
  venueTimezone = DEFAULT_VENUE_TIMEZONE,
  onOpenFullscreen,
}: AgendaControlsBarProps) {
  const t = useTranslations("agenda");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const todayStr = todayInTimezone(venueTimezone);
  const tomorrowStr = addDaysToIsoDate(todayStr, 1);
  const dayAfterStr = addDaysToIsoDate(todayStr, 2);

  const offsetLabel = getTimezoneOffsetLabel(venueTimezone);
  const isDifferentTz = mounted && isTimezoneDifferentFromBrowser(venueTimezone);
  const browserTz = mounted ? getBrowserTimezone() : DEFAULT_VENUE_TIMEZONE;

  const formatIsoDateDisplay = (isoDate: string) => {
    const [y, m, d] = isoDate.split("-").map(Number);
    if (!y || !m || !d) return isoDate;
    const localDate = new Date(y, m - 1, d);
    return localDate.toLocaleDateString("es-ES", {
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
              {t("dateToday")} ({formatIsoDateDisplay(todayStr)})
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
              {t("dateTomorrow")} ({formatIsoDateDisplay(tomorrowStr)})
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
              {formatIsoDateDisplay(dayAfterStr)}
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

          {/* Venue Timezone Badge */}
          <div
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-background px-2.5 py-1 text-[11px] font-semibold text-muted-foreground"
            title={t("timezoneBadgeTitle", {
              timezone: venueTimezone,
              offset: offsetLabel,
            })}
          >
            <span>🌎</span>
            <span className="font-mono text-foreground">{venueTimezone}</span>
            <span>·</span>
            <span className="font-mono">{offsetLabel}</span>
          </div>

          {isDifferentTz && (
            <div
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-400"
              title={t("timezoneDiffWarning", {
                timezone: venueTimezone,
                browserTz,
              })}
            >
              <span>🕒</span>
              <span>{t("timezoneAnchoredHint")}</span>
            </div>
          )}
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

      {/* Sport Category Filter Tabs & Day-Part Toggles */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
        <div className="flex flex-wrap items-center gap-1.5">
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

        {/* Time-of-Day Filter Toggles & Fullscreen Button */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div
            id="agenda-daypart-toggles"
            className="inline-flex flex-wrap items-center rounded-xl border border-border bg-background p-1 text-xs font-semibold"
          >
            <button
              type="button"
              onClick={() => onDayPartChange("all")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all ${
                selectedDayPart === "all"
                  ? "bg-accent text-accent-foreground font-bold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Clock className="size-3.5" />
              <span>{t("dayPartAll")}</span>
            </button>
            <button
              type="button"
              onClick={() => onDayPartChange("morning")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all ${
                selectedDayPart === "morning"
                  ? "bg-accent text-accent-foreground font-bold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Sunrise className="size-3.5" />
              <span>{t("dayPartMorning")}</span>
            </button>
            <button
              type="button"
              onClick={() => onDayPartChange("afternoon")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all ${
                selectedDayPart === "afternoon"
                  ? "bg-accent text-accent-foreground font-bold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Sun className="size-3.5" />
              <span>{t("dayPartAfternoon")}</span>
            </button>
            <button
              type="button"
              onClick={() => onDayPartChange("night")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all ${
                selectedDayPart === "night"
                  ? "bg-accent text-accent-foreground font-bold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Moon className="size-3.5" />
              <span>{t("dayPartNight")}</span>
            </button>
          </div>

          {onOpenFullscreen && (
            <button
              type="button"
              id="btn-agenda-fullscreen"
              onClick={onOpenFullscreen}
              className="inline-flex items-center gap-2 rounded-xl border border-border-medium bg-surface px-3.5 py-2 text-xs font-extrabold text-foreground shadow-xs hover:border-accent hover:bg-accent/15 transition-all active:scale-95 cursor-pointer"
              title="Abrir horario en pantalla completa"
            >
              <Maximize2 className="size-3.5 text-link" />
              <span>Ver horario en pantalla completa</span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
