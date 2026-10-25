"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
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
import {
  getCurrentWeekBounds,
  resolveReservationDateRange,
  type ReservationFilter,
  type ReservationItem,
  type ReservationKpis,
} from "@/features/reservations/model/types";

import { useActiveVenue } from "@/features/venues/context/venue-context";
import { todayInTimezone } from "@/shared/lib";

interface ReservationsPageProps {
  initialReservations: ReservationItem[];
  initialKpis: ReservationKpis;
  venues: Array<{
    id: string;
    organizationId?: string;
    organizationName?: string;
    organizationLegalName?: string | null;
    organizationRif?: string | null;
    name: string;
    referenceCurrencyCode?: string;
    spacesCount?: number;
  }>;
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
  const {
    activeOrganizationId: globalOrgId,
    setActiveOrganizationId: setGlobalOrgId,
    activeVenueId: globalVenueId,
    setActiveVenueId: setGlobalVenueId,
  } = useActiveVenue();
  const isValidator = userRole === "ALLY_VALIDATOR";
  const effectiveEurRate = bcvEurRate ?? bcvRate;

  const [reservations, setReservations] = useState<ReservationItem[]>(initialReservations);
  const [isReloading, setIsReloading] = useState(false);

  const todayIso = todayInTimezone("America/Caracas");
  const defaultWeekBounds = useMemo(() => getCurrentWeekBounds(todayIso), [todayIso]);

  const [filter, setFilter] = useState<ReservationFilter>({
    dateFilter: "week",
    customFromDate: defaultWeekBounds.fromDate,
    customToDate: defaultWeekBounds.toDate,
    organizationId: globalOrgId || "ALL",
    venueId: globalVenueId && globalVenueId !== "ALL" ? globalVenueId : "all",
    sport: "all",
    paymentMethod: "all",
    status: "all",
    search: "",
  });

  // Sync with global organization & venue context changes
  useEffect(() => {
    setFilter((prev) => {
      const nextOrg = globalOrgId || "ALL";
      const nextVenue =
        globalVenueId && globalVenueId !== "ALL" ? globalVenueId : "all";
      if (prev.organizationId === nextOrg && prev.venueId === nextVenue) {
        return prev;
      }
      return {
        ...prev,
        organizationId: nextOrg,
        venueId: nextVenue,
      };
    });
  }, [globalOrgId, globalVenueId]);

  const activeRange = useMemo(
    () =>
      resolveReservationDateRange(
        filter.dateFilter || "week",
        todayIso,
        filter.customFromDate,
        filter.customToDate,
      ),
    [filter.dateFilter, filter.customFromDate, filter.customToDate, todayIso],
  );

  // Re-fetch from backend when the active date range changes
  const isFirstMount = useRef(true);
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    let active = true;
    setIsReloading(true);
    getReservationsAction({
      fromDate: activeRange.fromDate,
      toDate: activeRange.toDate,
    })
      .then((res) => {
        if (!active) return;
        if (res.ok && res.data) {
          setReservations(res.data.items);
        }
      })
      .finally(() => {
        if (active) setIsReloading(false);
      });

    return () => {
      active = false;
    };
  }, [activeRange.fromDate, activeRange.toDate]);

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

  const organizationVenueIds = useMemo(() => {
    if (
      !filter.organizationId ||
      filter.organizationId === "ALL" ||
      filter.organizationId === "all"
    ) {
      return null;
    }
    return new Set(
      venues
        .filter((v) => v.organizationId === filter.organizationId)
        .map((v) => v.id),
    );
  }, [venues, filter.organizationId]);

  const scopedVenuesForModal = useMemo(() => {
    if (!organizationVenueIds) return venues;
    return venues.filter((v) => organizationVenueIds.has(v.id));
  }, [venues, organizationVenueIds]);

  const scopedSpacesForModal = useMemo(() => {
    if (!organizationVenueIds) return spaces;
    return spaces.filter((s) => organizationVenueIds.has(s.venueId));
  }, [spaces, organizationVenueIds]);

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

      // 2. Venue & Organization
      if (filter.venueId && filter.venueId !== "all") {
        if (res.venueId !== filter.venueId) return false;
      } else if (organizationVenueIds) {
        if (!organizationVenueIds.has(res.venueId)) return false;
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
        if (filter.status === "PENDING_PAYMENT") {
          if (
            res.status !== "PENDING_PAYMENT" &&
            (res.status as string) !== "PAYMENT_UNDER_REVIEW"
          ) {
            return false;
          }
        } else if (res.status !== filter.status) {
          return false;
        }
      }

      // 6. Date Filter
      if (res.date < activeRange.fromDate || res.date > activeRange.toDate) {
        return false;
      }

      return true;
    });
  }, [reservations, filter, activeRange, organizationVenueIds]);

  // Determine active currency code (USD, EUR, or MIXED) based on selected venue / organization
  const activeCurrencyCode = useMemo(() => {
    if (filter.venueId && filter.venueId !== "all") {
      const selectedVenue = venues.find((v) => v.id === filter.venueId);
      if (selectedVenue?.referenceCurrencyCode) {
        return selectedVenue.referenceCurrencyCode;
      }
    }

    const relevantVenues = organizationVenueIds
      ? venues.filter((v) => organizationVenueIds.has(v.id))
      : venues;

    const venueCurrencies = new Set(
      relevantVenues
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
  }, [
    filter.venueId,
    venues,
    organizationVenueIds,
    displayedReservations,
    referenceCurrencyCode,
  ]);

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
    setIsReloading(true);
    try {
      const res = await getReservationsAction({
        fromDate: activeRange.fromDate,
        toDate: activeRange.toDate,
      });
      if (res.ok && res.data) {
        setReservations(res.data.items);
        setSelectedForDrawer((prev) => {
          if (!prev) return null;
          return res.data.items.find((i) => i.id === prev.id) ?? prev;
        });
      }
    } finally {
      setIsReloading(false);
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
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-2xl font-bold text-foreground">
              {t("title")}
            </h1>
            <button
              type="button"
              onClick={() => refreshReservations()}
              disabled={isReloading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-muted/60 hover:bg-muted hover:border-border-strong px-3 py-1 text-xs font-bold text-foreground transition-all cursor-pointer disabled:opacity-60"
              id="btn-reload-reservations"
              title={t("btnReload")}
            >
              <RefreshCw
                className={`size-3.5 text-link ${isReloading ? "animate-spin" : ""}`}
              />
              <span>{isReloading ? t("reloading") : t("btnReload")}</span>
            </button>
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
          dateFilter={filter.dateFilter}
        />

        {/* ADVANCED FILTER TOOLBAR */}
        <ReservationsFilterBar
          filter={filter}
          onChangeFilter={(upd) => {
            setFilter((prev) => ({ ...prev, ...upd }));
            if (upd.organizationId !== undefined) {
              setGlobalOrgId(upd.organizationId || "ALL");
            }
            if (upd.venueId !== undefined) {
              setGlobalVenueId(
                upd.venueId === "all" || !upd.venueId ? "ALL" : upd.venueId,
              );
            }
          }}
          onResetFilter={() => {
            setFilter({
              dateFilter: "week",
              customFromDate: defaultWeekBounds.fromDate,
              customToDate: defaultWeekBounds.toDate,
              organizationId: globalOrgId || "ALL",
              venueId: "all",
              sport: "all",
              paymentMethod: "all",
              status: "all",
              search: "",
            });
            setGlobalVenueId("ALL");
          }}
          venues={venues}
          totalSpacesCount={spaces.length}
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
        onRefresh={refreshReservations}
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
          venues={scopedVenuesForModal}
          spaces={scopedSpacesForModal}
          onSuccess={(createdDate) => {
            setIsWalkInOpen(false);
            if (
              createdDate &&
              (createdDate < activeRange.fromDate || createdDate > activeRange.toDate)
            ) {
              setFilter((prev) => ({
                ...prev,
                dateFilter: "custom",
                customFromDate:
                  createdDate < activeRange.fromDate ? createdDate : activeRange.fromDate,
                customToDate:
                  createdDate > activeRange.toDate ? createdDate : activeRange.toDate,
              }));
            } else {
              refreshReservations();
            }
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
