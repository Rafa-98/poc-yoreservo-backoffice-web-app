"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ROUTES } from "@/shared/config";
import type { LocationNode, VenueItem } from "../model/types";
import { BackofficeLocationSelect } from "./backoffice-location-select";

interface VenueCardGridProps {
  venues: VenueItem[];
  locationsTree?: LocationNode[];
  onOpenEditVenue: (venue: VenueItem) => void;
  onOpenCreateVenue: () => void;
}

export function VenueCardGrid({
  venues,
  locationsTree = [],
  onOpenEditVenue,
  onOpenCreateVenue,
}: VenueCardGridProps) {
  const t = useTranslations("venues.venues");
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  function getLocationString(venue: VenueItem): string {
    const loc = venue.location;
    if (!loc) return `📍 ${t("defaultLocation")}`;

    const hood =
      typeof loc.name === "object" ? loc.name?.es || loc.name?.en : loc.name;
    const city = loc.parent
      ? typeof loc.parent.name === "object"
        ? loc.parent.name?.es || loc.parent.name?.en
        : loc.parent.name
      : "";
    const state = loc.parent?.parent
      ? typeof loc.parent.parent.name === "object"
        ? loc.parent.parent.name?.es || loc.parent.parent.name?.en
        : loc.parent.parent.name
      : "";

    if (state && city && hood) {
      return `📍 ${state}, ${city} • ${hood}`;
    }
    return `📍 ${hood || t("defaultLocation")}`;
  }

  const filteredVenues = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    // Collect descendant city/neighborhood IDs if selectedLocationId is in locationsTree
    const matchingLocationIds = new Set<string>();
    if (selectedLocationId) {
      matchingLocationIds.add(selectedLocationId);
      for (const st of locationsTree) {
        if (st.id === selectedLocationId) {
          for (const ct of st.children ?? []) {
            matchingLocationIds.add(ct.id);
            for (const hd of ct.children ?? []) {
              matchingLocationIds.add(hd.id);
            }
          }
        } else {
          for (const ct of st.children ?? []) {
            if (ct.id === selectedLocationId) {
              for (const hd of ct.children ?? []) {
                matchingLocationIds.add(hd.id);
              }
            }
          }
        }
      }
    }

    return venues.filter((venue) => {
      if (selectedLocationId) {
        const vStateId =
          venue.stateId ||
          venue.location?.parent?.parent?.id ||
          venue.location?.parent?.parentLocationId ||
          venue.location?.parent?.parentId ||
          "";
        const vCityId =
          venue.cityId ||
          venue.location?.parent?.id ||
          venue.location?.parentLocationId ||
          venue.location?.parentId ||
          "";
        const vHoodId =
          venue.neighborhoodId || venue.locationId || venue.location?.id || "";

        const matchesLoc =
          matchingLocationIds.has(vStateId) ||
          matchingLocationIds.has(vCityId) ||
          matchingLocationIds.has(vHoodId);
        if (!matchesLoc) return false;
      }

      if (q) {
        const locStr = getLocationString(venue).toLowerCase();
        const matchesQuery =
          venue.name.toLowerCase().includes(q) ||
          venue.address.toLowerCase().includes(q) ||
          (venue.rif && venue.rif.toLowerCase().includes(q)) ||
          locStr.includes(q);
        if (!matchesQuery) return false;
      }

      return true;
    });
  }, [venues, selectedLocationId, searchQuery, locationsTree]);

  function getVenueMetadataChips(venue: VenueItem): string[] {
    if (venue.amenities && venue.amenities.length > 0) {
      return venue.amenities;
    }

    const chips: string[] = [];
    if (venue.contactPhone) {
      chips.push(`📞 ${venue.contactPhone}`);
    }
    if (venue.contactEmail) {
      chips.push(`✉️ ${venue.contactEmail}`);
    }
    if (venue.rif) {
      chips.push(`🪪 ${t("rifChip", { rif: venue.rif })}`);
    }
    if (venue.locationLat && venue.locationLng) {
      chips.push(
        `📍 ${t("coordsChip", {
          coords: `${venue.locationLat.toFixed(4)}, ${venue.locationLng.toFixed(4)}`,
        })}`
      );
    }
    return chips;
  }

  return (
    <section className="py-6">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 pb-4">
        <div className="flex flex-wrap items-center gap-3">
          {locationsTree.length > 0 && (
            <BackofficeLocationSelect
              locationsTree={locationsTree}
              value={selectedLocationId}
              onChange={setSelectedLocationId}
              allLabel="Todos los estados"
              placeholder="Escribe estado o ciudad..."
            />
          )}
          <div className="relative min-w-[220px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 Buscar sede, dirección o RIF..."
              aria-label="Buscar sede"
              className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground hover:text-foreground"
                aria-label="Limpiar búsqueda"
              >
                ×
              </button>
            )}
          </div>
          <div className="text-sm font-medium text-muted-foreground">
            {filteredVenues.length === 1
              ? t("registeredCountOne")
              : t("registeredCountMany", { count: filteredVenues.length })}
          </div>
        </div>
        <button
          type="button"
          className="btn btn-primary text-[13px]"
          onClick={onOpenCreateVenue}
          id="btn-add-venue"
        >
          <span>+</span>
          <span>{t("btnAdd")}</span>
        </button>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(360px,1fr))] gap-6 px-5 pb-8">
        {filteredVenues.map((venue) => {
          const isActive = venue.status === "ACTIVE";
          const sportsText =
            venue.sports && venue.sports.length > 0
              ? venue.sports.slice(0, 2).join(" / ")
              : t("defaultSports");
          const chips = getVenueMetadataChips(venue);

          return (
            <div
              key={venue.id}
              className={`venue-card flex flex-col overflow-hidden rounded-[20px] border border-border border-t-4 bg-surface shadow-card ${
                isActive ? "border-t-accent" : "border-t-status-hold-fg"
              }`}
            >
              {/* Hero Image */}
              <div className="relative h-40 overflow-hidden bg-gradient-to-br from-forest-800 to-forest-950">
                {venue.imageUrl && (
                  <img
                    src={venue.imageUrl}
                    alt={venue.name}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                )}
                <div className="absolute inset-0 flex items-end bg-gradient-to-b from-black/10 to-forest-900/85 p-4">
                  {isActive ? (
                    <span className="badge badge-available">
                      {t("activeInApp")}
                    </span>
                  ) : (
                    <span className="badge badge-hold">
                      {t("inAudit")}
                    </span>
                  )}
                </div>
              </div>

              {/* Body */}
              <div className="flex flex-1 flex-col p-5">
                <div className="mb-2">
                  <h3 className="mb-1 text-lg font-bold text-foreground">
                    {venue.name}
                  </h3>
                  <div className="text-[12.5px] text-muted-foreground">
                    {getLocationString(venue)}
                  </div>
                </div>

                <div className="mb-4 text-xs leading-relaxed text-muted-foreground">
                  {venue.address}
                </div>

                {/* Amenities or Venue Contact/Coordinates Summary Chips */}
                {chips.length > 0 && (
                  <div className="mb-5 flex flex-wrap gap-1.5">
                    {chips.map((chip) => (
                      <span
                        key={chip}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-2.5 py-1 text-[11.5px] font-semibold text-muted-foreground"
                      >
                        {chip}
                      </span>
                    ))}
                  </div>
                )}

                {/* Stats Strip */}
                <div className="mb-5 grid grid-cols-3 gap-2 rounded-xl bg-muted p-3 text-center">
                  <div>
                    <div className="text-[11px] text-muted-foreground">
                      {t("courts")}
                    </div>
                    <div className="text-base font-bold text-link">
                      {venue.spacesCount}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-muted-foreground">
                      {t("sports")}
                    </div>
                    <div className="text-sm font-bold text-foreground">
                      {sportsText}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-muted-foreground">
                      {t("staff")}
                    </div>
                    <div className="text-sm font-bold text-foreground">
                      {t("staffCount", { count: venue.staffCount })}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-auto flex gap-2.5">
                  <Link
                    href={`${ROUTES.spaces}?venueId=${venue.id}`}
                    prefetch={false}
                    className="btn btn-primary flex-1 text-center text-[12.5px]"
                  >
                    ⚙️ <span>{t("btnManageCourts")}</span>
                  </Link>
                  <button
                    type="button"
                    className="btn btn-outline text-[12.5px]"
                    onClick={() => onOpenEditVenue(venue)}
                  >
                    ✏️ <span>{t("btnEdit")}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
