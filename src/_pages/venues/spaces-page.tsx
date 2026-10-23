"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { DEFAULT_BCV_USD_RATE } from "@/shared/lib";
import type {
  SpaceItem,
  SportCategoryItem,
  VenueItem,
} from "@/features/venues/model/types";
import type {
  AmenityItem,
  SurfaceItem,
} from "@/features/catalogs/model/types";
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
  surfaces?: SurfaceItem[];
  amenities?: AmenityItem[];
  bcvRate?: number;
  referenceCurrencyCode?: string;
}

export function SpacesPage({
  initialVenues,
  initialVenueId,
  initialSpaces,
  categories,
  surfaces = [],
  amenities = [],
  bcvRate = DEFAULT_BCV_USD_RATE,
  referenceCurrencyCode = "USD",
}: SpacesPageProps) {
  const t = useTranslations("venues.top");
  const router = useRouter();

  const [venues] = useState<VenueItem[]>(initialVenues);
  const [selectedVenueId, setSelectedVenueId] = useState<string>(
    initialVenueId || initialVenues[0]?.id || "ALL"
  );
  const [spaces, setSpaces] = useState<SpaceItem[]>(initialSpaces);
  const [toast, setToast] = useState<{ message: string; isError: boolean } | null>(null);

  // Modals state
  const [isCourtModalOpen, setIsCourtModalOpen] = useState(false);
  const [editingCourt, setEditingCourt] = useState<SpaceItem | null>(null);

  // Safety Disable Modal state
  const [isSafetyModalOpen, setIsSafetyModalOpen] = useState(false);
  const [safetyCourt, setSafetyCourt] = useState<SpaceItem | null>(null);
  const [activeBookingsCount, setActiveBookingsCount] = useState<number>(0);

  const currentVenue =
    selectedVenueId === "ALL"
      ? null
      : venues.find((v) => v.id === selectedVenueId) || venues[0];

  function showToast(message: string, isError = false) {
    setToast({ message, isError });
    setTimeout(() => setToast(null), 4000);
  }

  async function handleSelectVenue(venueId: string) {
    setSelectedVenueId(venueId);
    const res = await getSpacesAction(venueId);
    if (res.ok && res.data) {
      setSpaces(res.data);
    } else if (!res.ok) {
      showToast(t("errorLoadSpaces", { code: res.error.code }), true);
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

  function handleCourtSaved(saved: SpaceItem, isNew?: boolean) {
    setSpaces((prev) => {
      const idx = prev.findIndex((s) => s.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = {
          ...prev[idx],
          ...saved,
          venueName: saved.venueName || prev[idx].venueName,
          activeBookingsCount:
            saved.activeBookingsCount || prev[idx].activeBookingsCount || 0,
          pricePerHour: Number(saved.pricePerHour ?? prev[idx].pricePerHour ?? 0),
          imageUrl: saved.imageUrl || prev[idx].imageUrl || null,
        };
        return next;
      }
      return [
        ...prev,
        {
          ...saved,
          pricePerHour: Number(saved.pricePerHour ?? 0),
        },
      ];
    });

    if (isNew || !editingCourt) {
      const targetVenue = saved.venueId || selectedVenueId;
      router.push(
        `/venues/schedules?venueId=${encodeURIComponent(targetVenue)}&spaceId=${encodeURIComponent(saved.id)}`
      );
      return;
    }

    showToast(t("toastCourtSaved"), false);
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
        showToast(t("toastCourtStatusUpdated"), false);
      } else if (!res.ok) {
        showToast(t("errorUpdateSpaceStatus", { code: res.error.code }), true);
      }
    } else {
      // Enabling space
      const res = await updateSpaceStatusAction(court.id, { status: "ENABLED" });
      if (res.ok) {
        setSpaces((prev) =>
          prev.map((s) => (s.id === court.id ? { ...s, status: "ENABLED" } : s))
        );
        showToast(t("toastCourtStatusUpdated"), false);
      } else {
        showToast(t("errorUpdateSpaceStatus", { code: res.error.code }), true);
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
      showToast(t("toastCourtStatusUpdated"), false);
    } else {
      showToast(t("errorUpdateSpaceStatus", { code: res.error.code }), true);
    }
  }

  return (
    <div className="spaces-page pb-10">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 px-5 pt-5 pb-2.5">
        <div>
          <div className="text-[11px] font-bold tracking-wider text-link uppercase">
            {t("spacesSubtitle", {
              venueName: currentVenue?.name || t("defaultVenueName"),
            })}
          </div>
          <h1 className="mt-1 text-[22px] font-extrabold text-foreground">
            {t("spacesTitle")}
          </h1>
        </div>
      </div>

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

      {/* Court Cards Grid */}
      <CourtCardsGrid
        venues={venues}
        selectedVenueId={selectedVenueId}
        onSelectVenueId={handleSelectVenue}
        spaces={spaces}
        amenitiesCatalog={amenities}
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
        venueId={
          editingCourt?.venueId ||
          (selectedVenueId !== "ALL" ? selectedVenueId : venues[0]?.id || "")
        }
        space={editingCourt}
        categories={categories}
        surfaces={surfaces}
        amenitiesCatalog={amenities}
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
