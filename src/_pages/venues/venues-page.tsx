"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { DEFAULT_BCV_EUR_RATE, DEFAULT_BCV_USD_RATE } from "@/shared/lib";
import type { LocationNode, OrganizationData, VenueItem } from "@/features/venues/model/types";
import { getVenuesListAction } from "@/features/venues/actions/venues-actions";
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
  bcvEurRate?: number;
}

export function VenuesPage({
  initialOrg,
  initialVenues,
  locationsTree,
  bcvRate = DEFAULT_BCV_USD_RATE,
  bcvEurRate = DEFAULT_BCV_EUR_RATE,
}: VenuesPageProps) {
  const t = useTranslations("venues.top");
  const [org, setOrg] = useState<OrganizationData>(initialOrg);
  const [venues, setVenues] = useState<VenueItem[]>(initialVenues);

  // Toast feedback state
  const [toast, setToast] = useState<{ message: string; isError: boolean } | null>(null);

  // Modals state
  const [isOrgModalOpen, setIsOrgModalOpen] = useState(false);
  const [isVenueModalOpen, setIsVenueModalOpen] = useState(false);
  const [editingVenue, setEditingVenue] = useState<VenueItem | null>(null);

  function showToast(message: string, isError = false) {
    setToast({ message, isError });
    setTimeout(() => setToast(null), 4000);
  }

  function handleOpenCreateVenue() {
    setEditingVenue(null);
    setIsVenueModalOpen(true);
  }

  function handleOpenEditVenue(venue: VenueItem) {
    setEditingVenue(venue);
    setIsVenueModalOpen(true);
  }

  async function handleVenueSaved(saved: VenueItem) {
    setVenues((prev) => {
      const idx = prev.findIndex((v) => v.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], ...saved };
        return next;
      }
      return [...prev, saved];
    });
    showToast(t("toastVenueSaved"), false);

    const res = await getVenuesListAction();
    if (res.ok && res.data) {
      setVenues(res.data);
    } else if (!res.ok) {
      showToast(t("errorLoadVenues", { code: res.error.code }), true);
    }
  }

  function handleOrgSaved(updated: OrganizationData) {
    setOrg(updated);
    showToast(t("toastOrgSaved"), false);
  }

  return (
    <div className="venues-page pb-10">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 px-5 pt-5 pb-2.5">
        <div>
          <div className="text-[11px] font-bold tracking-wider text-link uppercase">
            {t("venuesSubtitle")}
          </div>
          <h1 className="mt-1 text-[22px] font-extrabold text-foreground">
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

      {/* Toast feedback banner */}
      {toast && (
        <div className="mt-4 px-5">
          <div
            className={`flex items-center justify-between rounded-xl border px-4 py-3 text-[13.5px] font-semibold ${
              toast.isError
                ? "border-status-cancelled-border bg-status-cancelled-bg text-status-cancelled-fg"
                : "border-status-available-border bg-status-available-bg text-status-available-fg"
            }`}
          >
            <span>{toast.message}</span>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="cursor-pointer border-none bg-transparent font-bold text-current"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Organization Master Card */}
      <OrgMasterCard
        organization={org}
        bcvRate={bcvRate}
        bcvEurRate={bcvEurRate}
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
        onSuccess={handleOrgSaved}
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
