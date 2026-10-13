"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { backendRequest } from "@/shared/api/index.server";
import { ACCESS_COOKIE_NAME } from "@/shared/auth";
import { requireSession } from "@/shared/auth/index.server";
import { fail, ok, type ActionResult } from "@/shared/lib";
import { ROUTES } from "@/shared/config";
import type { AgendaData, VenueRef } from "../model/types";

async function getAuthToken(): Promise<string> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ACCESS_COOKIE_NAME)?.value;
  if (!token) throw new Error("Unauthorized");
  return token;
}

export async function getVenuesListAction(): Promise<ActionResult<VenueRef[]>> {
  try {
    const accessToken = await getAuthToken();
    const res = await backendRequest("/venues", { accessToken });
    if (!res.ok) {
      return fail("FAILED_TO_LOAD_VENUES");
    }
    const venues = (res.body as any[])?.map((v) => ({
      id: v.id,
      name: v.name,
      timezone: v.timezone,
      status: v.status,
    })) ?? [];
    return ok(venues);
  } catch (e) {
    console.error("[agenda] Failed to list venues:", e);
    return fail("SERVICE_UNAVAILABLE");
  }
}

export async function getAgendaAction(
  venueId?: string,
  date?: string,
): Promise<ActionResult<AgendaData>> {
  try {
    const session = await requireSession();
    const accessToken = await getAuthToken();

    // 1. Resolve venueId
    let resolvedVenueId = venueId;
    if (!resolvedVenueId) {
      if (session.user.managedVenueId) {
        resolvedVenueId = session.user.managedVenueId;
      } else {
        const venuesRes = await backendRequest("/venues", { accessToken });
        const list = (venuesRes.body as any[]) ?? [];
        resolvedVenueId = list[0]?.id;
      }
    }

    if (!resolvedVenueId) {
      return fail("NO_VENUES_FOUND");
    }

    // 2. Resolve date YYYY-MM-DD
    const resolvedDate =
      date || new Date().toISOString().split("T")[0];

    const res = await backendRequest(
      `/backoffice/agenda?venueId=${resolvedVenueId}&date=${resolvedDate}`,
      { accessToken },
    );

    if (!res.ok) {
      return fail("FAILED_TO_LOAD_AGENDA", undefined, res.correlationId);
    }

    return ok(res.body as AgendaData);
  } catch (error) {
    console.error("[agenda] Get agenda error:", error);
    return fail("SERVICE_UNAVAILABLE");
  }
}

export interface CreateWalkInInput {
  spaceId: string;
  reservationDate: string;
  startTime: string;
  endTime: string;
  customerName: string;
  customerPhone?: string;
  paymentMethod: string;
  referenceNumber?: string;
  originBank?: string;
  internalNotes?: string;
}

export async function createWalkInAction(
  input: CreateWalkInInput,
): Promise<ActionResult<{ id: string; shortCode: string }>> {
  try {
    const accessToken = await getAuthToken();
    const res = await backendRequest("/backoffice/agenda/walk-in", {
      method: "POST",
      accessToken,
      body: input,
    });

    if (!res.ok) {
      return fail("WALK_IN_FAILED", undefined, res.correlationId);
    }

    revalidatePath(ROUTES.agenda);
    return ok(res.body as { id: string; shortCode: string });
  } catch (error) {
    console.error("[agenda] Walk-in booking error:", error);
    return fail("SERVICE_UNAVAILABLE");
  }
}

export interface CheckInInput {
  code: string;
  method?: string;
}

export async function checkInAction(
  input: CheckInInput,
): Promise<ActionResult<{ alreadyCheckedIn?: boolean; reservation: any }>> {
  try {
    const accessToken = await getAuthToken();
    const res = await backendRequest("/backoffice/agenda/check-in", {
      method: "POST",
      accessToken,
      body: {
        code: input.code.trim().replace(/^#/, ""),
        method: input.method || "SHORT_CODE_MANUAL",
      },
    });

    if (res.status === 404) {
      return fail("CHECK_IN_NOT_FOUND");
    }

    if (!res.ok) {
      return fail("CHECK_IN_FAILED", undefined, res.correlationId);
    }

    revalidatePath(ROUTES.agenda);
    return ok(res.body as { alreadyCheckedIn?: boolean; reservation: any });
  } catch (error) {
    console.error("[agenda] Check-in error:", error);
    return fail("SERVICE_UNAVAILABLE");
  }
}

export interface CreateBlockInput {
  spaceId: string;
  blockDate: string;
  startTime: string;
  endTime: string;
  reason: string;
  notes?: string;
}

export async function createBlockAction(
  input: CreateBlockInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    const accessToken = await getAuthToken();
    const res = await backendRequest(`/backoffice/spaces/${input.spaceId}/blocks`, {
      method: "POST",
      accessToken,
      body: input,
    });

    if (!res.ok) {
      return fail("CREATE_BLOCK_FAILED", undefined, res.correlationId);
    }

    revalidatePath(ROUTES.agenda);
    return ok(res.body as { id: string });
  } catch (error) {
    console.error("[agenda] Create block error:", error);
    return fail("SERVICE_UNAVAILABLE");
  }
}

export async function deleteBlockAction(
  blockId: string,
): Promise<ActionResult<void>> {
  try {
    const accessToken = await getAuthToken();
    const res = await backendRequest(`/backoffice/spaces/blocks/${blockId}`, {
      method: "DELETE",
      accessToken,
    });

    if (!res.ok) {
      return fail("DELETE_BLOCK_FAILED", undefined, res.correlationId);
    }

    revalidatePath(ROUTES.agenda);
    return ok(undefined);
  } catch (error) {
    console.error("[agenda] Delete block error:", error);
    return fail("SERVICE_UNAVAILABLE");
  }
}
