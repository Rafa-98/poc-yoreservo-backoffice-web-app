"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { backendRequest } from "@/shared/api/index.server";
import { requireSessionWithToken } from "@/shared/auth/index.server";
import {
  fail,
  getTimezoneOffsetLabel,
  ok,
  todayInTimezone,
  type ActionResult,
} from "@/shared/lib";
import { ROUTE_ALLOWED_ROLES, ROUTES } from "@/shared/config";
import type { AgendaData, VenueRef } from "../model/types";

export async function getVenuesListAction(): Promise<ActionResult<VenueRef[]>> {
  const { accessToken } = await requireSessionWithToken(ROUTE_ALLOWED_ROLES[ROUTES.agenda]);
  try {
    const res = await backendRequest("/backoffice/venues", { accessToken });
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
  const { user, accessToken } = await requireSessionWithToken(ROUTE_ALLOWED_ROLES[ROUTES.agenda]);
  try {
    // 1. Resolve venueId
    let resolvedVenueId = venueId;
    if (!resolvedVenueId) {
      if (user.managedVenueId) {
        resolvedVenueId = user.managedVenueId;
      } else {
        const cookieStore = await cookies();
        const savedVenue = cookieStore.get("yoreservo_active_venue")?.value;
        resolvedVenueId = savedVenue || "ALL";
      }
    }

    if (!resolvedVenueId) {
      return fail("NO_VENUES_FOUND");
    }

    // 2. Resolve date YYYY-MM-DD
    const resolvedDate =
      date || todayInTimezone("America/Caracas");

    const res = await backendRequest(
      `/backoffice/agenda?venueId=${encodeURIComponent(resolvedVenueId)}&date=${resolvedDate}`,
      { accessToken },
    );


    if (!res.ok) {
      return fail("FAILED_TO_LOAD_AGENDA", undefined, res.correlationId);
    }

    const raw = res.body as AgendaData;
    const resolvedTimezone = raw.timezone || raw.venue?.timezone || "America/Caracas";
    const resolvedTimezoneOffset =
      raw.timezoneOffset || getTimezoneOffsetLabel(resolvedTimezone);

    let bcvRate = raw.bcvRate && Number(raw.bcvRate) > 0 ? Number(raw.bcvRate) : undefined;
    if (!bcvRate) {
      try {
        const ratesRes = await backendRequest("/backoffice/exchange-rates", {
          accessToken,
        });
        if (ratesRes.ok && ratesRes.body) {
          const activeRates = (ratesRes.body as any)?.activeRates ?? [];
          const usdObj = activeRates.find((r: any) => r.currencyCode === "USD");
          if (usdObj?.rate && Number(usdObj.rate) > 0) {
            bcvRate = Number(usdObj.rate);
          }
        }
      } catch {
        // Ignore rate fetch error
      }
    }

    return ok({
      ...raw,
      timezone: resolvedTimezone,
      timezoneOffset: resolvedTimezoneOffset,
      bcvRate,
    });
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
  const { accessToken } = await requireSessionWithToken([
    "PLATFORM_ADMIN",
    "ALLY_ADMIN",
  ]);
  try {
    const normalizedMethod =
      input.paymentMethod === "POS"
        ? "CARD"
        : input.paymentMethod === "PENDING"
          ? "CASH"
          : input.paymentMethod;

    const res = await backendRequest("/backoffice/agenda/walk-in", {
      method: "POST",
      accessToken,
      body: {
        ...input,
        paymentMethod: normalizedMethod,
      },
    });

    if (!res.ok) {
      return fail("WALK_IN_FAILED", undefined, res.correlationId);
    }

    revalidatePath(ROUTES.agenda);
    revalidatePath(ROUTES.reservations);
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
  const { accessToken } = await requireSessionWithToken([
    "PLATFORM_ADMIN",
    "ALLY_ADMIN",
    "ALLY_VALIDATOR",
  ]);
  try {
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
      const msg = String((res.body as any)?.message || "");
      if (msg.includes("PENDING_PAYMENT") || msg.includes("PAYMENT_UNDER_REVIEW")) {
        return fail("CHECK_IN_PENDING_PAYMENT", undefined, res.correlationId);
      }
      if (msg.includes("CANCELLED")) {
        return fail("CHECK_IN_CANCELLED", undefined, res.correlationId);
      }
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
  const { accessToken } = await requireSessionWithToken([
    "PLATFORM_ADMIN",
    "ALLY_ADMIN",
    "ALLY_VALIDATOR",
  ]);
  try {
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
  const { accessToken } = await requireSessionWithToken([
    "PLATFORM_ADMIN",
    "ALLY_ADMIN",
    "ALLY_VALIDATOR",
  ]);
  try {
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
