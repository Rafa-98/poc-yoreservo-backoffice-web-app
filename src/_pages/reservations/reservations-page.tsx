"use client";

import React, { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/shared/ui/button";
import { ReservationsSubnav } from "@/features/reservations/ui/reservations-subnav";
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

interface ReservationsPageProps {
  initialReservations: ReservationItem[];
  initialKpis: ReservationKpis;
  venues: Array<{ id: string; name: string }>;
  spaces: Array<{ id: string; name: string; venueId: string; pricePerHour: number }>;
  bcvRate: number;
}

export function ReservationsPage({
  initialReservations,
  initialKpis,
  venues,
  spaces,
  bcvRate,
}: ReservationsPageProps) {
  const t = useTranslations("reservations");
  const { activeVenueId } = useActiveVenue();

  const [reservations, setReservations] = useState<ReservationItem[]>(initialReservations);
  const [kpis, setKpis] = useState<ReservationKpis>(initialKpis);

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

  // Distinct sports in the reservations set
  const sports = useMemo(() => {
    const set = new Set<string>();
    reservations.forEach((r) => {
      if (r.sport) set.add(r.sport);
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
        if (!matchesCode && !matchesName && !matchesPhone) return false;
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
        const today = new Date().toISOString().split("T")[0];
        const d = new Date();
        d.setDate(d.getDate() + 1);
        const tomorrow = d.toISOString().split("T")[0];

        if (filter.dateFilter === "today" && res.date !== today) return false;
        if (filter.dateFilter === "tomorrow" && res.date !== tomorrow) return false;
      }

      return true;
    });
  }, [reservations, filter]);

  async function refreshReservations() {
    const res = await getReservationsAction();
    if (res.ok && res.data) {
      setReservations(res.data.items);
      setKpis(res.data.kpis);
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
      "Monto_USD",
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
    link.setAttribute("download", `reservas_yoreservo_${new Date().toISOString().split("T")[0]}.csv`);
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
      </header>

      {/* SUBNAV TABS */}
      <ReservationsSubnav currentTab="ledger" />

      {/* MAIN CONTENT AREA */}
      <main className="p-6 space-y-6">
        {/* KPI SUMMARY STRIP */}
        <ReservationsKpiStrip kpis={kpis} bcvRate={bcvRate} />

        {/* ADVANCED FILTER TOOLBAR */}
        <ReservationsFilterBar
          filter={filter}
          onChangeFilter={(upd) => setFilter((prev) => ({ ...prev, ...upd }))}
          onResetFilter={() =>
            setFilter({
              dateFilter: "all",
              venueId: "all",
              sport: "all",
              paymentMethod: "all",
              status: "all",
              search: "",
            })
          }
          venues={venues}
          sports={sports}
          bcvRate={bcvRate}
        />

        {/* RESERVATIONS MASTER DATA TABLE */}
        <ReservationsTable
          reservations={displayedReservations}
          onSelectReservation={(res) => setSelectedForDrawer(res)}
          onCancelReservation={(res) => setSelectedForCancel(res)}
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
      />

      {/* MODAL: WALK-IN BOOKING */}
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
