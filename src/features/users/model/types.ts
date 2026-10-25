export type UserRole =
  | 'PLATFORM_ADMIN'
  | 'PLATFORM_ACCOUNTING'
  | 'ALLY_ADMIN'
  | 'ALLY_ACCOUNTING'
  | 'ALLY_VALIDATOR'
  | 'CLIENT';
export type DocumentType = 'V' | 'E' | 'J' | 'G' | 'P' | 'C';
export type GeneralStatus = 'ACTIVE' | 'INACTIVE' | 'IN_VERIFICATION' | 'INVITATION_PENDING';

export interface UserItem {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone: string;
  dni: string;
  documentType?: DocumentType;
  documentNumber?: string;
  role: UserRole;
  status: GeneralStatus | string;
  scopeType: 'ORGANIZATION' | 'VENUE' | 'PLATFORM';
  organizationId?: string | null;
  organizationName?: string;
  venueId?: string | null;
  venueName?: string;
  activeSessions: number;
  lastSession: string;
  isInvitation?: boolean;
  invitationId?: string;
}

export interface UsersKpi {
  totalStaff: number;
  frontdeskValidators: number;
  pendingInvitations: number;
  activeSessions: number;
}

export interface ActiveSessionItem {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  role: UserRole;
  deviceIp: string;
  userAgent: string;
  createdAt: string;
  expiresAt: string;
}

export interface InviteUserInput {
  name: string;
  lastName: string;
  email: string;
  phone: string;
  documentType: DocumentType;
  documentNumber: string;
  role: UserRole;
  managedVenueId?: string | null;
  deliveryMethod: 'magic_link' | 'temp_pass';
  tempPassword?: string;
}

export interface UpdateUserPrivilegesInput {
  role?: UserRole;
  managedVenueId?: string | null;
  status?: GeneralStatus;
}
