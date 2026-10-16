export type ProfileTab = "general" | "security" | "sessions";

export interface ProfileSessionItem {
  id: string;
  deviceIp: string;
  userAgent: string;
  isCurrent: boolean;
  createdAt: string;
  rotatedAt?: string | null;
  deviceLabel?: string;
  deviceType?: "desktop" | "mobile" | "tablet";
  location?: string;
  lastActiveText?: string;
}

export interface UserProfileData {
  id: string;
  name: string;
  lastName: string;
  fullName: string;
  email: string;
  documentType?: string | null;
  documentNumber?: string | null;
  phone?: string | null;
  imageUrl?: string | null;
  avatarUrl?: string | null;
  role: string;
  status: string;
  preferredLanguage: string;
  createdAt: string;
  organization?:
    | {
        id: string;
        tradeName: string;
        legalName: string;
        rif: string;
      }
    | string
    | null;
  managedVenue?:
    | {
        id: string;
        name: string;
      }
    | string
    | null;
  sessions: ProfileSessionItem[];
}

export interface UpdateProfileInput {
  name: string;
  lastName: string;
  phone?: string;
  documentType?: string;
  documentNumber?: string;
  preferredLanguage?: string;
  imageUrl?: string;
  avatarUrl?: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}
