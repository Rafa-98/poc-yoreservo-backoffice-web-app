"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import type { LocationNode } from "../model/types";

interface BackofficeLocationSelectProps {
  /** Tree of STATE nodes with their CITY children */
  locationsTree: readonly LocationNode[];
  /** Selected state ID or city ID ("" means all states) */
  value: string;
  onChange: (locationId: string) => void;
  allLabel?: string;
  placeholder?: string;
}

function getNodeName(node: LocationNode): string {
  if (typeof node.name === "string") return node.name;
  return node.name?.es || node.name?.en || "";
}

function normalizeSearchText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function BackofficeLocationSelect({
  locationsTree,
  value,
  onChange,
  allLabel = "Todos los estados",
  placeholder = "Escribe estado o ciudad...",
}: BackofficeLocationSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const stateGroups = useMemo(() => {
    return locationsTree
      .map((st) => ({
        state: st,
        stateName: getNodeName(st),
        cities: (st.children ?? []).map((ct) => ({
          city: ct,
          cityName: getNodeName(ct),
        })),
      }))
      .sort((a, b) => a.stateName.localeCompare(b.stateName, "es"));
  }, [locationsTree]);

  const selectedInfo = useMemo(() => {
    if (!value) return null;
    for (const group of stateGroups) {
      if (group.state.id === value) {
        return {
          id: group.state.id,
          type: "STATE" as const,
          label: group.stateName,
          stateId: group.state.id,
          stateName: group.stateName,
        };
      }
      for (const c of group.cities) {
        if (c.city.id === value) {
          return {
            id: c.city.id,
            type: "CITY" as const,
            label: `${c.cityName} · ${group.stateName}`,
            cityName: c.cityName,
            stateId: group.state.id,
            stateName: group.stateName,
          };
        }
      }
    }
    return null;
  }, [stateGroups, value]);

  const selectedLabel = selectedInfo ? selectedInfo.label : allLabel;

  const filteredGroups = useMemo(() => {
    const q = normalizeSearchText(query);
    if (!q) {
      return stateGroups.map((g) => ({
        ...g,
        stateMatches: true,
        matchingCities: g.cities,
      }));
    }

    const result: Array<{
      state: LocationNode;
      stateName: string;
      cities: Array<{ city: LocationNode; cityName: string }>;
      stateMatches: boolean;
      matchingCities: Array<{ city: LocationNode; cityName: string }>;
    }> = [];

    for (const group of stateGroups) {
      const stateMatches = normalizeSearchText(group.stateName).includes(q);
      const matchingCities = group.cities.filter((c) =>
        normalizeSearchText(c.cityName).includes(q)
      );

      if (stateMatches || matchingCities.length > 0) {
        result.push({
          ...group,
          stateMatches,
          matchingCities: stateMatches ? group.cities : matchingCities,
        });
      }
    }

    return result;
  }, [stateGroups, query]);

  useEffect(() => {
    if (!open) return;
    function handleOutsideClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [open]);

  function openMenu() {
    setOpen(true);
    setQuery("");
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }

  function handleSelect(nextValue: string) {
    onChange(nextValue);
    setOpen(false);
    setQuery("");
  }

  return (
    <div ref={containerRef} className="relative min-w-[230px]">
      {!open ? (
        <div className="flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground shadow-xs transition hover:border-accent/50">
          <button
            type="button"
            onClick={openMenu}
            aria-haspopup="listbox"
            aria-expanded={open}
            className="flex flex-1 items-center justify-between gap-2 text-left focus:outline-none"
          >
            <span className="truncate">
              {selectedInfo?.type === "CITY" ? "🏙️" : "🗺️"} {selectedLabel}
            </span>
            <span className="shrink-0 text-[10px] text-muted-foreground">▾</span>
          </button>
          {value ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
              title={`Restablecer a ${allLabel}`}
              aria-label={`Restablecer a ${allLabel}`}
              className="ml-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-bold text-muted-foreground transition hover:bg-border hover:text-foreground"
            >
              ×
            </button>
          ) : null}
        </div>
      ) : (
        <div className="flex items-center gap-1.5 rounded-xl border border-accent bg-surface px-3 py-2 text-xs font-semibold text-foreground ring-2 ring-accent/25">
          <span className="shrink-0 text-xs">🔍</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setOpen(false);
                setQuery("");
              } else if (e.key === "Enter") {
                e.preventDefault();
                if (!query.trim()) {
                  handleSelect("");
                } else if (filteredGroups.length > 0) {
                  const first = filteredGroups[0];
                  if (
                    !first.stateMatches &&
                    first.matchingCities.length === 1
                  ) {
                    handleSelect(first.matchingCities[0].city.id);
                  } else {
                    handleSelect(first.state.id);
                  }
                }
              }
            }}
            placeholder={placeholder}
            aria-label="Buscar estado o ciudad"
            className="w-full min-w-[140px] bg-transparent text-xs font-semibold text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              aria-label="Limpiar texto"
              className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-bold text-muted-foreground hover:text-foreground"
            >
              ×
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setQuery("");
              }}
              aria-label="Cerrar selector"
              className="shrink-0 text-[10px] text-muted-foreground hover:text-foreground"
            >
              ▴
            </button>
          )}
        </div>
      )}

      {open && (
        <div
          role="listbox"
          aria-label="Estados y ciudades disponibles"
          className="absolute left-0 top-full z-50 mt-1.5 max-h-80 w-full min-w-[300px] overflow-y-auto rounded-2xl border border-border bg-surface p-2 text-foreground shadow-modal"
        >
          {/* All States option */}
          <button
            type="button"
            role="option"
            aria-selected={value === ""}
            onClick={() => handleSelect("")}
            className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-xs font-bold transition ${
              value === ""
                ? "bg-accent/15 text-link border border-accent/30"
                : "text-foreground hover:bg-muted"
            }`}
          >
            <span className="truncate">🗺️ {allLabel}</span>
            <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">
              Nacional
            </span>
          </button>

          <div className="my-1.5 border-t border-border/60" />

          {filteredGroups.length === 0 ? (
            <div className="px-3 py-4 text-center text-xs text-muted-foreground">
              No se encontraron estados ni ciudades para &ldquo;{query}&rdquo;
            </div>
          ) : (
            <div className="space-y-1.5">
              {filteredGroups.map((group) => {
                const isStateSelected = value === group.state.id;
                const isChildCitySelected =
                  selectedInfo?.type === "CITY" &&
                  selectedInfo.stateId === group.state.id;
                const q = normalizeSearchText(query);

                return (
                  <div
                    key={group.state.id}
                    className={`rounded-xl border p-2 transition ${
                      isStateSelected || isChildCitySelected
                        ? "border-accent/40 bg-accent/10"
                        : "border-border/60 bg-background/50 hover:border-border"
                    }`}
                  >
                    <button
                      type="button"
                      role="option"
                      aria-selected={isStateSelected}
                      onClick={() => handleSelect(group.state.id)}
                      className="flex w-full items-center justify-between gap-2 text-left"
                    >
                      <span
                        className={`truncate text-xs font-bold ${
                          isStateSelected
                            ? "text-link"
                            : "text-foreground"
                        }`}
                      >
                        🗺️ {group.stateName}
                      </span>
                      <span
                        className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                          isStateSelected
                            ? "bg-accent text-accent-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {isStateSelected ? "Todo el estado ✓" : "Estado"}
                      </span>
                    </button>

                    {group.cities.length > 0 && (
                      <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-border/50 pt-1.5">
                        <span className="text-[10px] font-semibold text-muted-foreground">
                          Ciudad (opcional):
                        </span>
                        <button
                          type="button"
                          onClick={() => handleSelect(group.state.id)}
                          className={`rounded-lg px-2 py-0.5 text-[11px] font-semibold transition ${
                            isStateSelected
                              ? "bg-accent text-accent-foreground shadow-xs"
                              : "bg-muted/80 text-muted-foreground hover:bg-muted hover:text-foreground"
                          }`}
                        >
                          Todo {group.stateName}
                        </button>
                        {group.cities.map(({ city, cityName }) => {
                          const isCitySelected = value === city.id;
                          const cityMatchesQuery =
                            Boolean(q) &&
                            normalizeSearchText(cityName).includes(q);
                          return (
                            <button
                              key={city.id}
                              type="button"
                              role="option"
                              aria-selected={isCitySelected}
                              onClick={() => handleSelect(city.id)}
                              className={`rounded-lg px-2 py-0.5 text-[11px] font-semibold transition ${
                                isCitySelected
                                  ? "bg-accent text-accent-foreground shadow-xs"
                                  : cityMatchesQuery
                                    ? "border border-accent/50 bg-accent/15 font-bold text-link"
                                    : "bg-muted/80 text-foreground hover:bg-muted"
                              }`}
                            >
                              🏙️ {cityName}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

