"use server";

import { revalidatePath } from "next/cache";
import { backendRequest } from "@/shared/api/index.server";
import { requireSessionWithToken } from "@/shared/auth/index.server";
import {
  DEFAULT_BCV_EUR_RATE,
  DEFAULT_BCV_USD_RATE,
  fail,
  ok,
  type ActionResult,
} from "@/shared/lib";
import { ROUTE_ALLOWED_ROLES, ROUTES } from "@/shared/config";
import type {
  CheckInMethod,
  CreateWalkInReservationInput,
  ReservationItem,
  ReservationKpis,
} from "../model/types";

function formatTime(val: any): string {
  if (!val) return "—";
  if (typeof val === "string") {
    if (val.includes("T")) {
      const d = new Date(val);
      return Number.isNaN(d.getTime()) ? val.substring(0, 5) : d.toISOString().substring(11, 16);
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
  if (Number.isNaN(sh) || Number.isNaN(sm) || Number.isNaN(eh) || Number.isNaN(em)) {
    return "—";
  }
  const startMins = sh * 60 + sm;
  let endMins = eh * 60 + em;
  if (endMins === 0 && startMins > 0) {
    endMins = 24 * 60;
  }
  const diff = endMins - startMins;
  return diff > 0 ? `${diff} min` : "—";
}

function mapReservationRow(
  row: any,
  rates: {
    usdRate: number;
    eurRate: number;
    defaultCurrencyCode: string;
  },
): ReservationItem {
  const isWalkIn = !!row.isManual;
  const clientFullName = row.client
    ? `${row.client.name || ""} ${row.client.lastName || ""}`.trim()
    : "";
  const clientName =
    row.customerName ||
    clientFullName ||
    row.client?.email ||
    "—";
  const phone = row.customerPhone || row.client?.phone || "—";
  const dni =
    row.clientDni ||
    row.customerDni ||
    (row.customerDocumentType && row.customerDocumentNumber
      ? `${row.customerDocumentType}-${row.customerDocumentNumber}`
      : null) ||
    row.client?.dni ||
    (row.client?.documentType && row.client?.documentNumber
      ? `${row.client.documentType}-${row.client.documentNumber}`
      : null) ||
    "—";

  const dateStr = row.reservationDate
    ? String(row.reservationDate).slice(0, 10)
    : "—";

  const startTimeStr = formatTime(row.startTime);
  const endTimeStr = formatTime(row.endTime);
  const timeSlot = `${startTimeStr} - ${endTimeStr}`;
  const duration = calculateDurationMinutes(startTimeStr, endTimeStr);

  const currencyCode =
    row.space?.venue?.organization?.referenceCurrencyCode ||
    row.currencyCode ||
    rates.defaultCurrencyCode ||
    "USD";

  const fallbackRateForCurrency =
    currencyCode === "EUR" ? rates.eurRate : rates.usdRate;

  const latestPayment =
    Array.isArray(row.payments) && row.payments.length > 0 ? row.payments[0] : null;

  const priceUsd = Number(row.totalAmount ?? row.subtotal ?? 0);
  const rateBcv = Number(
    row.exchangeRateValue ||
      latestPayment?.exchangeRate ||
      fallbackRateForCurrency,
  );
  const priceBs = Number(
    row.totalAmountVes ||
      latestPayment?.amountVes ||
      priceUsd * rateBcv,
  );

  // Determine payment method and meta from actual payment record
  let paymentMethod = "pending";
  let paymentMeta = "Sin pago registrado";

  if (latestPayment && latestPayment.paymentMethod) {
    const rawMethod = String(latestPayment.paymentMethod).toUpperCase();
    if (rawMethod === "PAGO_MOVIL") {
      paymentMethod = "pago_movil";
    } else if (rawMethod === "CASH") {
      paymentMethod = "cash";
    } else if (
      rawMethod === "POS" ||
      rawMethod === "CARD" ||
      rawMethod === "ZELLE" ||
      rawMethod === "PIPOL_PAY" ||
      rawMethod === "BANK_TRANSFER"
    ) {
      paymentMethod = "pos";
    } else {
      paymentMethod = rawMethod.toLowerCase();
    }
    const bankPart = latestPayment.originBank ? ` (${latestPayment.originBank})` : "";
    const refPart = latestPayment.referenceNumber
      ? ` • Ref: #${latestPayment.referenceNumber}`
      : "";
    paymentMeta = `${latestPayment.paymentMethod}${bankPart}${refPart}`;
  } else if (isWalkIn) {
    paymentMethod = "cash";
    paymentMeta = "Cobro en Mostrador (Taquilla)";
  }

  // Sport name resolution from real activity / category
  let sportName = "—";
  const actName =
    row.space?.activityCategory?.activity?.name ??
    row.space?.activityCategory?.name;
  if (actName) {
    if (typeof actName === "object") {
      sportName = actName.es || actName.en || "—";
    } else {
      sportName = String(actName);
    }
  }

  const isCheckedIn = row.status === "COMPLETED" || !!row.validatedAt;

  const rawSpaceNumber = row.space?.spaceNumber
    ? String(row.space.spaceNumber).trim()
    : "";
  const courtDisplay = rawSpaceNumber
    ? rawSpaceNumber.toLowerCase().includes("cancha")
      ? rawSpaceNumber
      : `Cancha ${rawSpaceNumber}`
    : "—";

  return {
    id: row.id,
    code: row.shortCode || row.id.substring(0, 6).toUpperCase(),
    origin: isWalkIn ? "walk-in" : "app",
    clientName,
    dni,
    clientDni: dni,
    isFrequentPlayer: Boolean(row.isFrequentPlayer),
    phone,
    venueId: row.space?.venue?.id || "",
    venue: row.space?.venue?.name || "—",
    court: courtDisplay,
    sport: sportName,
    date: dateStr,
    dateDisplay: dateStr,
    timeSlot,
    duration,
    currencyCode,
    priceUsd,
    rateBcv,
    priceBs,
    paymentMethod,
    paymentMeta,
    status: row.status,
    checkedIn: isCheckedIn,
    checkedInBy: row.validator
      ? `${row.validator.name} ${row.validator.lastName || ""}`.trim()
      : undefined,
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
}): Promise<
  ActionResult<{
    items: ReservationItem[];
    kpis: ReservationKpis;
    total: number;
    referenceCurrencyCode: string;
    activeUsdRate: number | null;
    activeEurRate: number | null;
  }>
> {
  const { accessToken } = await requireSessionWithToken(ROUTE_ALLOWED_ROLES[ROUTES.reservations]);
  try {
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
    const activeUsdRate =
      data.activeUsdRate && Number(data.activeUsdRate) > 0
        ? Number(data.activeUsdRate)
        : DEFAULT_BCV_USD_RATE;
    const activeEurRate =
      data.activeEurRate && Number(data.activeEurRate) > 0
        ? Number(data.activeEurRate)
        : DEFAULT_BCV_EUR_RATE;
    const referenceCurrencyCode =
      data.referenceCurrencyCode ||
      data.kpis?.referenceCurrencyCode ||
      "USD";

    const items = rawItems.map((r) =>
      mapReservationRow(r, {
        usdRate: activeUsdRate,
        eurRate: activeEurRate,
        defaultCurrencyCode: referenceCurrencyCode,
      }),
    );

    const kpis: ReservationKpis = {
      totalBookings: data.kpis?.totalBookings ?? (data.total || items.length),
      confirmedCount:
        data.kpis?.confirmedCount ??
        items.filter((i) => i.status === "CONFIRMED" || i.status === "COMPLETED").length,
      walkinCount:
        data.kpis?.walkinCount ??
        items.filter((i) => i.origin === "walk-in").length,
      volumeUsd:
        data.kpis?.volumeUsd ??
        items.reduce(
          (acc, curr) =>
            acc +
            (curr.status === "CONFIRMED" || curr.status === "COMPLETED"
              ? curr.priceUsd
              : 0),
          0,
        ),
      volumeVes:
        data.kpis?.volumeVes ??
        items.reduce(
          (acc, curr) =>
            acc +
            (curr.status === "CONFIRMED" || curr.status === "COMPLETED"
              ? curr.priceBs
              : 0),
          0,
        ),
      confirmedGrowthPct: data.kpis?.confirmedGrowthPct,
      referenceCurrencyCode,
    };

    return ok({
      items,
      kpis,
      total: data.total || items.length,
      referenceCurrencyCode,
      activeUsdRate: data.activeUsdRate ? Number(data.activeUsdRate) : null,
      activeEurRate: data.activeEurRate ? Number(data.activeEurRate) : null,
    });
  } catch (err: any) {
    return fail(err instanceof Error ? err.message : "RESERVATIONS_FETCH_FAILED");
  }
}

export async function getReservationDetailAction(id: string): Promise<ActionResult<any>> {
  const { accessToken } = await requireSessionWithToken(ROUTE_ALLOWED_ROLES[ROUTES.reservations]);
  try {
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
  const { accessToken } = await requireSessionWithToken([
    "PLATFORM_ADMIN",
    "ALLY_ADMIN",
    "ALLY_VALIDATOR",
  ]);
  try {
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
  const { accessToken } = await requireSessionWithToken([
    "PLATFORM_ADMIN",
    "ALLY_ADMIN",
  ]);
  try {
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
  const { accessToken } = await requireSessionWithToken([
    "PLATFORM_ADMIN",
    "ALLY_ADMIN",
  ]);
  try {
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
