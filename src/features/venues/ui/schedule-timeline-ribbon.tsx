"use client";

import React from "react";
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
  if (!isOpen) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <div
          style={{
            height: "28px",
            background: "var(--bg-muted)",
            border: "1px dashed var(--border-medium)",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "11px",
            color: "var(--text-faint, #6b7280)",
            fontWeight: 600,
          }}
        >
          Cerrado / Sin Turnos Disponibles
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

  // Segment widths in percentages (1440 min = 100%)
  const preS1Pct = (s1Open / 1440) * 100;
  const s1Pct = Math.max(0, ((s1Close - s1Open) / 1440) * 100);

  let recessPct = 0;
  let s2Pct = 0;
  let postPct = 0;

  if (hasShift2 && s2Open > s1Close) {
    recessPct = Math.max(0, ((s2Open - s1Close) / 1440) * 100);
    s2Pct = Math.max(0, ((s2Close - s2Open) / 1440) * 100);
    postPct = Math.max(0, ((1440 - s2Close) / 1440) * 100);
  } else {
    postPct = Math.max(0, ((1440 - s1Close) / 1440) * 100);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <div
        className="timeline-ribbon"
        style={{
          height: "28px",
          background: "var(--bg-muted)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "8px",
          display: "flex",
          overflow: "hidden",
          position: "relative",
          width: "100%",
        }}
      >
        {/* Pre-Shift 1 (closed) */}
        {preS1Pct > 0 && <div style={{ width: `${preS1Pct}%`, height: "100%" }} />}

        {/* Shift 1 */}
        {s1Pct > 0 && (
          <div
            title={`Turno 1: ${shift1.openTime} - ${shift1.closeTime}`}
            style={{
              width: `${s1Pct}%`,
              height: "100%",
              background: "var(--brand-lime)",
              color: "var(--brand-lime-text, #121811)",
              borderRight: "1px solid rgba(0,0,0,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "10.5px",
              fontWeight: 700,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              padding: "0 4px",
            }}
          >
            T1: {shift1.openTime}-{shift1.closeTime}
          </div>
        )}

        {/* Recess */}
        {recessPct > 0 && (
          <div
            title="Receso Intermedio"
            style={{
              width: `${recessPct}%`,
              height: "100%",
              background:
                "repeating-linear-gradient(-45deg, rgba(0,0,0,0.05), rgba(0,0,0,0.05) 6px, rgba(0,0,0,0.1) 6px, rgba(0,0,0,0.1) 12px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "10px",
              fontWeight: 600,
              color: "var(--text-faint, #6b7280)",
              overflow: "hidden",
            }}
          >
            {recessPct > 8 ? "Receso" : ""}
          </div>
        )}

        {/* Shift 2 */}
        {s2Pct > 0 && (
          <div
            title={`Turno 2: ${shift2?.openTime} - ${shift2?.closeTime}`}
            style={{
              width: `${s2Pct}%`,
              height: "100%",
              background: "var(--brand-forest, #1F3316)",
              color: "#E2FF80",
              borderLeft: "1px solid rgba(198, 242, 59, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "10.5px",
              fontWeight: 700,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              padding: "0 4px",
            }}
          >
            T2: {shift2?.openTime}-{shift2?.closeTime}
          </div>
        )}

        {/* Post-Shift 2 (closed) */}
        {postPct > 0 && <div style={{ width: `${postPct}%`, height: "100%" }} />}
      </div>

      {showTicks && <TimelineTicks />}
    </div>
  );
}

function TimelineTicks() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        fontSize: "10px",
        color: "var(--text-faint, #9ca3af)",
        fontFamily: "monospace",
        padding: "0 2px",
      }}
    >
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
