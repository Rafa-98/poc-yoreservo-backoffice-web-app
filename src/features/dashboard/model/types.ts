export type RolePerspective = "ADMIN" | "ALLY";

export type TimeframeKey = "HOY" | "SEMANA" | "MES" | "ANO";

export interface TimeframeChartData {
  labels: string[];
  gmv: number[];
  fee: number[];
  peakText: string;
}

export type CourtStatusType = "in-play" | "upcoming" | "available" | "maintenance";

export interface CourtRibbonItem {
  id: string;
  reservationId?: string;
  name: string;
  venueName?: string;
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
  gmvGrowthPct?: string;
}

export interface AdminKpisData {
  gmvGrowthPct?: string;
  bookingsByTimeframe?: Record<TimeframeKey, number>;
  totalBookings?: number;
  totalVenues?: number;
  totalSpaces?: number;
  onboardingVenues?: number;
  activeVenuesCount?: number;
  fulfillmentPct?: string;
  pendingPaymentsCount?: number;
  pendingSettlementBatchesCount?: number;
  pendingSettlementAmountUsd?: number;
}

export interface AllyKpisData {
  occupiedSlots?: number;
  totalSlots?: number;
  availableWalkInSlots?: number;
  occupancyPct?: number;
  occupancyPeakPct?: string;
  todayNetRevenue?: number;
  checkedInMatches?: number;
  playersOnCourt?: number;
  pendingCheckInCount?: number;
  nextCheckInText?: string;
  nextMatchTime?: string;
  nextMatchDesc?: string;
  nextMatchCourt?: string;
  commissionPct?: number;
  netSharePct?: number;
  organizationName?: string;
  venuesCount?: number;
}

export interface SportDistributionItem {
  id?: string;
  key: string;
  name?: string;
  labelKey?: string;
  label?: string;
  percentage: number;
  count: number;
  peakHour?: string;
  occupancyPct?: number;
  barColorClass?: string;
  textColorClass?: string;
}

export interface SportsDistributionData {
  items: SportDistributionItem[];
  peakHoursTime?: string;
  peakHoursSub?: string;
  occupancyPct?: number;
}

export interface BackendDashboardSummary {
  perspective: "GLOBAL_ADMIN" | "ALLY";
  bcvRate?: number;
  metrics: DashboardMetrics;
  adminKpis?: Partial<AdminKpisData>;
  allyKpis?: Partial<AllyKpisData>;
  chartData?: Partial<Record<TimeframeKey, TimeframeChartData>>;
  sportsDistribution?: Partial<SportsDistributionData> | SportDistributionItem[];
  courtsRibbon: Array<{
    id: string;
    reservationId?: string;
    name: string;
    venueName?: string;
    category?: string;
    sport?: string;
    courtType?: string;
    surface: string | null;
    status: string;
    timeSlot?: string;
    player?: string;
    customerName?: string;
    bookingCode?: string;
    shortCode?: string;
    amount?: number;
    rate?: number;
    ratePerHour?: number;
    pricePerHour?: number;
    freeSlotText?: string;
    checkInDone?: boolean;
  }>;
  activityFeed?: ActivityStreamItem[];
  adminActivityFeed?: ActivityStreamItem[];
  allyActivityFeed?: ActivityStreamItem[];
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
  adminKpis: AdminKpisData;
  allyKpis: AllyKpisData;
  sportsDistribution: SportsDistributionData;
  chartData: Record<TimeframeKey, TimeframeChartData>;
  courtsRibbon: CourtRibbonItem[];
  adminActivityFeed: ActivityStreamItem[];
  allyActivityFeed: ActivityStreamItem[];
}

export type DashboardOverviewData = ExecutiveDashboardData;
