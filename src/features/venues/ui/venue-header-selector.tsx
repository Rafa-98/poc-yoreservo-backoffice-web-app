"use client";

import { useEffect, useRef, useState } from "react";
import {
  Building2,
  Check,
  ChevronDown,
  Globe,
  Lock,
  MapPin,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useActiveVenue } from "../context/venue-context";

export function VenueHeaderSelector() {
  const t = useTranslations("shell");
  const {
    venues,
    activeVenueId,
    activeVenue,
    setActiveVenueId,
    isLoading,
    isManagedLocked,
  } = useActiveVenue();

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const filteredVenues = venues.filter((venue) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      venue.name.toLowerCase().includes(q) ||
      venue.address.toLowerCase().includes(q) ||
      venue.rif.toLowerCase().includes(q)
    );
  });

  const isAllSelected = activeVenueId === "ALL";

  return (
    <div className="relative" ref={dropdownRef}>
      {/* TRIGGER BUTTON */}
      <button
        type="button"
        onClick={() => {
          if (!isManagedLocked) setIsOpen(!isOpen);
        }}
        disabled={isManagedLocked || isLoading}
        className={`group flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-1.5 text-xs sm:text-sm font-semibold text-foreground shadow-xs transition-all duration-200 ${
          isManagedLocked
            ? "cursor-default opacity-90"
            : "hover:border-accent/50 hover:bg-muted/60 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
        }`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={t("venueSelectorTitle")}
        id="header-venue-selector-trigger"
      >
        <div className="flex size-5 items-center justify-center rounded-lg bg-accent/20 text-accent">
          {isManagedLocked ? (
            <Lock className="size-3 text-accent" />
          ) : isAllSelected ? (
            <Globe className="size-3 text-accent" />
          ) : (
            <MapPin className="size-3 text-accent" />
          )}
        </div>

        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1.5">
            <span className="max-w-[130px] sm:max-w-[210px] md:max-w-[260px] truncate font-bold text-foreground">
              {isLoading
                ? t("allVenues")
                : isAllSelected
                ? t("allVenuesConsolidated")
                : activeVenue?.name || t("allVenues")}
            </span>

            {isAllSelected && venues.length > 0 && (
              <span className="hidden sm:inline-flex items-center rounded-full bg-accent/20 px-1.5 py-0.2 text-[10px] font-bold text-accent-foreground">
                {venues.length}
              </span>
            )}

            {isManagedLocked && (
              <span className="hidden sm:inline-flex items-center rounded-full bg-blue-500/15 border border-blue-500/30 px-1.5 py-0.2 text-[10px] font-bold text-blue-700 dark:text-blue-300">
                {t("assignedVenueLocked")}
              </span>
            )}
          </div>
        </div>

        {!isManagedLocked && (
          <ChevronDown
            className={`size-3.5 text-muted-foreground transition-transform duration-200 ${
              isOpen ? "rotate-180 text-foreground" : "group-hover:text-foreground"
            }`}
          />
        )}
      </button>

      {/* DROPDOWN MENU */}
      {isOpen && !isManagedLocked && (
        <div
          role="listbox"
          aria-label={t("venueSelectorTitle")}
          className="absolute left-0 top-full z-50 mt-2 w-80 sm:w-96 rounded-2xl border border-border bg-surface p-2 shadow-modal backdrop-blur-md animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Header & Quick Search */}
          <div className="p-2 pb-2">
            <div className="flex items-center justify-between pb-2 border-b border-border/70">
              <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                <Sparkles className="size-3.5 text-accent" />
                <span>{t("venueSelectorTitle")}</span>
              </div>
              <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[11px] font-bold text-accent-foreground">
                {venues.length}
              </span>
            </div>

            {/* Search Input */}
            {venues.length > 3 && (
              <div className="relative mt-2">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("searchVenue")}
                  className="w-full rounded-xl border border-border bg-background py-1.5 pl-8 pr-7 text-xs text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-3" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Options List */}
          <div className="max-h-72 overflow-y-auto space-y-1 p-1">
            {/* "Todas las Sedes" Option */}
            {!searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setActiveVenueId("ALL");
                  setIsOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition-colors ${
                  isAllSelected
                    ? "bg-accent/15 font-bold text-accent-foreground border border-accent/30"
                    : "text-foreground hover:bg-muted/70"
                }`}
                role="option"
                aria-selected={isAllSelected}
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-surface border border-border">
                    <Globe className="size-3.5 text-accent" />
                  </div>
                  <div>
                    <div className="font-bold text-foreground">
                      {t("allVenuesConsolidated")}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {t("allVenues")}
                    </div>
                  </div>
                </div>

                {isAllSelected && (
                  <div className="flex size-5 items-center justify-center rounded-full bg-accent text-accent-foreground">
                    <Check className="size-3 stroke-[3]" />
                  </div>
                )}
              </button>
            )}

            {/* Individual Venues */}
            {filteredVenues.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                {t("noVenuesFound")}
              </div>
            ) : (
              filteredVenues.map((venue) => {
                const isSelected = activeVenueId === venue.id;
                const spacesCount = venue.spacesCount ?? 0;

                return (
                  <button
                    key={venue.id}
                    type="button"
                    onClick={() => {
                      setActiveVenueId(venue.id);
                      setIsOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition-colors ${
                      isSelected
                        ? "bg-accent/15 font-bold text-accent-foreground border border-accent/30"
                        : "text-foreground hover:bg-muted/70"
                    }`}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-surface border border-border">
                        <Building2 className="size-3.5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate font-semibold text-foreground">
                          {venue.name}
                        </div>
                        <div className="truncate text-[10px] text-muted-foreground">
                          {venue.address}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {spacesCount > 0 && (
                        <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                          {t("courtsCount", { count: spacesCount })}
                        </span>
                      )}

                      {isSelected && (
                        <div className="flex size-5 items-center justify-center rounded-full bg-accent text-accent-foreground">
                          <Check className="size-3 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
