"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ChevronDown, ChevronRight, MapPin, X } from "lucide-react";
import { useActiveVenue } from "../context/venue-context";
import {
  deriveOrganizationsFromVenues,
  type DerivedOrganizationOption,
  type VenueItem,
} from "../model/types";
import {
  OrganizationAdvancedSelector,
  type SelectableOrganizationItem,
} from "./organization-advanced-selector";

export interface OrganizationInlineComboboxProps {
  organizations?: DerivedOrganizationOption[];
  selectedOrganizationId?: string;
  onSelectOrganizationId?: (organizationId: string) => void;
  allowAllOrganizations?: boolean;
  showLabel?: boolean;
  label?: string;
  id?: string;
  className?: string;
}

export function OrganizationInlineCombobox({
  organizations: organizationsProp,
  selectedOrganizationId: selectedOrganizationIdProp,
  onSelectOrganizationId: onSelectOrganizationIdProp,
  allowAllOrganizations = true,
  showLabel = true,
  label,
  id = "inline-org-selector",
  className = "",
}: OrganizationInlineComboboxProps) {
  const locale = useLocale();
  const isEn = locale.toLowerCase().startsWith("en");
  const resolvedLabel = label ?? (isEn ? "Organization:" : "Organización:");
  const {
    venues: contextVenues,
    organizations: contextOrganizations,
    activeOrganizationId: contextActiveOrganizationId,
    setActiveOrganizationId: contextSetActiveOrganizationId,
  } = useActiveVenue();

  const organizations = organizationsProp ?? contextOrganizations;
  const selectedOrganizationId =
    selectedOrganizationIdProp ?? contextActiveOrganizationId ?? "ALL";

  const handleSelectOrganization = (nextOrgId: string) => {
    if (onSelectOrganizationIdProp) {
      onSelectOrganizationIdProp(nextOrgId);
    } else {
      contextSetActiveOrganizationId(nextOrgId);
    }
  };

  const selectableOrgs = useMemo<SelectableOrganizationItem[]>(
    () =>
      organizations.map((o) => ({
        id: o.id,
        tradeName: o.tradeName,
        legalName: o.legalName ?? undefined,
        rif: o.rif ?? undefined,
        isPlatformOrg: o.isPlatformOrg,
        venuesCount: o.venuesCount,
        paymentCollectionMode: o.paymentCollectionMode,
        referenceCurrencyCode: o.referenceCurrencyCode,
        venues: o.venues,
      })),
    [organizations],
  );

  return (
    <div className={`inline-flex items-center ${className}`}>
      <OrganizationAdvancedSelector
        id={id}
        label={showLabel ? resolvedLabel : undefined}
        organizations={selectableOrgs}
        venues={contextVenues}
        selectedOrganizationId={selectedOrganizationId}
        onSelectOrganization={handleSelectOrganization}
        allowAll={allowAllOrganizations}
        allLabel={isEn ? "All Organizations" : "Todas las Organizaciones"}
      />
    </div>
  );
}

export interface VenueInlineComboboxProps {
  venues?: VenueItem[];
  selectedOrganizationId?: string;
  onSelectOrganizationId?: (organizationId: string) => void;
  selectedVenueId?: string;
  onSelectVenueId?: (venueId: string) => void;
  totalSpacesOverride?: number;
  allowAllVenues?: boolean;
  showLabel?: boolean;
  id?: string;
  actions?: React.ReactNode;
}

export function VenueInlineCombobox({
  venues: venuesProp,
  selectedOrganizationId: selectedOrganizationIdProp,
  onSelectOrganizationId: onSelectOrganizationIdProp,
  selectedVenueId: selectedVenueIdProp,
  onSelectVenueId: onSelectVenueIdProp,
  totalSpacesOverride,
  allowAllVenues = true,
  showLabel = true,
  id = "inline-venue-selector",
  actions,
}: VenueInlineComboboxProps) {
  const locale = useLocale();
  const isEn = locale.toLowerCase().startsWith("en");
  const t = useTranslations("venues.spaces");
  const {
    venues: contextVenues,
    organizations: contextOrganizations,
    isPlatformRole,
    activeOrganizationId: contextActiveOrganizationId,
    setActiveOrganizationId: contextSetActiveOrganizationId,
    activeVenueId: contextActiveVenueId,
    setActiveVenueId: contextSetActiveVenueId,
    isManagedLocked,
  } = useActiveVenue();

  // Merge prop venues with contextVenues metadata if organizationName is missing on a minimal prop
  const allVenues = useMemo(() => {
    if (!venuesProp) return contextVenues;
    if (contextVenues.length === 0) return venuesProp;
    const contextMap = new Map(contextVenues.map((v) => [v.id, v]));
    return venuesProp.map((v) => {
      const full = contextMap.get(v.id);
      if (!full) return v;
      return {
        ...full,
        ...v,
        organizationId: v.organizationId || full.organizationId,
        organizationName: v.organizationName || full.organizationName,
        organizationLegalName:
          v.organizationLegalName ?? full.organizationLegalName,
        organizationRif: v.organizationRif ?? full.organizationRif,
        isPlatformOrg: v.isPlatformOrg ?? full.isPlatformOrg,
      };
    });
  }, [venuesProp, contextVenues]);

  const organizations = useMemo(() => {
    if (!venuesProp && contextOrganizations.length > 0) {
      return contextOrganizations;
    }
    const derived = deriveOrganizationsFromVenues(allVenues);
    return derived.length > 0 ? derived : contextOrganizations;
  }, [venuesProp, allVenues, contextOrganizations]);

  const showOrganizationFilter = isPlatformRole || organizations.length > 1;

  const selectedOrganizationId =
    selectedOrganizationIdProp ?? contextActiveOrganizationId ?? "ALL";
  const selectedVenueId = selectedVenueIdProp ?? contextActiveVenueId ?? "ALL";

  const scopedVenues = useMemo(() => {
    if (
      !showOrganizationFilter ||
      !selectedOrganizationId ||
      selectedOrganizationId === "ALL"
    ) {
      return allVenues;
    }
    return allVenues.filter((v) => v.organizationId === selectedOrganizationId);
  }, [allVenues, showOrganizationFilter, selectedOrganizationId]);

  const handleSelectVenue = (nextVenueId: string) => {
    if (nextVenueId !== "ALL") {
      const targetVenue = allVenues.find((v) => v.id === nextVenueId);
      if (
        targetVenue?.organizationId &&
        selectedOrganizationId !== "ALL" &&
        targetVenue.organizationId !== selectedOrganizationId
      ) {
        if (onSelectOrganizationIdProp) {
          onSelectOrganizationIdProp(targetVenue.organizationId);
        } else {
          contextSetActiveOrganizationId(targetVenue.organizationId);
        }
      }
    }
    if (onSelectVenueIdProp) {
      onSelectVenueIdProp(nextVenueId);
    } else {
      contextSetActiveVenueId(nextVenueId);
    }
  };

  const handleSelectOrganization = (nextOrgId: string) => {
    if (onSelectOrganizationIdProp) {
      onSelectOrganizationIdProp(nextOrgId);
    } else {
      contextSetActiveOrganizationId(nextOrgId);
    }

    const nextOrgVenues =
      nextOrgId === "ALL"
        ? allVenues
        : allVenues.filter((v) => v.organizationId === nextOrgId);

    if (!allowAllVenues) {
      const firstVenueId = nextOrgVenues[0]?.id;
      if (firstVenueId) {
        handleSelectVenue(firstVenueId);
      }
    } else if (selectedVenueId && selectedVenueId !== "ALL") {
      const stillInOrg = nextOrgVenues.some((v) => v.id === selectedVenueId);
      if (!stillInOrg) {
        if (onSelectVenueIdProp) {
          onSelectVenueIdProp("ALL");
        } else {
          contextSetActiveVenueId("ALL");
        }
      }
    }
  };

  const totalSpacesCount = useMemo(() => {
    if (
      typeof totalSpacesOverride === "number" &&
      totalSpacesOverride > 0 &&
      (!showOrganizationFilter || selectedOrganizationId === "ALL")
    ) {
      return totalSpacesOverride;
    }
    return scopedVenues.reduce((acc, v) => acc + (v.spacesCount || 0), 0);
  }, [
    totalSpacesOverride,
    scopedVenues,
    showOrganizationFilter,
    selectedOrganizationId,
  ]);

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
    if (!q) return scopedVenues;
    return scopedVenues.filter(
      (v) =>
        v.name.toLowerCase().includes(q) ||
        (v.organizationName && v.organizationName.toLowerCase().includes(q)),
    );
  }, [scopedVenues, venueFilterQuery]);

  const selectedVenueDisplayLabel = useMemo(() => {
    const totalLabel =
      totalSpacesCount === 1
        ? isEn
          ? "1 court"
          : "1 cancha"
        : isEn
          ? `${totalSpacesCount} courts`
          : `${totalSpacesCount} canchas`;
    if (selectedVenueId === "ALL" || !selectedVenueId) {
      return isEn
        ? `All venues (${totalLabel})`
        : `Todas las sedes (${totalLabel})`;
    }
    const found =
      scopedVenues.find((v) => v.id === selectedVenueId) ??
      allVenues.find((v) => v.id === selectedVenueId);
    if (!found) {
      return isEn
        ? `All venues (${totalLabel})`
        : `Todas las sedes (${totalLabel})`;
    }
    const count = found.spacesCount ?? 0;
    const countLabel =
      count === 1
        ? isEn
          ? "1 court"
          : "1 cancha"
        : isEn
          ? `${count} courts`
          : `${count} canchas`;
    return `${found.name} (${countLabel})`;
  }, [selectedVenueId, scopedVenues, allVenues, totalSpacesCount, isEn]);

  return (
    <div className="inline-flex flex-wrap md:flex-nowrap items-center gap-2 rounded-2xl border border-border bg-surface p-1.5 shadow-2xs">
      {showOrganizationFilter && !isManagedLocked && (
        <>
          <OrganizationInlineCombobox
            organizations={organizations}
            selectedOrganizationId={selectedOrganizationId}
            onSelectOrganizationId={handleSelectOrganization}
            allowAllOrganizations={allowAllVenues}
            showLabel={showLabel}
            id={`${id}-org`}
          />
          <ChevronRight
            className="hidden md:block size-3.5 shrink-0 text-muted-foreground/60"
            aria-hidden="true"
          />
        </>
      )}

      <div className="flex items-center gap-2 shrink-0">
        {showLabel && (
          <label
            htmlFor={id}
            className="text-xs font-semibold text-muted-foreground whitespace-nowrap pl-1 shrink-0"
          >
            {t("venueLabel")}
          </label>
        )}

        <div
          ref={venueDropdownRef}
          className="relative w-[220px] sm:w-[250px]"
        >
          <div
            className={`flex h-9 items-center gap-2 rounded-xl border bg-background px-2.5 shadow-2xs transition-all ${
              isManagedLocked
                ? "opacity-80 cursor-not-allowed border-border"
                : isVenueDropdownOpen
                ? "border-accent ring-2 ring-accent/30"
                : "border-border-medium hover:border-accent/60 hover:bg-muted/50"
            }`}
          >
            <span
              className="flex size-5 shrink-0 items-center justify-center rounded-md bg-accent/20 text-foreground"
              aria-hidden="true"
            >
              <MapPin className="size-3.5" />
            </span>
            <input
              id={id}
              type="text"
              disabled={isManagedLocked}
              value={
                isVenueDropdownOpen
                  ? venueFilterQuery
                  : selectedVenueDisplayLabel
              }
              onFocus={() => {
                if (isManagedLocked) return;
                setIsVenueDropdownOpen(true);
                setVenueFilterQuery("");
              }}
              onChange={(e) => {
                if (isManagedLocked) return;
                setIsVenueDropdownOpen(true);
                setVenueFilterQuery(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  if (isVenueDropdownOpen) {
                    e.preventDefault();
                    e.stopPropagation();
                  }
                  setIsVenueDropdownOpen(false);
                  setVenueFilterQuery("");
                } else if (e.key === "Enter" && isVenueDropdownOpen) {
                  e.preventDefault();
                  if (filteredVenueOptions.length > 0) {
                    handleSelectVenue(filteredVenueOptions[0].id);
                    setIsVenueDropdownOpen(false);
                    setVenueFilterQuery("");
                  }
                }
              }}
              placeholder={
                isEn ? "Type or select venue..." : "Escribir o elegir sede..."
              }
              aria-label={t("venueLabel")}
              className="w-full min-w-0 border-none bg-transparent text-xs font-bold text-foreground outline-none placeholder:font-normal placeholder:text-muted-foreground disabled:cursor-not-allowed"
            />
            {!isManagedLocked &&
              allowAllVenues &&
              selectedVenueId &&
              selectedVenueId !== "ALL" && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectVenue("ALL");
                    setVenueFilterQuery("");
                    setIsVenueDropdownOpen(false);
                  }}
                  title={isEn ? "View all venues" : "Ver todas las sedes"}
                  className="cursor-pointer rounded-md border-none bg-muted p-0.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3" />
                </button>
              )}
            {!isManagedLocked && (
              <button
                type="button"
                onClick={() => {
                  setIsVenueDropdownOpen((prev) => !prev);
                  setVenueFilterQuery("");
                }}
                className="cursor-pointer border-none bg-transparent p-0.5 text-muted-foreground hover:text-foreground"
                aria-label={isEn ? "Open venue list" : "Abrir lista de sedes"}
              >
                <ChevronDown
                  className={`size-3.5 transition-transform duration-200 ${
                    isVenueDropdownOpen ? "rotate-180 text-foreground" : ""
                  }`}
                />
              </button>
            )}
          </div>

          {isVenueDropdownOpen && !isManagedLocked && (
            <div className="absolute right-0 left-0 z-50 mt-1 max-h-64 overflow-y-auto rounded-xl border border-border-medium bg-surface p-1.5 shadow-xl">
              {allowAllVenues && (
                <button
                  type="button"
                  onClick={() => {
                    handleSelectVenue("ALL");
                    setIsVenueDropdownOpen(false);
                    setVenueFilterQuery("");
                  }}
                  className={`flex w-full cursor-pointer items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs font-bold transition-colors ${
                    selectedVenueId === "ALL" || !selectedVenueId
                      ? "bg-accent/20 text-foreground"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  <span>
                    🌐 {isEn ? "All venues" : "Todas las sedes"}
                    {showOrganizationFilter &&
                    selectedOrganizationId &&
                    selectedOrganizationId !== "ALL"
                      ? ` (${scopedVenues.length})`
                      : ""}
                  </span>
                  <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                    {totalSpacesCount === 1
                      ? isEn
                        ? "1 court"
                        : "1 cancha"
                      : isEn
                        ? `${totalSpacesCount} courts`
                        : `${totalSpacesCount} canchas`}
                  </span>
                </button>
              )}

              {filteredVenueOptions.length === 0 ? (
                <div className="px-3 py-3 text-center text-xs text-muted-foreground">
                  {isEn
                    ? `No venue found matching «${venueFilterQuery}»`
                    : `No se encontró ninguna sede con «${venueFilterQuery}»`}
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
                        handleSelectVenue(v.id);
                        setIsVenueDropdownOpen(false);
                        setVenueFilterQuery("");
                      }}
                      className={`mt-0.5 flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold transition-colors ${
                        isSelectedVenue
                          ? "bg-accent/20 font-bold text-foreground"
                          : "text-foreground hover:bg-muted"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate">📍 {v.name}</div>
                        {showOrganizationFilter &&
                          selectedOrganizationId === "ALL" &&
                          v.organizationName && (
                            <div className="truncate text-[10px] font-medium text-muted-foreground">
                              🏢 {v.organizationName}
                            </div>
                          )}
                      </div>
                      <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                        {count === 1
                          ? isEn
                            ? "1 court"
                            : "1 cancha"
                          : isEn
                            ? `${count} courts`
                            : `${count} canchas`}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>

      {actions && (
        <>
          <div
            className="hidden sm:block h-5 w-px bg-border mx-0.5 shrink-0"
            aria-hidden="true"
          />
          <div className="flex items-center shrink-0">{actions}</div>
        </>
      )}
    </div>
  );
}
