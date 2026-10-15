export type PaymentStatus = "PENDING" | "VERIFIED" | "REJECTED" | "FAILED";

export interface ClientRef {
  id: string;
  name: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface SpaceRef {
  id: string;
  spaceNumber: string;
  venue: {
    id: string;
    name: string;
  };
}

export interface ReservationRef {
  id: string;
  shortCode: string;
  status: string;
  reservationDate: string;
  startTime: string;
  endTime: string;
  client: ClientRef;
  space: SpaceRef;
}

export interface VerifierRef {
  id: string;
  name: string;
  lastName: string;
}

export interface PaymentItem {
  id: string;
  reservationId: string;
  referenceNumber: string | null;
  phoneNumber: string | null;
  originBank: string | null;
  payerIdDocument: string | null;
  payerDocumentType?: string | null;
  amount: number;
  amountVes: number | null;
  amountReference: number | null;
  currency: string;
  exchangeRate: number;
  paymentMethod: string;
  paymentDate: string;
  status: PaymentStatus;
  rejectionReason: string | null;
  receiptUrl: string | null;
  verifiedBy: string | null;
  verifiedAt: string | null;
  createdAt: string;
  collectionMode?: "PLATFORM_CUSTODY" | "ALLY_DIRECT";
  isDuplicateReference?: boolean;
  reservation: ReservationRef;
  verifier?: VerifierRef | null;
}

export type PaymentTransaction = PaymentItem;

export interface TreasuryKpis {
  pendingCount: number;
  pendingAmountBs: number;
  pendingAmountUsd: number;
  verifiedTodayCount: number;
  rejectedCount: number;
  averageSpeedMin: string;
}

export interface PaymentsInboxData {
  items: PaymentItem[];
  total: number;
  kpis: TreasuryKpis;
}

export interface ExchangeRateItem {
  id: string;
  currencyCode: string;
  targetCurrencyCode: string;
  rate: number;
  valueDate: string;
  isActive: boolean;
  generatedBy: "SYSTEM" | "MANUAL";
  notes?: string | null;
  sourceDetails?: string | null;
  createdAt: string;
  creator?: VerifierRef | null;
}

export interface SecondaryCurrency {
  currency: string;
  symbol: string;
  rate: string;
}

export interface ExchangeRateData {
  activeUsd: ExchangeRateItem | null;
  activeEur: ExchangeRateItem | null;
  history: ExchangeRateItem[];
  lastSync: string;
  secondaryCurrencies: SecondaryCurrency[];
}

export interface ManualRateOverrideInput {
  currencyCode: "USD" | "EUR";
  rate: number;
  valueDate: string;
  notes: string;
  sourceDetails?: string;
}

// ============================================================================
// Module 7: Ally Settlements & Treasury Disbursements
// ============================================================================

export type SettlementBatchStatus =
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "PAYMENT_UNDER_REVIEW"
  | "DISBURSED"
  | "OVERDUE"
  | "CANCELLED";

export type SettlementDirection = "PLATFORM_TO_ALLY" | "ALLY_TO_PLATFORM";

export type SettlementPayoutMethod = "BANK_TRANSFER" | "PAGO_MOVIL";

export interface SettlementOrganizationRef {
  id: string;
  tradeName: string;
  legalName: string;
  rif: string;
  payoutBank?: string | null;
  payoutAccountNumber?: string | null;
  payoutAccountType?: string | null;
  payoutIdDocument?: string | null;
  payoutAccountHolder?: string | null;
  contactPhone?: string | null;
}

export interface SettlementItemDetail {
  id: string;
  settlementBatchId: string;
  reservationId: string;
  paymentId?: string | null;
  courtSubtotal: number;
  serviceFee: number;
  netAllyAmount: number;
  createdAt: string;
  reservation?: {
    id: string;
    shortCode?: string;
    reservationDate?: string;
    startTime?: string;
    endTime?: string;
    client?: {
      id: string;
      name: string;
      lastName: string;
    };
    space?: {
      id: string;
      spaceNumber: string;
      activityCategory?: {
        name: string;
        activity?: {
          name: string;
        };
      };
    };
  };
  payment?: {
    id: string;
    paymentMethod: string;
    referenceNumber?: string | null;
    amount: number;
  } | null;
}

export interface SettlementBatchItem {
  id: string;
  batchCode: string;
  organizationId: string;
  organization: SettlementOrganizationRef;
  venueId?: string | null;
  venue?: {
    id: string;
    name: string;
  } | null;
  periodStartDate: string;
  periodEndDate: string;
  periodDisplay?: string;
  totalReservations: number;
  currencyCode: string;
  grossAmount: number;
  platformFeeAmount: number;
  netPayoutAmount: number;
  payoutCurrencyCode: string;
  payoutExchangeRate?: number | null;
  direction?: SettlementDirection;
  dueDate?: string | null;
  status: SettlementBatchStatus;
  payoutMethod?: SettlementPayoutMethod | null;
  payoutReferenceNumber?: string | null;
  payoutDestinationBank?: string | null;
  payoutReceiptUrl?: string | null;
  disbursedAt?: string | null;
  disbursedBy?: string | null;
  disburser?: {
    id: string;
    name: string;
    lastName: string;
  } | null;
  notes?: string | null;
  createdAt?: string;
  items?: SettlementItemDetail[];
}

export type SettlementBatch = SettlementBatchItem;

export interface SettlementsKpis {
  gmv: number;
  fee: number;
  pendingAmount: number;
  pendingCount: number;
  disbursedAmount: number;
  disbursedCount: number;
  totalBatches: number;
  completedBookingsCount: number;
  cycleProgress: {
    completedCount: number;
    totalCount: number;
    percentage: number;
    deadline: string;
  };
}

export interface SettlementFilter {
  search: string;
  period: string;
  organizationId: string;
  status: "ALL" | "PENDING" | "DISBURSED";
}

export interface DisburseSettlementInput {
  payoutMethod: SettlementPayoutMethod;
  payoutReferenceNumber: string;
  payoutDestinationBank: string;
  originAccount?: string;
  payoutDate?: string;
  payoutReceiptUrl?: string;
  notes?: string;
}

