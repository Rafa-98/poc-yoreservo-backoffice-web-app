"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/shared/ui/button";
import type { AmenityItem } from "../model/types";

interface AmenitiesGridProps {
  amenities: AmenityItem[];
  onAddAmenity: () => void;
  onEditAmenity?: (amenity: AmenityItem) => void;
}

const SPORT_FILTERS = [
  "Todos",
  "Fútbol",
  "Pádel",
  "Tenis",
  "Pickleball",
  "Ping-pong",
  "Voleibol",
];

export function AmenitiesGrid({
  amenities,
  onAddAmenity,
  onEditAmenity,
}: AmenitiesGridProps) {
  const t = useTranslations("catalogs.amenities");
  const [selectedSport, setSelectedSport] = useState<string>("Todos");

  const filteredAmenities =
    selectedSport === "Todos"
      ? amenities
      : amenities.filter((a) => {
          const sports = a.suitedSports || [];
          if (sports.length === 0) return true;
          return sports.some((s) =>
            s.toLowerCase().includes(selectedSport.toLowerCase())
          );
        });

  return (
    <div className="space-y-6">
      {/* BANNER WITH CTA */}
      <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-display text-base font-bold text-foreground">
            {t("bannerTitle")}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("bannerDesc")}
          </p>
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

      {/* SPORT CATEGORY FILTER PILLS */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mr-1">
          Filtrar por deporte:
        </span>
        {SPORT_FILTERS.map((sport) => {
          const active = selectedSport === sport;
          return (
            <button
              key={sport}
              type="button"
              onClick={() => setSelectedSport(sport)}
              className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-bold transition-all ${
                active
                  ? "border-accent bg-accent text-accent-foreground shadow-xs"
                  : "border-border bg-surface text-muted-foreground hover:border-accent/60 hover:text-foreground"
              }`}
            >
              {sport}
            </button>
          );
        })}
      </div>

      {/* AMENITIES CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAmenities.map((a) => {
          const sports = a.suitedSports || [];
          const isAllSports = sports.length >= 6 || sports.length === 0;
          return (
            <div
              key={a.id}
              className="rounded-2xl border border-border bg-surface p-5 shadow-sm transition-all hover:border-accent hover:-translate-y-0.5 flex flex-col justify-between gap-3"
            >
              <div className="flex items-start gap-4">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent/15 border border-accent/30 text-2xl">
                  {a.icon}
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <strong className="text-sm font-bold text-foreground block leading-snug">
                      {a.name}
                    </strong>
                    {onEditAmenity && (
                      <button
                        type="button"
                        onClick={() => onEditAmenity(a)}
                        className="shrink-0 cursor-pointer rounded-lg border border-border px-2 py-0.5 text-[11px] font-semibold text-muted-foreground transition-colors hover:border-accent hover:text-foreground"
                      >
                        ✏️ Editar
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {a.description}
                  </p>
                </div>
              </div>

              <div className="border-t border-border/60 pt-3 flex flex-col gap-2">
                <div className="flex flex-wrap gap-1.5">
                  {isAllSports ? (
                    <span className="rounded-md bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10.5px] font-bold text-emerald-600 dark:text-emerald-400">
                      🌟 Todos los deportes
                    </span>
                  ) : (
                    sports.map((sp) => (
                      <span
                        key={sp}
                        className="rounded-md bg-muted border border-border px-2 py-0.5 text-[10.5px] font-semibold text-foreground"
                      >
                        {sp}
                      </span>
                    ))
                  )}
                </div>

                <div className="text-[11.5px] font-bold text-accent-foreground dark:text-accent">
                  {t("activeInVenues", { count: a.activeVenuesCount ?? 0 })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
