"use client";

import React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ROUTES } from "@/shared/config";

interface ReservationsSubnavProps {
  currentTab: "timeline" | "ledger";
}

export function ReservationsSubnav({ currentTab }: ReservationsSubnavProps) {
  const t = useTranslations("reservations.subnav");

  return (
    <nav className="flex gap-2 border-b border-border bg-surface px-6 pt-3">
      <Link
        href={ROUTES.agenda}
        className={`inline-flex items-center gap-2 border-b-2 py-3 px-4 text-sm font-semibold transition-all ${
          currentTab === "timeline"
            ? "border-accent text-foreground font-bold"
            : "border-transparent text-muted-foreground hover:text-foreground"
        }`}
        id="tab-agenda-view"
      >
        <span>📅</span>
        <span>{t("timeline")}</span>
      </Link>

      <Link
        href={ROUTES.reservations}
        className={`inline-flex items-center gap-2 border-b-2 py-3 px-4 text-sm font-semibold transition-all ${
          currentTab === "ledger"
            ? "border-accent text-foreground font-bold"
            : "border-transparent text-muted-foreground hover:text-foreground"
        }`}
        id="tab-list-view"
      >
        <span>📋</span>
        <span>{t("ledger")}</span>
      </Link>
    </nav>
  );
}
