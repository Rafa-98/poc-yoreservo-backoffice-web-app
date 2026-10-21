"use server";

import { revalidatePath } from "next/cache";
import { backendRequest } from "@/shared/api/index.server";
import { requireSessionWithToken } from "@/shared/auth/index.server";
import { fail, ok, type ActionResult } from "@/shared/lib";
import { ROUTES } from "@/shared/config";
import type {
  CreateOrganizationInput,
  CreateSpaceInput,
  CreateVenueInput,
  LocationNode,
  OrganizationData,
  PaymentMethodConfigItem,
  SpaceItem,
  SpaceStatusConflictResult,
  SportCategoryItem,
  UpdateOrganizationInput,
  UpdateOrganizationStatusInput,
  UpdateSpaceInput,
  UpdateSpaceStatusInput,
  UpdateVenueInput,
  VenueItem,
  WeeklyScheduleData,
  WeeklySchedulesInput,
} from "../model/types";

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

  const loc = v?.location;
  let neighborhoodId: string | undefined = v?.neighborhoodId
    ? String(v.neighborhoodId)
    : undefined;
  let cityId: string | undefined = v?.cityId ? String(v.cityId) : undefined;
  let stateId: string | undefined = v?.stateId ? String(v.stateId) : undefined;
  let city: string | undefined = v?.city ? String(v.city) : undefined;

  if (loc) {
    if (loc.locationType === "NEIGHBORHOOD") {
      neighborhoodId = neighborhoodId || String(loc.id);
      if (loc.parent) {
        cityId = cityId || (loc.parent.id ? String(loc.parent.id) : undefined);
        const parentName = loc.parent.name;
        city =
          city ||
          (typeof parentName === "object"
            ? parentName?.es || parentName?.en
            : parentName
            ? String(parentName)
            : undefined);
        if (loc.parent.parent) {
          stateId =
            stateId ||
            (loc.parent.parent.id ? String(loc.parent.parent.id) : undefined);
        } else if (loc.parent.parentId) {
          stateId = stateId || String(loc.parent.parentId);
        }
      } else if (loc.parentId) {
        cityId = cityId || String(loc.parentId);
      }
    } else if (loc.locationType === "CITY") {
      cityId = cityId || String(loc.id);
      const locName = loc.name;
      city =
        city ||
        (typeof locName === "object"
          ? locName?.es || locName?.en
          : locName
          ? String(locName)
          : undefined);
      stateId =
        stateId ||
        (loc.parent?.id
          ? String(loc.parent.id)
          : loc.parentId
          ? String(loc.parentId)
          : undefined);
    } else if (loc.locationType === "STATE") {
      stateId = stateId || String(loc.id);
    } else if (!neighborhoodId && loc.id) {
      neighborhoodId = String(loc.id);
    }
  }

  return {
    ...v,
    id: String(v?.id ?? ""),
    organizationId: String(v?.organizationId ?? ""),
    name: String(v?.name ?? ""),
    rif: String(v?.rif ?? ""),
    address: String(v?.address ?? ""),
    contactPhone: String(v?.contactPhone ?? ""),
    contactEmail: v?.contactEmail ? String(v.contactEmail) : undefined,
    timezone: v?.timezone ? String(v.timezone) : "America/Caracas",
    status: v?.status ?? "ACTIVE",
    imageUrl: v?.imageUrl ?? null,
    locationLat: Number(v?.locationLat ?? 0),
    locationLng: Number(v?.locationLat ? v?.locationLng ?? 0 : v?.locationLng ?? 0),
    locationId: v?.locationId
      ? String(v.locationId)
      : neighborhoodId || cityId || stateId,
    neighborhoodId,
    cityId,
    stateId,
    city,
    location: v?.location,
    spacesCount: Number(v?.spacesCount ?? 0),
    sports: Array.isArray(v?.sports) ? v.sports : [],
    staffCount: Number(v?.staffCount ?? 0),
    amenities,
  };
}

function mapOrganizationData(raw: any): OrganizationData {
  const rawRate = Number(raw?.commissionRate ?? 5);
  const commissionPct =
    raw?.commissionPct !== undefined
      ? Number(raw.commissionPct)
      : rawRate > 1 || rawRate === 0
      ? Math.round(rawRate * 10) / 10
      : Math.round(rawRate * 100);
  const commissionRate =
    rawRate > 1 ? rawRate / 100 : rawRate;

  return {
    id: String(raw?.id ?? ""),
    tradeName: String(raw?.tradeName ?? ""),
    legalName: String(raw?.legalName ?? ""),
    rif: String(raw?.rif ?? raw?.taxId ?? ""),
    taxId: raw?.taxId ? String(raw.taxId) : undefined,
    contactEmail: String(raw?.contactEmail ?? ""),
    contactPhone: String(raw?.contactPhone ?? raw?.pagoMovilPhone ?? raw?.payoutPhoneNumber ?? ""),
    pagoMovilPhone: raw?.pagoMovilPhone
      ? String(raw.pagoMovilPhone)
      : raw?.payoutPhoneNumber
      ? String(raw.payoutPhoneNumber)
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
    commissionPct,
    paymentCollectionMode:
      raw?.paymentCollectionMode === "ALLY_DIRECT"
        ? "ALLY_DIRECT"
        : "PLATFORM_CUSTODY",
    manualCommissionRate: Number(raw?.manualCommissionRate ?? 0),
    minimumMonthlyFee: Number(raw?.minimumMonthlyFee ?? 0),
    isBookingPaused: Boolean(raw?.isBookingPaused),
    status: String(raw?.status ?? "ACTIVE"),
    venuesCount: Number(raw?.venuesCount ?? 0),
    spacesCount: Number(raw?.spacesCount ?? 0),
    paymentMethodConfigs: Array.isArray(raw?.paymentMethodConfigs)
      ? raw.paymentMethodConfigs
      : undefined,
    platformPaymentMethodConfigs: Array.isArray(raw?.platformPaymentMethodConfigs)
      ? raw.platformPaymentMethodConfigs
      : undefined,
    organizations: Array.isArray(raw?.organizations)
      ? raw.organizations.map((o: any) => {
          const oRate = Number(o?.commissionRate ?? 5);
          return {
            id: String(o?.id ?? ""),
            tradeName: String(o?.tradeName || o?.legalName || ""),
            legalName: o?.legalName ? String(o.legalName) : undefined,
            rif: o?.rif ? String(o.rif) : undefined,
            status: o?.status ? String(o.status) : "ACTIVE",
            isBookingPaused: Boolean(o?.isBookingPaused),
            paymentCollectionMode:
              o?.paymentCollectionMode === "ALLY_DIRECT"
                ? "ALLY_DIRECT"
                : "PLATFORM_CUSTODY",
            commissionRate: oRate > 1 ? oRate / 100 : oRate,
            referenceCurrencyCode: o?.referenceCurrencyCode
              ? String(o.referenceCurrencyCode)
              : "USD",
            contactEmail: o?.contactEmail ? String(o.contactEmail) : undefined,
            contactPhone: o?.contactPhone ? String(o.contactPhone) : undefined,
            venuesCount:
              o?.venuesCount !== undefined
                ? Number(o.venuesCount)
                : Array.isArray(o?.venues)
                ? o.venues.length
                : undefined,
          };
        })
      : undefined,
  };
}

// =============================================================================
// ORGANIZATION ACTIONS
// =============================================================================

export async function getOrganizationAction(
  organizationId?: string
): Promise<ActionResult<OrganizationData>> {
  const { accessToken } = await requireSessionWithToken([
    "PLATFORM_ADMIN",
    "PLATFORM_ACCOUNTING",
    "ALLY_ADMIN",
    "ALLY_ACCOUNTING",
  ]);
  try {
    const query = organizationId
      ? `?organizationId=${encodeURIComponent(organizationId)}`
      : "";
    const res = await backendRequest(`/backoffice/organization${query}`, {
      accessToken,
    });
    if (!res.ok) {
      return fail("FAILED_TO_LOAD_ORGANIZATION");
    }

    return ok(mapOrganizationData(res.body));
  } catch (error) {
    return fail(error instanceof Error ? error.message : "UNKNOWN_ERROR");
  }
}

export async function createOrganizationAction(
  input: CreateOrganizationInput
): Promise<ActionResult<OrganizationData>> {
  const { accessToken } = await requireSessionWithToken(["PLATFORM_ADMIN"]);
  try {
    const res = await backendRequest("/backoffice/organizations", {
      method: "POST",
      accessToken,
      body: input,
    });

    if (!res.ok) {
      const msg = (res.body as any)?.message || "FAILED_TO_CREATE_ORGANIZATION";
      return fail(msg);
    }

    revalidatePath(ROUTES.organization);
    revalidatePath(ROUTES.venues);
    revalidatePath(ROUTES.spaces);
    revalidatePath(ROUTES.schedules);

    return ok(mapOrganizationData(res.body));
  } catch (error) {
    return fail(error instanceof Error ? error.message : "UNKNOWN_ERROR");
  }
}

export async function updateOrganizationStatusAction(
  organizationId: string,
  input: UpdateOrganizationStatusInput
): Promise<ActionResult<OrganizationData>> {
  const { accessToken } = await requireSessionWithToken(["PLATFORM_ADMIN"]);
  try {
    const res = await backendRequest(
      `/backoffice/organizations/${encodeURIComponent(organizationId)}/status`,
      {
        method: "PATCH",
        accessToken,
        body: input,
      }
    );

    if (!res.ok) {
      const msg =
        (res.body as any)?.message || "FAILED_TO_UPDATE_ORGANIZATION_STATUS";
      return fail(msg);
    }

    revalidatePath(ROUTES.organization);
    revalidatePath(ROUTES.venues);
    revalidatePath(ROUTES.spaces);
    revalidatePath(ROUTES.schedules);

    return ok(mapOrganizationData(res.body));
  } catch (error) {
    return fail(error instanceof Error ? error.message : "UNKNOWN_ERROR");
  }
}

export async function updateOrganizationAction(
  input: UpdateOrganizationInput,
  organizationId?: string
): Promise<ActionResult<OrganizationData>> {
  const { accessToken } = await requireSessionWithToken(["PLATFORM_ADMIN", "ALLY_ADMIN"]);
  try {
    const targetOrgId = organizationId || input.organizationId;
    const query = targetOrgId
      ? `?organizationId=${encodeURIComponent(targetOrgId)}`
      : "";
    const res = await backendRequest(`/backoffice/organization${query}`, {
      method: "PUT",
      accessToken,
      body: targetOrgId ? { ...input, organizationId: targetOrgId } : input,
    });

    if (!res.ok) {
      const msg = (res.body as any)?.message || "FAILED_TO_UPDATE_ORGANIZATION";
      return fail(msg);
    }

    revalidatePath(ROUTES.organization);
    revalidatePath(ROUTES.venues);
    revalidatePath(ROUTES.spaces);
    revalidatePath(ROUTES.schedules);

    return ok(mapOrganizationData(res.body));
  } catch (error) {
    return fail(error instanceof Error ? error.message : "UNKNOWN_ERROR");
  }
}

export async function getPaymentMethodConfigsAction(
  scope: "PLATFORM" | "ORGANIZATION",
  organizationId?: string
): Promise<ActionResult<PaymentMethodConfigItem[]>> {
  const { accessToken } = await requireSessionWithToken([
    "PLATFORM_ADMIN",
    "PLATFORM_ACCOUNTING",
    "ALLY_ADMIN",
    "ALLY_ACCOUNTING",
  ]);
  try {
    const params = new URLSearchParams();
    params.set("scope", scope);
    if (organizationId) params.set("organizationId", organizationId);
    const res = await backendRequest(
      `/backoffice/payment-methods?${params.toString()}`,
      { accessToken }
    );
    if (!res.ok) {
      const msg = (res.body as any)?.message || "FAILED_TO_LOAD_PAYMENT_METHODS";
      return fail(msg);
    }
    const methods = Array.isArray((res.body as any)?.methods)
      ? (res.body as any).methods
      : [];
    return ok(methods);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "UNKNOWN_ERROR");
  }
}

export async function updatePaymentMethodConfigsAction(input: {
  scope: "PLATFORM" | "ORGANIZATION";
  organizationId?: string;
  methods: PaymentMethodConfigItem[];
}): Promise<ActionResult<PaymentMethodConfigItem[]>> {
  const { accessToken } = await requireSessionWithToken([
    "PLATFORM_ADMIN",
    "PLATFORM_ACCOUNTING",
    "ALLY_ADMIN",
  ]);
  try {
    const res = await backendRequest("/backoffice/payment-methods", {
      method: "PUT",
      accessToken,
      body: input,
    });
    if (!res.ok) {
      const msg =
        (res.body as any)?.message || "FAILED_TO_UPDATE_PAYMENT_METHODS";
      return fail(msg);
    }
    revalidatePath(ROUTES.organization);
    const methods = Array.isArray((res.body as any)?.methods)
      ? (res.body as any).methods
      : [];
    return ok(methods);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "UNKNOWN_ERROR");
  }
}

// =============================================================================
// VENUES ACTIONS
// =============================================================================

export async function getVenuesListAction(): Promise<ActionResult<VenueItem[]>> {
  const { accessToken } = await requireSessionWithToken([
    "PLATFORM_ADMIN",
    "PLATFORM_ACCOUNTING",
    "ALLY_ADMIN",
    "ALLY_ACCOUNTING",
    "ALLY_VALIDATOR",
  ]);
  try {
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
  const { accessToken } = await requireSessionWithToken(["PLATFORM_ADMIN", "ALLY_ADMIN"]);
  try {
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
  const { accessToken } = await requireSessionWithToken(["PLATFORM_ADMIN", "ALLY_ADMIN"]);
  try {
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
  venueId?: string
): Promise<ActionResult<SpaceItem[]>> {
  const { accessToken } = await requireSessionWithToken([
    "PLATFORM_ADMIN",
    "PLATFORM_ACCOUNTING",
    "ALLY_ADMIN",
    "ALLY_ACCOUNTING",
    "ALLY_VALIDATOR",
  ]);
  try {
    const targetVenue = !venueId || venueId === "ALL" ? "ALL" : venueId;
    let res = await backendRequest(`/backoffice/venues/${targetVenue}/spaces`, {
      accessToken,
    });
    if (!res.ok && targetVenue === "ALL") {
      res = await backendRequest("/backoffice/spaces", { accessToken });
    }
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
  const { accessToken } = await requireSessionWithToken(["PLATFORM_ADMIN", "ALLY_ADMIN"]);
  try {
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
  const { accessToken } = await requireSessionWithToken(["PLATFORM_ADMIN", "ALLY_ADMIN"]);
  try {
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
  const { accessToken } = await requireSessionWithToken(["PLATFORM_ADMIN", "ALLY_ADMIN"]);
  try {
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
  const { accessToken } = await requireSessionWithToken([
    "PLATFORM_ADMIN",
    "PLATFORM_ACCOUNTING",
    "ALLY_ADMIN",
    "ALLY_ACCOUNTING",
  ]);
  try {
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
  return getSpaceSchedulesAction(spaceId);
}

export async function updateSpaceSchedulesAction(
  spaceId: string,
  input: WeeklySchedulesInput
): Promise<ActionResult<any>> {
  const { accessToken } = await requireSessionWithToken(["PLATFORM_ADMIN", "ALLY_ADMIN"]);
  try {
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
  return updateSpaceSchedulesAction(spaceId, input);
}

// =============================================================================
// CATALOGS & GEOGRAPHY HELPERS
// =============================================================================

export async function getLocationsTreeAction(): Promise<ActionResult<LocationNode[]>> {
  const { accessToken } = await requireSessionWithToken([
    "PLATFORM_ADMIN",
    "PLATFORM_ACCOUNTING",
    "ALLY_ADMIN",
    "ALLY_ACCOUNTING",
  ]);
  try {
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
  const { accessToken } = await requireSessionWithToken([
    "PLATFORM_ADMIN",
    "PLATFORM_ACCOUNTING",
    "ALLY_ADMIN",
    "ALLY_ACCOUNTING",
  ]);
  try {
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
  return getCategoriesAction();
}
