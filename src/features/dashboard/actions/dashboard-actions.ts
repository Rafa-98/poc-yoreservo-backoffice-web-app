"use server";

import { backendRequest } from "@/shared/api/index.server";
import { requireSessionWithToken } from "@/shared/auth/index.server";
import { ROUTE_ALLOWED_ROLES, ROUTES } from "@/shared/config";
import { DEFAULT_BCV_USD_RATE } from "@/shared/lib";
import type {
  ActivityStreamItem,
  AdminKpisData,
  AllyKpisData,
  BackendDashboardSummary,
  CourtRibbonItem,
  CourtStatusType,
  ExecutiveDashboardData,
  SportDistributionItem,
  SportsDistributionData,
  TimeframeChartData,
  TimeframeKey,
} from "../model/types";

const EMPTY_CHART_DATA: Record<TimeframeKey, TimeframeChartData> = {
  HOY: {
    labels: [],
    gmv: [],
    fee: [],
    peakText: "Sin actividad",
  },
  SEMANA: {
    labels: [],
    gmv: [],
    fee: [],
    peakText: "Sin actividad",
  },
  MES: {
    labels: [],
    gmv: [],
    fee: [],
    peakText: "Sin actividad",
  },
  ANO: {
    labels: [],
    gmv: [],
    fee: [],
    peakText: "Sin actividad",
  },
};

export async function getDashboardSummaryAction(params?: {
  period?: TimeframeKey;
  venueId?: string;
}): Promise<ExecutiveDashboardData> {
  const { user, accessToken } = await requireSessionWithToken(ROUTE_ALLOWED_ROLES[ROUTES.dashboard]);
  const isGlobalAdmin =
    user.role === "PLATFORM_ADMIN" ||
    user.role === "PLATFORM_ACCOUNTING";

  const query = new URLSearchParams();
  if (params?.period) query.set("period", params.period);
  if (params?.venueId && params.venueId !== "ALL") query.set("venueId", params.venueId);
  const qs = query.toString() ? `?${query.toString()}` : "";

  let backendSummary: BackendDashboardSummary | null = null;
  try {
    let res = await backendRequest(`/backoffice/dashboard/summary${qs}`, {
      method: "GET",
      accessToken,
    });
    if (!res.ok) {
      res = await backendRequest(`/backoffice/dashboard${qs}`, {
        method: "GET",
        accessToken,
      });
    }
    if (res.ok && res.body) {
      backendSummary = res.body as BackendDashboardSummary;
    }
  } catch {
    backendSummary = null;
  }

  const bcvRate =
    backendSummary?.bcvRate && Number(backendSummary.bcvRate) > 0
      ? Number(backendSummary.bcvRate)
      : DEFAULT_BCV_USD_RATE;

  const metrics = {
    gmv:
      typeof backendSummary?.metrics?.gmv === "number"
        ? backendSummary.metrics.gmv
        : 0,
    platformFeeRevenue:
      typeof backendSummary?.metrics?.platformFeeRevenue === "number"
        ? backendSummary.metrics.platformFeeRevenue
        : 0,
    netPayout:
      typeof backendSummary?.metrics?.netPayout === "number"
        ? backendSummary.metrics.netPayout
        : 0,
    totalReservations:
      typeof backendSummary?.metrics?.totalReservations === "number"
        ? backendSummary.metrics.totalReservations
        : 0,
    totalVenues:
      typeof backendSummary?.metrics?.totalVenues === "number"
        ? backendSummary.metrics.totalVenues
        : 0,
    totalSpaces:
      typeof backendSummary?.metrics?.totalSpaces === "number"
        ? backendSummary.metrics.totalSpaces
        : 0,
    gmvGrowthPct: backendSummary?.metrics?.gmvGrowthPct ?? "0.0%",
  };

  const courtsRibbon: CourtRibbonItem[] = Array.isArray(backendSummary?.courtsRibbon)
    ? backendSummary.courtsRibbon.map((c) => {
        const rawStatus = String(c.status || "").toLowerCase();
        const status: CourtStatusType =
          rawStatus === "maintenance"
            ? "maintenance"
            : rawStatus === "in-play" ||
              rawStatus === "in_play" ||
              rawStatus === "occupied"
            ? "in-play"
            : rawStatus === "upcoming" ||
              rawStatus === "reserved_soon" ||
              rawStatus === "reserved" ||
              rawStatus === "confirmed"
            ? "upcoming"
            : "available";
        const rate = Number(c.ratePerHour ?? c.pricePerHour ?? c.rate ?? 0);
        return {
          id: String(c.id),
          reservationId: c.reservationId ? String(c.reservationId) : undefined,
          name: c.name || "Cancha",
          venueName: c.venueName,
          courtType: c.courtType || c.category || c.sport || "Cancha",
          surface: c.surface || "Superficie Estándar",
          status,
          timeSlot: c.timeSlot || "—",
          customerName: c.customerName || c.player,
          bookingCode: c.bookingCode || c.shortCode,
          amount: c.amount !== undefined ? Number(c.amount) : rate,
          ratePerHour: rate,
          freeSlotText: c.freeSlotText || `$${rate.toFixed(2)}/h`,
          checkInDone: Boolean(c.checkInDone),
        };
      })
    : [];

  const mappedRecentBookingsFeed: ActivityStreamItem[] =
    Array.isArray(backendSummary?.recentBookings) &&
    backendSummary.recentBookings.length > 0
      ? backendSummary.recentBookings.map((b) => {
          const isCompleted = b.status === "COMPLETED";
          const isConfirmed = b.status === "CONFIRMED";
          return {
            id: String(b.id),
            icon: isCompleted ? "🎟️" : isConfirmed ? "🎾" : "💳",
            bg: isCompleted
              ? "rgba(16, 185, 129, 0.15)"
              : isConfirmed
              ? "rgba(198, 242, 59, 0.2)"
              : "rgba(59, 130, 246, 0.15)",
            title: `${
              isCompleted
                ? "Check-in Realizado"
                : isConfirmed
                ? "Reserva Confirmada"
                : "Actividad de Reserva"
            } (#${b.shortCode || String(b.id).slice(0, 6).toUpperCase()})`,
            desc: `${b.customerName} • ${b.spaceName} en ${b.venueName} ($${Number(
              b.totalAmount || 0
            ).toFixed(2)})`,
            time: b.createdAt
              ? new Date(b.createdAt).toLocaleTimeString("es-VE", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "Reciente",
          };
        })
      : [];

  const adminActivityFeed: ActivityStreamItem[] =
    Array.isArray(backendSummary?.adminActivityFeed) &&
    backendSummary.adminActivityFeed.length > 0
      ? backendSummary.adminActivityFeed
      : Array.isArray(backendSummary?.activityFeed) &&
        backendSummary.activityFeed.length > 0
      ? backendSummary.activityFeed
      : mappedRecentBookingsFeed;

  const allyActivityFeed: ActivityStreamItem[] =
    Array.isArray(backendSummary?.allyActivityFeed) &&
    backendSummary.allyActivityFeed.length > 0
      ? backendSummary.allyActivityFeed
      : Array.isArray(backendSummary?.activityFeed) &&
        backendSummary.activityFeed.length > 0
      ? backendSummary.activityFeed
      : mappedRecentBookingsFeed;

  const chartData: Record<TimeframeKey, TimeframeChartData> = {
    HOY: backendSummary?.chartData?.HOY ?? EMPTY_CHART_DATA.HOY,
    SEMANA: backendSummary?.chartData?.SEMANA ?? EMPTY_CHART_DATA.SEMANA,
    MES: backendSummary?.chartData?.MES ?? EMPTY_CHART_DATA.MES,
    ANO: backendSummary?.chartData?.ANO ?? EMPTY_CHART_DATA.ANO,
  };

  const sportsDistribution: SportsDistributionData = Array.isArray(
    backendSummary?.sportsDistribution
  )
    ? {
        items: backendSummary.sportsDistribution,
      }
    : {
        items: backendSummary?.sportsDistribution?.items ?? [],
        peakHoursTime: backendSummary?.sportsDistribution?.peakHoursTime,
        peakHoursSub: backendSummary?.sportsDistribution?.peakHoursSub,
        occupancyPct: backendSummary?.sportsDistribution?.occupancyPct,
      };

  const adminKpis: AdminKpisData = {
    gmvGrowthPct:
      backendSummary?.adminKpis?.gmvGrowthPct ??
      backendSummary?.metrics?.gmvGrowthPct ??
      "0.0%",
    bookingsByTimeframe: backendSummary?.adminKpis?.bookingsByTimeframe ?? {
      HOY: 0,
      SEMANA: 0,
      MES: metrics.totalReservations,
      ANO: metrics.totalReservations,
    },
    totalBookings:
      backendSummary?.adminKpis?.totalBookings ?? metrics.totalReservations,
    totalVenues: backendSummary?.adminKpis?.totalVenues ?? metrics.totalVenues,
    totalSpaces: backendSummary?.adminKpis?.totalSpaces ?? metrics.totalSpaces,
    onboardingVenues: backendSummary?.adminKpis?.onboardingVenues ?? 0,
    activeVenuesCount:
      backendSummary?.adminKpis?.activeVenuesCount ?? metrics.totalVenues,
    fulfillmentPct: backendSummary?.adminKpis?.fulfillmentPct ?? "0.0%",
    pendingPaymentsCount: backendSummary?.adminKpis?.pendingPaymentsCount ?? 0,
    pendingSettlementBatchesCount:
      backendSummary?.adminKpis?.pendingSettlementBatchesCount ?? 0,
    pendingSettlementAmountUsd:
      backendSummary?.adminKpis?.pendingSettlementAmountUsd ?? 0,
  };

  const allyKpis: AllyKpisData = {
    occupiedSlots: backendSummary?.allyKpis?.occupiedSlots ?? 0,
    totalSlots: backendSummary?.allyKpis?.totalSlots ?? 0,
    availableWalkInSlots: backendSummary?.allyKpis?.availableWalkInSlots ?? 0,
    occupancyPct: backendSummary?.allyKpis?.occupancyPct ?? 0,
    occupancyPeakPct: backendSummary?.allyKpis?.occupancyPeakPct ?? "0.0%",
    todayNetRevenue: backendSummary?.allyKpis?.todayNetRevenue ?? 0,
    checkedInMatches: backendSummary?.allyKpis?.checkedInMatches ?? 0,
    playersOnCourt: backendSummary?.allyKpis?.playersOnCourt ?? 0,
    pendingCheckInCount:
      backendSummary?.allyKpis?.pendingCheckInCount ??
      courtsRibbon.filter(
        (c) =>
          (c.status === "in-play" || c.status === "upcoming") && !c.checkInDone
      ).length,
    nextCheckInText: backendSummary?.allyKpis?.nextCheckInText,
    nextMatchTime: backendSummary?.allyKpis?.nextMatchTime,
    nextMatchDesc: backendSummary?.allyKpis?.nextMatchDesc,
    nextMatchCourt: backendSummary?.allyKpis?.nextMatchCourt,
    commissionPct: backendSummary?.allyKpis?.commissionPct ?? 5,
    netSharePct: backendSummary?.allyKpis?.netSharePct ?? 95,
    organizationName: backendSummary?.allyKpis?.organizationName,
    venuesCount: backendSummary?.allyKpis?.venuesCount ?? metrics.totalVenues,
  };

  return {
    perspective: isGlobalAdmin ? "ADMIN" : "ALLY",
    bcvRate,
    metrics,
    adminKpis,
    allyKpis,
    sportsDistribution,
    chartData,
    courtsRibbon,
    adminActivityFeed,
    allyActivityFeed,
  };
}
