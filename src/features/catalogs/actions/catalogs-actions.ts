"use server";

import { revalidatePath } from "next/cache";
import { backendRequest } from "@/shared/api/index.server";
import { requireSessionWithToken } from "@/shared/auth/index.server";
import { fail, ok, type ActionResult } from "@/shared/lib";
import type {
  ActivityCategoryItem,
  ActivityItem,
  ActivityTypeItem,
  AmenityItem,
  CreateActivityInput,
  CreateAmenityInput,
  CreateCategoryInput,
  CreateSurfaceInput,
  SurfaceItem,
  UpdateActivityInput,
  UpdateAmenityInput,
  UpdateCategoryInput,
  UpdateSurfaceInput,
} from "../model/types";

const CATALOG_READ_ROLES = [
  "PLATFORM_ADMIN",
  "PLATFORM_ACCOUNTING",
  "ALLY_ADMIN",
  "ALLY_ACCOUNTING",
  "ALLY_VALIDATOR",
] as const;

export async function getTaxonomyAction(): Promise<ActionResult<ActivityTypeItem[]>> {
  const { accessToken } = await requireSessionWithToken([...CATALOG_READ_ROLES]);
  try {
    const res = await backendRequest("/backoffice/catalogs/taxonomy", {
      method: "GET",
      accessToken,
    });

    if (!res.ok) {
      return fail("TAXONOMY_FETCH_FAILED");
    }

    return ok(res.body as ActivityTypeItem[]);
  } catch (err: any) {
    return fail(err instanceof Error ? err.message : "TAXONOMY_FETCH_FAILED");
  }
}

export async function createActivityAction(
  input: CreateActivityInput
): Promise<ActionResult<ActivityItem>> {
  const { accessToken } = await requireSessionWithToken(["PLATFORM_ADMIN"]);
  try {
    const res = await backendRequest("/backoffice/catalogs/activities", {
      method: "POST",
      accessToken,
      body: input,
    });

    if (!res.ok) {
      return fail("ACTIVITY_CREATE_FAILED");
    }

    revalidatePath("/catalogs");
    revalidatePath("/venues/spaces");
    return ok(res.body as ActivityItem);
  } catch (err: any) {
    return fail(err instanceof Error ? err.message : "ACTIVITY_CREATE_FAILED");
  }
}

export async function updateActivityAction(
  id: string,
  input: UpdateActivityInput
): Promise<ActionResult<ActivityItem>> {
  const { accessToken } = await requireSessionWithToken(["PLATFORM_ADMIN"]);
  try {
    const res = await backendRequest(`/backoffice/catalogs/activities/${id}`, {
      method: "PUT",
      accessToken,
      body: input,
    });

    if (!res.ok) {
      return fail("ACTIVITY_UPDATE_FAILED");
    }

    revalidatePath("/catalogs");
    revalidatePath("/venues/spaces");
    return ok(res.body as ActivityItem);
  } catch (err: any) {
    return fail(err instanceof Error ? err.message : "ACTIVITY_UPDATE_FAILED");
  }
}

export async function createCategoryAction(
  input: CreateCategoryInput
): Promise<ActionResult<ActivityCategoryItem>> {
  const { accessToken } = await requireSessionWithToken(["PLATFORM_ADMIN"]);
  try {
    const res = await backendRequest("/backoffice/catalogs/categories", {
      method: "POST",
      accessToken,
      body: input,
    });

    if (!res.ok) {
      return fail("CATEGORY_CREATE_FAILED");
    }

    revalidatePath("/catalogs");
    revalidatePath("/venues/spaces");
    return ok(res.body as ActivityCategoryItem);
  } catch (err: any) {
    return fail(err instanceof Error ? err.message : "CATEGORY_CREATE_FAILED");
  }
}

export async function updateCategoryAction(
  id: string,
  input: UpdateCategoryInput
): Promise<ActionResult<ActivityCategoryItem>> {
  const { accessToken } = await requireSessionWithToken(["PLATFORM_ADMIN"]);
  try {
    const res = await backendRequest(`/backoffice/catalogs/categories/${id}`, {
      method: "PUT",
      accessToken,
      body: input,
    });

    if (!res.ok) {
      return fail("CATEGORY_UPDATE_FAILED");
    }

    revalidatePath("/catalogs");
    revalidatePath("/venues/spaces");
    return ok(res.body as ActivityCategoryItem);
  } catch (err: any) {
    return fail(err instanceof Error ? err.message : "CATEGORY_UPDATE_FAILED");
  }
}

export async function getSurfacesAction(): Promise<ActionResult<SurfaceItem[]>> {
  const { accessToken } = await requireSessionWithToken([...CATALOG_READ_ROLES]);
  try {
    const res = await backendRequest("/backoffice/catalogs/surfaces", {
      method: "GET",
      accessToken,
    });

    if (!res.ok) {
      return fail("SURFACES_FETCH_FAILED");
    }

    return ok(res.body as SurfaceItem[]);
  } catch (err: any) {
    return fail(err instanceof Error ? err.message : "SURFACES_FETCH_FAILED");
  }
}

export async function createSurfaceAction(
  input: CreateSurfaceInput
): Promise<ActionResult<SurfaceItem>> {
  const { accessToken } = await requireSessionWithToken(["PLATFORM_ADMIN"]);
  try {
    const res = await backendRequest("/backoffice/catalogs/surfaces", {
      method: "POST",
      accessToken,
      body: input,
    });

    if (!res.ok) {
      return fail("SURFACE_CREATE_FAILED");
    }

    revalidatePath("/catalogs");
    revalidatePath("/venues/spaces");
    return ok(res.body as SurfaceItem);
  } catch (err: any) {
    return fail(err instanceof Error ? err.message : "SURFACE_CREATE_FAILED");
  }
}

export async function updateSurfaceAction(
  id: string,
  input: UpdateSurfaceInput
): Promise<ActionResult<SurfaceItem>> {
  const { accessToken } = await requireSessionWithToken(["PLATFORM_ADMIN"]);
  try {
    const res = await backendRequest(`/backoffice/catalogs/surfaces/${id}`, {
      method: "PATCH",
      accessToken,
      body: input,
    });

    if (!res.ok) {
      return fail("SURFACE_UPDATE_FAILED");
    }

    revalidatePath("/catalogs");
    revalidatePath("/venues/spaces");
    return ok(res.body as SurfaceItem);
  } catch (err: any) {
    return fail(err instanceof Error ? err.message : "SURFACE_UPDATE_FAILED");
  }
}

export async function getAmenitiesAction(): Promise<ActionResult<AmenityItem[]>> {
  const { accessToken } = await requireSessionWithToken([...CATALOG_READ_ROLES]);
  try {
    const res = await backendRequest("/backoffice/catalogs/amenities", {
      method: "GET",
      accessToken,
    });

    if (!res.ok) {
      return fail("AMENITIES_FETCH_FAILED");
    }

    return ok(res.body as AmenityItem[]);
  } catch (err: any) {
    return fail(err instanceof Error ? err.message : "AMENITIES_FETCH_FAILED");
  }
}

export async function createAmenityAction(
  input: CreateAmenityInput
): Promise<ActionResult<AmenityItem>> {
  const { accessToken } = await requireSessionWithToken(["PLATFORM_ADMIN"]);
  try {
    const res = await backendRequest("/backoffice/catalogs/amenities", {
      method: "POST",
      accessToken,
      body: input,
    });

    if (!res.ok) {
      return fail("AMENITY_CREATE_FAILED");
    }

    revalidatePath("/catalogs");
    revalidatePath("/venues/spaces");
    return ok(res.body as AmenityItem);
  } catch (err: any) {
    return fail(err instanceof Error ? err.message : "AMENITY_CREATE_FAILED");
  }
}

export async function updateAmenityAction(
  id: string,
  input: UpdateAmenityInput
): Promise<ActionResult<AmenityItem>> {
  const { accessToken } = await requireSessionWithToken(["PLATFORM_ADMIN"]);
  try {
    const res = await backendRequest(`/backoffice/catalogs/amenities/${id}`, {
      method: "PATCH",
      accessToken,
      body: input,
    });

    if (!res.ok) {
      return fail("AMENITY_UPDATE_FAILED");
    }

    revalidatePath("/catalogs");
    revalidatePath("/venues/spaces");
    return ok(res.body as AmenityItem);
  } catch (err: any) {
    return fail(err instanceof Error ? err.message : "AMENITY_UPDATE_FAILED");
  }
}
