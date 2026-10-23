export type PaymentCollectionMode = "PLATFORM_CUSTODY" | "ALLY_DIRECT";

export type PaymentMethodType =
  | "PAGO_MOVIL"
  | "ZELLE"
  | "PIPOL_PAY"
  | "CASH"
  | "CARD";

export interface PaymentMethodConfigItem {
  id?: string;
  organizationId?: string | null;
  method: PaymentMethodType;
  isEnabled: boolean;
  bankCode?: string | null;
  bankName?: string | null;
  phone?: string | null;
  documentId?: string | null;
  email?: string | null;
  beneficiaryName?: string | null;
  instructions?: string | null;
}

export interface OrganizationSummaryItem {
  id: string;
  tradeName: string;
  legalName?: string;
  rif?: string;
  fiscalAddress?: string;
  status?: string;
  isBookingPaused?: boolean;
  paymentCollectionMode?: PaymentCollectionMode;
  commissionRate?: number;
  referenceCurrencyCode?: string;
  contactEmail?: string;
  contactPhone?: string;
  venuesCount?: number;
  venues?: Array<{
    id?: string;
    name?: string;
    address?: string;
    location?: any;
  }>;
}

export interface OrganizationData {
  id: string;
  tradeName: string;
  legalName: string;
  rif: string;
  taxId?: string;
  contactEmail: string;
  contactPhone: string;
  pagoMovilPhone?: string;
  fiscalAddress: string;
  referenceCurrencyCode: string; // 'USD' | 'EUR'
  payoutBank: string;
  bankName?: string;
  payoutAccountNumber: string;
  payoutAccountType: string;
  payoutAccountHolder: string;
  payoutIdDocument?: string;
  payoutPhoneNumber?: string;
  preferredPayoutMethod?: "BANK_TRANSFER" | "PAGO_MOVIL";
  payoutPagoMovilBank?: string;
  payoutPagoMovilIdDocument?: string;
  payoutPagoMovilHolder?: string;
  commissionRate: number; // e.g. 0.05
  commissionPct?: number; // e.g. 5
  paymentCollectionMode: PaymentCollectionMode;
  manualCommissionRate: number;
  minimumMonthlyFee: number;
  isBookingPaused?: boolean;
  status: string;
  venuesCount: number;
  spacesCount: number;
  paymentMethodConfigs?: PaymentMethodConfigItem[];
  platformPaymentMethodConfigs?: PaymentMethodConfigItem[];
  platformConfig?: PlatformConfigData;
  organizations?: OrganizationSummaryItem[];
}

export interface PlatformConfigData {
  supportWhatsapp: string;
  supportEmail: string;
}

export interface CreateOrganizationInput {
  tradeName: string;
  legalName: string;
  rif: string;
  contactEmail: string;
  contactPhone: string;
  fiscalAddress?: string;
  referenceCurrencyCode?: string;
  commissionRate?: number;
  manualCommissionRate?: number;
  minimumMonthlyFee?: number;
  paymentCollectionMode?: PaymentCollectionMode;
  payoutBank?: string;
  payoutAccountNumber?: string;
  payoutAccountType?: string;
  payoutAccountHolder?: string;
  payoutIdDocument?: string;
  payoutPhoneNumber?: string;
  preferredPayoutMethod?: "BANK_TRANSFER" | "PAGO_MOVIL";
  payoutPagoMovilBank?: string;
  payoutPagoMovilIdDocument?: string;
  payoutPagoMovilHolder?: string;
}

export interface UpdateOrganizationStatusInput {
  status?: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  isBookingPaused?: boolean;
}

export interface UpdateOrganizationInput {
  organizationId?: string;
  tradeName?: string;
  legalName?: string;
  rif?: string;
  contactEmail?: string;
  contactPhone?: string;
  pagoMovilPhone?: string;
  fiscalAddress?: string;
  referenceCurrencyCode?: string;
  payoutBank?: string;
  bankName?: string;
  payoutAccountNumber?: string;
  payoutAccountType?: string;
  payoutAccountHolder?: string;
  payoutIdDocument?: string;
  payoutPhoneNumber?: string;
  preferredPayoutMethod?: "BANK_TRANSFER" | "PAGO_MOVIL";
  payoutPagoMovilBank?: string;
  payoutPagoMovilIdDocument?: string;
  payoutPagoMovilHolder?: string;
  paymentCollectionMode?: PaymentCollectionMode;
  manualCommissionRate?: number;
  minimumMonthlyFee?: number;
  isBookingPaused?: boolean;
}


export interface LocationNode {
  id: string;
  name: Record<string, string> | string;
  code: string | null;
  locationType: "COUNTRY" | "STATE" | "CITY" | "NEIGHBORHOOD";
  parentId: string | null;
  children?: LocationNode[];
}

export type VenueStatusType =
  | "ACTIVE"
  | "INACTIVE"
  | "IN_VERIFICATION"
  | "PENDING_VERIFICATION";

export interface VenueItem {
  id: string;
  organizationId: string;
  referenceCurrencyCode?: string;
  name: string;
  rif: string;
  address: string;
  contactPhone: string;
  contactPhones?: string[];
  contactEmail?: string | null;
  contactEmails?: string[];
  timezone?: string;
  status: VenueStatusType;
  imageUrl: string | null;
  locationLat: number;
  locationLng: number;
  locationId?: string;
  neighborhoodId?: string;
  cityId?: string;
  stateId?: string;
  city?: string;
  location?: any;
  spacesCount: number;
  sports: string[];
  staffCount: number;
  amenities?: string[];
}

export interface CreateVenueInput {
  name: string;
  rif?: string;
  locationId: string;
  address: string;
  contactPhone: string;
  contactPhones?: string[];
  contactEmail?: string;
  contactEmails?: string[];
  timezone?: string;
  status?: VenueStatusType;
  imageUrl?: string;
  locationLat?: number;
  locationLng?: number;
  amenities?: string[];
}

export interface UpdateVenueInput {
  name?: string;
  rif?: string;
  locationId?: string;
  address?: string;
  contactPhone?: string;
  contactPhones?: string[];
  contactEmail?: string;
  contactEmails?: string[];
  timezone?: string;
  status?: VenueStatusType;
  imageUrl?: string;
  locationLat?: number;
  locationLng?: number;
  amenities?: string[];
}

export interface SportCategoryItem {
  id: string;
  activityId: string;
  name: Record<string, string> | string;
  status: string;
  activity?: {
    id: string;
    name: Record<string, string> | string;
  };
}

export interface SpaceItem {
  id: string;
  venueId: string;
  venueName?: string;
  venue?: {
    id: string;
    name: string;
  };
  spaceNumber: string;

  activityCategoryId: string;
  activityCategory?: {
    id: string;
    name: Record<string, string> | string;
    activity?: {
      name: Record<string, string> | string;
    };
  };
  pricePerHour: number;
  currencyCode: string;
  surfaceType: string | null;
  capacity: number | null;
  isCovered: boolean;
  amenities?: string[];
  imageUrl?: string | null;
  images?: string[];
  status: "ENABLED" | "DISABLED";
  activeBookingsCount: number;
  openDaysCount?: number;
  weeklyHours?: number;
}

export interface CreateSpaceInput {
  spaceNumber: string;
  activityCategoryId: string;
  pricePerHour: number;
  surfaceType?: string;
  capacity?: number;
  isCovered?: boolean;
  amenities?: string[];
  status?: "ENABLED" | "DISABLED";
  imageUrl?: string;
}

export interface UpdateSpaceInput {
  spaceNumber?: string;
  activityCategoryId?: string;
  pricePerHour?: number;
  surfaceType?: string;
  capacity?: number;
  isCovered?: boolean;
  amenities?: string[];
  status?: "ENABLED" | "DISABLED";
  imageUrl?: string;
}

export interface UpdateSpaceStatusInput {
  status: "ENABLED" | "DISABLED";
  safetyAction?: "reassign" | "defer" | "cancel";
}

export interface SpaceStatusConflictResult {
  conflict: boolean;
  activeBookingsCount?: number;
  space?: SpaceItem;
}

export interface ShiftRange {
  openTime: string; // HH:mm
  closeTime: string; // HH:mm
  isEnabled?: boolean;
}

export interface DaySchedule {
  dayOfWeek: number; // 0=Sunday, 1=Monday ... 6=Saturday
  isOpen: boolean;
  enabled?: boolean;
  shifts?: ShiftRange[];
  shift1: ShiftRange;
  shift2?: ShiftRange;
}

export interface WeeklyScheduleData {
  spaceId: string;
  days: DaySchedule[];
}

export interface WeeklySchedulesInput {
  days: DaySchedule[];
  applyToAllVenueSpaces?: boolean;
  alsoApplyToSameSportInVenue?: boolean;
  targetSpaceIds?: string[];
  enableSpace?: boolean;
}
