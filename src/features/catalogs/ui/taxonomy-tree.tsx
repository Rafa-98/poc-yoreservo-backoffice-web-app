"use client";

import React, { useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { Edit3, Plus, Search, Trophy, Layers } from "lucide-react";
import { Button } from "@/shared/ui/button";
import type {
  ActivityCategoryItem,
  ActivityItem,
  ActivityTypeItem,
} from "../model/types";

interface TaxonomyTreeProps {
  taxonomy: ActivityTypeItem[];
  onAddSport: (typeId: string) => void;
  onEditSport: (typeId: string, activity: ActivityItem) => void;
  onAddCategory: (activity: ActivityItem) => void;
  onEditCategory: (
    activity: ActivityItem,
    category: ActivityCategoryItem,
  ) => void;
}

function getLocalizedName(val: any): { es: string; en: string } {
  if (typeof val === "object" && val !== null) {
    return { es: val.es || "", en: val.en || "" };
  }
  return { es: String(val || ""), en: String(val || "") };
}

function resolveSportVisual(nameEs: string, rawImageUrl?: string | null): {
  emoji: string;
  imageUrl: string;
} {
  const lower = nameEs.toLowerCase();
  let emoji = "🏆";
  let fallbackUrl =
    "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=900&q=80";

  if (lower.includes("fútbol") || lower.includes("futbol") || lower.includes("soccer")) {
    emoji = "⚽";
    fallbackUrl =
      "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=900&q=80";
  } else if (lower.includes("pádel") || lower.includes("padel")) {
    emoji = "🎾";
    fallbackUrl =
      "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=900&q=80";
  } else if (lower.includes("tenis") || lower.includes("tennis")) {
    emoji = "🎾";
    fallbackUrl =
      "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=900&q=80";
  } else if (lower.includes("pickleball")) {
    emoji = "🏓";
    fallbackUrl =
      "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=900&q=80";
  } else if (lower.includes("ping") || lower.includes("mesa")) {
    emoji = "🏓";
    fallbackUrl =
      "https://images.unsplash.com/photo-1534158914592-062992fbe900?auto=format&fit=crop&w=900&q=80";
  } else if (lower.includes("voleibol") || lower.includes("volley")) {
    emoji = "🏐";
    fallbackUrl =
      "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?auto=format&fit=crop&w=900&q=80";
  }

  const trimmed = (rawImageUrl || "").trim();
  const isHttpImage =
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("/");

  return {
    emoji,
    imageUrl: isHttpImage ? trimmed : fallbackUrl,
  };
}

export function TaxonomyTree({
  taxonomy,
  onAddSport,
  onEditSport,
  onAddCategory,
  onEditCategory,
}: TaxonomyTreeProps) {
  const locale = useLocale();
  const isEn = locale.toLowerCase().startsWith("en");

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ENABLED" | "DISABLED">("ALL");

  const defaultTypeId = taxonomy[0]?.id || "";

  // Flatten all activities with their parent type metadata
  const allSports = useMemo(() => {
    const list: Array<{
      typeId: string;
      typeNameEs: string;
      activity: ActivityItem;
    }> = [];
    for (const t of taxonomy) {
      const tName = getLocalizedName(t.name);
      for (const act of t.activities || []) {
        list.push({
          typeId: t.id,
          typeNameEs: isEn
            ? tName.en || tName.es || "Sports"
            : tName.es || tName.en || "Deportes",
          activity: act,
        });
      }
    }
    return list;
  }, [taxonomy, isEn]);

  const filteredSports = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allSports.filter(({ activity }) => {
      if (statusFilter !== "ALL" && activity.status !== statusFilter) {
        return false;
      }
      if (!q) return true;
      const actName = getLocalizedName(activity.name);
      const catNames = (activity.categories || [])
        .map((c) => {
          const cn = getLocalizedName(c.name);
          return `${cn.es} ${cn.en}`;
        })
        .join(" ");
      const haystack = `${actName.es} ${actName.en} ${catNames}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [allSports, searchQuery, statusFilter]);

  const totalSportsCount = allSports.length;
  const totalCategoriesCount = useMemo(
    () =>
      allSports.reduce(
        (acc, item) => acc + (item.activity.categories?.length || 0),
        0,
      ),
    [allSports],
  );
  const totalSpacesCount = useMemo(
    () =>
      allSports.reduce(
        (acc, item) => acc + (item.activity.totalSpaces || 0),
        0,
      ),
    [allSports],
  );

  return (
    <div className="space-y-5">
      {/* TOP CONTROL & SUMMARY BAR */}
      <div className="flex flex-col gap-3.5 rounded-2xl border border-border bg-surface p-4 shadow-2xs lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-3 py-1.5 text-xs">
            <Trophy className="size-3.5 text-amber-500" />
            <span className="text-muted-foreground">
              {isEn ? "Sports:" : "Deportes:"}
            </span>
            <strong className="font-extrabold text-foreground">
              {totalSportsCount}
            </strong>
          </div>

          <div className="inline-flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-3 py-1.5 text-xs">
            <Layers className="size-3.5 text-link" />
            <span className="text-muted-foreground">
              {isEn ? "Court formats:" : "Formatos de cancha:"}
            </span>
            <strong className="font-extrabold text-foreground">
              {totalCategoriesCount}
            </strong>
          </div>

          <div className="inline-flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-3 py-1.5 text-xs">
            <span>🏟️</span>
            <span className="text-muted-foreground">
              {isEn ? "Linked courts:" : "Canchas vinculadas:"}
            </span>
            <strong className="font-extrabold text-foreground">
              {totalSpacesCount}
            </strong>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative min-w-[230px] flex-1 sm:w-64 sm:flex-initial">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                isEn
                  ? "Search sport or format (e.g. Padel, 5v5 Soccer)..."
                  : "Buscar deporte o formato (ej. Pádel, Fútbol 5)..."
              }
              className="h-9 w-full rounded-xl border border-border bg-background pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            aria-label={isEn ? "Filter sports by status" : "Filtrar deportes por estado"}
            className="h-9 rounded-xl border border-border bg-background px-3 text-xs font-semibold text-foreground focus:border-accent focus:outline-none"
          >
            <option value="ALL">
              {isEn ? "All statuses" : "Todos los estados"}
            </option>
            <option value="ENABLED">
              {isEn ? "🟢 Active" : "🟢 Activos"}
            </option>
            <option value="DISABLED">
              {isEn ? "🔴 Inactive" : "🔴 Inactivos"}
            </option>
          </select>

          {defaultTypeId && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => onAddSport(defaultTypeId)}
              id="btn-add-sport-primary"
            >
              {isEn ? "+ Add Sport" : "+ Agregar Deporte"}
            </Button>
          )}
        </div>
      </div>

      {/* SPORTS CARDS GRID */}
      {filteredSports.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-surface px-6 py-14 text-center">
          <div className="mb-2 text-3xl">🎾</div>
          <h3 className="text-sm font-bold text-foreground">
            {isEn
              ? "No sports or formats found with that filter"
              : "No se encontraron deportes ni formatos con ese filtro"}
          </h3>
          <p className="mt-1 max-w-md text-xs text-muted-foreground">
            {isEn
              ? "Try another search term or add a new sports discipline."
              : "Intenta con otro término de búsqueda o agrega una nueva disciplina deportiva."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          {filteredSports.map(({ typeId, activity: act }) => {
            const actName = getLocalizedName(act.name);
            const primaryActName = isEn
              ? actName.en || actName.es
              : actName.es || actName.en;
            const secondaryActName = isEn
              ? actName.es || actName.en
              : actName.en || actName.es;
            const isDisabled = act.status === "DISABLED";
            const visual = resolveSportVisual(
              `${actName.es} ${actName.en}`,
              act.imageUrl,
            );

            return (
              <div
                key={act.id}
                className="flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-surface shadow-card transition-all hover:border-border-strong"
              >
                {/* 1. SPORT VISUAL HEADER */}
                <div>
                  <div className="relative h-36 w-full overflow-hidden bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={visual.imageUrl}
                      alt={primaryActName}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/15" />

                    {/* Top badges on cover */}
                    <div className="absolute left-4 right-4 top-3 flex items-center justify-between gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider backdrop-blur-xs ${
                          isDisabled
                            ? "border-rose-400/50 bg-rose-500/25 text-rose-100"
                            : "border-emerald-400/50 bg-emerald-500/25 text-emerald-100"
                        }`}
                      >
                        {isDisabled
                          ? isEn
                            ? "🔴 Inactive"
                            : "🔴 Inactivo"
                          : isEn
                            ? "🟢 Active"
                            : "🟢 Activo"}
                      </span>

                      <button
                        type="button"
                        onClick={() => onEditSport(typeId, act)}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-white/25 bg-black/55 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-xs transition hover:bg-black/80"
                      >
                        <Edit3 className="size-3.5" />
                        <span>{isEn ? "Edit sport" : "Editar deporte"}</span>
                      </button>
                    </div>

                    {/* Bottom title on cover */}
                    <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-white/25 bg-black/55 text-2xl shadow-sm backdrop-blur-xs">
                          {visual.emoji}
                        </div>
                        <div>
                          <div className="flex flex-wrap items-baseline gap-2">
                            <h3 className="font-display text-lg font-extrabold text-white">
                              {primaryActName}
                            </h3>
                            <span className="rounded-md bg-white/15 px-1.5 py-0.5 text-[10px] font-semibold text-white/90">
                              {isEn ? "ES" : "EN"}: {secondaryActName}
                            </span>
                          </div>
                          <p className="text-xs font-medium text-white/80">
                            🏟️ {act.totalSpaces || 0}{" "}
                            {act.totalSpaces === 1
                              ? isEn
                                ? "active court on platform"
                                : "cancha activa en plataforma"
                              : isEn
                                ? "active courts on platform"
                                : "canchas activas en plataforma"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 2. CATEGORIES / GAME FORMATS SECTION */}
                  <div className="p-5">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h4 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                          {isEn
                            ? `Court Formats & Modalities (${act.categories.length})`
                            : `Formatos & Modalidades de Cancha (${act.categories.length})`}
                        </h4>
                        <p className="text-[11px] text-muted-foreground">
                          {isEn
                            ? "Click on any format to edit its name, photo, or status."
                            : "Haz clic en cualquier formato para editar su nombre, foto o estado."}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => onAddCategory(act)}
                        id={`btn-add-format-${act.id}`}
                        className="inline-flex cursor-pointer items-center gap-1 rounded-xl border border-border-medium bg-background px-3 py-1.5 text-xs font-bold text-foreground transition hover:border-accent hover:bg-accent/15"
                      >
                        <Plus className="size-3.5" />
                        <span>{isEn ? "Add format" : "Agregar formato"}</span>
                      </button>
                    </div>

                    {act.categories.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                        {isEn ? (
                          <>
                            This sport has no formats registered yet. Click on{" "}
                            <strong>+ Add format</strong>.
                          </>
                        ) : (
                          <>
                            Este deporte aún no tiene formatos registrados. Haz clic en{" "}
                            <strong>+ Agregar formato</strong>.
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                        {act.categories.map((cat) => {
                          const catName = getLocalizedName(cat.name);
                          const primaryCatName = isEn
                            ? catName.en || catName.es
                            : catName.es || catName.en;
                          const secondaryCatName = isEn
                            ? catName.es || catName.en
                            : catName.en || catName.es;
                          const catDisabled = cat.status === "DISABLED";

                          return (
                            <div
                              key={cat.id}
                              onClick={() => onEditCategory(act, cat)}
                              className="group flex cursor-pointer items-center justify-between gap-2.5 rounded-xl border border-border bg-muted/35 p-3 transition-all hover:border-accent hover:bg-muted/70"
                            >
                              <div className="flex min-w-0 items-center gap-2.5">
                                {cat.imageUrl ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={cat.imageUrl}
                                    alt={primaryCatName}
                                    className="size-9 shrink-0 rounded-lg border border-border object-cover"
                                  />
                                ) : (
                                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-base">
                                    {visual.emoji}
                                  </div>
                                )}

                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="truncate text-xs font-extrabold text-foreground">
                                      {primaryCatName}
                                    </span>
                                    {catDisabled && (
                                      <span className="rounded bg-rose-500/15 px-1.5 py-0.2 text-[9px] font-bold text-rose-500">
                                        {isEn ? "Inactive" : "Inactivo"}
                                      </span>
                                    )}
                                  </div>
                                  <div className="truncate text-[10.5px] text-muted-foreground">
                                    {isEn ? "ES" : "EN"}: {secondaryCatName} •{" "}
                                    <strong className="text-foreground">
                                      {cat.spacesCount || 0}
                                    </strong>{" "}
                                    {cat.spacesCount === 1
                                      ? isEn
                                        ? "court"
                                        : "cancha"
                                      : isEn
                                        ? "courts"
                                        : "canchas"}
                                  </div>
                                </div>
                              </div>

                              <span
                                className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-transparent text-muted-foreground transition group-hover:border-border group-hover:bg-surface group-hover:text-foreground"
                                title={isEn ? "Edit format" : "Editar formato"}
                              >
                                <Edit3 className="size-3.5" />
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
