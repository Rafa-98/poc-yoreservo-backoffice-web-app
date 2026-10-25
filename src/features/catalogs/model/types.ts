export type EntityStatus = 'ENABLED' | 'DISABLED';

export interface LocalizedName {
  es: string;
  en: string;
}

export interface ActivityCategoryItem {
  id: string;
  name: LocalizedName | string;
  imageUrl?: string | null;
  status: EntityStatus;
  spacesCount?: number;
}

export interface ActivityItem {
  id: string;
  name: LocalizedName | string;
  imageUrl: string;
  status: EntityStatus;
  totalSpaces?: number;
  categories: ActivityCategoryItem[];
}

export interface ActivityTypeItem {
  id: string;
  code: string;
  name: LocalizedName | string;
  icon: string;
  activities: ActivityItem[];
}

export interface SurfaceItem {
  id: string;
  code: string;
  name: string;
  description: string;
  imageUrl?: string | null;
  maintenanceProtocol?: string;
  suitedSports: string[];
  status: EntityStatus;
  spacesCount?: number;
}

export interface AmenityItem {
  id: string;
  code: string;
  name: string;
  icon: string;
  description: string;
  suitedSports?: string[];
  activeVenuesCount?: number;
  spacesCount?: number;
  status: EntityStatus;
}

export interface CreateActivityInput {
  activityTypeId: string;
  name: LocalizedName;
  imageUrl: string;
  status?: EntityStatus;
}

export interface UpdateActivityInput {
  activityTypeId?: string;
  name?: LocalizedName;
  imageUrl?: string;
  status?: EntityStatus;
}

export interface CreateCategoryInput {
  activityId: string;
  name: LocalizedName;
  imageUrl?: string;
  status?: EntityStatus;
}

export interface UpdateCategoryInput {
  name?: LocalizedName;
  imageUrl?: string | null;
  status?: EntityStatus;
}

export interface CreateSurfaceInput {
  code?: string;
  name: string;
  description: string;
  imageUrl?: string | null;
  maintenanceProtocol?: string;
  suitedSports: string[];
  status?: EntityStatus;
}

export type UpdateSurfaceInput = Partial<CreateSurfaceInput>;

export interface CreateAmenityInput {
  code?: string;
  name: string;
  icon: string;
  description: string;
  suitedSports?: string[];
  status?: EntityStatus;
}

export type UpdateAmenityInput = Partial<CreateAmenityInput>;
