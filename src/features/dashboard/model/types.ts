export type RolePerspective = "ADMIN" | "ALLY";

export type TimeframeKey = "HOY" | "SEMANA" | "MES" | "ANO";

export interface TimeframeChartData {
  labels: string[];
  gmv: number[];
  fee: number[];
  peakText: string;
}

export type CourtStatusType = "in-play" | "upcoming" | "available";

export interface CourtRibbonItem {
  id: string;
  name: string;
  courtType: string;
  surface: string;
  status: CourtStatusType;
  timeSlot: string;
  customerName?: string;
  bookingCode?: string;
  amount?: number;
  ratePerHour?: number;
  freeSlotText?: string;
  checkInDone?: boolean;
}

export interface ActivityStreamItem {
  id: string;
  icon: string;
  bg: string;
  title: string;
  desc: string;
  time: string;
}

export interface DashboardMetrics {
  gmv: number;
  platformFeeRevenue: number;
  netPayout: number;
  totalReservations: number;
  totalVenues: number;
  totalSpaces: number;
}

export interface BackendDashboardSummary {
  perspective: "GLOBAL_ADMIN" | "ALLY";
  metrics: DashboardMetrics;
  courtsRibbon: Array<{
    id: string;
    name: string;
    venueName: string;
    category: string;
    surface: string | null;
    status: string;
  }>;
  recentBookings: Array<{
    id: string;
    shortCode: string;
    customerName: string;
    venueName: string;
    spaceName: string;
    totalAmount: number;
    status: string;
    createdAt: string;
  }>;
}

export interface ExecutiveDashboardData {
  perspective: RolePerspective;
  bcvRate: number;
  metrics: DashboardMetrics;
  chartData: Record<TimeframeKey, TimeframeChartData>;
  courtsRibbon: CourtRibbonItem[];
  adminActivityFeed: ActivityStreamItem[];
  allyActivityFeed: ActivityStreamItem[];
}
