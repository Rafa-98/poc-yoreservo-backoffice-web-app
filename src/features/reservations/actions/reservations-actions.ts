"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { backendRequest } from "@/shared/api/index.server";
import { ACCESS_COOKIE_NAME } from "@/shared/auth";
import { requireSession } from "@/shared/auth/index.server";
import { DEFAULT_BCV_USD_RATE, fail, ok, type ActionResult } from "@/shared/lib";
import { ROUTE_ALLOWED_ROLES, ROUTES } from "@/shared/config";
import type {
  CheckInMethod,
  CreateWalkInReservationInput,
  ReservationItem,
  ReservationKpis,
} from "../model/types";

async function getAuthToken(): Promise<string> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ACCESS_COOKIE_NAME)?.value;
  if (!token) throw new Error("Unauthorized");
  return token;
}

function formatTime(val: any): string {
  if (!val) return "00:00";
  if (typeof val === "string") {
    if (val.includes("T")) {
      const d = new Date(val);
      return d.toISOString().substring(11, 16);
    }
    return val.substring(0, 5);
  }
  if (val instanceof Date) {
    return val.toISOString().substring(11, 16);
  }
  return String(val);
}

function calculateDurationMinutes(start: string, end: string): string {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const startMins = sh * 60 + sm;
  const endMins = eh * 60 + em;
  const diff = endMins - startMins;
  return `${diff > 0 ? diff : 90} min`;
}

function mapReservationRow(row: any, fallbackBcvRate = DEFAULT_BCV_USD_RATE): ReservationItem {
  const isWalkIn = !!row.isManual;
  const clientName =
    row.customerName ||
    (row.client ? `${row.client.name} ${row.client.lastName || ""}`.trim() : "Cliente YoReservo");
  const phone = row.customerPhone || row.client?.phone || "+58 414 0000000";
  const dni = row.customerDni || row.client?.dni || "V-00000000";

  const dateObj = row.reservationDate ? new Date(row.reservationDate) : new Date();
  const dateStr = dateObj.toISOString().split("T")[0];

  const startTimeStr = formatTime(row.startTime);
  const endTimeStr = formatTime(row.endTime);
  const timeSlot = `${startTimeStr} - ${endTimeStr}`;
  const duration = calculateDurationMinutes(startTimeStr, endTimeStr);

  const priceUsd = Number(row.totalAmount || row.subtotal || 0);
  const rateBcv = Number(row.exchangeRateValue || fallbackBcvRate);
  const priceBs = Number(row.totalAmountVes || (priceUsd * rateBcv));

  // Determine payment method and meta
  const latestPayment = Array.isArray(row.payments) && row.payments.length > 0 ? row.payments[0] : null;
  let paymentMethod = "pago_movil";
  let paymentMeta = "Pago Móvil Banesco";

  if (isWalkIn) {
    paymentMethod = "cash";
    paymentMeta = "Efectivo en Mostrador (Caja)";
  } else if (latestPayment) {
    paymentMethod = String(latestPayment.paymentMethod || "pago_movil").toLowerCase();
    paymentMeta = `${latestPayment.paymentMethod} • Ref: #${latestPayment.referenceNumber || "S/R"}`;
  }

  // Sport name resolution
  let sportName = "Pádel";
  const actName = row.space?.activityCategory?.activity?.name;
  if (actName) {
    if (typeof actName === "object") {
      sportName = actName.es || actName.en || "Deporte";
    } else {
      sportName = String(actName);
    }
  }

  const isCheckedIn = row.status === "COMPLETED" || !!row.validatedAt;

  return {
    id: row.id,
    code: row.shortCode || row.id.substring(0, 6).toUpperCase(),
    origin: isWalkIn ? "walk-in" : "app",
    clientName,
    dni,
    phone,
    venueId: row.space?.venue?.id || "",
    venue: row.space?.venue?.name || "Sede Principal",
    court: row.space?.spaceNumber ? `Cancha ${row.space.spaceNumber}` : "Cancha 1",
    sport: sportName,
    date: dateStr,
    dateDisplay: dateStr,
    timeSlot,
    duration,
    priceUsd,
    rateBcv,
    priceBs,
    paymentMethod,
    paymentMeta,
    status: row.status,
    checkedIn: isCheckedIn,
    checkedInBy: row.validator ? `${row.validator.name} ${row.validator.lastName || ""}`.trim() : undefined,
    validatedAt: row.validatedAt,
    cancellationReason: row.cancellationReason,
  };
}

export async function getReservationsAction(filter?: {
  venueId?: string;
  status?: string;
  search?: string;
  fromDate?: string;
  toDate?: string;
}): Promise<ActionResult<{ items: ReservationItem[]; kpis: ReservationKpis; total: number }>> {
  try {
    await requireSession(ROUTE_ALLOWED_ROLES[ROUTES.reservations]);
    const accessToken = await getAuthToken();

    const query = new URLSearchParams();
    if (filter?.venueId && filter.venueId !== "all") query.append("venueId", filter.venueId);
    if (filter?.status && filter.status !== "all") query.append("status", filter.status);
    if (filter?.search) query.append("search", filter.search);
    if (filter?.fromDate) query.append("fromDate", filter.fromDate);
    if (filter?.toDate) query.append("toDate", filter.toDate);

    const qs = query.toString() ? `?${query.toString()}` : "";
    const res = await backendRequest(`/backoffice/reservations${qs}`, {
      method: "GET",
      accessToken,
    });

    if (!res.ok) {
      return fail("RESERVATIONS_FETCH_FAILED");
    }

    const data = res.body as any;
    const rawItems: any[] = data.items || [];
    const items = rawItems.map((r) => mapReservationRow(r));

    const kpis: ReservationKpis = data.kpis || {
      totalBookings: data.total || items.length,
      confirmedCount: items.filter((i) => i.status === "CONFIRMED" || i.status === "COMPLETED").length,
      walkinCount: items.filter((i) => i.origin === "walk-in").length,
      volumeUsd: items.reduce((acc, curr) => acc + (curr.status === "CONFIRMED" || curr.status === "COMPLETED" ? curr.priceUsd : 0), 0),
      volumeVes: items.reduce((acc, curr) => acc + (curr.status === "CONFIRMED" || curr.status === "COMPLETED" ? curr.priceBs : 0), 0),
    };

    return ok({
      items,
      kpis,
      total: data.total || items.length,
    });
  } catch (err: any) {
    return fail(err instanceof Error ? err.message : "RESERVATIONS_FETCH_FAILED");
  }
}

export async function getReservationDetailAction(id: string): Promise<ActionResult<any>> {
  try {
    await requireSession(ROUTE_ALLOWED_ROLES[ROUTES.reservations]);
    const accessToken = await getAuthToken();

    const res = await backendRequest(`/backoffice/reservations/${id}`, {
      method: "GET",
      accessToken,
    });

    if (!res.ok) {
      return fail("RESERVATION_NOT_FOUND");
    }

    return ok(res.body);
  } catch (err: any) {
    return fail(err instanceof Error ? err.message : "RESERVATION_NOT_FOUND");
  }
}

export async function checkInReservationAction(
  id: string,
  method: CheckInMethod = "SHORT_CODE_MANUAL"
): Promise<ActionResult<any>> {
  try {
    await requireSession(ROUTE_ALLOWED_ROLES[ROUTES.reservations]);
    const accessToken = await getAuthToken();

    const res = await backendRequest(`/backoffice/reservations/${id}/check-in`, {
      method: "POST",
      accessToken,
      body: { method },
    });

    if (!res.ok) {
      return fail("CHECK_IN_FAILED");
    }

    revalidatePath(ROUTES.reservations);
    revalidatePath(ROUTES.agenda);
    return ok(res.body);
  } catch (err: any) {
    return fail(err instanceof Error ? err.message : "CHECK_IN_FAILED");
  }
}

export async function cancelReservationAction(
  id: string,
  reason: string
): Promise<ActionResult<any>> {
  try {
    await requireSession(ROUTE_ALLOWED_ROLES[ROUTES.reservations]);
    const accessToken = await getAuthToken();

    const res = await backendRequest(`/backoffice/reservations/${id}/cancel`, {
      method: "POST",
      accessToken,
      body: { reason },
    });

    if (!res.ok) {
      return fail("CANCEL_RESERVATION_FAILED");
    }

    revalidatePath(ROUTES.reservations);
    revalidatePath(ROUTES.agenda);
    return ok(res.body);
  } catch (err: any) {
    return fail(err instanceof Error ? err.message : "CANCEL_RESERVATION_FAILED");
  }
}

export async function createWalkInReservationAction(
  input: CreateWalkInReservationInput
): Promise<ActionResult<any>> {
  try {
    await requireSession(ROUTE_ALLOWED_ROLES[ROUTES.reservations]);
    const accessToken = await getAuthToken();

    const res = await backendRequest("/backoffice/agenda/walk-in", {
      method: "POST",
      accessToken,
      body: input,
    });

    if (!res.ok) {
      return fail("WALK_IN_FAILED");
    }

    revalidatePath(ROUTES.reservations);
    revalidatePath(ROUTES.agenda);
    return ok(res.body);
  } catch (err: any) {
    return fail(err instanceof Error ? err.message : "WALK_IN_FAILED");
  }
}
