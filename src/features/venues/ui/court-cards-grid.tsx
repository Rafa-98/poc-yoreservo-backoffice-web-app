"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ROUTES } from "@/shared/config";
import type { SpaceItem, VenueItem } from "../model/types";
import type { AmenityItem } from "@/features/catalogs/model/types";

interface CourtCardsGridProps {
  venues: VenueItem[];
  selectedVenueId: string;
  onSelectVenueId: (id: string) => void;
  spaces: SpaceItem[];
  amenitiesCatalog?: AmenityItem[];
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
  amenitiesCatalog = [],
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

  const [venueFilterQuery, setVenueFilterQuery] = useState("");
  const [isVenueDropdownOpen, setIsVenueDropdownOpen] = useState(false);
  const venueDropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (
        venueDropdownRef.current &&
        !venueDropdownRef.current.contains(e.target as Node)
      ) {
        setIsVenueDropdownOpen(false);
        setVenueFilterQuery("");
      }
    }
    if (isVenueDropdownOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isVenueDropdownOpen]);

  const filteredVenueOptions = useMemo(() => {
    const q = venueFilterQuery.trim().toLowerCase();
    if (!q) return venues;
    return venues.filter((v) => v.name.toLowerCase().includes(q));
  }, [venues, venueFilterQuery]);

  const selectedVenueDisplayLabel = useMemo(() => {
    const totalCount = totalSpacesCount || spaces.length;
    const totalLabel = totalCount === 1 ? "1 cancha" : `${totalCount} canchas`;
    if (selectedVenueId === "ALL" || !selectedVenueId) {
      return `Todas las sedes (${totalLabel})`;
    }
    const found = venues.find((v) => v.id === selectedVenueId);
    if (!found) {
      return `Todas las sedes (${totalLabel})`;
    }
    const count = found.spacesCount ?? 0;
    const countLabel = count === 1 ? "1 cancha" : `${count} canchas`;
    return `${found.name} (${countLabel})`;
  }, [selectedVenueId, venues, totalSpacesCount, spaces.length]);

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

          <div ref={venueDropdownRef} className="relative min-w-[290px] sm:min-w-[330px]">
            <div
              className={`flex items-center gap-1.5 rounded-xl border bg-surface px-3 py-2 transition-all ${
                isVenueDropdownOpen
                  ? "border-accent ring-2 ring-accent/30"
                  : "border-border-medium hover:border-border-strong"
              }`}
            >
              <span className="shrink-0 text-xs">📍</span>
              <input
                id="venue-selector"
                type="text"
                value={
                  isVenueDropdownOpen
                    ? venueFilterQuery
                    : selectedVenueDisplayLabel
                }
                onFocus={() => {
                  setIsVenueDropdownOpen(true);
                  setVenueFilterQuery("");
                }}
                onChange={(e) => {
                  setIsVenueDropdownOpen(true);
                  setVenueFilterQuery(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setIsVenueDropdownOpen(false);
                    setVenueFilterQuery("");
                  } else if (e.key === "Enter" && isVenueDropdownOpen) {
                    e.preventDefault();
                    if (filteredVenueOptions.length > 0) {
                      onSelectVenueId(filteredVenueOptions[0].id);
                      setIsVenueDropdownOpen(false);
                      setVenueFilterQuery("");
                    }
                  }
                }}
                placeholder="Escribir o elegir sede..."
                aria-label={t("venueLabel")}
                className="w-full min-w-0 border-none bg-transparent text-[13px] font-bold text-foreground outline-none placeholder:font-normal placeholder:text-muted-foreground"
              />
              {selectedVenueId && selectedVenueId !== "ALL" && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectVenueId("ALL");
                    setVenueFilterQuery("");
                    setIsVenueDropdownOpen(false);
                  }}
                  title="Ver todas las sedes"
                  className="cursor-pointer rounded-md border-none bg-muted px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setIsVenueDropdownOpen((prev) => !prev);
                  setVenueFilterQuery("");
                }}
                className="cursor-pointer border-none bg-transparent px-1 text-xs text-muted-foreground"
                aria-label="Abrir lista de sedes"
              >
                ▾
              </button>
            </div>

            {isVenueDropdownOpen && (
              <div className="absolute right-0 left-0 z-30 mt-1 max-h-64 overflow-y-auto rounded-xl border border-border-medium bg-surface p-1.5 shadow-xl">
                <button
                  type="button"
                  onClick={() => {
                    onSelectVenueId("ALL");
                    setIsVenueDropdownOpen(false);
                    setVenueFilterQuery("");
                  }}
                  className={`flex w-full cursor-pointer items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs font-bold transition-colors ${
                    selectedVenueId === "ALL" || !selectedVenueId
                      ? "bg-accent/20 text-foreground"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  <span>🌐 Todas las sedes</span>
                  <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                    {(totalSpacesCount || spaces.length) === 1
                      ? "1 cancha"
                      : `${totalSpacesCount || spaces.length} canchas`}
                  </span>
                </button>

                {filteredVenueOptions.length === 0 ? (
                  <div className="px-3 py-3 text-center text-xs text-muted-foreground">
                    No se encontró ninguna sede con «{venueFilterQuery}»
                  </div>
                ) : (
                  filteredVenueOptions.map((v) => {
                    const isSelectedVenue = selectedVenueId === v.id;
                    const count = v.spacesCount ?? 0;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => {
                          onSelectVenueId(v.id);
                          setIsVenueDropdownOpen(false);
                          setVenueFilterQuery("");
                        }}
                        className={`mt-0.5 flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold transition-colors ${
                          isSelectedVenue
                            ? "bg-accent/20 font-bold text-foreground"
                            : "text-foreground hover:bg-muted"
                        }`}
                      >
                        <span className="truncate">📍 {v.name}</span>
                        <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                          {count === 1 ? "1 cancha" : `${count} canchas`}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>
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
          const pricePerHourNum = Number(court.pricePerHour) || 0;
          const bcvTotal = (pricePerHourNum * bcvRate).toLocaleString("es-VE", {
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
                    {pricePerHourNum.toFixed(2)}{" "}
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

                {/* Court Amenities Pills */}
                {Array.isArray(court.amenities) &&
                  court.amenities.length > 0 && (
                    <div className="mb-4 flex flex-wrap gap-1.5">
                      {court.amenities.map((amenityName) => {
                        const catalogMatch = amenitiesCatalog.find(
                          (a) =>
                            a.name === amenityName || a.code === amenityName
                        );
                        return (
                          <span
                            key={amenityName}
                            className="inline-flex items-center gap-1 rounded-lg border border-border bg-muted/60 px-2 py-0.5 text-[11px] font-semibold text-foreground"
                          >
                            <span>{catalogMatch?.icon || "✨"}</span>
                            <span>{catalogMatch?.name || amenityName}</span>
                          </span>
                        );
                      })}
                    </div>
                  )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 border-t border-border pt-3.5">
                <Link
                  href={`${ROUTES.schedules}?venueId=${encodeURIComponent(court.venueId)}&spaceId=${encodeURIComponent(court.id)}`}
                  className="btn btn-outline w-full justify-center border-accent/60 bg-accent/10 text-[12.5px] font-bold text-foreground hover:bg-accent/25"
                  id={`btn-schedules-${court.id}`}
                >
                  🕒 <span>{t("btnManageSchedules")}</span>
                </Link>

                <div className="flex gap-2">
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
            </div>
          );
        })}
      </div>
    </section>
  );
}
