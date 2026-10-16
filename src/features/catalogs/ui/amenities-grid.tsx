"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/shared/ui/button";
import type { AmenityItem } from "../model/types";

interface AmenitiesGridProps {
  amenities: AmenityItem[];
  onAddAmenity: () => void;
}

export function AmenitiesGrid({
  amenities,
  onAddAmenity,
}: AmenitiesGridProps) {
  const t = useTranslations("catalogs.amenities");

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

      {/* AMENITIES CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {amenities.map((a) => (
          <div
            key={a.id}
            className="rounded-2xl border border-border bg-surface p-5 shadow-sm transition-all hover:border-accent hover:-translate-y-0.5 flex items-start gap-4"
          >
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent/15 border border-accent/30 text-2xl">
              {a.icon}
            </div>

            <div className="flex-1 space-y-1">
              <strong className="text-sm font-bold text-foreground block">
                {a.name}
              </strong>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {a.description}
              </p>
              <div className="pt-1.5 text-[11.5px] font-bold text-accent-foreground dark:text-accent">
                {t("activeInVenues", { count: a.activeVenuesCount ?? 0 })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
