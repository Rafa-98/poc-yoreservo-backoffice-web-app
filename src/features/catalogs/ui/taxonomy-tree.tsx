"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/shared/ui/button";
import type { ActivityItem, ActivityTypeItem } from "../model/types";

interface TaxonomyTreeProps {
  taxonomy: ActivityTypeItem[];
  onAddSport: (typeId: string) => void;
  onAddCategory: (activity: ActivityItem) => void;
}

export function TaxonomyTree({
  taxonomy,
  onAddSport,
  onAddCategory,
}: TaxonomyTreeProps) {
  const t = useTranslations("catalogs.taxonomy");

  function getLocalizedName(val: any): { es: string; en: string } {
    if (typeof val === "object" && val !== null) {
      return { es: val.es || "", en: val.en || "" };
    }
    return { es: String(val || ""), en: String(val || "") };
  }

  return (
    <div className="space-y-6">
      {/* EXPLANATORY ARCHITECTURE BANNER */}
      <div className="rounded-2xl border border-accent/30 bg-accent/10 p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-sm font-bold text-foreground">
              {t("bannerTitle")}
            </div>
            <div className="text-xs text-muted-foreground leading-relaxed max-w-4xl">
              {t("bannerDesc")}
            </div>
          </div>
          <span className="rounded-xl border border-border bg-surface px-3 py-1 text-xs font-bold text-foreground">
            {t("parityBadge")}
          </span>
        </div>
      </div>

      {/* ACTIVITY TYPES LIST */}
      {taxonomy.map((type) => {
        const typeName = getLocalizedName(type.name);
        return (
          <div
            key={type.id}
            className="rounded-2xl border border-border bg-surface shadow-sm overflow-hidden"
          >
            {/* Type Header */}
            <div className="flex items-center justify-between border-b border-border bg-muted/60 px-6 py-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{type.icon || "🏆"}</span>
                <div>
                  <h3 className="font-display text-base font-bold text-foreground">
                    {typeName.es}
                  </h3>
                  <span className="text-xs text-muted-foreground font-mono">
                    (ActivityType: <code>{type.code}</code>)
                  </span>
                </div>
              </div>

              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => onAddSport(type.id)}
                id={`btn-add-sport-${type.code}`}
              >
                + {t("btnAddSport")}
              </Button>
            </div>

            {/* Activities within Type */}
            <div className="divide-y divide-border">
              {type.activities.map((act) => {
                const actName = getLocalizedName(act.name);
                return (
                  <div key={act.id} className="p-6 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        <div className="flex size-10 items-center justify-center rounded-xl bg-accent/15 border border-accent/30 text-xl">
                          {type.icon || "🎾"}
                        </div>
                        <div>
                          <div className="flex items-center gap-2.5">
                            <strong className="text-base text-foreground">
                              {actName.es}
                            </strong>
                            <span className="text-xs text-muted-foreground">
                              [EN: {actName.en}]
                            </span>
                            <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-semibold text-emerald-500">
                              {t("active")}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {t("spacesCount", { count: act.totalSpaces || 0 })}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => onAddCategory(act)}
                          id={`btn-add-format-${act.id}`}
                        >
                          {t("btnAddCategory")}
                        </Button>
                      </div>
                    </div>

                    {/* Formats / Categories chips */}
                    <div className="flex flex-wrap gap-2 pl-12 pt-1">
                      {act.categories.map((cat) => {
                        const catName = getLocalizedName(cat.name);
                        return (
                          <div
                            key={cat.id}
                            className="inline-flex items-center gap-2 rounded-xl border border-border bg-muted/60 px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:border-accent"
                          >
                            <span>🏆 {catName.es}</span>
                            <span className="text-[11px] text-muted-foreground">
                              • {cat.spacesCount || 0} canchas
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
