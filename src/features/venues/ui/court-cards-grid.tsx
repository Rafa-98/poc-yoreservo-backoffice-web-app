"use client";

import React from "react";
import { useTranslations } from "next-intl";
import type { SpaceItem, VenueItem } from "../model/types";

interface CourtCardsGridProps {
  venues: VenueItem[];
  selectedVenueId: string;
  onSelectVenueId: (id: string) => void;
  spaces: SpaceItem[];
  bcvRate: number;
  referenceCurrencyCode: string; // 'USD' | 'EUR'
  onOpenCreateCourt: () => void;
  onOpenEditCourt: (court: SpaceItem) => void;
  onToggleCourtStatus: (court: SpaceItem) => void;
}

export function CourtCardsGrid({
  venues,
  selectedVenueId,
  onSelectVenueId,
  spaces,
  bcvRate,
  referenceCurrencyCode = "USD",
  onOpenCreateCourt,
  onOpenEditCourt,
  onToggleCourtStatus,
}: CourtCardsGridProps) {
  const t = useTranslations("venues.spaces");

  const currencySymbol = referenceCurrencyCode === "EUR" ? "€" : "$";
  const currencySuffix =
    referenceCurrencyCode === "EUR" ? t("rateUnitEur") : t("rateUnit");

  function getSportBadge(space: SpaceItem): string {
    const raw =
      typeof space.activityCategory?.name === "object"
        ? space.activityCategory?.name?.es || space.activityCategory?.name?.en
        : space.activityCategory?.name;
    const act =
      typeof space.activityCategory?.activity?.name === "object"
        ? space.activityCategory?.activity?.name?.es ||
          space.activityCategory?.activity?.name?.en
        : space.activityCategory?.activity?.name;

    if (raw) return `⚽ ${raw}`;
    if (act) return `🎾 ${act}`;
    return `⚽ ${t("defaultSport")}`;
  }

  const totalSpacesCount = venues.reduce((acc, v) => acc + (v.spacesCount || 0), 0);

  return (
    <section className="py-5">
      {/* Venue Selector & Header */}
      <div className="flex flex-wrap items-center justify-between gap-3.5 px-5 pb-4">
        <div className="flex items-center gap-2.5">
          <label
            htmlFor="venue-selector"
            className="text-[13px] font-semibold text-muted-foreground"
          >
            {t("venueLabel")}
          </label>
          <select
            id="venue-selector"
            className="input-field form-select px-3.5 py-2 text-sm font-bold"
            value={selectedVenueId}
            onChange={(e) => onSelectVenueId(e.target.value)}
          >
            <option value="ALL">
              {t("venueOption", {
                name: "Consolidado Todas las Sedes",
                count: totalSpacesCount || spaces.length,
              })}
            </option>
            {venues.map((v) => (
              <option key={v.id} value={v.id}>
                {t("venueOption", { name: v.name, count: v.spacesCount })}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          className="btn btn-primary text-[13px]"
          onClick={onOpenCreateCourt}
          id="btn-add-court"
        >
          <span>+</span>
          <span>{t("btnAdd")}</span>
        </button>
      </div>

      {/* Grid of Courts */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(340px,1fr))] gap-5 px-5 pb-8">
        {spaces.map((court) => {
          const isEnabled = court.status === "ENABLED";
          const bcvTotal = (court.pricePerHour * bcvRate).toLocaleString("es-VE", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });
          const surfaceName = court.surfaceType || t("defaultSurface");
          const courtVenueName =
            court.venueName ||
            court.venue?.name ||
            venues.find((v) => v.id === court.venueId)?.name;

          return (
            <div
              key={court.id}
              className={`court-config-card flex flex-col justify-between rounded-[20px] border border-border border-t-4 bg-surface p-5.5 shadow-card ${
                isEnabled
                  ? "border-t-accent opacity-100"
                  : "border-t-status-hold-fg opacity-85"
              }`}
            >
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <span className="badge badge-confirmed">
                    {getSportBadge(court)}
                  </span>
                  {isEnabled ? (
                    <span className="badge badge-available">
                      {t("statusEnabled")}
                    </span>
                  ) : (
                    <span className="badge badge-cancelled">
                      {t("statusDisabled")}
                    </span>
                  )}
                </div>

                {court.imageUrl && (
                  <div className="mb-3 overflow-hidden rounded-xl border border-border bg-muted/40">
                    <img
                      src={court.imageUrl}
                      alt={court.spaceNumber}
                      className="h-36 w-full object-cover"
                    />
                  </div>
                )}

                {courtVenueName && (
                  <div className="mb-0.5 text-[11px] font-bold uppercase tracking-wider text-link">
                    📍 {courtVenueName}
                  </div>
                )}
                <h3 className="mb-1.5 text-[19px] font-bold text-foreground">
                  {court.spaceNumber}
                </h3>

                <div className="mb-3.5 text-[12.5px] text-muted-foreground">
                  {t("surfaceLabel")}{" "}
                  <strong className="text-foreground">
                    {surfaceName}
                  </strong>
                </div>

                {/* Price Box */}
                <div className="mb-4 rounded-xl bg-muted p-3.5">
                  <div className="mb-1 text-[11px] font-bold text-muted-foreground uppercase">
                    {t("hourlyRate")}
                  </div>
                  <div className="flex items-baseline gap-1 font-display text-2xl font-bold text-link">
                    {currencySymbol}
                    {court.pricePerHour.toFixed(2)}{" "}
                    <span className="text-[13px] font-medium text-muted-foreground">
                      {currencySuffix}
                    </span>
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {t("bcvEquivalent", { amount: bcvTotal })}
                  </div>
                </div>

                <div className="mb-4 text-xs leading-relaxed text-muted-foreground">
                  {court.capacity != null && court.capacity > 0 && (
                    <>
                      • {t("capacity", { cap: court.capacity })}
                      <br />
                    </>
                  )}
                  • {t("surfaceLabel")} {surfaceName}
                  <br />
                  •{" "}
                  {t("coveredLabel", {
                    value: court.isCovered
                      ? "Techada (Indoor)"
                      : "Aire Libre (Outdoor)",
                  })}
                  {court.activeBookingsCount > 0 && (
                    <div className="mt-1 font-semibold text-link">
                      {t("activeBookingsBadge", {
                        count: court.activeBookingsCount,
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 border-t border-border pt-3.5">
                <button
                  type="button"
                  className="btn btn-outline flex-1 text-[12.5px]"
                  onClick={() => onOpenEditCourt(court)}
                >
                  ✏️ <span>{t("btnEdit")}</span>
                </button>

                {isEnabled ? (
                  <button
                    type="button"
                    className="btn btn-destructive px-3 py-2 text-xs"
                    onClick={() => onToggleCourtStatus(court)}
                    id={`btn-disable-${court.id}`}
                  >
                    ⏸️ <span>{t("btnDisable")}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-primary px-3 py-2 text-xs"
                    onClick={() => onToggleCourtStatus(court)}
                    id={`btn-enable-${court.id}`}
                  >
                    ▶️ <span>{t("btnEnable")}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
