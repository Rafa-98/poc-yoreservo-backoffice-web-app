"use client";

import React, { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import type { BackofficeRole } from "@/shared/config";
import { Button } from "@/shared/ui/button";
import { ReservationsKpiStrip } from "@/features/reservations/ui/reservations-kpi-strip";
import { ReservationsFilterBar } from "@/features/reservations/ui/reservations-filter-bar";
import { ReservationsTable } from "@/features/reservations/ui/reservations-table";
import { ReservationDetailDrawer } from "@/features/reservations/ui/reservation-detail-drawer";
import { WalkInModal } from "@/features/reservations/ui/walk-in-modal";
import { CancelBookingModal } from "@/features/reservations/ui/cancel-booking-modal";
import { getReservationsAction } from "@/features/reservations/actions/reservations-actions";
import type {
  ReservationFilter,
  ReservationItem,
  ReservationKpis,
} from "@/features/reservations/model/types";

import { useActiveVenue } from "@/features/venues/context/venue-context";
import { addDaysToIsoDate, todayInTimezone } from "@/shared/lib";

interface ReservationsPageProps {
  initialReservations: ReservationItem[];
  initialKpis: ReservationKpis;
  venues: Array<{ id: string; name: string; referenceCurrencyCode?: string }>;
  spaces: Array<{ id: string; name: string; venueId: string; pricePerHour: number }>;
  bcvRate: number;
  bcvEurRate?: number;
  referenceCurrencyCode?: string;
  userRole?: BackofficeRole;
}

export function ReservationsPage({
  initialReservations,
  initialKpis,
  venues,
  spaces,
  bcvRate,
  bcvEurRate,
  referenceCurrencyCode = "USD",
  userRole,
}: ReservationsPageProps) {
  const t = useTranslations("reservations");
  const { activeVenueId } = useActiveVenue();
  const isValidator = userRole === "ALLY_VALIDATOR";
  const effectiveEurRate = bcvEurRate ?? bcvRate;

  const [reservations, setReservations] = useState<ReservationItem[]>(initialReservations);

  const [filter, setFilter] = useState<ReservationFilter>({
    dateFilter: "all",
    venueId: activeVenueId && activeVenueId !== "ALL" ? activeVenueId : "all",
    sport: "all",
    paymentMethod: "all",
    status: "all",
    search: "",
  });

  // Sync with global header venue changes
  React.useEffect(() => {
    if (activeVenueId) {
      setFilter((prev) => ({
        ...prev,
        venueId: activeVenueId === "ALL" ? "all" : activeVenueId,
      }));
    }
  }, [activeVenueId]);

  // Modals and Drawer state
  const [selectedForDrawer, setSelectedForDrawer] = useState<ReservationItem | null>(null);
  const [selectedForCancel, setSelectedForCancel] = useState<ReservationItem | null>(null);
  const [isWalkInOpen, setIsWalkInOpen] = useState(false);

  // Distinct sports in the reservations set (excluding empty placeholder)
  const sports = useMemo(() => {
    const set = new Set<string>();
    reservations.forEach((r) => {
      if (r.sport && r.sport !== "—") set.add(r.sport);
    });
    return Array.from(set);
  }, [reservations]);

  // Client-side quick filter
  const displayedReservations = useMemo(() => {
    return reservations.filter((res) => {
      // 1. Search
      if (filter.search) {
        const q = filter.search.toLowerCase().trim();
        const matchesCode = res.code.toLowerCase().includes(q);
        const matchesName = res.clientName.toLowerCase().includes(q);
        const matchesPhone = res.phone.includes(q);
        const matchesDni = res.dni.toLowerCase().includes(q);
        if (!matchesCode && !matchesName && !matchesPhone && !matchesDni) return false;
      }

      // 2. Venue
      if (filter.venueId && filter.venueId !== "all") {
        if (res.venueId !== filter.venueId) return false;
      }

      // 3. Sport
      if (filter.sport && filter.sport !== "all") {
        if (res.sport !== filter.sport) return false;
      }

      // 4. Payment Method
      if (filter.paymentMethod && filter.paymentMethod !== "all") {
        if (res.paymentMethod !== filter.paymentMethod) return false;
      }

      // 5. Status
      if (filter.status && filter.status !== "all") {
        if (res.status !== filter.status) return false;
      }

      // 6. Date Filter
      if (filter.dateFilter && filter.dateFilter !== "all") {
        const today = todayInTimezone("America/Caracas");
        const tomorrow = addDaysToIsoDate(today, 1);

        if (filter.dateFilter === "today" && res.date !== today) return false;
        if (filter.dateFilter === "tomorrow" && res.date !== tomorrow) return false;
        if (filter.dateFilter === "week") {
          const [ty, tm, td] = today.split("-").map(Number);
          const todayUtc = new Date(Date.UTC(ty, tm - 1, td));
          const day = todayUtc.getUTCDay();
          const diffToMon = (day + 6) % 7;
          const weekStart = addDaysToIsoDate(today, -diffToMon);
          const weekEnd = addDaysToIsoDate(weekStart, 6);
          if (res.date < weekStart || res.date > weekEnd) return false;
        }
        if (filter.dateFilter === "month") {
          const currentYearMonth = today.slice(0, 7);
          if (!res.date.startsWith(currentYearMonth)) return false;
        }
      }

      return true;
    });
  }, [reservations, filter]);

  // Determine active currency code (USD, EUR, or MIXED) based on selected venue / organization
  const activeCurrencyCode = useMemo(() => {
    if (filter.venueId && filter.venueId !== "all") {
      const selectedVenue = venues.find((v) => v.id === filter.venueId);
      if (selectedVenue?.referenceCurrencyCode) {
        return selectedVenue.referenceCurrencyCode;
      }
    }

    const venueCurrencies = new Set(
      venues
        .map((v) => v.referenceCurrencyCode)
        .filter((c): c is string => Boolean(c)),
    );
    if (venueCurrencies.size === 1) {
      return Array.from(venueCurrencies)[0];
    }

    const resCurrencies = new Set(
      displayedReservations
        .map((r) => r.currencyCode)
        .filter((c): c is string => Boolean(c)),
    );
    if (resCurrencies.size === 1) {
      return Array.from(resCurrencies)[0];
    }
    if (resCurrencies.size > 1 || venueCurrencies.size > 1) {
      return "MIXED";
    }

    return referenceCurrencyCode || "USD";
  }, [filter.venueId, venues, displayedReservations, referenceCurrencyCode]);

  // Compute live KPIs directly from real filtered reservations
  const liveKpis = useMemo<ReservationKpis>(() => {
    let confirmedCount = 0;
    let walkinCount = 0;
    let volumeRef = 0;
    let volumeVes = 0;

    for (const r of displayedReservations) {
      const isPaidOrConfirmed =
        r.status === "CONFIRMED" || r.status === "COMPLETED";
      if (isPaidOrConfirmed) {
        confirmedCount++;
        volumeRef += r.priceUsd;
        volumeVes += r.priceBs;
      }
      if (r.origin === "walk-in") {
        walkinCount++;
      }
    }

    return {
      totalBookings: displayedReservations.length,
      confirmedCount,
      walkinCount,
      volumeUsd: volumeRef,
      volumeVes,
      confirmedGrowthPct: initialKpis.confirmedGrowthPct,
      referenceCurrencyCode:
        activeCurrencyCode === "EUR" ? "EUR" : "USD",
    };
  }, [displayedReservations, initialKpis.confirmedGrowthPct, activeCurrencyCode]);

  async function refreshReservations() {
    const res = await getReservationsAction();
    if (res.ok && res.data) {
      setReservations(res.data.items);
    }
  }

  function handleExportCsv() {
    const headers = [
      "Código",
      "Origen",
      "Cliente",
      "Cédula",
      "Teléfono",
      "Sede",
      "Cancha",
      "Deporte",
      "Fecha",
      "Horario",
      "Duración",
      "Moneda",
      "Monto_Divisa",
      "Tasa_BCV",
      "Monto_Bs",
      "Metodo_Pago",
      "Estatus",
      "Check_In",
    ];

    const rows = displayedReservations.map((r) => [
      `#${r.code}`,
      r.origin,
      `"${r.clientName}"`,
      r.dni,
      `"${r.phone}"`,
      `"${r.venue}"`,
      `"${r.court}"`,
      `"${r.sport}"`,
      r.date,
      `"${r.timeSlot}"`,
      r.duration,
      r.currencyCode || "USD",
      r.priceUsd.toFixed(2),
      r.rateBcv.toFixed(2),
      r.priceBs.toFixed(2),
      r.paymentMethod,
      r.status,
      r.checkedIn ? "SI" : "NO",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `reservas_yoreservo_${todayInTimezone("America/Caracas")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="space-y-0">
      {/* TOP HEADER */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border bg-surface px-6 py-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-bold text-foreground">
              {t("title")}
            </h1>
            <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-bold text-emerald-400">
              {t("badge")}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>

        {!isValidator && (
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setIsWalkInOpen(true)}
              id="btn-walkin"
            >
              <span>+</span> {t("btnWalkIn")}
            </Button>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleExportCsv}
              id="btn-export-csv"
            >
              <span>📊</span> {t("btnExportCsv")}
            </Button>
          </div>
        )}
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="p-6 space-y-6">
        {/* KPI SUMMARY STRIP */}
        <ReservationsKpiStrip
          kpis={liveKpis}
          bcvRate={bcvRate}
          bcvEurRate={effectiveEurRate}
          currencyCode={activeCurrencyCode === "EUR" ? "EUR" : "USD"}
          userRole={userRole}
        />

        {/* ADVANCED FILTER TOOLBAR */}
        <ReservationsFilterBar
          filter={filter}
          onChangeFilter={(upd) => setFilter((prev) => ({ ...prev, ...upd }))}
          onResetFilter={() =>
            setFilter({
              dateFilter: "all",
              venueId: activeVenueId && activeVenueId !== "ALL" ? activeVenueId : "all",
              sport: "all",
              paymentMethod: "all",
              status: "all",
              search: "",
            })
          }
          venues={venues}
          sports={sports}
          bcvRate={bcvRate}
          bcvEurRate={effectiveEurRate}
          currencyCode={activeCurrencyCode}
        />

        {/* RESERVATIONS MASTER DATA TABLE */}
        <ReservationsTable
          reservations={displayedReservations}
          onSelectReservation={(res) => setSelectedForDrawer(res)}
          onCancelReservation={(res) => setSelectedForCancel(res)}
          currencyCode={activeCurrencyCode}
          userRole={userRole}
        />
      </main>

      {/* FLYOUT DRAWER: RESERVATION DETAIL */}
      <ReservationDetailDrawer
        isOpen={!!selectedForDrawer}
        reservation={selectedForDrawer}
        onClose={() => setSelectedForDrawer(null)}
        onRefresh={() => {
          refreshReservations();
          setSelectedForDrawer(null);
        }}
        onOpenCancel={(res) => {
          setSelectedForDrawer(null);
          setSelectedForCancel(res);
        }}
        userRole={userRole}
      />

      {/* MODAL: WALK-IN BOOKING */}
      {!isValidator && (
        <WalkInModal
          isOpen={isWalkInOpen}
          onClose={() => setIsWalkInOpen(false)}
          venues={venues}
          spaces={spaces}
          onSuccess={() => {
            refreshReservations();
            setIsWalkInOpen(false);
          }}
        />
      )}

      {/* MODAL: AUDIT CANCELLATION */}
      <CancelBookingModal
        isOpen={!!selectedForCancel}
        reservation={selectedForCancel}
        onClose={() => setSelectedForCancel(null)}
        onSuccess={() => {
          refreshReservations();
          setSelectedForCancel(null);
        }}
      />
    </div>
  );
}
