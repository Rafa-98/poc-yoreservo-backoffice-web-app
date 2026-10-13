"use client";

import React from "react";
import { useTranslations } from "next-intl";
import type { SpaceItem, VenueItem } from "../model/types";

interface ScheduleScopeBarProps {
  venues: VenueItem[];
  selectedVenueId: string;
  onSelectVenueId: (id: string) => void;
  spaces: SpaceItem[];
  selectedSpaceId: string;
  onSelectSpaceId: (id: string) => void;
  applyToAllVenueSpaces: boolean;
  onToggleApplyToAll: (applyAll: boolean) => void;
  onCopyMondayToWeek: () => void;
  onSaveSchedules: () => void;
  isSaving: boolean;
}

export function ScheduleScopeBar({
  venues,
  selectedVenueId,
  onSelectVenueId,
  spaces,
  selectedSpaceId,
  onSelectSpaceId,
  applyToAllVenueSpaces,
  onToggleApplyToAll,
  onCopyMondayToWeek,
  onSaveSchedules,
  isSaving,
}: ScheduleScopeBarProps) {
  const t = useTranslations("venues.schedules");
  const currentVenue = venues.find((v) => v.id === selectedVenueId) || venues[0];

  return (
    <div
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "16px",
        padding: "18px 24px",
        margin: "0 20px 24px",
        boxShadow: "var(--shadow-sm)",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "14px",
        }}
      >
        {/* Scope selector */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <div>
            <label
              style={{
                fontSize: "11px",
                textTransform: "uppercase",
                color: "var(--text-muted)",
                fontWeight: 700,
                display: "block",
                marginBottom: "4px",
              }}
            >
              Sede:
            </label>
            <select
              className="input-field"
              value={selectedVenueId}
              onChange={(e) => onSelectVenueId(e.target.value)}
              style={{ padding: "8px 12px", fontSize: "13px", fontWeight: 600 }}
            >
              {venues.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              style={{
                fontSize: "11px",
                textTransform: "uppercase",
                color: "var(--text-muted)",
                fontWeight: 700,
                display: "block",
                marginBottom: "4px",
              }}
            >
              {t("scopeTitle")}
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                <input
                  type="radio"
                  name="schedule_scope"
                  checked={applyToAllVenueSpaces}
                  onChange={() => onToggleApplyToAll(true)}
                  style={{ accentColor: "var(--brand-lime)" }}
                />
                <span>
                  {t("scopeVenueAll", {
                    venueName: currentVenue?.name || "Sede",
                  })}
                </span>
              </label>

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                <input
                  type="radio"
                  name="schedule_scope"
                  checked={!applyToAllVenueSpaces}
                  onChange={() => onToggleApplyToAll(false)}
                  style={{ accentColor: "var(--brand-lime)" }}
                />
                <span>Cancha Específica:</span>
              </label>

              {!applyToAllVenueSpaces && (
                <select
                  className="input-field"
                  value={selectedSpaceId}
                  onChange={(e) => onSelectSpaceId(e.target.value)}
                  style={{ padding: "6px 10px", fontSize: "12.5px" }}
                >
                  {spaces.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.spaceNumber}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            type="button"
            className="btn btn-outline"
            onClick={onCopyMondayToWeek}
            id="btn-copy-monday"
            style={{ fontSize: "12.5px" }}
          >
            📋 <span>{t("btnCopyMonday")}</span>
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onSaveSchedules}
            disabled={isSaving}
            id="btn-save-schedules"
            style={{ fontSize: "13px" }}
          >
            {isSaving ? "..." : t("btnSave")}
          </button>
        </div>
      </div>

      {/* Visual Timeline Legend */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          borderTop: "1px solid var(--border-subtle)",
          paddingTop: "12px",
          fontSize: "12px",
          color: "var(--text-muted)",
        }}
      >
        <span style={{ fontWeight: 600 }}>{t("timelineLegend")}</span>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span
            style={{
              width: "12px",
              height: "12px",
              borderRadius: "3px",
              background: "var(--brand-lime)",
              display: "inline-block",
            }}
          />
          <span>{t("legendShift1")} (Mañana)</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span
            style={{
              width: "12px",
              height: "12px",
              borderRadius: "3px",
              background:
                "repeating-linear-gradient(-45deg, rgba(0,0,0,0.1), rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.2) 2px, rgba(0,0,0,0.2) 4px)",
              display: "inline-block",
            }}
          />
          <span>{t("legendRecess")}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span
            style={{
              width: "12px",
              height: "12px",
              borderRadius: "3px",
              background: "var(--brand-forest, #1F3316)",
              display: "inline-block",
            }}
          />
          <span>{t("legendShift2")} (Tarde/Noche)</span>
        </div>
      </div>
    </div>
  );
}
