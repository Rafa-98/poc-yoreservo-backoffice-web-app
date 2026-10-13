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
  WeeklyScheduleData,
  WeeklySchedulesInput,
} from "../model/types";

async function getAuthToken(): Promise<string> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ACCESS_COOKIE_NAME)?.value;
  if (!token) throw new Error("Unauthorized");
  return token;
}

// =============================================================================
// ORGANIZATION ACTIONS
// =============================================================================

export async function getOrganizationAction(): Promise<ActionResult<OrganizationData>> {
  try {
    await requireSession();
    const accessToken = await getAuthToken();

    const res = await backendRequest("/backoffice/organization", { accessToken });
    if (!res.ok) {
      return fail("FAILED_TO_LOAD_ORGANIZATION");
    }

    return ok(res.body as OrganizationData);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "UNKNOWN_ERROR");
  }
}

export async function updateOrganizationAction(
  input: UpdateOrganizationInput
): Promise<ActionResult<OrganizationData>> {
  try {
    await requireSession();
    const accessToken = await getAuthToken();

    const res = await backendRequest("/backoffice/organization", {
      method: "PUT",
      accessToken,
      body: input,
    });

    if (!res.ok) {
      return fail("FAILED_TO_UPDATE_ORGANIZATION");
    }

    revalidatePath(ROUTES.venues);
    revalidatePath(ROUTES.spaces);
    revalidatePath(ROUTES.schedules);

    return ok(res.body as OrganizationData);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "UNKNOWN_ERROR");
  }
}

// =============================================================================
// VENUES ACTIONS
// =============================================================================

export async function getVenuesListAction(): Promise<ActionResult<any[]>> {
  try {
    await requireSession();
    const accessToken = await getAuthToken();

    const res = await backendRequest("/backoffice/venues", { accessToken });
    if (!res.ok) {
      return fail("FAILED_TO_LOAD_VENUES");
    }

    return ok((res.body as any[]) ?? []);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "UNKNOWN_ERROR");
  }
}

export async function createVenueAction(
  input: CreateVenueInput
): Promise<ActionResult<any>> {
  try {
    await requireSession();
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
    return ok(res.body);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "UNKNOWN_ERROR");
  }
}

export async function updateVenueAction(
  venueId: string,
  input: UpdateVenueInput
): Promise<ActionResult<any>> {
  try {
    await requireSession();
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
    return ok(res.body);
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
    await requireSession();
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
    await requireSession();
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
    await requireSession();
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
    await requireSession();
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
    await requireSession();
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

export async function updateSpaceSchedulesAction(
  spaceId: string,
  input: WeeklySchedulesInput
): Promise<ActionResult<any>> {
  try {
    await requireSession();
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

// =============================================================================
// CATALOGS & GEOGRAPHY HELPERS
// =============================================================================

export async function getLocationsTreeAction(): Promise<ActionResult<LocationNode[]>> {
  try {
    await requireSession();
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
    await requireSession();
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
