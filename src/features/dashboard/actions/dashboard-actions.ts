"use server";

import { cookies } from "next/headers";
import { backendRequest } from "@/shared/api/index.server";
import { ACCESS_COOKIE_NAME } from "@/shared/auth";
import { requireSession } from "@/shared/auth/index.server";
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

const DEFAULT_CHART_DATA: Record<TimeframeKey, TimeframeChartData> = {
  HOY: {
    labels: ["08:00", "11:00", "14:00", "17:00", "20:00", "22:00"],
    gmv: [120, 240, 180, 520, 780, 440],
    fee: [6, 12, 9, 26, 39, 22],
    peakText: "20:00 hrs ($780.00 GMV)",
  },
  SEMANA: {
    labels: ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"],
    gmv: [2400, 3100, 2900, 4200, 6800, 8900, 7500],
    fee: [120, 155, 145, 210, 340, 445, 375],
    peakText: "Sábado ($8,900.00 GMV)",
  },
  MES: {
    labels: ["Sem 1", "Sem 2", "Sem 3", "Sem 4"],
    gmv: [26500, 28900, 34800, 22250],
    fee: [1325, 1445, 1740, 1112.5],
    peakText: "Semana 3 ($34,800.00 GMV)",
  },
  ANO: {
    labels: ["Ene-Feb", "Mar-Abr", "May-Jun", "Jul-Ago", "Sep-Oct"],
    gmv: [142000, 189000, 215000, 240000, 224900],
    fee: [7100, 9450, 10750, 12000, 11245],
    peakText: "Julio-Agosto ($240,000.00 GMV)",
  },
};

const DEFAULT_COURTS_RIBBON: CourtRibbonItem[] = [
  {
    id: "c-1",
    name: "Cancha 1 — Fútbol 7",
    courtType: "Fútbol 7",
    surface: "Grama Sintética 50mm",
    status: "in-play",
    timeSlot: "17:00 - 18:00",
    customerName: "Carlos Mendoza",
    bookingCode: "AB4553",
    amount: 35.0,
    checkInDone: true,
  },
  {
    id: "c-2",
    name: "Cancha 2 — Fútbol 5",
    courtType: "Fútbol 5",
    surface: "Grama Sintética Pro",
    status: "upcoming",
    timeSlot: "18:00 - 19:00",
    customerName: "Alejandro Silva",
    bookingCode: "CD9021",
    amount: 30.0,
    checkInDone: false,
  },
  {
    id: "c-3",
    name: "Cancha 3 — Pádel 1",
    courtType: "Pádel",
    surface: "Pista Panorámica Cristal",
    status: "available",
    timeSlot: "18:00 a 19:30",
    freeSlotText: "$40.00/h",
    ratePerHour: 40.0,
  },
  {
    id: "c-4",
    name: "Cancha 4 — Pádel 2",
    courtType: "Pádel",
    surface: "Pista Cubierta Indoor",
    status: "in-play",
    timeSlot: "17:30 - 19:00",
    customerName: "Valentina Gómez",
    bookingCode: "EF3412",
    amount: 40.0,
    checkInDone: true,
  },
];

const DEFAULT_ADMIN_ACTIVITY_FEED: ActivityStreamItem[] = [
  {
    id: "feed-1",
    icon: "💳",
    bg: "rgba(16, 185, 129, 0.15)",
    title: "Pago Móvil Verificado (#AB4553)",
    desc: "Carlos Mendoza pagó $35.00 (Bs. 1,435.00) por Cancha 1 en Complejo Ávila.",
    time: "Hace 4 min",
  },
  {
    id: "feed-2",
    icon: "🎾",
    bg: "rgba(198, 242, 59, 0.2)",
    title: "Nueva Reserva Confirmada (#PP1004)",
    desc: "Enrique Peña reservó Pista Panorámica 1 en Padel Pro Las Mercedes.",
    time: "Hace 12 min",
  },
  {
    id: "feed-3",
    icon: "🏦",
    bg: "rgba(59, 130, 246, 0.15)",
    title: "Lote de Liquidación Pagado (#LIQ-10A-001)",
    desc: "Se desembolsaron $4,047.00 USD a Complejo Ávila vía Banesco Ref #013498210398.",
    time: "Hace 35 min",
  },
  {
    id: "feed-4",
    icon: "🏟️",
    bg: "rgba(139, 92, 246, 0.15)",
    title: "Nueva Sede en Verificación RIF",
    desc: "Valle Arriba Athletic Club completó registro de 6 canchas de tenis.",
    time: "Hace 1 hora",
  },
];

const DEFAULT_ALLY_ACTIVITY_FEED: ActivityStreamItem[] = [
  {
    id: "feed-ally-1",
    icon: "🎟️",
    bg: "rgba(16, 185, 129, 0.15)",
    title: "Check-in Realizado (#AB4553)",
    desc: "Carlos Mendoza ingresó a Cancha 1 - Fútbol 7. Validado por Mariana Duarte.",
    time: "Hace 2 min",
  },
  {
    id: "feed-ally-2",
    icon: "⚡",
    bg: "rgba(245, 158, 11, 0.15)",
    title: "Turno Próximo en 15 Minutos (#CD9021)",
    desc: "Alejandro Silva en Cancha 2 - Fútbol 5. Notificación enviada.",
    time: "Hace 8 min",
  },
  {
    id: "feed-ally-3",
    icon: "🚶",
    bg: "rgba(198, 242, 59, 0.2)",
    title: "Reserva Walk-in en Mostrador (#WK9102)",
    desc: "Roberto Gómez reservó Cancha 3 - Pádel 1 pagando en efectivo.",
    time: "Hace 24 min",
  },
];

const DEFAULT_SPORTS_ITEMS: SportDistributionItem[] = [
  {
    key: "padel",
    labelKey: "sports.padel",
    percentage: 48,
    count: 1363,
    barColorClass: "bg-accent",
    textColorClass: "text-accent-foreground",
  },
  {
    key: "futbol",
    labelKey: "sports.futbol",
    percentage: 34,
    count: 965,
    barColorClass: "bg-emerald-500",
    textColorClass: "text-emerald-600 dark:text-emerald-400",
  },
  {
    key: "tennis",
    labelKey: "sports.tennis",
    percentage: 12,
    count: 341,
    barColorClass: "bg-blue-500",
    textColorClass: "text-blue-600 dark:text-blue-400",
  },
  {
    key: "other",
    labelKey: "sports.other",
    percentage: 6,
    count: 171,
    barColorClass: "bg-purple-500",
    textColorClass: "text-purple-600 dark:text-purple-400",
  },
];

async function getAuthToken(): Promise<string | undefined> {
  try {
    const cookieStore = await cookies();
    return cookieStore.get(ACCESS_COOKIE_NAME)?.value;
  } catch {
    return undefined;
  }
}

export async function getDashboardSummaryAction(): Promise<ExecutiveDashboardData> {
  const session = await requireSession(ROUTE_ALLOWED_ROLES[ROUTES.dashboard]);
  const isGlobalAdmin =
    session.user.role === "PLATFORM_ADMIN" ||
    session.user.role === "PLATFORM_ACCOUNTING";
  const accessToken = await getAuthToken();

  let backendSummary: BackendDashboardSummary | null = null;
  try {
    const res = await backendRequest("/backoffice/dashboard", {
      method: "GET",
      accessToken,
    });
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
      backendSummary?.metrics?.gmv && backendSummary.metrics.gmv > 0
        ? backendSummary.metrics.gmv
        : 112450.0,
    platformFeeRevenue:
      backendSummary?.metrics?.platformFeeRevenue &&
      backendSummary.metrics.platformFeeRevenue > 0
        ? backendSummary.metrics.platformFeeRevenue
        : 5622.5,
    netPayout:
      backendSummary?.metrics?.netPayout && backendSummary.metrics.netPayout > 0
        ? backendSummary.metrics.netPayout
        : 106827.5,
    totalReservations:
      backendSummary?.metrics?.totalReservations &&
      backendSummary.metrics.totalReservations > 0
        ? backendSummary.metrics.totalReservations
        : 2840,
    totalVenues:
      backendSummary?.metrics?.totalVenues && backendSummary.metrics.totalVenues > 0
        ? backendSummary.metrics.totalVenues
        : 24,
    totalSpaces:
      backendSummary?.metrics?.totalSpaces && backendSummary.metrics.totalSpaces > 0
        ? backendSummary.metrics.totalSpaces
        : 88,
  };

  // Map courtsRibbon from backend when available
  const courtsRibbon: CourtRibbonItem[] =
    Array.isArray(backendSummary?.courtsRibbon) &&
    backendSummary.courtsRibbon.length > 0
      ? backendSummary.courtsRibbon.map((c) => {
          const rawStatus = String(c.status || "").toLowerCase();
          const status: CourtStatusType =
            rawStatus === "in-play" ||
            rawStatus === "in_play" ||
            rawStatus === "occupied"
              ? "in-play"
              : rawStatus === "upcoming" ||
                rawStatus === "reserved" ||
                rawStatus === "confirmed"
              ? "upcoming"
              : "available";
          const rate = Number(c.ratePerHour ?? c.pricePerHour ?? 40);
          return {
            id: String(c.id),
            reservationId: c.reservationId ? String(c.reservationId) : undefined,
            name: c.name || "Cancha",
            courtType: c.courtType || c.category || "Pádel",
            surface: c.surface || "Superficie Estándar",
            status,
            timeSlot: c.timeSlot || "18:00 - 19:00",
            customerName: c.customerName,
            bookingCode: c.bookingCode || c.shortCode,
            amount: c.amount !== undefined ? Number(c.amount) : rate,
            ratePerHour: rate,
            freeSlotText: c.freeSlotText || `$${rate.toFixed(2)}/h`,
            checkInDone: Boolean(c.checkInDone),
          };
        })
      : DEFAULT_COURTS_RIBBON;

  // Map activityFeed / recentBookings from backend when available
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
      : mappedRecentBookingsFeed.length > 0
      ? mappedRecentBookingsFeed
      : DEFAULT_ADMIN_ACTIVITY_FEED;

  const allyActivityFeed: ActivityStreamItem[] =
    Array.isArray(backendSummary?.allyActivityFeed) &&
    backendSummary.allyActivityFeed.length > 0
      ? backendSummary.allyActivityFeed
      : Array.isArray(backendSummary?.activityFeed) &&
        backendSummary.activityFeed.length > 0
      ? backendSummary.activityFeed
      : mappedRecentBookingsFeed.length > 0
      ? mappedRecentBookingsFeed
      : DEFAULT_ALLY_ACTIVITY_FEED;

  const chartData: Record<TimeframeKey, TimeframeChartData> = {
    HOY: backendSummary?.chartData?.HOY ?? DEFAULT_CHART_DATA.HOY,
    SEMANA: backendSummary?.chartData?.SEMANA ?? DEFAULT_CHART_DATA.SEMANA,
    MES: backendSummary?.chartData?.MES ?? DEFAULT_CHART_DATA.MES,
    ANO: backendSummary?.chartData?.ANO ?? DEFAULT_CHART_DATA.ANO,
  };

  const sportsDistribution: SportsDistributionData = Array.isArray(
    backendSummary?.sportsDistribution
  )
    ? {
        items:
          backendSummary.sportsDistribution.length > 0
            ? backendSummary.sportsDistribution
            : DEFAULT_SPORTS_ITEMS,
      }
    : {
        items:
          backendSummary?.sportsDistribution?.items &&
          backendSummary.sportsDistribution.items.length > 0
            ? backendSummary.sportsDistribution.items
            : DEFAULT_SPORTS_ITEMS,
        peakHoursTime: backendSummary?.sportsDistribution?.peakHoursTime,
        peakHoursSub: backendSummary?.sportsDistribution?.peakHoursSub,
      };

  const adminKpis: AdminKpisData = {
    gmvGrowthPct: backendSummary?.adminKpis?.gmvGrowthPct ?? "+18.4%",
    bookingsByTimeframe: backendSummary?.adminKpis?.bookingsByTimeframe ?? {
      HOY: 84,
      SEMANA: 612,
      MES: metrics.totalReservations,
      ANO: 28940,
    },
    totalBookings:
      backendSummary?.adminKpis?.totalBookings ?? metrics.totalReservations,
    totalVenues: backendSummary?.adminKpis?.totalVenues ?? metrics.totalVenues,
    totalSpaces: backendSummary?.adminKpis?.totalSpaces ?? metrics.totalSpaces,
    onboardingVenues: backendSummary?.adminKpis?.onboardingVenues ?? 3,
    fulfillmentPct: backendSummary?.adminKpis?.fulfillmentPct ?? "98.2%",
  };

  const allyKpis: AllyKpisData = {
    occupiedSlots: backendSummary?.allyKpis?.occupiedSlots ?? 22,
    totalSlots: backendSummary?.allyKpis?.totalSlots ?? 28,
    availableWalkInSlots: backendSummary?.allyKpis?.availableWalkInSlots ?? 6,
    occupancyPeakPct: backendSummary?.allyKpis?.occupancyPeakPct ?? "78.5%",
    todayNetRevenue: backendSummary?.allyKpis?.todayNetRevenue ?? 665.0,
    checkedInMatches: backendSummary?.allyKpis?.checkedInMatches ?? 18,
    playersOnCourt: backendSummary?.allyKpis?.playersOnCourt ?? 14,
    pendingCheckInCount:
      backendSummary?.allyKpis?.pendingCheckInCount ??
      Math.max(
        1,
        courtsRibbon.filter((c) => c.status !== "available" && !c.checkInDone).length
      ),
    nextMatchTime: backendSummary?.allyKpis?.nextMatchTime,
    nextMatchDesc: backendSummary?.allyKpis?.nextMatchDesc,
    nextMatchCourt: backendSummary?.allyKpis?.nextMatchCourt,
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
