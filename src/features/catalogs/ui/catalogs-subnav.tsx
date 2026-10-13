"use client";

import React from "react";
import { useTranslations } from "next-intl";

interface CatalogsSubnavProps {
  activeTab: "sports" | "surfaces" | "amenities";
  onChangeTab: (tab: "sports" | "surfaces" | "amenities") => void;
  surfacesCount: number;
  amenitiesCount: number;
}

export function CatalogsSubnav({
  activeTab,
  onChangeTab,
  surfacesCount,
  amenitiesCount,
}: CatalogsSubnavProps) {
  const t = useTranslations("catalogs.tabs");

  return (
    <nav className="flex gap-2 border-b border-border bg-surface px-6">
      <button
        type="button"
        onClick={() => onChangeTab("sports")}
        className={`inline-flex items-center gap-2 border-b-2 py-3.5 px-3 text-sm font-semibold transition-all cursor-pointer ${
          activeTab === "sports"
            ? "border-accent text-foreground font-bold"
            : "border-transparent text-muted-foreground hover:text-foreground"
        }`}
        id="tab-sports"
      >
        <span>🎾</span>
        <span>{t("sports")}</span>
      </button>

      <button
        type="button"
        onClick={() => onChangeTab("surfaces")}
        className={`inline-flex items-center gap-2 border-b-2 py-3.5 px-3 text-sm font-semibold transition-all cursor-pointer ${
          activeTab === "surfaces"
            ? "border-accent text-foreground font-bold"
            : "border-transparent text-muted-foreground hover:text-foreground"
        }`}
        id="tab-surfaces"
      >
        <span>🌱</span>
        <span>{t("surfaces")} ({surfacesCount})</span>
      </button>

      <button
        type="button"
        onClick={() => onChangeTab("amenities")}
        className={`inline-flex items-center gap-2 border-b-2 py-3.5 px-3 text-sm font-semibold transition-all cursor-pointer ${
          activeTab === "amenities"
            ? "border-accent text-foreground font-bold"
            : "border-transparent text-muted-foreground hover:text-foreground"
        }`}
        id="tab-amenities"
      >
        <span>✨</span>
        <span>{t("amenities")} ({amenitiesCount})</span>
      </button>
    </nav>
  );
}
