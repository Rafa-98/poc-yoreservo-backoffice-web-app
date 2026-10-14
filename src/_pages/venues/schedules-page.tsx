"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import type {
  DaySchedule,
  SpaceItem,
  VenueItem,
  WeeklyScheduleData,
  WeeklySchedulesInput,
} from "@/features/venues/model/types";
import { VenuesSubnav } from "@/features/venues/ui/venues-subnav";
import { ScheduleScopeBar } from "@/features/venues/ui/schedule-scope-bar";
import { DayScheduleCard } from "@/features/venues/ui/day-schedule-card";
import {
  getSpaceSchedulesAction,
  getSpacesAction,
  updateSpaceSchedulesAction,
} from "@/features/venues/actions/venues-actions";

interface SchedulesPageProps {
  initialVenues: VenueItem[];
  initialVenueId: string;
  initialSpaces: SpaceItem[];
  initialSpaceId: string;
  initialSchedules?: WeeklyScheduleData | null;
}

const DEFAULT_DAYS: DaySchedule[] = [
  {
    dayOfWeek: 1, // Monday
    isOpen: true,
    shift1: { openTime: "07:00", closeTime: "12:00", isEnabled: true },
    shift2: { openTime: "16:00", closeTime: "23:00", isEnabled: true },
  },
  {
    dayOfWeek: 2, // Tuesday
    isOpen: true,
    shift1: { openTime: "07:00", closeTime: "12:00", isEnabled: true },
    shift2: { openTime: "16:00", closeTime: "23:00", isEnabled: true },
  },
  {
    dayOfWeek: 3, // Wednesday
    isOpen: true,
    shift1: { openTime: "07:00", closeTime: "12:00", isEnabled: true },
    shift2: { openTime: "16:00", closeTime: "23:00", isEnabled: true },
  },
  {
    dayOfWeek: 4, // Thursday
    isOpen: true,
    shift1: { openTime: "07:00", closeTime: "12:00", isEnabled: true },
    shift2: { openTime: "16:00", closeTime: "23:00", isEnabled: true },
  },
  {
    dayOfWeek: 5, // Friday
    isOpen: true,
    shift1: { openTime: "07:00", closeTime: "12:00", isEnabled: true },
    shift2: { openTime: "16:00", closeTime: "23:00", isEnabled: true },
  },
  {
    dayOfWeek: 6, // Saturday
    isOpen: true,
    shift1: { openTime: "08:00", closeTime: "14:00", isEnabled: true },
    shift2: { openTime: "16:00", closeTime: "22:00", isEnabled: true },
  },
  {
    dayOfWeek: 0, // Sunday
    isOpen: true,
    shift1: { openTime: "08:00", closeTime: "18:00", isEnabled: true },
    shift2: { openTime: "18:00", closeTime: "22:00", isEnabled: false },
  },
];

export function SchedulesPage({
  initialVenues,
  initialVenueId,
  initialSpaces,
  initialSpaceId,
  initialSchedules,
}: SchedulesPageProps) {
  const topT = useTranslations("venues.top");
  const schedT = useTranslations("venues.schedules");

  const [venues] = useState<VenueItem[]>(initialVenues);
  const [selectedVenueId, setSelectedVenueId] = useState<string>(
    initialVenueId || initialVenues[0]?.id || ""
  );

  const [spaces, setSpaces] = useState<SpaceItem[]>(initialSpaces);
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>(
    initialSpaceId || initialSpaces[0]?.id || ""
  );

  const [applyToAllVenueSpaces, setApplyToAllVenueSpaces] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [toast, setToast] = useState<{ message: string; isError: boolean } | null>(null);

  // Initialize 7 days
  const [days, setDays] = useState<DaySchedule[]>(() => {
    if (initialSchedules && initialSchedules.days?.length > 0) {
      // Re-order starting from Monday (1) to Sunday (0)
      const mapped = [...initialSchedules.days];
      return mapped.sort((a, b) => {
        const orderA = a.dayOfWeek === 0 ? 7 : a.dayOfWeek;
        const orderB = b.dayOfWeek === 0 ? 7 : b.dayOfWeek;
        return orderA - orderB;
      });
    }
    return DEFAULT_DAYS;
  });

  const currentVenue = venues.find((v) => v.id === selectedVenueId) || venues[0];

  function showToast(message: string, isError = false) {
    setToast({ message, isError });
    setTimeout(() => setToast(null), 4000);
  }

  async function handleSelectVenue(venueId: string) {
    setSelectedVenueId(venueId);
    const spacesRes = await getSpacesAction(venueId);
    if (!spacesRes.ok) {
      showToast(topT("errorLoadSpaces", { code: spacesRes.error.code }), true);
      return;
    }
    if (spacesRes.data && spacesRes.data.length > 0) {
      setSpaces(spacesRes.data);
      const firstSpaceId = spacesRes.data[0].id;
      setSelectedSpaceId(firstSpaceId);
      await loadSpaceSchedules(firstSpaceId);
    } else {
      setSpaces([]);
      setSelectedSpaceId("");
    }
  }

  async function handleSelectSpace(spaceId: string) {
    setSelectedSpaceId(spaceId);
    await loadSpaceSchedules(spaceId);
  }

  async function loadSpaceSchedules(spaceId: string) {
    const res = await getSpaceSchedulesAction(spaceId);
    if (!res.ok) {
      showToast(schedT("toastLoadError", { code: res.error.code }), true);
      return;
    }
    if (res.data && res.data.days?.length > 0) {
      const sorted = [...res.data.days].sort((a, b) => {
        const orderA = a.dayOfWeek === 0 ? 7 : a.dayOfWeek;
        const orderB = b.dayOfWeek === 0 ? 7 : b.dayOfWeek;
        return orderA - orderB;
      });
      setDays(sorted);
    }
  }

  function handleUpdateDay(index: number, updated: DaySchedule) {
    setDays((prev) => {
      const next = [...prev];
      next[index] = updated;
      return next;
    });
  }

  function handleCopyMondayToWeek() {
    const monday = days.find((d) => d.dayOfWeek === 1);
    if (!monday) return;

    setDays((prev) =>
      prev.map((day): DaySchedule => {
        // Copy to Tuesday (2), Wednesday (3), Thursday (4), Friday (5)
        if ([2, 3, 4, 5].includes(day.dayOfWeek)) {
          return {
            dayOfWeek: day.dayOfWeek,
            isOpen: monday.isOpen,
            shift1: { ...monday.shift1 },
            shift2: monday.shift2 ? { ...monday.shift2 } : undefined,
          };
        }
        return day;
      })
    );

    showToast(schedT("toastCopiedMonday"), false);
  }

  async function handleSaveSchedules() {
    if (!selectedSpaceId) return;
    setIsSaving(true);

    const payload: WeeklySchedulesInput = {
      days,
      applyToAllVenueSpaces,
    };

    const res = await updateSpaceSchedulesAction(selectedSpaceId, payload);
    setIsSaving(false);

    if (res.ok) {
      showToast(
        applyToAllVenueSpaces
          ? schedT("toastSavedAll", { count: spaces.length })
          : schedT("toastSavedSingle"),
        false
      );
    } else {
      showToast(schedT("toastSaveError", { code: res.error.code }), true);
    }
  }

  function getDayName(dayOfWeek: number): string {
    const key = `days.${dayOfWeek}` as any;
    return schedT(key);
  }

  return (
    <div className="schedules-page pb-10">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 px-5 pt-5 pb-2.5">
        <div>
          <div className="text-[11px] font-bold tracking-wider text-link uppercase">
            {topT("schedulesSubtitle", {
              venueName: currentVenue?.name || topT("defaultVenueName"),
            })}
          </div>
          <h1 className="mt-1 text-[22px] font-extrabold text-foreground">
            {topT("schedulesTitle")}
          </h1>
        </div>
      </div>

      {/* Subnav */}
      <VenuesSubnav
        venuesCount={venues.length}
        spacesCount={spaces.length}
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

      {/* Scope Bar */}
      <div className="mt-4">
        <ScheduleScopeBar
          venues={venues}
          selectedVenueId={selectedVenueId}
          onSelectVenueId={handleSelectVenue}
          spaces={spaces}
          selectedSpaceId={selectedSpaceId}
          onSelectSpaceId={handleSelectSpace}
          applyToAllVenueSpaces={applyToAllVenueSpaces}
          onToggleApplyToAll={setApplyToAllVenueSpaces}
          onCopyMondayToWeek={handleCopyMondayToWeek}
          onSaveSchedules={handleSaveSchedules}
          isSaving={isSaving}
        />
      </div>

      {/* 7 Days Matrix */}
      <div className="flex flex-col gap-4 px-5 pb-8">
        {days.map((day, idx) => (
          <DayScheduleCard
            key={day.dayOfWeek}
            day={day}
            dayName={getDayName(day.dayOfWeek)}
            onChange={(updated) => handleUpdateDay(idx, updated)}
          />
        ))}
      </div>
    </div>
  );
}
