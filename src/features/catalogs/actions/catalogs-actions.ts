"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { backendRequest } from "@/shared/api/index.server";
import { ACCESS_COOKIE_NAME } from "@/shared/auth";
import { requireSession } from "@/shared/auth/index.server";
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
  UpdateSurfaceInput,
} from "../model/types";

async function getAuthToken(): Promise<string> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ACCESS_COOKIE_NAME)?.value;
  if (!token) throw new Error("Unauthorized");
  return token;
}

export async function getTaxonomyAction(): Promise<ActionResult<ActivityTypeItem[]>> {
  try {
    await requireSession(["PLATFORM_ADMIN", "ALLY_ADMIN"]);
    const accessToken = await getAuthToken();

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
  try {
    await requireSession(["PLATFORM_ADMIN", "ALLY_ADMIN"]);
    const accessToken = await getAuthToken();

    const res = await backendRequest("/backoffice/catalogs/activities", {
      method: "POST",
      accessToken,
      body: input,
    });

    if (!res.ok) {
      return fail("ACTIVITY_CREATE_FAILED");
    }

    revalidatePath("/catalogs");
    return ok(res.body as ActivityItem);
  } catch (err: any) {
    return fail(err instanceof Error ? err.message : "ACTIVITY_CREATE_FAILED");
  }
}

export async function createCategoryAction(
  input: CreateCategoryInput
): Promise<ActionResult<ActivityCategoryItem>> {
  try {
    await requireSession(["PLATFORM_ADMIN", "ALLY_ADMIN"]);
    const accessToken = await getAuthToken();

    const res = await backendRequest("/backoffice/catalogs/categories", {
      method: "POST",
      accessToken,
      body: input,
    });

    if (!res.ok) {
      return fail("CATEGORY_CREATE_FAILED");
    }

    revalidatePath("/catalogs");
    return ok(res.body as ActivityCategoryItem);
  } catch (err: any) {
    return fail(err instanceof Error ? err.message : "CATEGORY_CREATE_FAILED");
  }
}

export async function getSurfacesAction(): Promise<ActionResult<SurfaceItem[]>> {
  try {
    await requireSession(["PLATFORM_ADMIN", "ALLY_ADMIN"]);
    const accessToken = await getAuthToken();

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
  try {
    await requireSession(["PLATFORM_ADMIN", "ALLY_ADMIN"]);
    const accessToken = await getAuthToken();

    const res = await backendRequest("/backoffice/catalogs/surfaces", {
      method: "POST",
      accessToken,
      body: input,
    });

    if (!res.ok) {
      return fail("SURFACE_CREATE_FAILED");
    }

    revalidatePath("/catalogs");
    return ok(res.body as SurfaceItem);
  } catch (err: any) {
    return fail(err instanceof Error ? err.message : "SURFACE_CREATE_FAILED");
  }
}

export async function updateSurfaceAction(
  id: string,
  input: UpdateSurfaceInput
): Promise<ActionResult<SurfaceItem>> {
  try {
    await requireSession(["PLATFORM_ADMIN", "ALLY_ADMIN"]);
    const accessToken = await getAuthToken();

    const res = await backendRequest(`/backoffice/catalogs/surfaces/${id}`, {
      method: "PATCH",
      accessToken,
      body: input,
    });

    if (!res.ok) {
      return fail("SURFACE_UPDATE_FAILED");
    }

    revalidatePath("/catalogs");
    return ok(res.body as SurfaceItem);
  } catch (err: any) {
    return fail(err instanceof Error ? err.message : "SURFACE_UPDATE_FAILED");
  }
}

export async function getAmenitiesAction(): Promise<ActionResult<AmenityItem[]>> {
  try {
    await requireSession(["PLATFORM_ADMIN", "ALLY_ADMIN"]);
    const accessToken = await getAuthToken();

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
  try {
    await requireSession(["PLATFORM_ADMIN", "ALLY_ADMIN"]);
    const accessToken = await getAuthToken();

    const res = await backendRequest("/backoffice/catalogs/amenities", {
      method: "POST",
      accessToken,
      body: input,
    });

    if (!res.ok) {
      return fail("AMENITY_CREATE_FAILED");
    }

    revalidatePath("/catalogs");
    return ok(res.body as AmenityItem);
  } catch (err: any) {
    return fail(err instanceof Error ? err.message : "AMENITY_CREATE_FAILED");
  }
}
