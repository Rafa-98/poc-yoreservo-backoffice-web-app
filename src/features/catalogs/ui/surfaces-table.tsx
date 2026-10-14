"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/shared/ui/button";
import type { SurfaceItem } from "../model/types";

interface SurfacesTableProps {
  surfaces: SurfaceItem[];
  onAddSurface: () => void;
  onEditSurface: (surface: SurfaceItem) => void;
}

export function SurfacesTable({
  surfaces,
  onAddSurface,
  onEditSurface,
}: SurfacesTableProps) {
  const t = useTranslations("catalogs.surfaces");

  return (
    <div className="space-y-4">
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
          onClick={onAddSurface}
          id="btn-add-surface"
        >
          + {t("btnAdd")}
        </Button>
      </div>

      {/* SURFACES TABLE */}
      <div className="overflow-x-auto rounded-2xl border border-border bg-surface shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border">
            <tr>
              <th className="px-5 py-3.5">{t("thName")}</th>
              <th className="px-5 py-3.5">{t("thSuited")}</th>
              <th className="px-5 py-3.5">{t("thMaintenance")}</th>
              <th className="px-4 py-3.5">{t("thStatus")}</th>
              <th className="px-5 py-3.5 text-right">{t("thActions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {surfaces.map((s) => (
              <tr key={s.id} className="transition-colors hover:bg-muted/40">
                <td className="px-5 py-4">
                  <strong className="text-foreground">{s.name}</strong>
                  <div className="text-xs text-muted-foreground font-mono mt-0.5">
                    <code>{s.code}</code> • {s.description}
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="flex flex-wrap gap-1.5">
                    {s.suitedSports.map((sport, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-accent/15 border border-accent/30 text-foreground"
                      >
                        {sport}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-5 py-4 text-xs text-muted-foreground">
                  {s.maintenanceProtocol}
                </td>
                <td className="px-4 py-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 border border-emerald-500/30 text-emerald-500">
                    {t("active")}
                  </span>
                </td>
                <td className="px-5 py-4 text-right">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => onEditSurface(s)}
                    className="h-8 px-2.5 text-xs"
                  >
                    ✏️ {t("btnEdit")}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
