"use client";

import React from "react";
import { useTranslations } from "next-intl";
import type { ShiftRange } from "../model/types";

interface ScheduleTimelineRibbonProps {
  isOpen: boolean;
  shift1: ShiftRange;
  shift2?: ShiftRange;
  showTicks?: boolean;
}

function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(":").map((v) => parseInt(v, 10) || 0);
  return Math.min(1440, Math.max(0, h * 60 + m));
}

export function ScheduleTimelineRibbon({
  isOpen,
  shift1,
  shift2,
  showTicks = true,
}: ScheduleTimelineRibbonProps) {
  const t = useTranslations("venues.schedules");

  if (!isOpen) {
    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex h-7 items-center justify-center rounded-lg border border-dashed border-border-medium bg-muted text-[11px] font-semibold text-faint-foreground">
          {t("closedNoShifts")}
        </div>
        {showTicks && <TimelineTicks />}
      </div>
    );
  }

  const s1Open = timeToMinutes(shift1?.openTime || "07:00");
  const s1Close = timeToMinutes(shift1?.closeTime || "12:00");

  const hasShift2 = Boolean(shift2?.isEnabled);
  const s2Open = hasShift2 ? timeToMinutes(shift2?.openTime || "16:00") : 0;
  const s2Close = hasShift2 ? timeToMinutes(shift2?.closeTime || "23:00") : 0;

  const s1Pct = Math.max(0, ((s1Close - s1Open) / 1440) * 100);
  const recessPct =
    hasShift2 && s2Open > s1Close
      ? Math.max(0, ((s2Open - s1Close) / 1440) * 100)
      : 0;
  const s2Pct =
    hasShift2 && s2Close > s2Open
      ? Math.max(0, ((s2Close - s2Open) / 1440) * 100)
      : 0;

  const slots = Array.from({ length: 48 }, (_, idx) => {
    const slotStart = idx * 30;
    if (slotStart >= s1Open && slotStart < s1Close) {
      return "shift1";
    }
    if (hasShift2 && s2Open > s1Close && slotStart >= s1Close && slotStart < s2Open) {
      return "recess";
    }
    if (hasShift2 && slotStart >= s2Open && slotStart < s2Close) {
      return "shift2";
    }
    return "closed";
  });

  return (
    <div className="flex flex-col gap-1.5">
      <div className="timeline-ribbon relative flex h-7 w-full overflow-hidden rounded-lg border border-border bg-muted">
        {slots.map((slotType, idx) => (
          <div
            key={idx}
            className={`h-full flex-1 ${
              slotType === "shift1"
                ? "bg-accent"
                : slotType === "recess"
                  ? "border-r border-border/50 bg-surface-hover"
                  : slotType === "shift2"
                    ? "bg-primary"
                    : "bg-muted"
            }`}
          />
        ))}

        {/* Labels Overlay */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center gap-3 px-2">
          {s1Pct > 0 && (
            <span
              title={`${t("legendShift1")}: ${shift1.openTime} - ${shift1.closeTime}`}
              className="truncate rounded bg-accent px-1.5 py-0.5 text-[10.5px] font-bold text-accent-foreground"
            >
              {t("shift1Prefix")}: {shift1.openTime}-{shift1.closeTime}
            </span>
          )}
          {recessPct > 8 && (
            <span
              title={t("legendRecess")}
              className="truncate rounded bg-surface/90 px-1.5 py-0.5 text-[10px] font-semibold text-faint-foreground"
            >
              {t("recessShort")}
            </span>
          )}
          {s2Pct > 0 && (
            <span
              title={`${t("legendShift2")}: ${shift2?.openTime} - ${shift2?.closeTime}`}
              className="truncate rounded bg-primary px-1.5 py-0.5 text-[10.5px] font-bold text-primary-foreground"
            >
              {t("shift2Prefix")}: {shift2?.openTime}-{shift2?.closeTime}
            </span>
          )}
        </div>
      </div>

      {showTicks && <TimelineTicks />}
    </div>
  );
}

function TimelineTicks() {
  return (
    <div className="flex justify-between px-0.5 font-mono text-[10px] text-faint-foreground">
      <span>00h</span>
      <span>04h</span>
      <span>08h</span>
      <span>12h</span>
      <span>16h</span>
      <span>20h</span>
      <span>24h</span>
    </div>
  );
}
