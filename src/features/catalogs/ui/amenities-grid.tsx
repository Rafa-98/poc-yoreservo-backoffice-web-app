"use client";

import React, { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/shared/ui/button";
import type { ActivityTypeItem, AmenityItem, LocalizedName } from "../model/types";

interface AmenitiesGridProps {
  amenities: AmenityItem[];
  taxonomy?: ActivityTypeItem[];
  onAddAmenity: () => void;
  onEditAmenity?: (amenity: AmenityItem) => void;
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
};

const AMENITY_EN_BY_CODE: Record<string, { name: string; description: string }> = {
  AMN_LIGHTING_LED: {
    name: "Night LED Lighting",
    description: "500+ Lux anti-glare standard for night matches and broadcasting",
  },
  AMN_HYDRATION: {
    name: "Hydration & Ice Station",
    description: "Cold filtered water dispenser, ice, and isotonic drinks courtside",
  },
  AMN_SCOREBOARD: {
    name: "Digital Electronic Scoreboard",
    description: "LED score and timer display visible from the court",
  },
  AMN_STREAMING_CAM: {
    name: "Match Recording & Replay Camera",
    description: "Automated system to record matches and download highlight replays",
  },
  AMN_BLEACHERS: {
    name: "Bleachers / Spectator Zone",
    description: "Covered benches and stands for guests and spectators",
  },
  AMN_LOCKERS: {
    name: "Locker Rooms & Showers",
    description: "Hot water, individual lockers, and climate-controlled changing rooms",
  },
  AMN_PARKING: {
    name: "Guarded Parking",
    description: "24/7 private security and vehicle access control",
  },
  AMN_CAFETERIA: {
    name: "Cafeteria / Sports Bar",
    description: "Isotonic drinks, snacks, coffee, and screens for live sports broadcasts",
  },
  AMN_WIFI: {
    name: "High-Speed Fiber Wi-Fi",
    description: "Complimentary high-speed connection for players and guests",
  },
  AMN_SOCCER_BALLS_BIBS: {
    name: "Official Soccer Balls & Bibs Loan",
    description: "Thermo-bonded size 4 / size 5 balls and team training vests",
  },
  AMN_SOCCER_GOALS_PRO: {
    name: "Regulation Goals with Pro Nets",
    description: "Padded metal goalframes with heavy-duty nylon nets",
  },
  AMN_SOCCER_BENCHES: {
    name: "Technical Benches for Substitutes",
    description: "Covered pitchside technical zone for substitutions and coaching staff",
  },
  AMN_GLOVES_SHINGUARDS: {
    name: "Goalkeeper Gloves & Shin Guards Rental",
    description: "Protective gear for goalkeepers and players available at reception",
  },
  AMN_RENTAL: {
    name: "Padel Rackets & Pressurized Balls Rental",
    description: "Carbon/fiberglass padel rackets and new high-pressure balls at reception",
  },
  AMN_PADEL_PANORAMIC_GLASS: {
    name: "12mm Panoramic Tempered Glass (WPT)",
    description: "Pillar-free glass walls and anti-injury electro-welded mesh",
  },
  AMN_PADEL_OUTSIDE_PLAY: {
    name: "Out-of-Court Play Zone",
    description: "3m obstacle-free perimeter run-off area for out-of-court recoveries",
  },
  AMN_TENNIS_RACKETS_BALLS: {
    name: "Tennis Rackets & Ball Basket Rental",
    description: "Adult/junior graphite rackets and training ball baskets",
  },
  AMN_PRO_SHOP: {
    name: "Pro Shop & Stringing Service",
    description: "Balls, overgrips, dampeners, and electronic racket stringing machine",
  },
  AMN_TENNIS_BALL_MACHINE: {
    name: "Training Ball Launcher Machine",
    description: "Programmable ball launcher with spin (topspin/slice) and speed control",
  },
  AMN_TENNIS_UMPIRE_CHAIR: {
    name: "Umpire Chair & Shaded Player Benches",
    description: "Official ITF centerline equipment with canopy for changeovers",
  },
  AMN_PICKLEBALL_PADDLES_BALLS: {
    name: "USA Pickleball Paddles & X-40 Balls Rental",
    description: "Polymer/carbon honeycomb paddles and outdoor/indoor perforated balls",
  },
  AMN_PICKLEBALL_PRO_NET: {
    name: "Regulation USA Pickleball Net & Dividers",
    description: "Official tensioned net system (36\"/34\") with perimeter court dividers",
  },
  AMN_PINGPONG_RACKETS_BALLS: {
    name: "ITTF Paddles & 3-Star Balls (40+) Loan",
    description: "ITTF-approved rubber paddles and competition ABS balls",
  },
  AMN_PINGPONG_BARRIERS_ROBOT: {
    name: "Perimeter Barriers & Multi-Ball Robot",
    description: "Individual table surrounds and multi-ball training robot",
  },
  AMN_AIR_CONDITIONING: {
    name: "Climate Control / Air Conditioning",
    description: "Draft-free climate-controlled indoor environment",
  },
  AMN_VOLLEY_BALLS_NET: {
    name: "FIVB Volleyballs & Net with Antennas",
    description: "Official Mikasa/Molten balls and height-adjustable net (2.43m / 2.24m) with antennas",
  },
  AMN_BEACH_SHOWER_FEET: {
    name: "Foot-Wash Showers & Shaded Sand Lounge",
    description: "Outdoor showers to rinse off sand and cool courtside rest area",
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

function getAmenityDisplay(
  amenity: AmenityItem,
  isEn: boolean,
): { name: string; description: string } {
  const rawName =
    typeof (amenity.name as any) === "object" && amenity.name !== null
      ? isEn
        ? (amenity.name as any).en || (amenity.name as any).es || ""
        : (amenity.name as any).es || (amenity.name as any).en || ""
      : String(amenity.name || "");

  const rawDesc =
    typeof (amenity.description as any) === "object" && amenity.description !== null
      ? isEn
        ? (amenity.description as any).en || (amenity.description as any).es || ""
        : (amenity.description as any).es || (amenity.description as any).en || ""
      : String(amenity.description || "");

  if (isEn && amenity.code && AMENITY_EN_BY_CODE[amenity.code]) {
    return AMENITY_EN_BY_CODE[amenity.code];
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
  return "🏅";
}

function isGeneralAmenity(amenity: AmenityItem, totalSportsCount: number): boolean {
  const sports = amenity.suitedSports || [];
  return sports.length === 0 || sports.length >= Math.max(5, totalSportsCount);
}

function matchesSport(amenity: AmenityItem, sportName: string): boolean {
  const sports = amenity.suitedSports || [];
  if (sports.length === 0) return true;
  const normSport = sportName.toLowerCase();
  const enSport = (SPORT_TAG_EN_MAP[normSport] || "").toLowerCase();
  return sports.some((s) => {
    const lower = s.toLowerCase();
    return (
      lower.includes(normSport) ||
      (Boolean(enSport) && lower.includes(enSport))
    );
  });
}

export function AmenitiesGrid({
  amenities,
  taxonomy = [],
  onAddAmenity,
  onEditAmenity,
}: AmenitiesGridProps) {
  const t = useTranslations("catalogs.amenities");
  const locale = useLocale();
  const isEn = locale.toLowerCase().startsWith("en");

  const [selectedFilter, setSelectedFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ENABLED" | "DISABLED">("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(9);

  // Extract official sports from taxonomy (using canonical ES key for matching against suitedSports)
  const systemSports = useMemo(() => {
    const names = taxonomy
      .flatMap((type) =>
        (type.activities || []).map((act) => getLocalizedText(act.name, false))
      )
      .filter(Boolean);
    return names.length > 0 ? names : DEFAULT_SPORT_NAMES;
  }, [taxonomy]);

  // Filter by search and status first (so pill counts reflect active search/status)
  const searchAndStatusFiltered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return amenities.filter((a) => {
      if (statusFilter !== "ALL" && a.status !== statusFilter) {
        return false;
      }
      if (!q) return true;
      const enDisplay = getAmenityDisplay(a, true);
      const esDisplay = getAmenityDisplay(a, false);
      return (
        esDisplay.name.toLowerCase().includes(q) ||
        enDisplay.name.toLowerCase().includes(q) ||
        esDisplay.description.toLowerCase().includes(q) ||
        enDisplay.description.toLowerCase().includes(q) ||
        (a.suitedSports || []).some(
          (sp) =>
            sp.toLowerCase().includes(q) ||
            translateSportTag(sp, true, taxonomy).toLowerCase().includes(q)
        )
      );
    });
  }, [amenities, searchQuery, statusFilter, taxonomy]);

  // Counts for each pill
  const generalCount = useMemo(
    () =>
      searchAndStatusFiltered.filter((a) =>
        isGeneralAmenity(a, systemSports.length)
      ).length,
    [searchAndStatusFiltered, systemSports.length]
  );

  const sportCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const sp of systemSports) {
      counts[sp] = searchAndStatusFiltered.filter((a) =>
        matchesSport(a, sp)
      ).length;
    }
    return counts;
  }, [searchAndStatusFiltered, systemSports]);

  // Apply sport / general filter
  const filteredAmenities = useMemo(() => {
    if (selectedFilter === "ALL") {
      return searchAndStatusFiltered;
    }
    if (selectedFilter === "GENERAL") {
      return searchAndStatusFiltered.filter((a) =>
        isGeneralAmenity(a, systemSports.length)
      );
    }
    return searchAndStatusFiltered.filter((a) =>
      matchesSport(a, selectedFilter)
    );
  }, [searchAndStatusFiltered, selectedFilter, systemSports.length]);

  // Pagination
  const totalItems = filteredAmenities.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedAmenities = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredAmenities.slice(start, start + pageSize);
  }, [filteredAmenities, safePage, pageSize]);

  const activeCount = amenities.filter((a) => a.status === "ENABLED").length;
  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    selectedFilter !== "ALL" ||
    statusFilter !== "ALL";

  return (
    <div className="space-y-5">
      {/* TOP CONTROL & SUMMARY BAR */}
      <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="font-display text-lg font-bold text-foreground">
              {t("bannerTitle")}
            </h2>
            <p className="text-xs text-muted-foreground">
              {t("bannerDesc")}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-3.5 py-2 text-xs">
              <span className="font-bold text-foreground">{amenities.length}</span>
              <span className="text-muted-foreground">
                {isEn ? "Amenities" : "Amenidades"}
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
              onClick={onAddAmenity}
              id="btn-add-amenity"
            >
              + {t("btnAdd")}
            </Button>
          </div>
        </div>

        {/* FILTER PILLS + SEARCH + STATUS */}
        <div className="flex flex-col gap-3 border-t border-border pt-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* SPORT & SCOPE FILTER PILLS */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setSelectedFilter("ALL");
                  setCurrentPage(1);
                }}
                className={`cursor-pointer rounded-xl border px-3 py-1.5 text-xs font-bold transition-all ${
                  selectedFilter === "ALL"
                    ? "border-accent bg-accent text-accent-foreground shadow-2xs"
                    : "border-border bg-muted/30 text-muted-foreground hover:border-accent/50 hover:text-foreground"
                }`}
              >
                {isEn
                  ? `All (${searchAndStatusFiltered.length})`
                  : `Todos (${searchAndStatusFiltered.length})`}
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedFilter("GENERAL");
                  setCurrentPage(1);
                }}
                className={`cursor-pointer inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all ${
                  selectedFilter === "GENERAL"
                    ? "border-accent bg-accent text-accent-foreground shadow-2xs"
                    : "border-border bg-surface text-muted-foreground hover:border-accent/50 hover:text-foreground"
                }`}
              >
                <span>🌟</span>
                <span>{isEn ? "Venue General" : "Generales de Sede"}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                    selectedFilter === "GENERAL"
                      ? "bg-black/15 text-accent-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {generalCount}
                </span>
              </button>

              {systemSports.map((sport) => {
                const active = selectedFilter === sport;
                const count = sportCounts[sport] ?? 0;
                return (
                  <button
                    key={sport}
                    type="button"
                    onClick={() => {
                      setSelectedFilter(sport);
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
                      ? "🔍 Search amenity or service..."
                      : "🔍 Buscar amenidad o servicio..."
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
                aria-label={isEn ? "Filter amenities by status" : "Filtrar amenidades por estado"}
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
                    setSelectedFilter("ALL");
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

      {/* AMENITIES CARDS GRID */}
      {paginatedAmenities.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-10 text-center">
          <p className="text-sm font-semibold text-foreground">
            {isEn
              ? "No amenities found with the current filters"
              : "No se encontraron amenidades con los filtros actuales"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {isEn
              ? "Try changing the selected sport or clearing the search."
              : "Intenta cambiar el deporte seleccionado o limpia la búsqueda."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedAmenities.map((a) => {
            const displayAmenity = getAmenityDisplay(a, isEn);
            const sports = a.suitedSports || [];
            const isAllSports = isGeneralAmenity(a, systemSports.length);
            return (
              <div
                key={a.id}
                onClick={() => onEditAmenity?.(a)}
                className="group cursor-pointer rounded-2xl border border-border bg-surface p-5 shadow-xs transition-all hover:border-accent hover:shadow-md hover:-translate-y-0.5 flex flex-col justify-between gap-3.5"
              >
                <div className="flex items-start gap-3.5">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-accent/15 border border-accent/30 text-2xl transition-transform group-hover:scale-105">
                    {a.icon}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <strong className="text-sm font-bold text-foreground block leading-snug">
                        {displayAmenity.name}
                      </strong>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {a.status === "DISABLED" ? (
                          <span className="rounded-full bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 text-[10px] font-bold text-rose-500">
                            {isEn ? "Inactive" : "Inactivo"}
                          </span>
                        ) : (
                          <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                            {isEn ? "Active" : "Activo"}
                          </span>
                        )}
                        {onEditAmenity && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditAmenity(a);
                            }}
                            className="cursor-pointer rounded-lg border border-border px-2 py-0.5 text-[11px] font-semibold text-muted-foreground transition-colors hover:border-accent hover:text-foreground"
                          >
                            ✏️ {t("btnEdit")}
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                      {displayAmenity.description}
                    </p>
                  </div>
                </div>

                <div className="border-t border-border/60 pt-3 flex flex-col gap-2">
                  <div className="flex flex-wrap gap-1.5">
                    {isAllSports ? (
                      <span className="rounded-lg bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10.5px] font-bold text-emerald-600 dark:text-emerald-400">
                        {isEn
                          ? "🌟 All sports (Venue General)"
                          : "🌟 Todos los deportes (General de Sede)"}
                      </span>
                    ) : (
                      sports.slice(0, 5).map((sp) => (
                        <span
                          key={sp}
                          className="rounded-lg bg-muted border border-border px-2 py-0.5 text-[10.5px] font-semibold text-foreground"
                        >
                          {translateSportTag(sp, isEn, taxonomy)}
                        </span>
                      ))
                    )}
                    {!isAllSports && sports.length > 5 && (
                      <span className="rounded-lg bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                        +{sports.length - 5} {isEn ? "more" : "más"}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11.5px]">
                    <span className="font-bold text-link">
                      {t("activeInVenues", { count: a.activeVenuesCount ?? 0 })}
                    </span>
                    <span className="text-[11px] font-semibold text-muted-foreground group-hover:text-foreground group-hover:underline">
                      {isEn ? "Configure →" : "Configurar →"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* PAGINATION BAR */}
      {totalItems > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface px-5 py-3.5 text-xs text-muted-foreground shadow-xs">
          <div className="flex flex-wrap items-center gap-3">
            <span>
              {isEn ? "Showing" : "Mostrando"}{" "}
              <strong className="text-foreground">
                {(safePage - 1) * pageSize + 1}–
                {Math.min(safePage * pageSize, totalItems)}
              </strong>{" "}
              {isEn ? "of" : "de"}{" "}
              <strong className="text-foreground">{totalItems}</strong>{" "}
              {isEn ? "amenities" : "amenidades"}
            </span>

            <div className="flex items-center gap-1.5">
              <span>{isEn ? "Show:" : "Mostrar:"}</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                aria-label={isEn ? "Amenities per page" : "Amenidades por página"}
                className="form-input h-7 w-auto rounded-lg px-2 py-0 text-xs font-semibold"
              >
                <option value={9}>
                  {isEn ? "9 per page" : "9 por página"}
                </option>
                <option value={12}>
                  {isEn ? "12 per page" : "12 por página"}
                </option>
                <option value={18}>
                  {isEn ? "18 per page" : "18 por página"}
                </option>
                <option value={27}>
                  {isEn
                    ? `All (${amenities.length})`
                    : `Todas (${amenities.length})`}
                </option>
              </select>
            </div>
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
