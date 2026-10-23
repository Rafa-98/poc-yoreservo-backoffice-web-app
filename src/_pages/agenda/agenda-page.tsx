"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Calendar, QrCode, RefreshCw } from "lucide-react";
import {
  AgendaControlsBar,
  type AgendaDayPart,
} from "@/features/agenda/ui/agenda-controls-bar";
import { AgendaKpiStrip } from "@/features/agenda/ui/agenda-kpi-strip";
import {
  AgendaMatrix,
  type AgendaSelectedRange,
} from "@/features/agenda/ui/agenda-matrix";
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
import { VenueInlineCombobox } from "@/features/venues/ui/venue-inline-combobox";
import { ROUTES, type BackofficeRole } from "@/shared/config";
import { todayInTimezone } from "@/shared/lib";

export interface AgendaPageProps {
  initialAgenda: AgendaData | null;
  initialVenues: VenueRef[];
  userRole?: BackofficeRole;
}

export function AgendaPage({ initialAgenda, initialVenues, userRole }: AgendaPageProps) {
  const t = useTranslations("agenda");
  const { activeVenueId: globalVenueId, setActiveVenueId: setGlobalVenueId } = useActiveVenue();
  const isValidator = userRole === "ALLY_VALIDATOR";

  // Active state
  const todayStr = todayInTimezone(
    initialAgenda?.timezone || initialAgenda?.venue?.timezone || "America/Caracas",
  );
  const [selectedDate, setSelectedDate] = useState(
    initialAgenda?.date || todayStr,
  );
  const [selectedSport, setSelectedSport] = useState("all");
  const [selectedDayPart, setSelectedDayPart] = useState<AgendaDayPart>("all");
  const [activeVenueId, setActiveVenueId] = useState<string>(
    initialAgenda?.venue?.id || globalVenueId || "ALL"
  );
  const [agenda, setAgenda] = useState<AgendaData | null>(initialAgenda);
  const [isPending, setIsPending] = useState(false);

  const loadAgendaData = useCallback(async (venueIdToLoad: string, dateToLoad: string) => {
    setIsPending(true);
    try {
      const res = await getAgendaAction(venueIdToLoad, dateToLoad);
      if (res.ok) {
        setAgenda(res.data);
      }
    } finally {
      setIsPending(false);
    }
  }, []);

  // Sync with global venue context changes
  useEffect(() => {
    if (globalVenueId && globalVenueId !== activeVenueId) {
      setActiveVenueId(globalVenueId);
      void loadAgendaData(globalVenueId, selectedDate);
    }
  }, [globalVenueId, selectedDate, activeVenueId, loadAgendaData]);

  // Modals and Drawers state
  const [selectedRange, setSelectedRange] = useState<AgendaSelectedRange | null>(
    null,
  );
  const [isWalkInOpen, setIsWalkInOpen] = useState(false);
  const [selectedWalkInCourt, setSelectedWalkInCourt] = useState<CourtSpace | null>(null);
  const [selectedWalkInHour, setSelectedWalkInHour] = useState("09:00");
  const [selectedWalkInEndHour, setSelectedWalkInEndHour] = useState<string | undefined>("10:00");

  const [isCheckInOpen, setIsCheckInOpen] = useState(false);

  const [selectedDetailReservation, setSelectedDetailReservation] =
    useState<CourtReservation | null>(null);
  const [selectedDetailCourt, setSelectedDetailCourt] =
    useState<CourtSpace | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const [selectedBlock, setSelectedBlock] = useState<CourtBlock | null>(null);
  const [selectedBlockCourt, setSelectedBlockCourt] = useState<CourtSpace | null>(null);
  const [selectedBlockHour, setSelectedBlockHour] = useState("09:00");
  const [selectedBlockEndHour, setSelectedBlockEndHour] = useState<string | undefined>("10:00");
  const [isBlockOpen, setIsBlockOpen] = useState(false);

  // Auto-open QR check-in modal or walk-in drawer if URL query `?qr=open` or `?drawer=open`
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("qr") === "open") {
      setIsCheckInOpen(true);
      window.history.replaceState(null, "", ROUTES.agenda);
    } else if (!isValidator && params.get("drawer") === "open" && agenda?.spaces?.[0]) {
      setSelectedWalkInCourt(agenda.spaces[0]);
      setSelectedWalkInHour("16:00");
      setSelectedWalkInEndHour("17:00");
      setIsWalkInOpen(true);
      window.history.replaceState(null, "", ROUTES.agenda);
    }
  }, [agenda, isValidator]);

  // Listen for top header quick-action events when already on /agenda
  useEffect(() => {
    const handleOpenQr = () => setIsCheckInOpen(true);
    const handleOpenDrawer = () => {
      if (!isValidator && agenda?.spaces?.[0]) {
        setSelectedWalkInCourt(agenda.spaces[0]);
        setSelectedWalkInHour("16:00");
        setSelectedWalkInEndHour("17:00");
        setIsWalkInOpen(true);
      }
    };
    window.addEventListener("yoreservo:open-checkin-qr", handleOpenQr);
    window.addEventListener("yoreservo:open-walkin-drawer", handleOpenDrawer);
    return () => {
      window.removeEventListener("yoreservo:open-checkin-qr", handleOpenQr);
      window.removeEventListener("yoreservo:open-walkin-drawer", handleOpenDrawer);
    };
  }, [agenda, isValidator]);

  // Refresh agenda data
  const refreshAgenda = () => {
    setSelectedRange(null);
    void loadAgendaData(activeVenueId, selectedDate);
  };

  // Re-fetch when date changes
  const handleDateChange = (newDate: string) => {
    setSelectedRange(null);
    setSelectedDate(newDate);
    void loadAgendaData(activeVenueId, newDate);
  };

  // Confirm single or multi-hour available slot selection
  const handleSlotClick = (
    court: CourtSpace,
    startTime: string,
    endTime?: string,
  ) => {
    if (isValidator) return;
    setSelectedWalkInCourt(court);
    setSelectedWalkInHour(startTime);
    setSelectedWalkInEndHour(endTime);
    setIsWalkInOpen(true);
  };

  // Request blocking a single or multi-hour available slot range
  const handleRequestBlock = (
    court: CourtSpace,
    startTime: string,
    endTime?: string,
  ) => {
    setSelectedBlock(null);
    setSelectedBlockCourt(court);
    setSelectedBlockHour(startTime);
    setSelectedBlockEndHour(endTime);
    setIsBlockOpen(true);
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
    setSelectedBlockEndHour(block.endTime);
    setIsBlockOpen(true);
  };

  // Calculate sports categories filter list
  const allSpaces = agenda?.spaces ?? [];
  const sportsMap = new Map<string, { label: string; count: number }>();
  allSpaces.forEach((s) => {
    const actName =
      typeof s.activity === "object"
        ? s.activity?.es || s.activity?.en
        : s.activity || t("defaultSport");
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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-accent/15 px-3 py-1 text-xs font-bold text-foreground border border-accent/30 mb-1.5">
            <span>{agenda?.venue?.name || t("defaultVenue")}</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-foreground">
            {t("title")}
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <VenueInlineCombobox
            id="agenda-venue-selector"
            selectedVenueId={activeVenueId}
            onSelectVenueId={(newVenueId) => {
              setActiveVenueId(newVenueId);
              setGlobalVenueId(newVenueId);
              void loadAgendaData(newVenueId, selectedDate);
            }}
          />

          <button
            type="button"
            onClick={refreshAgenda}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground shadow-xs hover:bg-muted transition-all active:scale-95"
            title={t("btnRefreshTitle")}
          >
            <RefreshCw className={`size-3.5 ${isPending ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">{t("btnRefresh")}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCheckInOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border-medium bg-surface px-3 py-2 text-xs font-bold text-foreground shadow-xs hover:bg-muted transition-all active:scale-95"
          >
            <QrCode className="size-4" />
            <span>{t("btnScanQr")}</span>
          </button>

          {!isValidator && (
            <button
              type="button"
              onClick={() => {
                if (allSpaces[0]) {
                  setSelectedWalkInCourt(allSpaces[0]);
                  setSelectedWalkInHour("16:00");
                  setSelectedWalkInEndHour("17:00");
                  setIsWalkInOpen(true);
                }
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-3.5 py-2 text-xs font-bold text-accent-foreground shadow-xs hover:brightness-105 transition-all active:scale-95"
            >
              <Calendar className="size-4" />
              <span>{t("btnNewWalkin")}</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats Strip */}
      <AgendaKpiStrip
        spaces={allSpaces}
        bcvRate={agenda?.bcvRate}
        totalAvailableSlots={agenda?.kpis?.totalAvailableSlots}
      />

      {/* Controls Bar: Date pills & Sport category tabs */}
      <AgendaControlsBar
        selectedDate={selectedDate}
        onDateChange={handleDateChange}
        selectedSport={selectedSport}
        onSportChange={setSelectedSport}
        selectedDayPart={selectedDayPart}
        onDayPartChange={setSelectedDayPart}
        sportsList={sportsList}
        totalCourtsCount={allSpaces.length}
        venueTimezone={agenda?.timezone || agenda?.venue?.timezone || "America/Caracas"}
      />

      {/* Main Multi-Court Grid Matrix */}
      <AgendaMatrix
        spaces={filteredSpaces}
        selectedDayPart={selectedDayPart}
        isValidator={isValidator}
        selectedRange={selectedRange}
        onSelectedRangeChange={setSelectedRange}
        onSlotClick={handleSlotClick}
        onRequestBlock={handleRequestBlock}
        onReservationClick={handleReservationClick}
        onBlockClick={handleBlockClick}
      />

      {/* Walk-In Booking Side Drawer */}
      {!isValidator && (
        <WalkInDrawer
          isOpen={isWalkInOpen}
          onClose={() => setIsWalkInOpen(false)}
          court={selectedWalkInCourt}
          spaces={allSpaces}
          selectedDate={selectedDate}
          startTime={selectedWalkInHour}
          endTime={selectedWalkInEndHour}
          onSelectionChange={(court, nextStart, nextEnd) => {
            setSelectedWalkInCourt(court);
            setSelectedWalkInHour(nextStart);
            setSelectedWalkInEndHour(nextEnd);
            setSelectedRange({
              courtId: court.id,
              startHour: nextStart,
              endHour: nextEnd,
            });
          }}
          onSuccess={refreshAgenda}
          bcvRate={agenda?.bcvRate}
        />
      )}

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
        endTime={selectedBlockEndHour}
        existingBlock={selectedBlock}
        onRefresh={refreshAgenda}
      />
    </div>
  );
}
