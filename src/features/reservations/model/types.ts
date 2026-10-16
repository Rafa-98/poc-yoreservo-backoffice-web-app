export type ReservationStatus =
  | 'PENDING_PAYMENT'
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
  priceUsd: number;
  rateBcv: number;
  priceBs: number;
  paymentMethod: string;
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
}

export interface ReservationFilter {
  search?: string;
  dateFilter?: 'all' | 'today' | 'tomorrow' | 'week' | 'month';
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
  paymentMethod: 'CASH' | 'PAGO_MOVIL' | 'POS' | 'CARD';
  referenceNumber?: string;
  notes?: string;
}
