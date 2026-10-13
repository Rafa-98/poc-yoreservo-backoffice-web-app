"use server";

import { backendRequest } from "@/shared/api/index.server";
import { requireSession } from "@/shared/auth/index.server";
import type {
  BackendDashboardSummary,
  ExecutiveDashboardData,
  CourtRibbonItem,
  TimeframeKey,
  TimeframeChartData,
} from "../model/types";

const BCV_RATE = 40.0;

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

const DEFAULT_ADMIN_ACTIVITY_FEED = [
  {
    id: "feed-1",
    icon: "💳",
    bg: "rgba(16, 185, 129, 0.15)",
    title: "Pago Móvil Verificado (#AB4553)",
    desc: "Carlos Mendoza pagó $35.00 (Bs. 1,400.00) por Cancha 1 en Complejo Ávila.",
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

const DEFAULT_ALLY_ACTIVITY_FEED = [
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

import { cookies } from "next/headers";
import { ACCESS_COOKIE_NAME } from "@/shared/auth";

async function getAuthToken(): Promise<string | undefined> {
  try {
    const cookieStore = await cookies();
    return cookieStore.get(ACCESS_COOKIE_NAME)?.value;
  } catch {
    return undefined;
  }
}

export async function getDashboardSummaryAction(): Promise<ExecutiveDashboardData> {
  const session = await requireSession();
  const isGlobalAdmin = session.user.role === "ADMIN";
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

  const metrics = {
    gmv: backendSummary?.metrics?.gmv && backendSummary.metrics.gmv > 0
      ? backendSummary.metrics.gmv
      : 112450.0,
    platformFeeRevenue:
      backendSummary?.metrics?.platformFeeRevenue && backendSummary.metrics.platformFeeRevenue > 0
        ? backendSummary.metrics.platformFeeRevenue
        : 5622.5,
    netPayout:
      backendSummary?.metrics?.netPayout && backendSummary.metrics.netPayout > 0
        ? backendSummary.metrics.netPayout
        : 106827.5,
    totalReservations:
      backendSummary?.metrics?.totalReservations && backendSummary.metrics.totalReservations > 0
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

  return {
    perspective: isGlobalAdmin ? "ADMIN" : "ALLY",
    bcvRate: BCV_RATE,
    metrics,
    chartData: DEFAULT_CHART_DATA,
    courtsRibbon: DEFAULT_COURTS_RIBBON,
    adminActivityFeed: DEFAULT_ADMIN_ACTIVITY_FEED,
    allyActivityFeed: DEFAULT_ALLY_ACTIVITY_FEED,
  };
}
