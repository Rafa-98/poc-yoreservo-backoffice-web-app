export interface OrganizationData {
  id: string;
  tradeName: string;
  legalName: string;
  rif: string;
  contactEmail: string;
  contactPhone: string;
  fiscalAddress: string;
  referenceCurrencyCode: string; // 'USD' | 'EUR'
  payoutBank: string;
  payoutAccountNumber: string;
  payoutAccountType: string;
  payoutAccountHolder: string;
  payoutIdDocument?: string;
  commissionRate: number; // e.g. 0.05
  status: string;
  venuesCount: number;
  spacesCount: number;
}

export interface UpdateOrganizationInput {
  tradeName?: string;
  legalName?: string;
  rif?: string;
  contactEmail?: string;
  contactPhone?: string;
  fiscalAddress?: string;
  referenceCurrencyCode?: string;
  payoutBank?: string;
  payoutAccountNumber?: string;
  payoutAccountType?: string;
  payoutAccountHolder?: string;
  payoutIdDocument?: string;
}

export interface LocationNode {
  id: string;
  name: Record<string, string> | string;
  code: string | null;
  locationType: "COUNTRY" | "STATE" | "CITY" | "NEIGHBORHOOD";
  parentId: string | null;
  children?: LocationNode[];
}

export interface VenueItem {
  id: string;
  organizationId: string;
  name: string;
  rif: string;
  address: string;
  contactPhone: string;
  status: "ACTIVE" | "INACTIVE" | "PENDING_VERIFICATION";
  imageUrl: string | null;
  locationLat: number;
  locationLng: number;
  location?: any;
  spacesCount: number;
  sports: string[];
  staffCount: number;
}

export interface CreateVenueInput {
  name: string;
  rif: string;
  locationId: string;
  address: string;
  contactPhone: string;
  status?: "ACTIVE" | "INACTIVE" | "PENDING_VERIFICATION";
  imageUrl?: string;
  locationLat?: number;
  locationLng?: number;
}

export interface UpdateVenueInput {
  name?: string;
  rif?: string;
  locationId?: string;
  address?: string;
  contactPhone?: string;
  status?: "ACTIVE" | "INACTIVE" | "PENDING_VERIFICATION";
  imageUrl?: string;
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
  status: "ENABLED" | "DISABLED";
  activeBookingsCount: number;
}

export interface CreateSpaceInput {
  spaceNumber: string;
  activityCategoryId: string;
  pricePerHour: number;
  surfaceType?: string;
  capacity?: number;
  isCovered?: boolean;
}

export interface UpdateSpaceInput {
  spaceNumber?: string;
  activityCategoryId?: string;
  pricePerHour?: number;
  surfaceType?: string;
  capacity?: number;
  isCovered?: boolean;
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
}
