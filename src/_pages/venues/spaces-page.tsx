"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import type {
  SpaceItem,
  SportCategoryItem,
  VenueItem,
} from "@/features/venues/model/types";
import { VenuesSubnav } from "@/features/venues/ui/venues-subnav";
import { CourtCardsGrid } from "@/features/venues/ui/court-cards-grid";
import { CourtModal } from "@/features/venues/ui/court-modal";
import { SafetyDisableModal } from "@/features/venues/ui/safety-disable-modal";
import {
  getSpacesAction,
  updateSpaceStatusAction,
} from "@/features/venues/actions/venues-actions";

interface SpacesPageProps {
  initialVenues: VenueItem[];
  initialVenueId: string;
  initialSpaces: SpaceItem[];
  categories: SportCategoryItem[];
  bcvRate?: number;
  referenceCurrencyCode?: string;
}

export function SpacesPage({
  initialVenues,
  initialVenueId,
  initialSpaces,
  categories,
  bcvRate = 41.0,
  referenceCurrencyCode = "USD",
}: SpacesPageProps) {
  const t = useTranslations("venues.top");

  const [venues] = useState<VenueItem[]>(initialVenues);
  const [selectedVenueId, setSelectedVenueId] = useState<string>(
    initialVenueId || initialVenues[0]?.id || ""
  );
  const [spaces, setSpaces] = useState<SpaceItem[]>(initialSpaces);

  // Modals state
  const [isCourtModalOpen, setIsCourtModalOpen] = useState(false);
  const [editingCourt, setEditingCourt] = useState<SpaceItem | null>(null);

  // Safety Disable Modal state
  const [isSafetyModalOpen, setIsSafetyModalOpen] = useState(false);
  const [safetyCourt, setSafetyCourt] = useState<SpaceItem | null>(null);
  const [activeBookingsCount, setActiveBookingsCount] = useState<number>(0);

  const currentVenue = venues.find((v) => v.id === selectedVenueId) || venues[0];

  async function handleSelectVenue(venueId: string) {
    setSelectedVenueId(venueId);
    const res = await getSpacesAction(venueId);
    if (res.ok && res.data) {
      setSpaces(res.data);
    }
  }

  function handleOpenCreateCourt() {
    setEditingCourt(null);
    setIsCourtModalOpen(true);
  }

  function handleOpenEditCourt(court: SpaceItem) {
    setEditingCourt(court);
    setIsCourtModalOpen(true);
  }

  function handleCourtSaved(saved: SpaceItem) {
    setSpaces((prev) => {
      const idx = prev.findIndex((s) => s.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [...prev, saved];
    });
  }

  async function handleToggleCourtStatus(court: SpaceItem) {
    if (court.status === "ENABLED") {
      // Trying to disable -> check for active reservations conflict
      const res = await updateSpaceStatusAction(court.id, { status: "DISABLED" });
      if (res.ok && res.data) {
        if (res.data.conflict) {
          // Open safety conflict modal
          setSafetyCourt(court);
          setActiveBookingsCount(res.data.activeBookingsCount || 0);
          setIsSafetyModalOpen(true);
          return;
        }

        // Successfully disabled without conflict
        setSpaces((prev) =>
          prev.map((s) => (s.id === court.id ? { ...s, status: "DISABLED" } : s))
        );
      }
    } else {
      // Enabling space
      const res = await updateSpaceStatusAction(court.id, { status: "ENABLED" });
      if (res.ok) {
        setSpaces((prev) =>
          prev.map((s) => (s.id === court.id ? { ...s, status: "ENABLED" } : s))
        );
      }
    }
  }

  async function handleConfirmSafetyResolution(action: "reassign" | "defer" | "cancel") {
    if (!safetyCourt) return;
    const res = await updateSpaceStatusAction(safetyCourt.id, {
      status: "DISABLED",
      safetyAction: action,
    });
    if (res.ok) {
      setSpaces((prev) =>
        prev.map((s) => (s.id === safetyCourt.id ? { ...s, status: "DISABLED" } : s))
      );
    }
  }

  return (
    <div className="spaces-page" style={{ paddingBottom: "40px" }}>
      {/* Top Header */}
      <div
        style={{
          padding: "20px 20px 10px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "11px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--text-link)",
            }}
          >
            {t("spacesSubtitle", {
              venueName: currentVenue?.name || "Sede Activa",
            })}
          </div>
          <h1
            style={{
              fontSize: "22px",
              fontWeight: 800,
              color: "var(--text-main)",
              margin: "4px 0 0",
            }}
          >
            {t("spacesTitle")}
          </h1>
        </div>
      </div>

      {/* Subnav */}
      <VenuesSubnav
        venuesCount={venues.length}
        spacesCount={spaces.length}
      />

      {/* Court Cards Grid */}
      <CourtCardsGrid
        venues={venues}
        selectedVenueId={selectedVenueId}
        onSelectVenueId={handleSelectVenue}
        spaces={spaces}
        bcvRate={bcvRate}
        referenceCurrencyCode={referenceCurrencyCode}
        onOpenCreateCourt={handleOpenCreateCourt}
        onOpenEditCourt={handleOpenEditCourt}
        onToggleCourtStatus={handleToggleCourtStatus}
      />

      {/* Create / Edit Court Modal */}
      <CourtModal
        isOpen={isCourtModalOpen}
        onClose={() => setIsCourtModalOpen(false)}
        venueId={selectedVenueId}
        space={editingCourt}
        categories={categories}
        onSuccess={handleCourtSaved}
      />

      {/* Safety Deactivation Modal */}
      <SafetyDisableModal
        isOpen={isSafetyModalOpen}
        onClose={() => setIsSafetyModalOpen(false)}
        space={safetyCourt}
        activeBookingsCount={activeBookingsCount}
        onConfirm={handleConfirmSafetyResolution}
      />
    </div>
  );
}
