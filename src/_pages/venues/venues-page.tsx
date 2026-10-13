"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import type { LocationNode, OrganizationData, VenueItem } from "@/features/venues/model/types";
import { VenuesSubnav } from "@/features/venues/ui/venues-subnav";
import { OrgMasterCard } from "@/features/venues/ui/org-master-card";
import { OrgEditModal } from "@/features/venues/ui/org-edit-modal";
import { VenueCardGrid } from "@/features/venues/ui/venue-card-grid";
import { VenueModal } from "@/features/venues/ui/venue-modal";

interface VenuesPageProps {
  initialOrg: OrganizationData;
  initialVenues: VenueItem[];
  locationsTree: LocationNode[];
  bcvRate?: number;
}

export function VenuesPage({
  initialOrg,
  initialVenues,
  locationsTree,
  bcvRate = 41.0,
}: VenuesPageProps) {
  const t = useTranslations("venues.top");
  const [org, setOrg] = useState<OrganizationData>(initialOrg);
  const [venues, setVenues] = useState<VenueItem[]>(initialVenues);

  // Modals state
  const [isOrgModalOpen, setIsOrgModalOpen] = useState(false);
  const [isVenueModalOpen, setIsVenueModalOpen] = useState(false);
  const [editingVenue, setEditingVenue] = useState<VenueItem | null>(null);

  function handleOpenCreateVenue() {
    setEditingVenue(null);
    setIsVenueModalOpen(true);
  }

  function handleOpenEditVenue(venue: VenueItem) {
    setEditingVenue(venue);
    setIsVenueModalOpen(true);
  }

  function handleVenueSaved(saved: any) {
    setVenues((prev) => {
      const idx = prev.findIndex((v) => v.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], ...saved };
        return next;
      }
      return [...prev, saved];
    });
  }

  return (
    <div className="venues-page" style={{ paddingBottom: "40px" }}>
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
            {t("venuesSubtitle")}
          </div>
          <h1
            style={{
              fontSize: "22px",
              fontWeight: 800,
              color: "var(--text-main)",
              margin: "4px 0 0",
            }}
          >
            {t("venuesTitle")}
          </h1>
        </div>
      </div>

      {/* Subnav */}
      <VenuesSubnav
        venuesCount={venues.length}
        spacesCount={org.spacesCount}
        onOpenOrgModal={() => setIsOrgModalOpen(true)}
      />

      {/* Organization Master Card */}
      <OrgMasterCard
        organization={org}
        bcvRate={bcvRate}
        onOpenEditModal={() => setIsOrgModalOpen(true)}
      />

      {/* Venues Grid */}
      <VenueCardGrid
        venues={venues}
        onOpenCreateVenue={handleOpenCreateVenue}
        onOpenEditVenue={handleOpenEditVenue}
      />

      {/* Organization Edit Modal */}
      <OrgEditModal
        isOpen={isOrgModalOpen}
        onClose={() => setIsOrgModalOpen(false)}
        organization={org}
        onSuccess={(updated) => setOrg(updated)}
      />

      {/* Venue Add / Edit Modal */}
      <VenueModal
        isOpen={isVenueModalOpen}
        onClose={() => setIsVenueModalOpen(false)}
        venue={editingVenue}
        locationsTree={locationsTree}
        onSuccess={handleVenueSaved}
      />
    </div>
  );
}
