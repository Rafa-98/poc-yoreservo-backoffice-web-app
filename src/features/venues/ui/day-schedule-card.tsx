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
      className={`day-row-card ${!day.isOpen ? "is-closed" : ""}`}
      style={{
        background: day.isOpen ? "var(--bg-surface)" : "var(--bg-muted)",
        border: day.isOpen
          ? "1px solid var(--border-subtle)"
          : "1px dashed var(--border-medium)",
        borderRadius: "16px",
        padding: "20px 24px",
        boxShadow: "var(--shadow-sm)",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        opacity: day.isOpen ? 1 : 0.75,
      }}
    >
      {/* Header with Day name and Open toggle */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "14px",
          borderBottom: "1px solid var(--border-subtle)",
          paddingBottom: "14px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: "18px",
              fontWeight: 700,
              color: "var(--text-main)",
              minWidth: "100px",
            }}
          >
            {dayName}
          </span>
          <span
            className={day.isOpen ? "badge badge-available" : "badge badge-hold"}
          >
            {day.isOpen ? t("dayOpen") : t("dayClosed")}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "12.5px", color: "var(--text-muted)" }}>
            {day.isOpen ? "Operativo" : "Cerrado"}
          </span>
          <label
            style={{
              position: "relative",
              display: "inline-block",
              width: "44px",
              height: "24px",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={day.isOpen}
              onChange={toggleOpen}
              style={{ opacity: 0, width: 0, height: 0 }}
            />
            <span
              style={{
                position: "absolute",
                inset: 0,
                backgroundColor: day.isOpen
                  ? "var(--brand-lime)"
                  : "var(--border-strong, #4b5563)",
                borderRadius: "24px",
                transition: "0.2s",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  content: '""',
                  height: "18px",
                  width: "18px",
                  left: day.isOpen ? "23px" : "3px",
                  bottom: "3px",
                  backgroundColor: day.isOpen ? "#121811" : "#ffffff",
                  borderRadius: "50%",
                  transition: "0.2s",
                }}
              />
            </span>
          </label>
        </div>
      </div>

      {/* Shifts Inputs */}
      {day.isOpen && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "16px",
          }}
        >
          {/* Shift 1 */}
          <div
            style={{
              border: "1px solid var(--border-subtle)",
              borderRadius: "12px",
              padding: "14px 16px",
              background: "var(--bg-surface-hover, var(--bg-muted))",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: "13px",
                fontWeight: 700,
                color: "var(--text-main)",
              }}
            >
              <span>🌅 {t("shift1Title")}</span>
              <span className="badge badge-available">Principal</span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label
                  style={{
                    fontSize: "11px",
                    color: "var(--text-muted)",
                    fontWeight: 600,
                    textTransform: "uppercase",
                  }}
                >
                  {t("openLabel")}
                </label>
                <input
                  type="time"
                  className="input-field"
                  value={day.shift1?.openTime || "07:00"}
                  onChange={(e) => updateShift1("openTime", e.target.value)}
                  style={{ padding: "8px 10px", fontSize: "13px", fontWeight: 600 }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label
                  style={{
                    fontSize: "11px",
                    color: "var(--text-muted)",
                    fontWeight: 600,
                    textTransform: "uppercase",
                  }}
                >
                  {t("closeLabel")}
                </label>
                <input
                  type="time"
                  className="input-field"
                  value={day.shift1?.closeTime || "12:00"}
                  onChange={(e) => updateShift1("closeTime", e.target.value)}
                  style={{ padding: "8px 10px", fontSize: "13px", fontWeight: 600 }}
                />
              </div>
            </div>
          </div>

          {/* Shift 2 (Split Shift) */}
          <div
            style={{
              border: "1px solid var(--border-subtle)",
              borderRadius: "12px",
              padding: "14px 16px",
              background: "var(--bg-surface-hover, var(--bg-muted))",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              opacity: day.shift2?.isEnabled ? 1 : 0.7,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: "13px",
                fontWeight: 700,
                color: "var(--text-main)",
              }}
            >
              <span>🌙 {t("shift2Title")}</span>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={Boolean(day.shift2?.isEnabled)}
                  onChange={toggleShift2}
                  style={{ accentColor: "var(--brand-lime)" }}
                />
                <span>{t("enableShift2")}</span>
              </label>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label
                  style={{
                    fontSize: "11px",
                    color: "var(--text-muted)",
                    fontWeight: 600,
                    textTransform: "uppercase",
                  }}
                >
                  {t("openLabel")}
                </label>
                <input
                  type="time"
                  className="input-field"
                  disabled={!day.shift2?.isEnabled}
                  value={day.shift2?.openTime || "16:00"}
                  onChange={(e) => updateShift2("openTime", e.target.value)}
                  style={{ padding: "8px 10px", fontSize: "13px", fontWeight: 600 }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label
                  style={{
                    fontSize: "11px",
                    color: "var(--text-muted)",
                    fontWeight: 600,
                    textTransform: "uppercase",
                  }}
                >
                  {t("closeLabel")}
                </label>
                <input
                  type="time"
                  className="input-field"
                  disabled={!day.shift2?.isEnabled}
                  value={day.shift2?.closeTime || "23:00"}
                  onChange={(e) => updateShift2("closeTime", e.target.value)}
                  style={{ padding: "8px 10px", fontSize: "13px", fontWeight: 600 }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Visual Timeline Ribbon */}
      <div style={{ marginTop: "4px" }}>
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
