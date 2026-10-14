"use client";

import React from "react";
import { useTranslations } from "next-intl";
import type { DaySchedule } from "../model/types";
import { ScheduleTimelineRibbon } from "./schedule-timeline-ribbon";

interface DayScheduleCardProps {
  day: DaySchedule;
  dayName: string;
  onChange: (updated: DaySchedule) => void;
}

export function DayScheduleCard({
  day,
  dayName,
  onChange,
}: DayScheduleCardProps) {
  const t = useTranslations("venues.schedules");

  function toggleOpen() {
    onChange({
      ...day,
      isOpen: !day.isOpen,
    });
  }

  function updateShift1(field: "openTime" | "closeTime", value: string) {
    onChange({
      ...day,
      shift1: {
        ...day.shift1,
        [field]: value,
      },
    });
  }

  function toggleShift2() {
    const isCurrentlyEnabled = Boolean(day.shift2?.isEnabled);
    onChange({
      ...day,
      shift2: {
        openTime: day.shift2?.openTime || "16:00",
        closeTime: day.shift2?.closeTime || "23:00",
        isEnabled: !isCurrentlyEnabled,
      },
    });
  }

  function updateShift2(field: "openTime" | "closeTime", value: string) {
    onChange({
      ...day,
      shift2: {
        openTime: day.shift2?.openTime || "16:00",
        closeTime: day.shift2?.closeTime || "23:00",
        isEnabled: true,
        [field]: value,
      },
    });
  }

  return (
    <div
      className={`day-row-card flex flex-col gap-4 rounded-2xl p-5 shadow-card ${
        day.isOpen
          ? "border border-border bg-surface opacity-100"
          : "is-closed border border-dashed border-border-medium bg-muted opacity-75"
      }`}
    >
      {/* Header with Day name and Open toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3.5 border-b border-border pb-3.5">
        <div className="flex items-center gap-3">
          <span className="min-w-[100px] font-display text-lg font-bold text-foreground">
            {dayName}
          </span>
          <span
            className={day.isOpen ? "badge badge-available" : "badge badge-hold"}
          >
            {day.isOpen ? t("dayOpen") : t("dayClosed")}
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="text-[12.5px] text-muted-foreground">
            {day.isOpen ? t("statusOperational") : t("dayClosed")}
          </span>
          <label className="relative inline-block h-6 w-11 cursor-pointer">
            <input
              type="checkbox"
              checked={day.isOpen}
              onChange={toggleOpen}
              className="sr-only"
            />
            <span
              className={`absolute inset-0 rounded-full transition-colors duration-200 ${
                day.isOpen ? "bg-accent" : "bg-border-strong"
              }`}
            >
              <span
                className={`absolute bottom-[3px] h-4.5 w-4.5 rounded-full transition-all duration-200 ${
                  day.isOpen
                    ? "left-[23px] bg-accent-foreground"
                    : "left-[3px] bg-surface"
                }`}
              />
            </span>
          </label>
        </div>
      </div>

      {/* Shifts Inputs */}
      {day.isOpen && (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4">
          {/* Shift 1 */}
          <div className="flex flex-col gap-2.5 rounded-xl border border-border bg-surface-hover px-4 py-3.5">
            <div className="flex items-center justify-between text-[13px] font-bold text-foreground">
              <span>🌅 {t("shift1Title")}</span>
              <span className="badge badge-available">{t("shiftPrimaryBadge")}</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase">
                  {t("openLabel")}
                </label>
                <input
                  type="time"
                  className="input-field form-input px-2.5 py-2 text-[13px] font-semibold"
                  value={day.shift1?.openTime || "07:00"}
                  onChange={(e) => updateShift1("openTime", e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase">
                  {t("closeLabel")}
                </label>
                <input
                  type="time"
                  className="input-field form-input px-2.5 py-2 text-[13px] font-semibold"
                  value={day.shift1?.closeTime || "12:00"}
                  onChange={(e) => updateShift1("closeTime", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Shift 2 (Split Shift) */}
          <div
            className={`flex flex-col gap-2.5 rounded-xl border border-border bg-surface-hover px-4 py-3.5 ${
              day.shift2?.isEnabled ? "opacity-100" : "opacity-70"
            }`}
          >
            <div className="flex items-center justify-between text-[13px] font-bold text-foreground">
              <span>🌙 {t("shift2Title")}</span>
              <label className="flex cursor-pointer items-center gap-1.5 text-xs font-semibold">
                <input
                  type="checkbox"
                  checked={Boolean(day.shift2?.isEnabled)}
                  onChange={toggleShift2}
                  className="accent-accent"
                />
                <span>{t("enableShift2")}</span>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase">
                  {t("openLabel")}
                </label>
                <input
                  type="time"
                  className="input-field form-input px-2.5 py-2 text-[13px] font-semibold"
                  disabled={!day.shift2?.isEnabled}
                  value={day.shift2?.openTime || "16:00"}
                  onChange={(e) => updateShift2("openTime", e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase">
                  {t("closeLabel")}
                </label>
                <input
                  type="time"
                  className="input-field form-input px-2.5 py-2 text-[13px] font-semibold"
                  disabled={!day.shift2?.isEnabled}
                  value={day.shift2?.closeTime || "23:00"}
                  onChange={(e) => updateShift2("closeTime", e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Visual Timeline Ribbon */}
      <div className="mt-1">
        <ScheduleTimelineRibbon
          isOpen={day.isOpen}
          shift1={day.shift1}
          shift2={day.shift2}
          showTicks={false}
        />
      </div>
    </div>
  );
}
