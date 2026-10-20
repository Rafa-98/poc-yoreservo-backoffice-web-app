export interface VenueRef {
  id: string;
  name: string;
  timezone?: string;
  status?: string;
}

export interface CourtShift {
  id: string;
  openTime: string;
  closeTime: string;
}

export interface CourtBlock {
  id: string;
  startTime: string;
  endTime: string;
  reason: string;
  notes?: string | null;
  creator?: string | null;
}

export interface CourtPayment {
  id: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  status: string;
  referenceNumber?: string | null;
  receiptUrl?: string | null;
}

export interface CourtReservation {
  id: string;
  shortCode: string;
  status: string;
  isManual: boolean;
  startTime: string;
  endTime: string;
  customerName: string;
  customerPhone?: string | null;
  totalAmount: number;
  currencyCode: string;
  internalNotes?: string | null;
  payments?: CourtPayment[];
}

export interface CourtSpace {
  id: string;
  spaceNumber: string;
  venueId?: string;
  venueName?: string;
  surfaceType?: string | null;
  isCovered: boolean;
  pricePerHour: number;
  currencyCode: string;
  category: any;
  activity: any;
  shifts: CourtShift[];
  blocks: CourtBlock[];
  reservations: CourtReservation[];
}


export interface AgendaKpis {
  totalAvailableSlots?: number;
  occupiedSlots?: number;
  occupancyRatePct?: number;
  paidBookingsCount?: number;
  estimatedRevenueUsd?: number;
  nextMatchTime?: string | null;
  nextMatchCourt?: string | null;
}

export interface AgendaData {
  venue: VenueRef;
  date: string;
  dayOfWeek: number;
  timezone?: string;
  timezoneOffset?: string;
  bcvRate?: number;
  kpis?: AgendaKpis;
  spaces: CourtSpace[];
}

export type SlotStatus =
  | "available"
  | "confirmed"
  | "hold"
  | "completed"
  | "blocked"
  | "closed";

export interface CellSlotInfo {
  hourStr: string;
  court: CourtSpace;
  status: SlotStatus;
  reservation?: CourtReservation;
  block?: CourtBlock;
}
