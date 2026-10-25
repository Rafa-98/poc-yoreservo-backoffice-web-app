"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "next-intl";
import {
  Building2,
  Check,
  ChevronDown,
  Filter,
  Globe,
  MapPin,
  Search,
  X,
} from "lucide-react";
import type { PaymentCollectionMode, VenueItem } from "../model/types";

export interface SelectableOrganizationItem {
  id: string;
  name?: string;
  tradeName?: string;
  legalName?: string;
  rif?: string;
  isPlatformOrg?: boolean;
  fiscalAddress?: string;
  state?: string;
  states?: string[];
  city?: string;
  venueNames?: string[];
  venuesCount?: number;
  paymentCollectionMode?: PaymentCollectionMode | string;
  referenceCurrencyCode?: string;
  status?: string;
  isBookingPaused?: boolean;
  venues?: Array<{
    id?: string;
    name?: string;
    address?: string;
    location?: any;
  }>;
}

export interface OrganizationAdvancedSelectorProps {
  organizations: SelectableOrganizationItem[];
  venues?: VenueItem[];
  selectedOrganizationId: string;
  onSelectOrganization: (organizationId: string) => void;
  allowAll?: boolean;
  allLabel?: string;
  selectedStateFilter?: string;
  onChangeStateFilter?: (state: string) => void;
  id?: string;
  label?: string;
}

const KNOWN_VENEZUELAN_STATES = [
  "Distrito Capital",
  "Miranda",
  "Carabobo",
  "Zulia",
  "Lara",
  "Aragua",
  "Nueva Esparta",
  "Anzoátegui",
  "Mérida",
  "Táchira",
  "Bolívar",
  "Monagas",
  "Sucre",
  "Falcón",
  "Barinas",
  "Portuguesa",
  "La Guaira",
];

function extractLocName(nameField: unknown): string {
  if (!nameField) return "";
  if (typeof nameField === "string") return nameField.trim();
  if (typeof nameField === "object" && nameField !== null) {
    const obj = nameField as Record<string, unknown>;
    if (typeof obj.es === "string") return obj.es.trim();
    if (typeof obj.en === "string") return obj.en.trim();
  }
  return "";
}

function inferStateFromText(text?: string): string {
  if (!text) return "";
  const lower = text.toLowerCase();
  for (const st of KNOWN_VENEZUELAN_STATES) {
    if (lower.includes(st.toLowerCase())) {
      return st;
    }
  }
  if (
    lower.includes("chacao") ||
    lower.includes("baruta") ||
    lower.includes("hatillo") ||
    lower.includes("las mercedes")
  ) {
    return "Miranda";
  }
  if (
    lower.includes("caracas") ||
    lower.includes("san bernardino") ||
    lower.includes("el paraíso") ||
    lower.includes("el paraiso") ||
    lower.includes("san agustín") ||
    lower.includes("san agustin")
  ) {
    return "Distrito Capital";
  }
  if (lower.includes("valencia") || lower.includes("naguanagua")) {
    return "Carabobo";
  }
  if (lower.includes("maracaibo")) {
    return "Zulia";
  }
  if (lower.includes("barquisimeto") || lower.includes("crepuscular")) {
    return "Lara";
  }
  if (lower.includes("maracay")) {
    return "Aragua";
  }
  if (
    lower.includes("margarita") ||
    lower.includes("porlamar") ||
    lower.includes("pampatar")
  ) {
    return "Nueva Esparta";
  }
  if (
    lower.includes("lechería") ||
    lower.includes("lecheria") ||
    lower.includes("puerto la cruz") ||
    lower.includes("oriente")
  ) {
    return "Anzoátegui";
  }
  if (lower.includes("andes") || lower.includes("mérida") || lower.includes("merida")) {
    return "Mérida";
  }
  return "";
}

export function extractOrganizationLocationMeta(
  org: SelectableOrganizationItem,
  externalVenues?: VenueItem[],
): {
  states: string[];
  primaryState: string;
  cities: string[];
  venueNames: string[];
  venuesCount: number;
} {
  const statesSet = new Set<string>(org.states ?? []);
  const citiesSet = new Set<string>();
  const venueNamesSet = new Set<string>(org.venueNames ?? []);

  if (org.state) statesSet.add(org.state);
  if (org.city) citiesSet.add(org.city);

  const combinedVenues = [
    ...(org.venues ?? []),
    ...(externalVenues ?? []).filter((v) => v.organizationId === org.id),
  ];

  for (const v of combinedVenues) {
    if (v?.name) venueNamesSet.add(v.name);
    const loc = v?.location;
    if (loc) {
      const n1 = extractLocName(loc.name);
      const t1 = loc.locationType;
      const n2 = extractLocName(loc.parent?.name);
      const t2 = loc.parent?.locationType;
      const n3 = extractLocName(loc.parent?.parent?.name);
      const t3 = loc.parent?.parent?.locationType;

      if (t3 === "STATE" && n3) statesSet.add(n3);
      else if (t2 === "STATE" && n2) statesSet.add(n2);
      else if (t1 === "STATE" && n1) statesSet.add(n1);
      else if (n3) statesSet.add(n3);

      if (t2 === "CITY" && n2) citiesSet.add(n2);
      else if (t1 === "CITY" && n1) citiesSet.add(n1);
      else if (n2 && !n3) statesSet.add(n2);
      else if (n2 && n3) citiesSet.add(n2);
    }
    const inferredFromVenue = inferStateFromText(
      `${v?.address || ""} ${v?.name || ""}`,
    );
    if (inferredFromVenue) statesSet.add(inferredFromVenue);
  }

  if (statesSet.size === 0) {
    const inferred = inferStateFromText(
      `${org.fiscalAddress || ""} ${org.tradeName || org.name || ""} ${org.legalName || ""}`,
    );
    if (inferred) statesSet.add(inferred);
  }

  const states = Array.from(statesSet).filter(Boolean);
  const cities = Array.from(citiesSet).filter(Boolean);
  const venueNames = Array.from(venueNamesSet).filter(Boolean);
  const venuesCount =
    org.venuesCount !== undefined && org.venuesCount > 0
      ? org.venuesCount
      : venueNames.length;

  return {
    states,
    primaryState: states[0] || "",
    cities,
    venueNames,
    venuesCount,
  };
}

export function OrganizationAdvancedSelector({
  organizations,
  venues,
  selectedOrganizationId,
  onSelectOrganization,
  allowAll = false,
  allLabel,
  selectedStateFilter,
  onChangeStateFilter,
  id = "organization-advanced-selector",
  label,
}: OrganizationAdvancedSelectorProps) {
  const locale = useLocale();
  const isEn = locale.toLowerCase().startsWith("en");
  const resolvedAllLabel =
    allLabel ??
    (isEn ? "All Venues & Allies" : "Todas las Sedes & Aliados");
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [internalStateFilter, setInternalStateFilter] = useState<string>("ALL");
  const [modeFilter, setModeFilter] = useState<
    "ALL" | "PLATFORM_CUSTODY" | "ALLY_DIRECT"
  >("ALL");
  const [currencyFilter, setCurrencyFilter] = useState<"ALL" | "USD" | "EUR">(
    "ALL",
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const activeStateFilter = selectedStateFilter ?? internalStateFilter;

  function handleStateChange(nextState: string) {
    setInternalStateFilter(nextState);
    onChangeStateFilter?.(nextState);
  }

  // Enrich organizations with location & venue metadata
  const enrichedOrgs = useMemo(() => {
    const mapped = organizations.map((org) => {
      const displayName =
        org.tradeName ||
        org.name ||
        (isEn ? "Ally Organization" : "Organización Aliada");
      const isPlatformOrg = Boolean(
        org.isPlatformOrg ||
          displayName.toLowerCase().includes("yoreservo oficial") ||
          org.rif === "J-50000001-0",
      );
      const meta = extractOrganizationLocationMeta(org, venues);
      const mode: PaymentCollectionMode =
        org.paymentCollectionMode === "ALLY_DIRECT"
          ? "ALLY_DIRECT"
          : "PLATFORM_CUSTODY";
      const currency = org.referenceCurrencyCode === "EUR" ? "EUR" : "USD";
      return {
        ...org,
        displayName,
        isPlatformOrg,
        rif: org.rif || "",
        mode,
        currency,
        ...meta,
      };
    });
    return mapped.sort((a, b) => {
      if (a.isPlatformOrg && !b.isPlatformOrg) return -1;
      if (!a.isPlatformOrg && b.isPlatformOrg) return 1;
      return a.displayName.localeCompare(b.displayName, "es");
    });
  }, [organizations, venues, isEn]);

  // All unique states available across organizations
  const availableStates = useMemo(() => {
    const set = new Set<string>();
    for (const org of enrichedOrgs) {
      for (const st of org.states) {
        if (st) set.add(st);
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, "es"));
  }, [enrichedOrgs]);

  // Filter organizations based on search query + State + Mode + Currency
  const filteredOrgs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return enrichedOrgs.filter((org) => {
      if (
        activeStateFilter !== "ALL" &&
        !org.states.includes(activeStateFilter)
      ) {
        return false;
      }
      if (modeFilter !== "ALL" && org.mode !== modeFilter) {
        return false;
      }
      if (currencyFilter !== "ALL" && org.currency !== currencyFilter) {
        return false;
      }
      if (q) {
        const haystack = [
          org.displayName,
          org.legalName || "",
          org.rif || "",
          org.fiscalAddress || "",
          ...org.states,
          ...org.cities,
          ...org.venueNames,
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [
    enrichedOrgs,
    searchQuery,
    activeStateFilter,
    modeFilter,
    currencyFilter,
  ]);

  const selectedOrg = useMemo(
    () => enrichedOrgs.find((o) => o.id === selectedOrganizationId),
    [enrichedOrgs, selectedOrganizationId],
  );

  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    activeStateFilter !== "ALL" ||
    modeFilter !== "ALL" ||
    currencyFilter !== "ALL";

  function clearFilters() {
    setSearchQuery("");
    handleStateChange("ALL");
    setModeFilter("ALL");
    setCurrencyFilter("ALL");
  }

  // Close on click outside
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleOutside);
    }
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKey);
    }
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen]);

  return (
    <div className="relative inline-flex items-center gap-2 shrink-0" ref={containerRef}>
      {label && (
        <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap pl-1">
          {label}
        </span>
      )}

      {/* TRIGGER BUTTON */}
      <button
        type="button"
        id={id}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="group inline-flex h-9 min-w-[200px] max-w-[280px] items-center justify-between gap-2 rounded-xl border border-border-medium bg-background px-2.5 text-xs font-semibold text-foreground shadow-2xs transition-all hover:border-accent/60 hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/30 cursor-pointer"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-accent/20 text-foreground">
            {selectedOrganizationId === "ALL" ? (
              <Globe className="size-3.5" />
            ) : (
              <Building2 className="size-3.5" />
            )}
          </span>
          <span className="truncate font-bold text-foreground">
            {selectedOrganizationId === "ALL"
              ? activeStateFilter !== "ALL"
                ? `${resolvedAllLabel} (${activeStateFilter})`
                : resolvedAllLabel
              : selectedOrg
              ? selectedOrg.displayName
              : resolvedAllLabel}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {selectedOrg?.isPlatformOrg && selectedOrganizationId !== "ALL" && (
            <span className="hidden sm:inline-flex items-center rounded-md bg-accent/25 border border-accent/50 px-1.5 py-0.5 text-[10px] font-extrabold text-foreground">
              ⚡ SUPER ORG
            </span>
          )}
          {selectedOrg?.primaryState &&
            !selectedOrg?.isPlatformOrg &&
            selectedOrganizationId !== "ALL" && (
              <span className="hidden sm:inline-flex items-center rounded-md bg-muted border border-border px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                📍 {selectedOrg.primaryState}
              </span>
            )}
          <span className="rounded-full bg-accent/20 px-1.5 py-0.5 text-[10px] font-bold text-foreground">
            {enrichedOrgs.length}
          </span>
          <ChevronDown
            className={`size-3.5 text-muted-foreground transition-transform duration-200 ${
              isOpen ? "rotate-180 text-foreground" : ""
            }`}
          />
        </div>
      </button>

      {/* POPOVER DROPDOWN WITH SEARCH & ADVANCED FILTERS */}
      {isOpen && (
        <div
          role="listbox"
          className="absolute right-0 sm:left-0 top-full z-50 mt-2 w-[340px] sm:w-[440px] rounded-2xl border border-border-medium bg-surface p-3 shadow-card animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Search Input */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                isEn
                  ? "Search by organization, Tax ID, venue, state, or city..."
                  : "Buscar por organización, RIF, sede, estado o ciudad..."
              }
              className="w-full rounded-xl border border-border-medium bg-background py-2 pl-9 pr-8 text-xs font-medium text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground cursor-pointer"
                aria-label={isEn ? "Clear search" : "Limpiar búsqueda"}
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Advanced Filter Controls (State, Collection Mode, Currency) */}
          <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-3 gap-2 border-b border-border/70 pb-2.5">
            {/* State Filter */}
            <div>
              <label className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <MapPin className="size-2.5" />
                <span>{isEn ? "State" : "Estado"}</span>
              </label>
              <select
                value={activeStateFilter}
                onChange={(e) => handleStateChange(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-2 py-1 text-[11px] font-semibold text-foreground focus:border-accent focus:outline-none"
                aria-label={isEn ? "Filter by state" : "Filtrar por estado"}
              >
                <option value="ALL">
                  {isEn ? "All states" : "Todos los estados"}
                </option>
                {availableStates.map((st) => (
                  <option key={st} value={st}>
                    📍 {st}
                  </option>
                ))}
              </select>
            </div>

            {/* Collection Mode Filter */}
            <div>
              <label className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <Filter className="size-2.5" />
                <span>{isEn ? "Mode" : "Modalidad"}</span>
              </label>
              <select
                value={modeFilter}
                onChange={(e) =>
                  setModeFilter(
                    e.target.value as
                      | "ALL"
                      | "PLATFORM_CUSTODY"
                      | "ALLY_DIRECT",
                  )
                }
                className="w-full rounded-lg border border-border bg-background px-2 py-1 text-[11px] font-semibold text-foreground focus:border-accent focus:outline-none"
                aria-label={
                  isEn
                    ? "Filter by collection mode"
                    : "Filtrar por modalidad de cobro"
                }
              >
                <option value="ALL">{isEn ? "All" : "Todas"}</option>
                <option value="PLATFORM_CUSTODY">
                  {isEn ? "🏦 YoReservo Custody" : "🏦 Custodia YoReservo"}
                </option>
                <option value="ALLY_DIRECT">
                  {isEn ? "📲 Direct Collection" : "📲 Cobro Directo"}
                </option>
              </select>
            </div>

            {/* Currency Filter */}
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {isEn ? "💱 Currency" : "💱 Moneda"}
              </label>
              <select
                value={currencyFilter}
                onChange={(e) =>
                  setCurrencyFilter(e.target.value as "ALL" | "USD" | "EUR")
                }
                className="w-full rounded-lg border border-border bg-background px-2 py-1 text-[11px] font-semibold text-foreground focus:border-accent focus:outline-none"
                aria-label={isEn ? "Filter by currency" : "Filtrar por moneda"}
              >
                <option value="ALL">
                  {isEn ? "All (USD / EUR)" : "Todas (USD / EUR)"}
                </option>
                <option value="USD">
                  {isEn ? "💵 US Dollars (USD)" : "💵 Dólares (USD)"}
                </option>
                <option value="EUR">
                  {isEn ? "💶 Euros (EUR)" : "💶 Euros (EUR)"}
                </option>
              </select>
            </div>
          </div>

          {/* Filter Results Counter & Reset */}
          <div className="my-1.5 flex items-center justify-between px-1 text-[11px] text-muted-foreground">
            <span>
              {isEn ? (
                <>
                  Showing{" "}
                  <strong className="text-foreground">
                    {filteredOrgs.length}
                  </strong>{" "}
                  of{" "}
                  <strong className="text-foreground">
                    {enrichedOrgs.length}
                  </strong>{" "}
                  organizations
                </>
              ) : (
                <>
                  Mostrando{" "}
                  <strong className="text-foreground">
                    {filteredOrgs.length}
                  </strong>{" "}
                  de{" "}
                  <strong className="text-foreground">
                    {enrichedOrgs.length}
                  </strong>{" "}
                  organizaciones
                </>
              )}
            </span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="font-bold text-link hover:underline cursor-pointer"
              >
                {isEn ? "Clear filters" : "Limpiar filtros"}
              </button>
            )}
          </div>

          {/* Options List */}
          <div className="max-h-72 overflow-y-auto space-y-1 pr-0.5">
            {allowAll && (
              <button
                type="button"
                onClick={() => {
                  onSelectOrganization("ALL");
                  setIsOpen(false);
                }}
                role="option"
                aria-selected={selectedOrganizationId === "ALL"}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition-colors cursor-pointer ${
                  selectedOrganizationId === "ALL"
                    ? "bg-accent/15 font-bold text-foreground border border-accent/40"
                    : "text-foreground hover:bg-muted/70"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-border bg-surface">
                    <Globe className="size-3.5 text-link" />
                  </div>
                  <div>
                    <div className="font-bold text-foreground">
                      {resolvedAllLabel}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {activeStateFilter !== "ALL"
                        ? isEn
                          ? `Consolidated organizations in ${activeStateFilter}`
                          : `Consolidado de organizaciones en ${activeStateFilter}`
                        : isEn
                          ? `Global consolidated (${enrichedOrgs.length} organizations)`
                          : `Consolidado global (${enrichedOrgs.length} organizaciones)`}
                    </div>
                  </div>
                </div>
                {selectedOrganizationId === "ALL" && (
                  <div className="flex size-5 items-center justify-center rounded-full bg-accent text-accent-foreground">
                    <Check className="size-3 stroke-[3]" />
                  </div>
                )}
              </button>
            )}

            {filteredOrgs.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                {isEn
                  ? "No organizations found with those filters."
                  : "No se encontraron organizaciones con esos filtros."}
              </div>
            ) : (
              filteredOrgs.map((org) => {
                const isSelected = org.id === selectedOrganizationId;
                return (
                  <button
                    key={org.id}
                    type="button"
                    onClick={() => {
                      onSelectOrganization(org.id);
                      setIsOpen(false);
                    }}
                    role="option"
                    aria-selected={isSelected}
                    className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-accent/15 font-bold text-foreground border border-accent/40"
                        : "text-foreground hover:bg-muted/70"
                    }`}
                  >
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="truncate font-bold text-foreground">
                          {org.isPlatformOrg ? `⚡ ${org.displayName}` : org.displayName}
                        </span>
                        {org.isPlatformOrg && (
                          <span className="rounded-md bg-accent/25 border border-accent/50 px-1.5 py-0.2 text-[9px] font-extrabold uppercase tracking-wider text-foreground">
                            {isEn
                              ? "SUPER ORG · OWN VENUES"
                              : "SUPER ORG · SEDES PROPIAS"}
                          </span>
                        )}
                        {org.rif && (
                          <span className="rounded bg-muted px-1.5 py-0.2 font-mono text-[10px] text-muted-foreground">
                            {org.rif}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
                        {org.primaryState && (
                          <span className="inline-flex items-center gap-0.5 font-semibold text-foreground/80">
                            📍 {org.primaryState}
                            {org.cities[0] && org.cities[0] !== org.primaryState
                              ? ` · ${org.cities[0]}`
                              : ""}
                          </span>
                        )}
                        {org.venuesCount > 0 && (
                          <>
                            <span>•</span>
                            <span>
                              🏟️ {org.venuesCount}{" "}
                              {org.venuesCount === 1
                                ? isEn
                                  ? "venue"
                                  : "sede"
                                : isEn
                                  ? "venues"
                                  : "sedes"}
                            </span>
                          </>
                        )}
                        <span>•</span>
                        <span className="font-semibold">
                          {org.currency === "EUR" ? "💶 EUR" : "💵 USD"}
                        </span>
                        <span>•</span>
                        <span>
                          {org.isPlatformOrg
                            ? isEn
                              ? "⚡ 100% Own (0% Fee)"
                              : "⚡ 100% Propio (0% Fee)"
                            : org.mode === "ALLY_DIRECT"
                            ? isEn
                              ? "📲 Direct Collection"
                              : "📲 Cobro Directo"
                            : isEn
                              ? "🏦 Custody"
                              : "🏦 Custodia"}
                        </span>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                        <Check className="size-3 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

