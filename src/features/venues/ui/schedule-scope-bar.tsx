"use client";

import React from "react";
import { Loader2 } from "lucide-react";
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
  onApplyStandardTemplate?: () => void;
  onCopyMondayToWeek: () => void;
  onSaveSchedules: () => void;
  isSaving: boolean;
  isLoading?: boolean;
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
  onApplyStandardTemplate,
  onCopyMondayToWeek,
  onSaveSchedules,
  isSaving,
  isLoading = false,
}: ScheduleScopeBarProps) {
  const t = useTranslations("venues.schedules");
  const currentVenue =
    selectedVenueId === "ALL"
      ? null
      : venues.find((v) => v.id === selectedVenueId) || venues[0];

  return (
    <div className="mx-5 mb-6 flex flex-col gap-4 rounded-2xl border border-border bg-surface px-6 py-4.5 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3.5">
        {/* Scope selector */}
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="mb-1 block text-[11px] font-bold text-muted-foreground uppercase">
              {t("venueLabel")}
            </label>
            <select
              className="input-field form-select px-3 py-2 text-[13px] font-semibold"
              value={selectedVenueId}
              onChange={(e) => onSelectVenueId(e.target.value)}
            >
              <option value="ALL">Consolidado Todas las Sedes</option>
              {venues.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-bold text-muted-foreground uppercase">
              {t("scopeTitle")}
            </label>
            <div className="flex flex-wrap items-center gap-3.5">
              <label className="flex cursor-pointer items-center gap-1.5 text-[13px] text-foreground">
                <input
                  type="radio"
                  name="schedule_scope"
                  checked={applyToAllVenueSpaces}
                  onChange={() => onToggleApplyToAll(true)}
                  className="accent-accent"
                />
                <span>
                  {t("scopeVenueAll", {
                    venueName:
                      selectedVenueId === "ALL"
                        ? "Todas las Sedes"
                        : currentVenue?.name || t("defaultVenue"),
                  })}
                </span>
              </label>

              <label className="flex cursor-pointer items-center gap-1.5 text-[13px] text-foreground">
                <input
                  type="radio"
                  name="schedule_scope"
                  checked={!applyToAllVenueSpaces}
                  onChange={() => onToggleApplyToAll(false)}
                  className="accent-accent"
                />
                <span>{t("specificCourtLabel")}</span>
              </label>

              {!applyToAllVenueSpaces && (
                <select
                  className="input-field form-select px-2.5 py-1.5 text-[12.5px]"
                  value={selectedSpaceId}
                  onChange={(e) => onSelectSpaceId(e.target.value)}
                >
                  {spaces.map((s) => {
                    const vName =
                      s.venueName ||
                      s.venue?.name ||
                      venues.find((v) => v.id === s.venueId)?.name;
                    return (
                      <option key={s.id} value={s.id}>
                        {selectedVenueId === "ALL" && vName
                          ? `${vName} — ${s.spaceNumber}`
                          : s.spaceNumber}
                      </option>
                    );
                  })}
                </select>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {onApplyStandardTemplate && (
            <button
              type="button"
              className="btn btn-outline text-[12.5px]"
              onClick={onApplyStandardTemplate}
              id="btn-apply-standard-template"
            >
              ⚡ <span>{t("btnApplyTemplate")}</span>
            </button>
          )}
          <button
            type="button"
            onClick={onCopyMondayToWeek}
            className="btn btn-outline text-[12.5px]"
            id="btn-copy-monday"
          >
            📋 <span>{t("btnCopyMonday")}</span>
          </button>
          <button
            type="button"
            className="btn btn-primary inline-flex items-center gap-2 text-[13px] disabled:opacity-50"
            onClick={onSaveSchedules}
            disabled={isSaving || isLoading}
            id="btn-save-schedules"
          >
            {(isSaving || isLoading) && (
              <Loader2 className="size-3.5 animate-spin" />
            )}
            <span>{t("btnSave")}</span>
          </button>
        </div>
      </div>

      {/* Visual Timeline Legend */}
      <div className="flex flex-wrap items-center gap-4 border-t border-border pt-3 text-xs text-muted-foreground">
        <span className="font-semibold text-foreground">{t("timelineLegend")}</span>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-[3px] bg-accent" />
          <span>
            {t("legendShift1")} {t("morningSuffix")}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-[3px] border border-dashed border-border-strong bg-muted" />
          <span>{t("legendRecess")}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-[3px] bg-primary" />
          <span>
            {t("legendShift2")} {t("eveningSuffix")}
          </span>
        </div>
      </div>
    </div>
  );
}

