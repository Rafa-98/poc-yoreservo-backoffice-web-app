"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { backendRequest } from "@/shared/api/index.server";
import { ACCESS_COOKIE_NAME } from "@/shared/auth";
import { requireSession } from "@/shared/auth/index.server";
import { fail, ok, type ActionResult } from "@/shared/lib";
import { ROUTES } from "@/shared/config";
import type {
  CreateSpaceInput,
  CreateVenueInput,
  LocationNode,
  OrganizationData,
  SpaceItem,
  SpaceStatusConflictResult,
  SportCategoryItem,
  UpdateOrganizationInput,
  UpdateSpaceInput,
  UpdateSpaceStatusInput,
  UpdateVenueInput,
  VenueItem,
  WeeklyScheduleData,
  WeeklySchedulesInput,
} from "../model/types";

async function getAuthToken(): Promise<string> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ACCESS_COOKIE_NAME)?.value;
  if (!token) throw new Error("Unauthorized");
  return token;
}

function mapVenueItem(v: any): VenueItem {
  const amenities = Array.isArray(v?.amenities)
    ? v.amenities
        .map((a: any) =>
          typeof a === "string"
            ? a
            : a?.name?.es || a?.name?.en || a?.name || String(a)
        )
        .filter(Boolean)
    : undefined;

  return {
    ...v,
    id: String(v?.id ?? ""),
    organizationId: String(v?.organizationId ?? ""),
    name: String(v?.name ?? ""),
    rif: String(v?.rif ?? ""),
    address: String(v?.address ?? ""),
    contactPhone: String(v?.contactPhone ?? ""),
    contactEmail: v?.contactEmail ? String(v.contactEmail) : undefined,
    status: v?.status ?? "ACTIVE",
    imageUrl: v?.imageUrl ?? null,
    locationLat: Number(v?.locationLat ?? 0),
    locationLng: Number(v?.locationLng ?? 0),
    location: v?.location,
    spacesCount: Number(v?.spacesCount ?? 0),
    sports: Array.isArray(v?.sports) ? v.sports : [],
    staffCount: Number(v?.staffCount ?? 0),
    amenities,
  };
}

function mapOrganizationData(raw: any): OrganizationData {
  const commissionRate = Number(raw?.commissionRate ?? raw?.manualCommissionRate ?? 0.05);
  return {
    id: String(raw?.id ?? ""),
    tradeName: String(raw?.tradeName ?? ""),
    legalName: String(raw?.legalName ?? ""),
    rif: String(raw?.rif ?? raw?.taxId ?? ""),
    taxId: raw?.taxId ? String(raw.taxId) : undefined,
    contactEmail: String(raw?.contactEmail ?? ""),
    contactPhone: String(raw?.contactPhone ?? raw?.pagoMovilPhone ?? ""),
    pagoMovilPhone: raw?.pagoMovilPhone
      ? String(raw.pagoMovilPhone)
      : raw?.contactPhone
      ? String(raw.contactPhone)
      : undefined,
    fiscalAddress: String(raw?.fiscalAddress ?? ""),
    referenceCurrencyCode: String(raw?.referenceCurrencyCode ?? "USD"),
    payoutBank: String(raw?.payoutBank ?? raw?.bankName ?? ""),
    bankName: raw?.bankName
      ? String(raw.bankName)
      : raw?.payoutBank
      ? String(raw.payoutBank)
      : undefined,
    payoutAccountNumber: String(raw?.payoutAccountNumber ?? ""),
    payoutAccountType: String(raw?.payoutAccountType ?? "Corriente"),
    payoutAccountHolder: String(raw?.payoutAccountHolder ?? ""),
    payoutIdDocument: raw?.payoutIdDocument ? String(raw.payoutIdDocument) : undefined,
    commissionRate,
    paymentCollectionMode:
      raw?.paymentCollectionMode === "ALLY_DIRECT"
        ? "ALLY_DIRECT"
        : "PLATFORM_CUSTODY",
    manualCommissionRate: Number(raw?.manualCommissionRate ?? commissionRate),
    minimumMonthlyFee: Number(raw?.minimumMonthlyFee ?? 20),
    isBookingPaused: Boolean(raw?.isBookingPaused),
    status: String(raw?.status ?? "ACTIVE"),
    venuesCount: Number(raw?.venuesCount ?? 0),
    spacesCount: Number(raw?.spacesCount ?? 0),
  };
}

// =============================================================================
// ORGANIZATION ACTIONS
// =============================================================================

export async function getOrganizationAction(): Promise<ActionResult<OrganizationData>> {
  try {
    await requireSession([
      "PLATFORM_ADMIN",
      "PLATFORM_ACCOUNTING",
      "ALLY_ADMIN",
      "ALLY_ACCOUNTING",
    ]);
    const accessToken = await getAuthToken();

    const res = await backendRequest("/backoffice/organization", { accessToken });
    if (!res.ok) {
      return fail("FAILED_TO_LOAD_ORGANIZATION");
    }

    return ok(mapOrganizationData(res.body));
  } catch (error) {
    return fail(error instanceof Error ? error.message : "UNKNOWN_ERROR");
  }
}

export async function updateOrganizationAction(
  input: UpdateOrganizationInput
): Promise<ActionResult<OrganizationData>> {
  try {
    await requireSession(["PLATFORM_ADMIN", "ALLY_ADMIN"]);
    const accessToken = await getAuthToken();

    const res = await backendRequest("/backoffice/organization", {
      method: "PUT",
      accessToken,
      body: input,
    });

    if (!res.ok) {
      const msg = (res.body as any)?.message || "FAILED_TO_UPDATE_ORGANIZATION";
      return fail(msg);
    }

    revalidatePath(ROUTES.venues);
    revalidatePath(ROUTES.spaces);
    revalidatePath(ROUTES.schedules);

    return ok(mapOrganizationData(res.body));
  } catch (error) {
    return fail(error instanceof Error ? error.message : "UNKNOWN_ERROR");
  }
}

// =============================================================================
// VENUES ACTIONS
// =============================================================================

export async function getVenuesListAction(): Promise<ActionResult<VenueItem[]>> {
  try {
    await requireSession([
      "PLATFORM_ADMIN",
      "PLATFORM_ACCOUNTING",
      "ALLY_ADMIN",
      "ALLY_ACCOUNTING",
      "ALLY_VALIDATOR",
    ]);
    const accessToken = await getAuthToken();

    const res = await backendRequest("/backoffice/venues", { accessToken });
    if (!res.ok) {
      return fail("FAILED_TO_LOAD_VENUES");
    }

    const raw = Array.isArray(res.body) ? res.body : [];
    return ok(raw.map(mapVenueItem));
  } catch (error) {
    return fail(error instanceof Error ? error.message : "UNKNOWN_ERROR");
  }
}

export async function createVenueAction(
  input: CreateVenueInput
): Promise<ActionResult<VenueItem>> {
  try {
    await requireSession(["PLATFORM_ADMIN", "ALLY_ADMIN"]);
    const accessToken = await getAuthToken();

    const res = await backendRequest("/backoffice/venues", {
      method: "POST",
      accessToken,
      body: input,
    });

    if (!res.ok) {
      return fail("FAILED_TO_CREATE_VENUE");
    }

    revalidatePath(ROUTES.venues);
    return ok(mapVenueItem(res.body));
  } catch (error) {
    return fail(error instanceof Error ? error.message : "UNKNOWN_ERROR");
  }
}

export async function updateVenueAction(
  venueId: string,
  input: UpdateVenueInput
): Promise<ActionResult<VenueItem>> {
  try {
    await requireSession(["PLATFORM_ADMIN", "ALLY_ADMIN"]);
    const accessToken = await getAuthToken();

    const res = await backendRequest(`/backoffice/venues/${venueId}`, {
      method: "PUT",
      accessToken,
      body: input,
    });

    if (!res.ok) {
      return fail("FAILED_TO_UPDATE_VENUE");
    }

    revalidatePath(ROUTES.venues);
    return ok(mapVenueItem(res.body));
  } catch (error) {
    return fail(error instanceof Error ? error.message : "UNKNOWN_ERROR");
  }
}

// =============================================================================
// SPACES ACTIONS
// =============================================================================

export async function getSpacesAction(
  venueId: string
): Promise<ActionResult<SpaceItem[]>> {
  try {
    await requireSession([
      "PLATFORM_ADMIN",
      "PLATFORM_ACCOUNTING",
      "ALLY_ADMIN",
      "ALLY_ACCOUNTING",
      "ALLY_VALIDATOR",
    ]);
    const accessToken = await getAuthToken();

    const res = await backendRequest(`/backoffice/venues/${venueId}/spaces`, {
      accessToken,
    });
    if (!res.ok) {
      return fail("FAILED_TO_LOAD_SPACES");
    }

    return ok((res.body as SpaceItem[]) ?? []);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "UNKNOWN_ERROR");
  }
}

export async function createSpaceAction(
  venueId: string,
  input: CreateSpaceInput
): Promise<ActionResult<SpaceItem>> {
  try {
    await requireSession(["PLATFORM_ADMIN", "ALLY_ADMIN"]);
    const accessToken = await getAuthToken();

    const res = await backendRequest(`/backoffice/venues/${venueId}/spaces`, {
      method: "POST",
      accessToken,
      body: input,
    });

    if (!res.ok) {
      return fail("FAILED_TO_CREATE_SPACE");
    }

    revalidatePath(ROUTES.spaces);
    revalidatePath(ROUTES.schedules);
    return ok(res.body as SpaceItem);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "UNKNOWN_ERROR");
  }
}

export async function updateSpaceAction(
  spaceId: string,
  input: UpdateSpaceInput
): Promise<ActionResult<SpaceItem>> {
  try {
    await requireSession(["PLATFORM_ADMIN", "ALLY_ADMIN"]);
    const accessToken = await getAuthToken();

    const res = await backendRequest(`/backoffice/spaces/${spaceId}`, {
      method: "PUT",
      accessToken,
      body: input,
    });

    if (!res.ok) {
      return fail("FAILED_TO_UPDATE_SPACE");
    }

    revalidatePath(ROUTES.spaces);
    revalidatePath(ROUTES.schedules);
    return ok(res.body as SpaceItem);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "UNKNOWN_ERROR");
  }
}

export async function updateSpaceStatusAction(
  spaceId: string,
  input: UpdateSpaceStatusInput
): Promise<ActionResult<SpaceStatusConflictResult>> {
  try {
    await requireSession(["PLATFORM_ADMIN", "ALLY_ADMIN"]);
    const accessToken = await getAuthToken();

    const res = await backendRequest(`/backoffice/spaces/${spaceId}/status`, {
      method: "PATCH",
      accessToken,
      body: input,
    });

    if (!res.ok) {
      return fail("FAILED_TO_UPDATE_SPACE_STATUS");
    }

    revalidatePath(ROUTES.spaces);
    return ok(res.body as SpaceStatusConflictResult);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "UNKNOWN_ERROR");
  }
}

// =============================================================================
// SCHEDULES ACTIONS
// =============================================================================

export async function getSpaceSchedulesAction(
  spaceId: string
): Promise<ActionResult<WeeklyScheduleData>> {
  try {
    await requireSession([
      "PLATFORM_ADMIN",
      "PLATFORM_ACCOUNTING",
      "ALLY_ADMIN",
      "ALLY_ACCOUNTING",
    ]);
    const accessToken = await getAuthToken();

    const res = await backendRequest(`/backoffice/spaces/${spaceId}/schedules`, {
      accessToken,
    });
    if (!res.ok) {
      return fail("FAILED_TO_LOAD_SCHEDULES");
    }

    return ok(res.body as WeeklyScheduleData);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "UNKNOWN_ERROR");
  }
}

export async function getWeeklySchedulesAction(
  spaceId: string
): Promise<ActionResult<WeeklyScheduleData>> {
  await requireSession([
    "PLATFORM_ADMIN",
    "PLATFORM_ACCOUNTING",
    "ALLY_ADMIN",
    "ALLY_ACCOUNTING",
  ]);
  return getSpaceSchedulesAction(spaceId);
}

export async function updateSpaceSchedulesAction(
  spaceId: string,
  input: WeeklySchedulesInput
): Promise<ActionResult<any>> {
  try {
    await requireSession(["PLATFORM_ADMIN", "ALLY_ADMIN"]);
    const accessToken = await getAuthToken();

    const res = await backendRequest(`/backoffice/spaces/${spaceId}/schedules`, {
      method: "PUT",
      accessToken,
      body: input,
    });

    if (!res.ok) {
      return fail("FAILED_TO_UPDATE_SCHEDULES");
    }

    revalidatePath(ROUTES.schedules);
    return ok(res.body);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "UNKNOWN_ERROR");
  }
}

export async function saveWeeklySchedulesAction(
  spaceId: string,
  input: WeeklySchedulesInput
): Promise<ActionResult<any>> {
  await requireSession(["PLATFORM_ADMIN", "ALLY_ADMIN"]);
  return updateSpaceSchedulesAction(spaceId, input);
}

// =============================================================================
// CATALOGS & GEOGRAPHY HELPERS
// =============================================================================

export async function getLocationsTreeAction(): Promise<ActionResult<LocationNode[]>> {
  try {
    await requireSession([
      "PLATFORM_ADMIN",
      "PLATFORM_ACCOUNTING",
      "ALLY_ADMIN",
      "ALLY_ACCOUNTING",
    ]);
    const accessToken = await getAuthToken();

    const res = await backendRequest("/backoffice/locations/tree", {
      accessToken,
    });
    if (!res.ok) {
      return fail("FAILED_TO_LOAD_LOCATIONS");
    }

    return ok((res.body as LocationNode[]) ?? []);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "UNKNOWN_ERROR");
  }
}

export async function getCategoriesAction(): Promise<ActionResult<SportCategoryItem[]>> {
  try {
    await requireSession([
      "PLATFORM_ADMIN",
      "PLATFORM_ACCOUNTING",
      "ALLY_ADMIN",
      "ALLY_ACCOUNTING",
    ]);
    const accessToken = await getAuthToken();

    const res = await backendRequest("/backoffice/categories", {
      accessToken,
    });
    if (!res.ok) {
      return fail("FAILED_TO_LOAD_CATEGORIES");
    }

    return ok((res.body as SportCategoryItem[]) ?? []);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "UNKNOWN_ERROR");
  }
}

export async function getSportCategoriesAction(): Promise<ActionResult<SportCategoryItem[]>> {
  await requireSession([
    "PLATFORM_ADMIN",
    "PLATFORM_ACCOUNTING",
    "ALLY_ADMIN",
    "ALLY_ACCOUNTING",
  ]);
  return getCategoriesAction();
}
