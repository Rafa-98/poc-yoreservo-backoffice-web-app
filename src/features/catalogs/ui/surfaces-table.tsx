"use client";

import React, { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/shared/ui/button";
import type { ActivityTypeItem, LocalizedName, SurfaceItem } from "../model/types";

interface SurfacesTableProps {
  surfaces: SurfaceItem[];
  taxonomy?: ActivityTypeItem[];
  onAddSurface: () => void;
  onEditSurface: (surface: SurfaceItem) => void;
}

const DEFAULT_SPORT_NAMES = [
  "Fútbol",
  "Pádel",
  "Tenis",
  "Pickleball",
  "Ping-pong",
  "Voleibol",
];

const SPORT_TAG_EN_MAP: Record<string, string> = {
  "fútbol": "Soccer",
  "futbol": "Soccer",
  "fútbol 5": "5v5 Soccer",
  "futbol 5": "5v5 Soccer",
  "fútbol 5 (cancha sintética)": "5-a-side Soccer",
  "fútbol 7": "7v7 Soccer",
  "futbol 7": "7v7 Soccer",
  "fútbol 7 (media cancha)": "7-a-side Soccer",
  "fútbol 9": "9v9 Soccer",
  "futbol 9": "9v9 Soccer",
  "fútbol 11": "11v11 Soccer",
  "futbol 11": "11v11 Soccer",
  "pádel": "Padel",
  "padel": "Padel",
  "pádel dobles": "Padel Doubles",
  "padel dobles": "Padel Doubles",
  "pádel dobles (4 jugadores)": "Padel Doubles (4 Players)",
  "pádel individual": "Padel Singles",
  "padel individual": "Padel Singles",
  "pádel individual (1 vs 1)": "Padel Singles (1 vs 1)",
  "tenis": "Tennis",
  "tenis individual": "Tennis Singles",
  "tenis singles": "Tennis Singles",
  "tenis dobles": "Tennis Doubles",
  "pickleball": "Pickleball",
  "pickleball individual": "Pickleball Singles",
  "pickleball dobles": "Pickleball Doubles",
  "ping-pong": "Table Tennis",
  "ping pong": "Table Tennis",
  "ping-pong individual": "Table Tennis Singles",
  "ping-pong dobles": "Table Tennis Doubles",
  "voleibol": "Volleyball",
  "voleibol de sala": "Indoor Volleyball",
  "voleibol de playa": "Beach Volleyball",
  "otros deportes": "Other Sports",
};

const SURFACE_EN_BY_CODE: Record<string, { name: string; description: string }> = {
  SURF_SYNTH_GRASS_FIFA_PRO: {
    name: "FIFA Quality Pro Synthetic Turf (50mm)",
    description: "High-density monofilament fibers with SBR rubber and silica sand infill",
  },
  SURF_SYNTH_GRASS_50MM: {
    name: "Pro Synthetic Turf (Fibrillated 50mm)",
    description: "Shock-absorbing SBR rubber infill for high-traffic play",
  },
  SURF_SYNTH_GRASS_60MM: {
    name: "High-Performance Synthetic Turf (60mm)",
    description: "Long-pile hybrid turf with elastic ShockPad base",
  },
  SURF_NATURAL_GRASS_BERMUDA: {
    name: "Bermuda Tifway 419 Natural Grass",
    description: "Professional-cut natural grass with underground drainage system",
  },
  SURF_FUTSAL_PARQUET_PRO: {
    name: "Floating Sports Hardwood / Parquet",
    description: "Treated hardwood with high-grip non-slip polyurethane finish",
  },
  SURF_PADEL_WPT_TEXTURIZADO: {
    name: "Panoramic Glass · WPT Textured Turf (12mm)",
    description: "Official World Padel Tour curled monofilament with minimal abrasion and selected silica",
  },
  SURF_PADEL_MONO_12MM: {
    name: "Padel Monofilament Turf (WPT)",
    description: "Straight polyethylene fiber with 0.2-0.6mm silica sand infill",
  },
  SURF_PADEL_MURO_SINTETICO: {
    name: "Regulation Wall · Fibrillated Synthetic Turf (10mm)",
    description: "Traditional court with smoothed concrete walls and fibrillated synthetic carpet",
  },
  SURF_CLAY_TENNIS_PRO: {
    name: "Crushed Brick / Red Clay",
    description: "Screened red ceramic grain for slow bounce and controlled sliding",
  },
  SURF_HARD_ACRYLIC_ITF: {
    name: "Pro Acrylic Hard Court (ITF Cushion)",
    description: "Multi-layer asphalt base with medium-fast bounce textured acrylic coating",
  },
  SURF_TENNIS_GREEN_SET: {
    name: "Cushioned Synthetic Resin (GreenSet Pro)",
    description: "Fast indoor/outdoor surface with elastic rubber layers",
  },
  SURF_PICKLEBALL_CUSHION_PRO: {
    name: "Cushion Pro Acrylic Resin (USA Pickleball)",
    description: "Multi-layer acrylic coating with shock-absorbing rubber microspheres",
  },
  SURF_PICKLEBALL_MODULAR_PP: {
    name: "Outdoor Suspended Polypropylene Modular Floor",
    description: "High-impact copolymer tiles with instant drainage and UV protection",
  },
  SURF_PINGPONG_ITTF_25MM: {
    name: "ITTF 25mm Pro Table + Taraflex PVC Floor",
    description: "Anti-glare high-density MDF tabletop over 7mm sports vinyl flooring",
  },
  SURF_PINGPONG_CLUB_22MM: {
    name: "22mm Competition Table + Non-Slip Rubber Floor",
    description: "Fast uniform-bounce tabletop with cushioned rubber flooring",
  },
  SURF_POLY_INDOOR_8MM: {
    name: "Indoor Multi-Sport Polyurethane (Taraflex FIVB 8mm)",
    description: "Shock-absorbing elastic layer with over 35% impact absorption",
  },
  SURF_BEACH_SAND_SILICA: {
    name: "Washed Silica Beach Sand (FIVB 40cm)",
    description: "Dust-free, non-compacting screened quartz sand with low heat retention",
  },
  SURF_CONCRETE_OUTDOOR: {
    name: "Polished Concrete / Multi-Sport Epoxy Court",
    description: "Troweled concrete slab with non-slip epoxy coating",
  },
};

function getLocalizedText(
  val: LocalizedName | string | undefined,
  isEn = false,
): string {
  if (!val) return "";
  if (typeof val === "string") return val;
  return isEn ? val.en || val.es || "" : val.es || val.en || "";
}

function translateSportTag(
  tag: string,
  isEn: boolean,
  taxonomy: ActivityTypeItem[] = [],
): string {
  if (!tag || !isEn) return tag;
  const lower = tag.trim().toLowerCase();
  if (SPORT_TAG_EN_MAP[lower]) {
    return SPORT_TAG_EN_MAP[lower];
  }
  for (const t of taxonomy) {
    for (const act of t.activities || []) {
      if (typeof act.name === "object" && act.name !== null) {
        if ((act.name.es || "").toLowerCase() === lower && act.name.en) {
          return act.name.en;
        }
      }
      for (const cat of act.categories || []) {
        if (typeof cat.name === "object" && cat.name !== null) {
          if ((cat.name.es || "").toLowerCase() === lower && cat.name.en) {
            return cat.name.en;
          }
        }
      }
    }
  }
  return tag;
}

function getSurfaceDisplay(
  surface: SurfaceItem,
  isEn: boolean,
): { name: string; description: string } {
  const rawName =
    typeof (surface.name as any) === "object" && surface.name !== null
      ? isEn
        ? (surface.name as any).en || (surface.name as any).es || ""
        : (surface.name as any).es || (surface.name as any).en || ""
      : String(surface.name || "");

  const rawDesc =
    typeof (surface.description as any) === "object" && surface.description !== null
      ? isEn
        ? (surface.description as any).en || (surface.description as any).es || ""
        : (surface.description as any).es || (surface.description as any).en || ""
      : String(surface.description || "");

  if (isEn && surface.code && SURFACE_EN_BY_CODE[surface.code]) {
    return SURFACE_EN_BY_CODE[surface.code];
  }

  return { name: rawName, description: rawDesc };
}

function getSportEmoji(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("fútbol") || n.includes("futbol") || n.includes("soccer")) return "⚽";
  if (n.includes("pádel") || n.includes("padel")) return "🎾";
  if (n.includes("tenis") || n.includes("tennis")) return "🎾";
  if (n.includes("pickleball")) return "🏓";
  if (n.includes("ping") || n.includes("mesa") || n.includes("table tennis")) return "🏓";
  if (n.includes("voleibol") || n.includes("volley")) return "🏐";
  return "🏟️";
}

function isSurfaceCompatibleWithSport(surface: SurfaceItem, sportName: string): boolean {
  const normSport = sportName.toLowerCase();
  const enSport = (SPORT_TAG_EN_MAP[normSport] || "").toLowerCase();
  return (surface.suitedSports || []).some((tag) => {
    const lowerTag = tag.toLowerCase();
    return (
      lowerTag.includes(normSport) ||
      (Boolean(enSport) && lowerTag.includes(enSport))
    );
  });
}

export function SurfacesTable({
  surfaces,
  taxonomy = [],
  onAddSurface,
  onEditSurface,
}: SurfacesTableProps) {
  const t = useTranslations("catalogs.surfaces");
  const locale = useLocale();
  const isEn = locale.toLowerCase().startsWith("en");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSport, setSelectedSport] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ENABLED" | "DISABLED">("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  // In "ALL" mode we paginate by sport sections (default 3 sports per page) so a sport group is never cut in half.
  // In single-sport mode we paginate by surface cards (default 9 cards per page).
  const [sportsPerPage, setSportsPerPage] = useState(3);
  const [cardsPerPage, setCardsPerPage] = useState(9);

  // Extract official sports from taxonomy (using canonical ES key for matching against suitedSports)
  const systemSports = useMemo(() => {
    const names = taxonomy
      .flatMap((type) =>
        (type.activities || []).map((act) => getLocalizedText(act.name, false))
      )
      .filter(Boolean);
    return names.length > 0 ? names : DEFAULT_SPORT_NAMES;
  }, [taxonomy]);

  // Base filter by search and status (independent of selectedSport so pill counts stay accurate)
  const searchAndStatusFiltered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return surfaces.filter((s) => {
      if (statusFilter !== "ALL" && s.status !== statusFilter) {
        return false;
      }
      if (!q) return true;
      const enDisplay = getSurfaceDisplay(s, true);
      const esDisplay = getSurfaceDisplay(s, false);
      return (
        esDisplay.name.toLowerCase().includes(q) ||
        enDisplay.name.toLowerCase().includes(q) ||
        esDisplay.description.toLowerCase().includes(q) ||
        enDisplay.description.toLowerCase().includes(q) ||
        (s.suitedSports || []).some(
          (sp) =>
            sp.toLowerCase().includes(q) ||
            translateSportTag(sp, true, taxonomy).toLowerCase().includes(q)
        )
      );
    });
  }, [surfaces, searchQuery, statusFilter, taxonomy]);

  // Count how many surfaces match each sport (respecting active search/status filters)
  const sportCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const sp of systemSports) {
      counts[sp] = searchAndStatusFiltered.filter((s) =>
        isSurfaceCompatibleWithSport(s, sp)
      ).length;
    }
    return counts;
  }, [searchAndStatusFiltered, systemSports]);

  // Build complete sport sections so every sport section has the exact same surfaces & count as its filter pill
  const allSportSections = useMemo(() => {
    if (selectedSport !== "ALL") {
      const items = searchAndStatusFiltered.filter((s) =>
        isSurfaceCompatibleWithSport(s, selectedSport)
      );
      return items.length > 0 ? [[selectedSport, items] as const] : [];
    }

    const sections: Array<readonly [string, SurfaceItem[]]> = [];

    for (const sp of systemSports) {
      const items = searchAndStatusFiltered.filter((s) =>
        isSurfaceCompatibleWithSport(s, sp)
      );
      if (items.length > 0) {
        sections.push([sp, items] as const);
      }
    }

    // Any surface that doesn't match a known systemSport goes into "Otros Deportes"
    const unmatched = searchAndStatusFiltered.filter(
      (s) => !systemSports.some((sp) => isSurfaceCompatibleWithSport(s, sp))
    );
    if (unmatched.length > 0) {
      sections.push(["Otros Deportes", unmatched] as const);
    }

    return sections;
  }, [searchAndStatusFiltered, selectedSport, systemSports]);

  // Pagination:
  // - When viewing "ALL" sports, paginate by complete sport sections so a sport's surfaces are never split across pages.
  // - When viewing a single sport, paginate that sport's surface cards.
  const isAllSportsMode = selectedSport === "ALL";

  const totalPages = useMemo(() => {
    if (isAllSportsMode) {
      return Math.max(1, Math.ceil(allSportSections.length / sportsPerPage));
    }
    const singleItems = allSportSections[0]?.[1] || [];
    return Math.max(1, Math.ceil(singleItems.length / cardsPerPage));
  }, [isAllSportsMode, allSportSections, sportsPerPage, cardsPerPage]);

  const safePage = Math.min(currentPage, totalPages);

  const visibleSections = useMemo(() => {
    if (isAllSportsMode) {
      const start = (safePage - 1) * sportsPerPage;
      return allSportSections.slice(start, start + sportsPerPage).map(
        ([sportName, items]) => ({
          sportName,
          totalSportCount: items.length,
          items,
        })
      );
    }

    const section = allSportSections[0];
    if (!section) return [];
    const [sportName, items] = section;
    const start = (safePage - 1) * cardsPerPage;
    return [
      {
        sportName,
        totalSportCount: items.length,
        items: items.slice(start, start + cardsPerPage),
      },
    ];
  }, [isAllSportsMode, allSportSections, safePage, sportsPerPage, cardsPerPage]);

  const activeCount = surfaces.filter((s) => s.status === "ENABLED").length;
  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    selectedSport !== "ALL" ||
    statusFilter !== "ALL";

  return (
    <div className="space-y-5">
      {/* TOP CONTROL & SUMMARY BAR */}
      <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="font-display text-lg font-bold text-foreground">
              {isEn
                ? "Court Surfaces Catalog"
                : "Catálogo de Superficies de Cancha"}
            </h2>
            <p className="text-xs text-muted-foreground">
              {isEn
                ? "Specification of the floor or playing turf type available for each sport on the platform."
                : "Especificación del tipo de piso o terreno de juego disponible para cada deporte en la plataforma."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-3.5 py-2 text-xs">
              <span className="font-bold text-foreground">{surfaces.length}</span>
              <span className="text-muted-foreground">
                {isEn ? "Surfaces" : "Superficies"}
              </span>
              <span className="text-border">•</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {activeCount}
              </span>
              <span className="text-muted-foreground">
                {isEn ? "Active" : "Activas"}
              </span>
            </div>

            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={onAddSurface}
              id="btn-add-surface"
            >
              + {t("btnAdd")}
            </Button>
          </div>
        </div>

        {/* SEARCH + STATUS FILTER + SPORT PILLS */}
        <div className="flex flex-col gap-3 border-t border-border pt-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* SPORT FILTER PILLS */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setSelectedSport("ALL");
                  setCurrentPage(1);
                }}
                className={`cursor-pointer rounded-xl border px-3 py-1.5 text-xs font-bold transition-all ${
                  selectedSport === "ALL"
                    ? "border-accent bg-accent text-accent-foreground shadow-2xs"
                    : "border-border bg-muted/30 text-muted-foreground hover:border-accent/50 hover:text-foreground"
                }`}
              >
                {isEn
                  ? `All Sports (${searchAndStatusFiltered.length})`
                  : `Todos los Deportes (${searchAndStatusFiltered.length})`}
              </button>

              {systemSports.map((sport) => {
                const active = selectedSport === sport;
                const count = sportCounts[sport] ?? 0;
                return (
                  <button
                    key={sport}
                    type="button"
                    onClick={() => {
                      setSelectedSport(sport);
                      setCurrentPage(1);
                    }}
                    className={`cursor-pointer inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all ${
                      active
                        ? "border-accent bg-accent text-accent-foreground shadow-2xs"
                        : "border-border bg-surface text-muted-foreground hover:border-accent/50 hover:text-foreground"
                    }`}
                  >
                    <span>{getSportEmoji(sport)}</span>
                    <span>{translateSportTag(sport, isEn, taxonomy)}</span>
                    <span
                      className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                        active
                          ? "bg-black/15 text-accent-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* SEARCH & STATUS CONTROLS */}
            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
              <div className="relative flex-1 lg:w-64">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder={
                    isEn
                      ? "🔍 Search surface or material..."
                      : "🔍 Buscar superficie o material..."
                  }
                  className="form-input h-9 w-full pl-3 pr-8 text-xs"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setCurrentPage(1);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as "ALL" | "ENABLED" | "DISABLED");
                  setCurrentPage(1);
                }}
                aria-label={isEn ? "Filter surfaces by status" : "Filtrar superficies por estado"}
                className="form-input h-9 w-auto px-3 text-xs font-semibold"
              >
                <option value="ALL">
                  {isEn ? "All statuses" : "Todos los estados"}
                </option>
                <option value="ENABLED">
                  {isEn ? "Active only" : "Solo activas"}
                </option>
                <option value="DISABLED">
                  {isEn ? "Inactive only" : "Solo inactivas"}
                </option>
              </select>

              {hasActiveFilters && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedSport("ALL");
                    setStatusFilter("ALL");
                    setCurrentPage(1);
                  }}
                  className="h-9 px-3 text-xs"
                >
                  {isEn ? "🔄 Clear" : "🔄 Limpiar"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* GROUPED SURFACE SECTIONS */}
      {visibleSections.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-10 text-center">
          <p className="text-sm font-semibold text-foreground">
            {isEn
              ? "No surfaces found with the current filters"
              : "No se encontraron superficies con los filtros actuales"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {isEn
              ? "Try changing the selected sport or clearing the search."
              : "Intenta cambiar el deporte seleccionado o limpia la búsqueda."}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {visibleSections.map(({ sportName, totalSportCount, items }) => {
            const displaySportName = translateSportTag(
              sportName,
              isEn,
              taxonomy,
            );
            return (
              <section key={sportName} className="space-y-3">
                {/* SPORT GROUP HEADER */}
                <div className="flex items-center justify-between border-b border-border/80 pb-2 px-1">
                  <div className="flex items-center gap-2">
                    <span className="flex size-7 items-center justify-center rounded-lg bg-accent/15 border border-accent/30 text-sm">
                      {getSportEmoji(sportName)}
                    </span>
                    <h3 className="font-display text-sm font-bold text-foreground">
                      {sportName === "Otros Deportes"
                        ? isEn
                          ? "Surfaces for Other Sports"
                          : "Superficies para Otros Deportes"
                        : isEn
                          ? `Surfaces compatible with ${displaySportName}`
                          : `Superficies compatibles con ${displaySportName}`}
                    </h3>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-bold text-muted-foreground">
                      {totalSportCount}
                    </span>
                  </div>
                </div>

                {/* SURFACE CARDS GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {items.map((s) => {
                    const displaySurface = getSurfaceDisplay(s, isEn);
                    const mainSports = systemSports.filter((sp) =>
                      isSurfaceCompatibleWithSport(s, sp)
                    );
                    const specificFormats = (s.suitedSports || []).filter(
                      (tag) =>
                        !systemSports.some(
                          (sp) => sp.toLowerCase() === tag.toLowerCase()
                        )
                    );

                    return (
                      <div
                        key={`${sportName}-${s.id}`}
                        onClick={() => onEditSurface(s)}
                        className="group cursor-pointer overflow-hidden rounded-2xl border border-border bg-surface shadow-xs transition-all hover:border-accent hover:shadow-md flex flex-col justify-between"
                      >
                        <div>
                          {/* REFERENCE IMAGE BANNER */}
                          <div className="relative h-32 w-full overflow-hidden bg-muted">
                            {s.imageUrl ? (
                              <img
                                src={s.imageUrl}
                                alt={displaySurface.name}
                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-950/60 via-slate-900 to-slate-800 text-3xl">
                                🌱
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

                            {/* STATUS & EDIT PILLS */}
                            <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2">
                              {s.status === "DISABLED" ? (
                                <span className="rounded-full bg-rose-500/90 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-xs">
                                  {isEn ? "Inactive" : "Inactivo"}
                                </span>
                              ) : (
                                <span className="rounded-full bg-emerald-500/90 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-xs">
                                  {isEn ? "Active" : "Activo"}
                                </span>
                              )}

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEditSurface(s);
                                }}
                                className="cursor-pointer rounded-lg bg-black/65 backdrop-blur-xs border border-white/20 px-2.5 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-black/85"
                              >
                                ✏️ {t("btnEdit")}
                              </button>
                            </div>

                            {/* SURFACE TITLE OVERLAY */}
                            <div className="absolute bottom-2.5 left-3 right-3">
                              <h4 className="font-display text-sm font-bold text-white leading-snug line-clamp-1">
                                {displaySurface.name}
                              </h4>
                            </div>
                          </div>

                          {/* COMPOSITION / MATERIAL */}
                          <div className="p-4 pb-3 space-y-3">
                            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                              {displaySurface.description ||
                                (isEn
                                  ? "No composition details specified."
                                  : "Sin detalle de composición especificado.")}
                            </p>

                            {/* COMPATIBLE SPORTS & FORMATS */}
                            <div className="space-y-1.5">
                              <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                {isEn
                                  ? "Compatible Sports & Formats"
                                  : "Deportes & Formatos Compatibles"}
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {mainSports.map((sp) => (
                                  <span
                                    key={sp}
                                    className="inline-flex items-center gap-1 rounded-lg bg-accent/15 border border-accent/30 px-2 py-0.5 text-[11px] font-bold text-foreground"
                                  >
                                    <span>{getSportEmoji(sp)}</span>
                                    <span>
                                      {translateSportTag(sp, isEn, taxonomy)}
                                    </span>
                                  </span>
                                ))}
                                {specificFormats.slice(0, 4).map((fmt) => (
                                  <span
                                    key={fmt}
                                    className="inline-flex items-center rounded-lg bg-muted border border-border px-2 py-0.5 text-[10.5px] font-medium text-muted-foreground"
                                  >
                                    {translateSportTag(fmt, isEn, taxonomy)}
                                  </span>
                                ))}
                                {specificFormats.length > 4 && (
                                  <span className="inline-flex items-center rounded-lg bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                                    +{specificFormats.length - 4}{" "}
                                    {isEn ? "more" : "más"}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* CARD FOOTER */}
                        <div className="border-t border-border/60 bg-muted/20 px-4 py-2.5 flex items-center justify-between text-[11px] text-muted-foreground">
                          <span>
                            🏟️{" "}
                            <strong className="text-foreground">
                              {s.spacesCount ?? 0}
                            </strong>{" "}
                            {(s.spacesCount ?? 0) === 1
                              ? isEn
                                ? "linked court"
                                : "cancha vinculada"
                              : isEn
                                ? "linked courts"
                                : "canchas vinculadas"}
                          </span>
                          <span className="font-semibold text-foreground group-hover:underline">
                            {isEn ? "Configure →" : "Configurar →"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* PAGINATION BAR */}
      {allSportSections.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface px-5 py-3.5 text-xs text-muted-foreground shadow-xs">
          <div className="flex flex-wrap items-center gap-3">
            {isAllSportsMode ? (
              <>
                <span>
                  {isEn ? "Showing sports" : "Mostrando deportes"}{" "}
                  <strong className="text-foreground">
                    {(safePage - 1) * sportsPerPage + 1}–
                    {Math.min(safePage * sportsPerPage, allSportSections.length)}
                  </strong>{" "}
                  {isEn ? "of" : "de"}{" "}
                  <strong className="text-foreground">
                    {allSportSections.length}
                  </strong>{" "}
                  ({searchAndStatusFiltered.length}{" "}
                  {isEn ? "surfaces in total" : "superficies en total"})
                </span>

                <div className="flex items-center gap-1.5">
                  <span>{isEn ? "Show:" : "Mostrar:"}</span>
                  <select
                    value={sportsPerPage}
                    onChange={(e) => {
                      setSportsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    aria-label={isEn ? "Sports per page" : "Deportes por página"}
                    className="form-input h-7 w-auto rounded-lg px-2 py-0 text-xs font-semibold"
                  >
                    <option value={2}>
                      {isEn ? "2 sports per page" : "2 deportes por página"}
                    </option>
                    <option value={3}>
                      {isEn ? "3 sports per page" : "3 deportes por página"}
                    </option>
                    <option value={6}>
                      {isEn ? "All sports (6)" : "Todos los deportes (6)"}
                    </option>
                  </select>
                </div>
              </>
            ) : (
              <>
                <span>
                  {isEn ? "Showing" : "Mostrando"}{" "}
                  <strong className="text-foreground">
                    {(safePage - 1) * cardsPerPage + 1}–
                    {Math.min(
                      safePage * cardsPerPage,
                      allSportSections[0]?.[1].length || 0
                    )}
                  </strong>{" "}
                  {isEn ? "of" : "de"}{" "}
                  <strong className="text-foreground">
                    {allSportSections[0]?.[1].length || 0}
                  </strong>{" "}
                  {isEn
                    ? `surfaces compatible with ${translateSportTag(
                        selectedSport,
                        true,
                        taxonomy,
                      )}`
                    : `superficies compatibles con ${selectedSport}`}
                </span>

                <div className="flex items-center gap-1.5">
                  <span>{isEn ? "Show:" : "Mostrar:"}</span>
                  <select
                    value={cardsPerPage}
                    onChange={(e) => {
                      setCardsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    aria-label={isEn ? "Surfaces per page" : "Superficies por página"}
                    className="form-input h-7 w-auto rounded-lg px-2 py-0 text-xs font-semibold"
                  >
                    <option value={6}>
                      {isEn ? "6 per page" : "6 por página"}
                    </option>
                    <option value={9}>
                      {isEn ? "9 per page" : "9 por página"}
                    </option>
                    <option value={12}>
                      {isEn ? "12 per page" : "12 por página"}
                    </option>
                    <option value={18}>
                      {isEn ? "18 per page" : "18 por página"}
                    </option>
                  </select>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="cursor-pointer rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isEn ? "← Previous" : "← Anterior"}
            </button>

            {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => setCurrentPage(page)}
                className={`cursor-pointer size-8 rounded-lg text-xs font-bold transition-colors ${
                  page === safePage
                    ? "bg-accent text-accent-foreground shadow-2xs"
                    : "border border-border bg-surface text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {page}
              </button>
            ))}

            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="cursor-pointer rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isEn ? "Next →" : "Siguiente →"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
