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
    dayOfWeek: 1, // Lunes
    isOpen: true,
    shift1: { openTime: "07:00", closeTime: "12:00", isEnabled: true },
    shift2: { openTime: "16:00", closeTime: "23:00", isEnabled: true },
  },
  {
    dayOfWeek: 2, // Martes
    isOpen: true,
    shift1: { openTime: "07:00", closeTime: "12:00", isEnabled: true },
    shift2: { openTime: "16:00", closeTime: "23:00", isEnabled: true },
  },
  {
    dayOfWeek: 3, // Miércoles
    isOpen: true,
    shift1: { openTime: "07:00", closeTime: "12:00", isEnabled: true },
    shift2: { openTime: "16:00", closeTime: "23:00", isEnabled: true },
  },
  {
    dayOfWeek: 4, // Jueves
    isOpen: true,
    shift1: { openTime: "07:00", closeTime: "12:00", isEnabled: true },
    shift2: { openTime: "16:00", closeTime: "23:00", isEnabled: true },
  },
  {
    dayOfWeek: 5, // Viernes
    isOpen: true,
    shift1: { openTime: "07:00", closeTime: "12:00", isEnabled: true },
    shift2: { openTime: "16:00", closeTime: "23:00", isEnabled: true },
  },
  {
    dayOfWeek: 6, // Sábado
    isOpen: true,
    shift1: { openTime: "08:00", closeTime: "14:00", isEnabled: true },
    shift2: { openTime: "16:00", closeTime: "22:00", isEnabled: true },
  },
  {
    dayOfWeek: 0, // Domingo
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
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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

  async function handleSelectVenue(venueId: string) {
    setSelectedVenueId(venueId);
    const spacesRes = await getSpacesAction(venueId);
    if (spacesRes.ok && spacesRes.data && spacesRes.data.length > 0) {
      setSpaces(spacesRes.data);
      const firstSpaceId = spacesRes.data[0].id;
      setSelectedSpaceId(firstSpaceId);
      loadSpaceSchedules(firstSpaceId);
    }
  }

  async function handleSelectSpace(spaceId: string) {
    setSelectedSpaceId(spaceId);
    loadSpaceSchedules(spaceId);
  }

  async function loadSpaceSchedules(spaceId: string) {
    const res = await getSpaceSchedulesAction(spaceId);
    if (res.ok && res.data && res.data.days?.length > 0) {
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

    setToastMessage("¡Horario de Lunes copiado a Martes-Viernes!");
    setTimeout(() => setToastMessage(null), 3000);
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
      const countDesc = applyToAllVenueSpaces
        ? `todas las ${spaces.length} canchas de la sede`
        : "la cancha seleccionada";
      setToastMessage(`✓ Horarios semanales guardados exitosamente para ${countDesc}`);
      setTimeout(() => setToastMessage(null), 4000);
    } else {
      setToastMessage(`Error al guardar horarios: ${res.error.code}`);
      setTimeout(() => setToastMessage(null), 4000);
    }
  }

  function getDayName(dayOfWeek: number): string {
    const key = `days.${dayOfWeek}` as any;
    return schedT(key);
  }

  return (
    <div className="schedules-page" style={{ paddingBottom: "40px" }}>
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
            {topT("schedulesSubtitle", {
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
      {toastMessage && (
        <div style={{ padding: "0 20px", marginTop: "16px" }}>
          <div
            style={{
              background: toastMessage.startsWith("Error")
                ? "rgba(220, 38, 38, 0.15)"
                : "rgba(198, 242, 59, 0.15)",
              border: toastMessage.startsWith("Error")
                ? "1px solid rgba(220, 38, 38, 0.4)"
                : "1px solid rgba(198, 242, 59, 0.4)",
              color: toastMessage.startsWith("Error")
                ? "var(--status-cancelled-text, #ef4444)"
                : "var(--brand-lime-text, var(--text-link))",
              padding: "12px 18px",
              borderRadius: "12px",
              fontSize: "13.5px",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span>{toastMessage}</span>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Scope Bar */}
      <div style={{ marginTop: "16px" }}>
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
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          padding: "0 20px 32px",
        }}
      >
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
