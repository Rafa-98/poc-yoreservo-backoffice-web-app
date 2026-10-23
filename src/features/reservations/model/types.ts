export type ReservationStatus =
  | 'PENDING_PAYMENT'
  | 'PAYMENT_UNDER_REVIEW'
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REJECTED';

export type CheckInMethod =
  | 'QR_SCANNER'
  | 'SHORT_CODE_MANUAL'
  | 'DNI_LOOKUP'
  | 'STAFF_OVERRIDE';

export interface ReservationItem {
  id: string;
  code: string;
  origin: 'app' | 'walk-in';
  clientName: string;
  dni: string;
  clientDni?: string;
  isFrequentPlayer?: boolean;
  phone: string;
  venueId: string;
  venue: string;
  court: string;
  sport: string;
  date: string;
  dateDisplay: string;
  timeSlot: string;
  duration: string;
  currencyCode: string;
  subtotalUsd: number;
  serviceFeeUsd: number;
  allyCommissionUsd: number;
  priceUsd: number;
  rateBcv: number;
  priceBs: number;
  paymentMethod: string;
  paymentMethodLabel: string;
  paymentBank?: string;
  paymentReference?: string;
  paymentMeta: string;
  status: ReservationStatus;
  checkedIn: boolean;
  checkedInBy?: string;
  validatedAt?: string;
  cancellationReason?: string;
}

export interface ReservationKpis {
  totalBookings: number;
  confirmedCount: number;
  walkinCount: number;
  volumeUsd: number;
  volumeVes: number;
  confirmedGrowthPct?: string;
  referenceCurrencyCode?: string;
}

export interface ReservationFilter {
  search?: string;
  dateFilter?: 'today' | 'tomorrow' | 'week' | 'month' | 'custom';
  customFromDate?: string;
  customToDate?: string;
  venueId?: string;
  sport?: string;
  paymentMethod?: string;
  status?: string;
}

export interface CreateWalkInReservationInput {
  spaceId: string;
  reservationDate: string;
  startTime: string;
  endTime: string;
  customerName: string;
  customerPhone?: string;
  customerDni?: string;
  customerDocumentType?: 'V' | 'E' | 'J' | 'G' | 'P' | 'C';
  customerDocumentNumber?: string;
  paymentMethod: 'CASH' | 'PAGO_MOVIL' | 'POS' | 'CARD' | 'ZELLE';
  referenceNumber?: string;
  originBank?: string;
  notes?: string;
  subtotalOverride?: number;
}

export function addDaysIsoDate(baseIso: string, deltaDays: number): string {
  const [y, m, d] = baseIso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + deltaDays));
  return dt.toISOString().slice(0, 10);
}

export function getCurrentWeekBounds(todayIso: string): { fromDate: string; toDate: string } {
  const [y, m, d] = todayIso.split('-').map(Number);
  const todayDate = new Date(Date.UTC(y, m - 1, d));
  const dayOfWeek = todayDate.getUTCDay(); // 0=Sun, 1=Mon...
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const fromDate = addDaysIsoDate(todayIso, diffToMonday);
  const toDate = addDaysIsoDate(fromDate, 6);
  return { fromDate, toDate };
}

export function resolveReservationDateRange(
  dateFilter: ReservationFilter['dateFilter'],
  todayIso: string,
  customFromDate?: string,
  customToDate?: string,
): { fromDate: string; toDate: string } {
  const weekBounds = getCurrentWeekBounds(todayIso);

  if (dateFilter === 'today') {
    return { fromDate: todayIso, toDate: todayIso };
  }
  if (dateFilter === 'tomorrow') {
    const tomorrowIso = addDaysIsoDate(todayIso, 1);
    return { fromDate: tomorrowIso, toDate: tomorrowIso };
  }
  if (dateFilter === 'month') {
    const [y, m] = todayIso.split('-').map(Number);
    const fromDate = `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-01`;
    const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const toDate = `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    return { fromDate, toDate };
  }
  if (dateFilter === 'custom') {
    const from = customFromDate || weekBounds.fromDate;
    const to = customToDate || weekBounds.toDate;
    return from <= to ? { fromDate: from, toDate: to } : { fromDate: to, toDate: from };
  }

  // Default: "week"
  return weekBounds;
}
