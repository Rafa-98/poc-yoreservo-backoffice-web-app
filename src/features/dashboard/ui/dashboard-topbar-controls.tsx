"use client";

import Link from "next/link";
import { Shield, Building, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { ROUTES } from "@/shared/config";
import type { RolePerspective } from "../model/types";

interface DashboardTopbarControlsProps {
  perspective: RolePerspective;
  onTogglePerspective: (perspective: RolePerspective) => void;
}

export function DashboardTopbarControls({
  perspective,
  onTogglePerspective,
}: DashboardTopbarControlsProps) {
  const t = useTranslations("dashboard");

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Role Perspective Switcher */}
      <div
        className="inline-flex items-center p-1 rounded-full bg-surface-muted border border-border gap-1 shadow-2xs"
        role="group"
        aria-label="Role Perspective Switcher"
      >
        <button
          type="button"
          onClick={() => onTogglePerspective("ADMIN")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${
            perspective === "ADMIN"
              ? "bg-surface text-foreground font-bold shadow-xs dark:bg-accent/20 dark:text-accent-foreground border border-border/80 dark:border-accent/40"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Shield className="size-3.5 text-emerald-500" />
          <span>{t("roles.btnAdmin")}</span>
        </button>

        <button
          type="button"
          onClick={() => onTogglePerspective("ALLY")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${
            perspective === "ALLY"
              ? "bg-surface text-foreground font-bold shadow-xs dark:bg-accent/20 dark:text-accent-foreground border border-border/80 dark:border-accent/40"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Building className="size-3.5 text-blue-500" />
          <span>{t("roles.btnAlly")}</span>
        </button>
      </div>

      {/* Role Adaptive CTA */}
      {perspective === "ADMIN" ? (
        <Link
          href={ROUTES.venues}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent text-accent-foreground text-xs sm:text-sm font-bold shadow-xs hover:brightness-105 active:scale-98 transition-all"
        >
          <Plus className="size-4" />
          <span>{t("actions.newVenue")}</span>
        </Link>
      ) : (
        <Link
          href={ROUTES.agenda}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent text-accent-foreground text-xs sm:text-sm font-bold shadow-xs hover:brightness-105 active:scale-98 transition-all"
        >
          <Plus className="size-4" />
          <span>{t("actions.walkInBooking")}</span>
        </Link>
      )}
    </div>
  );
}
