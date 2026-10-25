"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useLocale, useTranslations } from "next-intl";
import {
  Clock,
  Minimize2,
  Moon,
  RefreshCw,
  Sun,
  Sunrise,
} from "lucide-react";
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
  const locale = useLocale();
  const isEn = locale === "en";
  const {
    activeOrganizationId: globalOrgId,
    setActiveOrganizationId: setGlobalOrgId,
    activeVenueId: globalVenueId,
    setActiveVenueId: setGlobalVenueId,
  } = useActiveVenue();
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
  const initialVenueRaw = initialAgenda?.venue?.id || globalVenueId || "ALL";
  const [activeVenueId, setActiveVenueId] = useState<string>(
    initialVenueRaw.startsWith("ORG:") ? "ALL" : initialVenueRaw,
  );
  const [activeOrganizationId, setActiveOrganizationId] = useState<string>(
    initialVenueRaw.startsWith("ORG:")
      ? initialVenueRaw.slice(4)
      : globalOrgId || "ALL",
  );
  const [agenda, setAgenda] = useState<AgendaData | null>(initialAgenda);
  const [isPending, setIsPending] = useState(false);

  const loadAgendaData = useCallback(
    async (venueIdToLoad: string, dateToLoad: string, orgIdToLoad?: string) => {
      setIsPending(true);
      try {
        const res = await getAgendaAction(venueIdToLoad, dateToLoad, orgIdToLoad);
        if (res.ok) {
          setAgenda(res.data);
        }
      } finally {
        setIsPending(false);
      }
    },
    [],
  );

  // Sync with global organization & venue context changes
  useEffect(() => {
    const venueChanged = Boolean(globalVenueId && globalVenueId !== activeVenueId);
    const orgChanged = Boolean(globalOrgId && globalOrgId !== activeOrganizationId);
    if (venueChanged || orgChanged) {
      const nextVenue = globalVenueId || activeVenueId;
      const nextOrg = globalOrgId || activeOrganizationId;
      setActiveVenueId(nextVenue);
      setActiveOrganizationId(nextOrg);
      void loadAgendaData(nextVenue, selectedDate, nextOrg);
    }
  }, [
    globalVenueId,
    globalOrgId,
    selectedDate,
    activeVenueId,
    activeOrganizationId,
    loadAgendaData,
  ]);

  // Modals and Drawers state
  const [isFullscreen, setIsFullscreen] = useState(false);
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

  // Allow Escape key to exit fullscreen mode when no modal/drawer/dropdown is open
  useEffect(() => {
    if (!isFullscreen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "Escape" &&
        !e.defaultPrevented &&
        !isWalkInOpen &&
        !isCheckInOpen &&
        !isDetailOpen &&
        !isBlockOpen
      ) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen, isWalkInOpen, isCheckInOpen, isDetailOpen, isBlockOpen]);

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
    void loadAgendaData(activeVenueId, selectedDate, activeOrganizationId);
  };

  // Re-fetch when date changes
  const handleDateChange = (newDate: string) => {
    setSelectedRange(null);
    setSelectedDate(newDate);
    void loadAgendaData(activeVenueId, newDate, activeOrganizationId);
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
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        <div className="min-w-0">
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

        <div className="flex items-center self-start xl:self-center shrink-0">
          <VenueInlineCombobox
            id="agenda-venue-selector"
            selectedOrganizationId={activeOrganizationId}
            onSelectOrganizationId={(newOrgId) => {
              setSelectedRange(null);
              setActiveOrganizationId(newOrgId);
              setGlobalOrgId(newOrgId);
              setActiveVenueId("ALL");
              setGlobalVenueId("ALL");
              void loadAgendaData("ALL", selectedDate, newOrgId);
            }}
            selectedVenueId={activeVenueId}
            onSelectVenueId={(newVenueId) => {
              setSelectedRange(null);
              setActiveVenueId(newVenueId);
              setGlobalVenueId(newVenueId);
              void loadAgendaData(newVenueId, selectedDate, activeOrganizationId);
            }}
            actions={
              <button
                type="button"
                onClick={refreshAgenda}
                disabled={isPending}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border-medium bg-background px-3 text-xs font-bold text-foreground shadow-2xs hover:border-accent/60 hover:bg-muted/50 transition-all active:scale-95 cursor-pointer shrink-0"
                title={t("btnRefreshTitle")}
              >
                <RefreshCw className={`size-3.5 ${isPending ? "animate-spin" : ""}`} />
                <span>{t("btnRefresh")}</span>
              </button>
            }
          />
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
        onOpenFullscreen={() => setIsFullscreen(true)}
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

      {/* Fullscreen Schedule Overlay (rendered via Portal on document.body to sit above AppSidebar) */}
      {isFullscreen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            id="agenda-fullscreen-modal"
            className="fixed inset-0 z-[60] flex flex-col gap-3 bg-background p-3 sm:p-4 animate-in fade-in duration-150"
          >
            {/* Compact Top Toolbar inside Fullscreen */}
            <div className="relative z-40 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface px-4 py-2.5 shadow-card">
              <div className="flex flex-wrap items-center gap-2.5">
                <VenueInlineCombobox
                  id="agenda-fullscreen-venue-selector"
                  selectedOrganizationId={activeOrganizationId}
                  onSelectOrganizationId={(newOrgId) => {
                    setSelectedRange(null);
                    setActiveOrganizationId(newOrgId);
                    setGlobalOrgId(newOrgId);
                    setActiveVenueId("ALL");
                    setGlobalVenueId("ALL");
                    void loadAgendaData("ALL", selectedDate, newOrgId);
                  }}
                  selectedVenueId={activeVenueId}
                  onSelectVenueId={(newVenueId) => {
                    setSelectedRange(null);
                    setActiveVenueId(newVenueId);
                    setGlobalVenueId(newVenueId);
                    void loadAgendaData(newVenueId, selectedDate, activeOrganizationId);
                  }}
                />

                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => e.target.value && handleDateChange(e.target.value)}
                  aria-label={isEn ? "Schedule date" : "Fecha del horario"}
                  className="h-9 rounded-xl border border-border-medium bg-background px-2.5 text-xs font-bold text-foreground focus:border-accent focus:outline-none cursor-pointer"
                />

                {/* Compact Sport Pills */}
                <div className="flex flex-wrap items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setSelectedSport("all")}
                    className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                      selectedSport === "all"
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "border border-border bg-background text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {t("filterAll")} ({allSpaces.length})
                  </button>
                  {sportsList.map((sport) => {
                    const isActive = selectedSport === sport.key;
                    return (
                      <button
                        key={sport.key}
                        type="button"
                        onClick={() => setSelectedSport(sport.key)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                          isActive
                            ? "bg-primary text-primary-foreground shadow-xs"
                            : "border border-border bg-background text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {sport.label} ({sport.count})
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Day-Part Toggles */}
                <div className="inline-flex items-center rounded-xl border border-border bg-background p-0.5 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setSelectedDayPart("all")}
                    className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 transition-all cursor-pointer ${
                      selectedDayPart === "all"
                        ? "bg-accent text-accent-foreground font-bold shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Clock className="size-3" />
                    <span>{t("dayPartAll")}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedDayPart("morning")}
                    className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 transition-all cursor-pointer ${
                      selectedDayPart === "morning"
                        ? "bg-accent text-accent-foreground font-bold shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Sunrise className="size-3" />
                    <span>{t("dayPartMorning")}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedDayPart("afternoon")}
                    className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 transition-all cursor-pointer ${
                      selectedDayPart === "afternoon"
                        ? "bg-accent text-accent-foreground font-bold shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Sun className="size-3" />
                    <span>{t("dayPartAfternoon")}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedDayPart("night")}
                    className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 transition-all cursor-pointer ${
                      selectedDayPart === "night"
                        ? "bg-accent text-accent-foreground font-bold shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Moon className="size-3" />
                    <span>{t("dayPartNight")}</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={refreshAgenda}
                  disabled={isPending}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-all cursor-pointer"
                  title={t("btnRefreshTitle")}
                >
                  <RefreshCw className={`size-3.5 ${isPending ? "animate-spin" : ""}`} />
                  <span className="hidden md:inline">{t("btnRefresh")}</span>
                </button>

                <button
                  type="button"
                  id="btn-exit-agenda-fullscreen"
                  onClick={() => setIsFullscreen(false)}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-3.5 py-1.5 text-xs font-extrabold text-primary-foreground shadow-xs hover:opacity-90 transition-all active:scale-95 cursor-pointer"
                  title={isEn ? "Exit fullscreen (Esc)" : "Salir de pantalla completa (Esc)"}
                >
                  <Minimize2 className="size-3.5 text-accent" />
                  <span>{isEn ? "Exit fullscreen" : "Salir de pantalla completa"}</span>
                  <span className="rounded bg-primary-foreground/15 px-1.5 py-0.5 font-mono text-[10px] text-primary-foreground/80">
                    Esc
                  </span>
                </button>
              </div>
            </div>

            {/* Full-Window Schedule Matrix */}
            <AgendaMatrix
              spaces={filteredSpaces}
              selectedDayPart={selectedDayPart}
              isValidator={isValidator}
              isFullscreen={true}
              selectedRange={selectedRange}
              onSelectedRangeChange={setSelectedRange}
              onSlotClick={handleSlotClick}
              onRequestBlock={handleRequestBlock}
              onReservationClick={handleReservationClick}
              onBlockClick={handleBlockClick}
            />
          </div>,
          document.body,
        )}

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
