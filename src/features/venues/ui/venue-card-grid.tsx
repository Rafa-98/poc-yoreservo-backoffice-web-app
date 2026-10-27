"use client";

import React, { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { MapPin } from "lucide-react";
import { ROUTES } from "@/shared/config";
import { useActiveVenue } from "../context/venue-context";
import {
  deriveOrganizationsFromVenues,
  type LocationNode,
  type VenueItem,
} from "../model/types";
import { BackofficeLocationSelect } from "./backoffice-location-select";
import { OrganizationInlineCombobox } from "./venue-inline-combobox";
import { VenueMapViewerModal } from "./venue-map-viewer-modal";

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
  const locale = useLocale();
  const isEn = locale.toLowerCase().startsWith("en");
  const t = useTranslations("venues.venues");
  const {
    isPlatformRole,
    activeOrganizationId,
    setActiveOrganizationId,
    organizations: contextOrganizations,
  } = useActiveVenue();
  const organizations = useMemo(
    () => deriveOrganizationsFromVenues(venues, contextOrganizations),
    [venues, contextOrganizations],
  );
  const showOrganizationFilter = isPlatformRole || organizations.length > 1;
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [mapPreviewVenue, setMapPreviewVenue] = useState<VenueItem | null>(
    null
  );
  const topRef = useRef<HTMLElement | null>(null);
  const PAGE_SIZE = 6;

  function handlePageChange(nextPage: number) {
    setCurrentPage(nextPage);
    if (topRef.current) {
      topRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    if (typeof document !== "undefined") {
      const mainEl = document.querySelector("main");
      if (mainEl) {
        mainEl.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function getLocationString(venue: VenueItem): string {
    const loc = venue.location;
    if (!loc) return `📍 ${t("defaultLocation")}`;

    const hood =
      typeof loc.name === "object"
        ? isEn
          ? loc.name?.en || loc.name?.es
          : loc.name?.es || loc.name?.en
        : loc.name;
    const city = loc.parent
      ? typeof loc.parent.name === "object"
        ? isEn
          ? loc.parent.name?.en || loc.parent.name?.es
          : loc.parent.name?.es || loc.parent.name?.en
        : loc.parent.name
      : "";
    const state = loc.parent?.parent
      ? typeof loc.parent.parent.name === "object"
        ? isEn
          ? loc.parent.parent.name?.en || loc.parent.parent.name?.es
          : loc.parent.parent.name?.es || loc.parent.parent.name?.en
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
      if (
        showOrganizationFilter &&
        activeOrganizationId &&
        activeOrganizationId !== "ALL"
      ) {
        if (venue.organizationId !== activeOrganizationId) return false;
      }

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
  }, [
    venues,
    showOrganizationFilter,
    activeOrganizationId,
    selectedLocationId,
    searchQuery,
    locationsTree,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredVenues.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedVenues = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredVenues.slice(start, start + PAGE_SIZE);
  }, [filteredVenues, safePage]);

  function getVenueMetadataChips(venue: VenueItem): string[] {
    const chips: string[] = [];
    const phones =
      venue.contactPhones && venue.contactPhones.length > 0
        ? venue.contactPhones
        : venue.contactPhone
          ? [venue.contactPhone]
          : [];
    const emails =
      venue.contactEmails && venue.contactEmails.length > 0
        ? venue.contactEmails
        : venue.contactEmail
          ? [venue.contactEmail]
          : [];

    for (const phone of phones) {
      chips.push(`📞 ${phone}`);
    }
    for (const email of emails) {
      chips.push(`✉️ ${email}`);
    }
    if (venue.rif) {
      chips.push(`🪪 ${t("rifChip", { rif: venue.rif })}`);
    }
    if (venue.amenities && venue.amenities.length > 0) {
      for (const amenity of venue.amenities.slice(0, 3)) {
        chips.push(amenity);
      }
    } else if (venue.locationLat && venue.locationLng) {
      chips.push(
        `📍 ${t("coordsChip", {
          coords: `${venue.locationLat.toFixed(4)}, ${venue.locationLng.toFixed(4)}`,
        })}`
      );
    }
    return chips;
  }

  return (
    <section ref={topRef} className="py-6">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 pb-4">
        <div className="flex flex-wrap items-center gap-3">
          {showOrganizationFilter && (
            <OrganizationInlineCombobox
              id="venues-org-filter"
              organizations={organizations}
              selectedOrganizationId={activeOrganizationId}
              onSelectOrganizationId={(nextOrgId) => {
                setActiveOrganizationId(nextOrgId);
                setCurrentPage(1);
              }}
              showLabel={true}
            />
          )}
          {locationsTree.length > 0 && (
            <BackofficeLocationSelect
              locationsTree={locationsTree}
              value={selectedLocationId}
              onChange={(val) => {
                setSelectedLocationId(val);
                setCurrentPage(1);
              }}
              allLabel={isEn ? "All states" : "Todos los estados"}
              placeholder={
                isEn ? "Type state or city..." : "Escribe estado o ciudad..."
              }
            />
          )}
          <div className="relative min-w-[220px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={
                isEn
                  ? "🔍 Search venue, address or tax ID..."
                  : "🔍 Buscar sede, dirección o RIF..."
              }
              aria-label={isEn ? "Search venue" : "Buscar sede"}
              className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setCurrentPage(1);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground hover:text-foreground"
                aria-label={isEn ? "Clear search" : "Limpiar búsqueda"}
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

      <div className="grid grid-cols-[repeat(auto-fill,minmax(360px,1fr))] gap-6 px-5 pb-6">
        {paginatedVenues.map((venue) => {
          const isActive = venue.status === "ACTIVE";
          const isInactive = venue.status === "INACTIVE";
          const sportsText =
            venue.sports && venue.sports.length > 0
              ? venue.sports.slice(0, 2).join(" / ")
              : t("defaultSports");
          const chips = getVenueMetadataChips(venue);

          return (
            <div
              key={venue.id}
              className={`venue-card flex flex-col overflow-hidden rounded-[20px] border border-border border-t-4 bg-surface shadow-card ${
                isActive
                  ? "border-t-accent"
                  : isInactive
                    ? "border-t-status-cancelled-fg"
                    : "border-t-status-hold-fg"
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
                  ) : isInactive ? (
                    <span className="badge badge-cancelled">
                      ● {isEn ? "DISABLED / INACTIVE" : "DESHABILITADA / INACTIVA"}
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
                  {showOrganizationFilter && venue.organizationName && (
                    <div className="mb-1 inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[11px] font-bold text-muted-foreground">
                      <span>🏢</span>
                      <span className="truncate">{venue.organizationName}</span>
                    </div>
                  )}
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <h3 className="text-lg font-bold text-foreground">
                      {venue.name}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setMapPreviewVenue(venue)}
                      className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-xl border border-border-medium bg-muted/60 px-2.5 py-1 text-[11.5px] font-bold text-foreground transition-all hover:border-accent hover:bg-accent/20"
                      title={
                        isEn
                          ? "View venue location on map"
                          : "Ver ubicación de la sede en el mapa"
                      }
                    >
                      <MapPin className="size-3.5 text-link" />
                      <span>{isEn ? "Open in map" : "Abrir en mapa"}</span>
                    </button>
                  </div>
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

      {/* Pagination Bar */}
      {filteredVenues.length > 0 && (
        <div className="mx-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface px-5 py-3.5 shadow-sm">
          <div className="text-xs font-medium text-muted-foreground">
            {isEn ? "Showing " : "Mostrando "}
            <strong className="font-bold text-foreground">
              {(safePage - 1) * PAGE_SIZE + 1}–
              {Math.min(safePage * PAGE_SIZE, filteredVenues.length)}
            </strong>{" "}
            {isEn ? "of " : "de "}
            <strong className="font-bold text-foreground">
              {filteredVenues.length}
            </strong>{" "}
            {filteredVenues.length === 1
              ? isEn
                ? "registered venue"
                : "sede registrada"
              : isEn
                ? "registered venues"
                : "sedes registradas"}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => handlePageChange(Math.max(1, safePage - 1))}
              className="cursor-pointer rounded-xl border border-border bg-surface px-3.5 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-45"
            >
              {isEn ? "← Previous" : "← Anterior"}
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, idx) => idx + 1).map(
                (pageNum) => (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => handlePageChange(pageNum)}
                    className={`flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                      pageNum === safePage
                        ? "bg-accent text-accent-foreground shadow-xs"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              )}
            </div>
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() =>
                handlePageChange(Math.min(totalPages, safePage + 1))
              }
              className="cursor-pointer rounded-xl border border-border bg-surface px-3.5 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-45"
            >
              {isEn ? "Next →" : "Siguiente →"}
            </button>
          </div>
        </div>
      )}

      <VenueMapViewerModal
        venue={mapPreviewVenue}
        locationLabel={
          mapPreviewVenue ? getLocationString(mapPreviewVenue) : ""
        }
        onClose={() => setMapPreviewVenue(null)}
      />
    </section>
  );
}
