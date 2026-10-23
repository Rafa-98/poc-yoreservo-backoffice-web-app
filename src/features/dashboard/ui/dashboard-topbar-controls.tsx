"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { ROUTES } from "@/shared/config";
import { VenueInlineCombobox } from "@/features/venues/ui/venue-inline-combobox";
import type { RolePerspective } from "../model/types";

interface DashboardTopbarControlsProps {
  perspective: RolePerspective;
}

export function DashboardTopbarControls({
  perspective,
}: DashboardTopbarControlsProps) {
  const t = useTranslations("dashboard");

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <VenueInlineCombobox id="dashboard-venue-selector" />

      {/* Role Adaptive CTA (Admin only — Walk-in Booking removed per spec) */}
      {perspective === "ADMIN" && (
        <Link
          href={ROUTES.venues}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent text-accent-foreground text-xs sm:text-sm font-bold shadow-xs hover:brightness-105 active:scale-98 transition-all"
        >
          <Plus className="size-4" />
          <span>{t("actions.newVenue")}</span>
        </Link>
      )}
    </div>
  );
}
