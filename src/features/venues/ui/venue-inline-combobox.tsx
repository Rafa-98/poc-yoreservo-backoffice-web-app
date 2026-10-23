"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useActiveVenue } from "../context/venue-context";
import type { VenueItem } from "../model/types";

export interface VenueInlineComboboxProps {
  venues?: VenueItem[];
  selectedVenueId?: string;
  onSelectVenueId?: (venueId: string) => void;
  totalSpacesOverride?: number;
  showLabel?: boolean;
  id?: string;
}

export function VenueInlineCombobox({
  venues: venuesProp,
  selectedVenueId: selectedVenueIdProp,
  onSelectVenueId: onSelectVenueIdProp,
  totalSpacesOverride,
  showLabel = true,
  id = "inline-venue-selector",
}: VenueInlineComboboxProps) {
  const t = useTranslations("venues.spaces");
  const {
    venues: contextVenues,
    activeVenueId: contextActiveVenueId,
    setActiveVenueId: contextSetActiveVenueId,
    isManagedLocked,
  } = useActiveVenue();

  const venues = venuesProp ?? contextVenues;
  const selectedVenueId = selectedVenueIdProp ?? contextActiveVenueId ?? "ALL";
  const handleSelectVenue = (nextId: string) => {
    if (onSelectVenueIdProp) {
      onSelectVenueIdProp(nextId);
    } else {
      contextSetActiveVenueId(nextId);
    }
  };

  const totalSpacesCount = useMemo(() => {
    if (typeof totalSpacesOverride === "number" && totalSpacesOverride > 0) {
      return totalSpacesOverride;
    }
    return venues.reduce((acc, v) => acc + (v.spacesCount || 0), 0);
  }, [totalSpacesOverride, venues]);

  const [venueFilterQuery, setVenueFilterQuery] = useState("");
  const [isVenueDropdownOpen, setIsVenueDropdownOpen] = useState(false);
  const venueDropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (
        venueDropdownRef.current &&
        !venueDropdownRef.current.contains(e.target as Node)
      ) {
        setIsVenueDropdownOpen(false);
        setVenueFilterQuery("");
      }
    }
    if (isVenueDropdownOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isVenueDropdownOpen]);

  const filteredVenueOptions = useMemo(() => {
    const q = venueFilterQuery.trim().toLowerCase();
    if (!q) return venues;
    return venues.filter((v) => v.name.toLowerCase().includes(q));
  }, [venues, venueFilterQuery]);

  const selectedVenueDisplayLabel = useMemo(() => {
    const totalLabel =
      totalSpacesCount === 1 ? "1 cancha" : `${totalSpacesCount} canchas`;
    if (selectedVenueId === "ALL" || !selectedVenueId) {
      return `Todas las sedes (${totalLabel})`;
    }
    const found = venues.find((v) => v.id === selectedVenueId);
    if (!found) {
      return `Todas las sedes (${totalLabel})`;
    }
    const count = found.spacesCount ?? 0;
    const countLabel = count === 1 ? "1 cancha" : `${count} canchas`;
    return `${found.name} (${countLabel})`;
  }, [selectedVenueId, venues, totalSpacesCount]);

  return (
    <div className="flex items-center gap-2.5">
      {showLabel && (
        <label
          htmlFor={id}
          className="text-[13px] font-semibold text-muted-foreground shrink-0"
        >
          {t("venueLabel")}
        </label>
      )}

      <div
        ref={venueDropdownRef}
        className="relative min-w-[290px] sm:min-w-[330px]"
      >
        <div
          className={`flex items-center gap-1.5 rounded-xl border bg-surface px-3 py-2 transition-all ${
            isManagedLocked
              ? "opacity-80 cursor-not-allowed border-border"
              : isVenueDropdownOpen
              ? "border-accent ring-2 ring-accent/30"
              : "border-border-medium hover:border-border-strong"
          }`}
        >
          <span className="shrink-0 text-xs">📍</span>
          <input
            id={id}
            type="text"
            disabled={isManagedLocked}
            value={
              isVenueDropdownOpen ? venueFilterQuery : selectedVenueDisplayLabel
            }
            onFocus={() => {
              if (isManagedLocked) return;
              setIsVenueDropdownOpen(true);
              setVenueFilterQuery("");
            }}
            onChange={(e) => {
              if (isManagedLocked) return;
              setIsVenueDropdownOpen(true);
              setVenueFilterQuery(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setIsVenueDropdownOpen(false);
                setVenueFilterQuery("");
              } else if (e.key === "Enter" && isVenueDropdownOpen) {
                e.preventDefault();
                if (filteredVenueOptions.length > 0) {
                  handleSelectVenue(filteredVenueOptions[0].id);
                  setIsVenueDropdownOpen(false);
                  setVenueFilterQuery("");
                }
              }
            }}
            placeholder="Escribir o elegir sede..."
            aria-label={t("venueLabel")}
            className="w-full min-w-0 border-none bg-transparent text-[13px] font-bold text-foreground outline-none placeholder:font-normal placeholder:text-muted-foreground disabled:cursor-not-allowed"
          />
          {!isManagedLocked &&
            selectedVenueId &&
            selectedVenueId !== "ALL" && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectVenue("ALL");
                  setVenueFilterQuery("");
                  setIsVenueDropdownOpen(false);
                }}
                title="Ver todas las sedes"
                className="cursor-pointer rounded-md border-none bg-muted px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            )}
          {!isManagedLocked && (
            <button
              type="button"
              onClick={() => {
                setIsVenueDropdownOpen((prev) => !prev);
                setVenueFilterQuery("");
              }}
              className="cursor-pointer border-none bg-transparent px-1 text-xs text-muted-foreground"
              aria-label="Abrir lista de sedes"
            >
              ▾
            </button>
          )}
        </div>

        {isVenueDropdownOpen && !isManagedLocked && (
          <div className="absolute right-0 left-0 z-30 mt-1 max-h-64 overflow-y-auto rounded-xl border border-border-medium bg-surface p-1.5 shadow-xl">
            <button
              type="button"
              onClick={() => {
                handleSelectVenue("ALL");
                setIsVenueDropdownOpen(false);
                setVenueFilterQuery("");
              }}
              className={`flex w-full cursor-pointer items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs font-bold transition-colors ${
                selectedVenueId === "ALL" || !selectedVenueId
                  ? "bg-accent/20 text-foreground"
                  : "text-foreground hover:bg-muted"
              }`}
            >
              <span>🌐 Todas las sedes</span>
              <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                {totalSpacesCount === 1
                  ? "1 cancha"
                  : `${totalSpacesCount} canchas`}
              </span>
            </button>

            {filteredVenueOptions.length === 0 ? (
              <div className="px-3 py-3 text-center text-xs text-muted-foreground">
                No se encontró ninguna sede con «{venueFilterQuery}»
              </div>
            ) : (
              filteredVenueOptions.map((v) => {
                const isSelectedVenue = selectedVenueId === v.id;
                const count = v.spacesCount ?? 0;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => {
                      handleSelectVenue(v.id);
                      setIsVenueDropdownOpen(false);
                      setVenueFilterQuery("");
                    }}
                    className={`mt-0.5 flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold transition-colors ${
                      isSelectedVenue
                        ? "bg-accent/20 font-bold text-foreground"
                        : "text-foreground hover:bg-muted"
                    }`}
                  >
                    <span className="truncate">📍 {v.name}</span>
                    <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                      {count === 1 ? "1 cancha" : `${count} canchas`}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}

