"use client";

import { useEffect, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Calendar, QrCode, RefreshCw } from "lucide-react";
import { AgendaControlsBar } from "@/features/agenda/ui/agenda-controls-bar";
import { AgendaKpiStrip } from "@/features/agenda/ui/agenda-kpi-strip";
import { AgendaMatrix } from "@/features/agenda/ui/agenda-matrix";
import { WalkInDrawer } from "@/features/agenda/ui/walk-in-drawer";
import { ExpressCheckInModal } from "@/features/agenda/ui/express-check-in-modal";
import { ReservationDetailModal } from "@/features/agenda/ui/reservation-detail-modal";
import { SpaceBlockModal } from "@/features/agenda/ui/space-block-modal";
import {
  getAgendaAction,
  getVenuesListAction,
} from "@/features/agenda/actions/agenda-actions";
import type {
  AgendaData,
  CourtBlock,
  CourtReservation,
  CourtSpace,
  VenueRef,
} from "@/features/agenda/model/types";

import { useActiveVenue } from "@/features/venues/context/venue-context";

export interface AgendaPageProps {
  initialAgenda: AgendaData | null;
  initialVenues: VenueRef[];
}

export function AgendaPage({ initialAgenda, initialVenues }: AgendaPageProps) {
  const t = useTranslations("agenda");
  const searchParams = useSearchParams();
  const { activeVenueId: globalVenueId, setActiveVenueId: setGlobalVenueId } = useActiveVenue();

  // Active state
  const todayStr = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(
    initialAgenda?.date || todayStr,
  );
  const [selectedSport, setSelectedSport] = useState("all");
  const [activeVenueId, setActiveVenueId] = useState<string>(
    globalVenueId !== "ALL" && globalVenueId
      ? globalVenueId
      : initialAgenda?.venue?.id || initialVenues[0]?.id || ""
  );
  const [agenda, setAgenda] = useState<AgendaData | null>(initialAgenda);
  const [isPending, startTransition] = useTransition();

  // Sync with global header venue changes
  useEffect(() => {
    if (globalVenueId && globalVenueId !== "ALL" && globalVenueId !== activeVenueId) {
      setActiveVenueId(globalVenueId);
      startTransition(async () => {
        const res = await getAgendaAction(globalVenueId, selectedDate);
        if (res.ok) {
          setAgenda(res.data);
        }
      });
    }
  }, [globalVenueId, selectedDate]);

  // Modals and Drawers state
  const [isWalkInOpen, setIsWalkInOpen] = useState(false);
  const [selectedWalkInCourt, setSelectedWalkInCourt] = useState<CourtSpace | null>(null);
  const [selectedWalkInHour, setSelectedWalkInHour] = useState("09:00");

  const [isCheckInOpen, setIsCheckInOpen] = useState(
    searchParams.get("qr") === "open",
  );

  const [selectedDetailReservation, setSelectedDetailReservation] =
    useState<CourtReservation | null>(null);
  const [selectedDetailCourt, setSelectedDetailCourt] =
    useState<CourtSpace | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const [selectedBlock, setSelectedBlock] = useState<CourtBlock | null>(null);
  const [selectedBlockCourt, setSelectedBlockCourt] = useState<CourtSpace | null>(null);
  const [selectedBlockHour, setSelectedBlockHour] = useState("09:00");
  const [isBlockOpen, setIsBlockOpen] = useState(false);

  // Auto-open walk-in drawer if URL query `?drawer=open`
  useEffect(() => {
    if (searchParams.get("drawer") === "open" && agenda?.spaces?.[0]) {
      setSelectedWalkInCourt(agenda.spaces[0]);
      setSelectedWalkInHour("16:00");
      setIsWalkInOpen(true);
    }
  }, [searchParams, agenda]);

  // Refresh agenda data
  const refreshAgenda = () => {
    startTransition(async () => {
      const res = await getAgendaAction(activeVenueId, selectedDate);
      if (res.ok) {
        setAgenda(res.data);
      }
    });
  };

  // Re-fetch when date changes
  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
    startTransition(async () => {
      const res = await getAgendaAction(activeVenueId, newDate);
      if (res.ok) {
        setAgenda(res.data);
      }
    });
  };

  // Click on available slot
  const handleSlotClick = (court: CourtSpace, startTime: string) => {
    setSelectedWalkInCourt(court);
    setSelectedWalkInHour(startTime);
    setIsWalkInOpen(true);
  };

  // Click on reservation card
  const handleReservationClick = (
    reservation: CourtReservation,
    court: CourtSpace,
  ) => {
    setSelectedDetailReservation(reservation);
    setSelectedDetailCourt(court);
    setIsDetailOpen(true);
  };

  // Click on maintenance block
  const handleBlockClick = (block: CourtBlock, court: CourtSpace) => {
    setSelectedBlock(block);
    setSelectedBlockCourt(court);
    setSelectedBlockHour(block.startTime);
    setIsBlockOpen(true);
  };

  // Calculate sports categories filter list
  const allSpaces = agenda?.spaces ?? [];
  const sportsMap = new Map<string, { label: string; count: number }>();
  allSpaces.forEach((s) => {
    const actName =
      typeof s.activity === "object"
        ? s.activity?.es || s.activity?.en
        : s.activity || "Deporte";
    const key = actName.toLowerCase().replace(/\s+/g, "-");
    const current = sportsMap.get(key) || { label: actName, count: 0 };
    current.count += 1;
    sportsMap.set(key, current);
  });

  const sportsList = Array.from(sportsMap.entries()).map(([key, val]) => ({
    key,
    label: val.label,
    count: val.count,
  }));

  // Filtered spaces by sport category
  const filteredSpaces = allSpaces.filter((space) => {
    if (selectedSport === "all") return true;
    const actName =
      typeof space.activity === "object"
        ? space.activity?.es || space.activity?.en
        : space.activity || "";
    return actName.toLowerCase().replace(/\s+/g, "-") === selectedSport;
  });

  return (
    <div className="space-y-5">
      {/* Top Banner & Fast Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-accent/15 px-3 py-1 text-xs font-bold text-accent-foreground border border-accent/30 mb-1.5">
            <span>{agenda?.venue?.name || "Sede Deportiva"}</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-foreground">
            {t("title")}
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={refreshAgenda}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground shadow-xs hover:bg-muted transition-all active:scale-95"
            title="Recargar agenda"
          >
            <RefreshCw className={`size-3.5 ${isPending ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Actualizar</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCheckInOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border-medium bg-surface px-3 py-2 text-xs font-bold text-foreground shadow-xs hover:bg-muted transition-all active:scale-95"
          >
            <QrCode className="size-4" />
            <span>{t("btnScanQr")}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (allSpaces[0]) {
                setSelectedWalkInCourt(allSpaces[0]);
                setSelectedWalkInHour("16:00");
                setIsWalkInOpen(true);
              }
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-3.5 py-2 text-xs font-bold text-accent-foreground shadow-xs hover:brightness-105 transition-all active:scale-95"
          >
            <Calendar className="size-4" />
            <span>{t("btnNewWalkin")}</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <AgendaKpiStrip spaces={allSpaces} />

      {/* Controls Bar: Date pills & Sport category tabs */}
      <AgendaControlsBar
        selectedDate={selectedDate}
        onDateChange={handleDateChange}
        selectedSport={selectedSport}
        onSportChange={setSelectedSport}
        sportsList={sportsList}
        totalCourtsCount={allSpaces.length}
      />

      {/* Main Multi-Court Grid Matrix */}
      <AgendaMatrix
        spaces={filteredSpaces}
        onSlotClick={handleSlotClick}
        onReservationClick={handleReservationClick}
        onBlockClick={handleBlockClick}
      />

      {/* Walk-In Booking Side Drawer */}
      <WalkInDrawer
        isOpen={isWalkInOpen}
        onClose={() => setIsWalkInOpen(false)}
        court={selectedWalkInCourt}
        selectedDate={selectedDate}
        startTime={selectedWalkInHour}
        onSuccess={refreshAgenda}
      />

      {/* Express Check-In Modal */}
      <ExpressCheckInModal
        isOpen={isCheckInOpen}
        onClose={() => setIsCheckInOpen(false)}
        onSuccess={refreshAgenda}
      />

      {/* Booking Detail Modal */}
      <ReservationDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        reservation={selectedDetailReservation}
        court={selectedDetailCourt}
        onRefresh={refreshAgenda}
      />

      {/* Space Block Modal */}
      <SpaceBlockModal
        isOpen={isBlockOpen}
        onClose={() => setIsBlockOpen(false)}
        court={selectedBlockCourt}
        selectedDate={selectedDate}
        startTime={selectedBlockHour}
        existingBlock={selectedBlock}
        onRefresh={refreshAgenda}
      />
    </div>
  );
}
