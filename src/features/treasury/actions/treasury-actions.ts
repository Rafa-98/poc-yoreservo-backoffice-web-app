"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { backendRequest } from "@/shared/api/index.server";
import { ACCESS_COOKIE_NAME } from "@/shared/auth";
import { requireSession } from "@/shared/auth/index.server";
import { fail, ok, type ActionResult } from "@/shared/lib";
import { ROUTES } from "@/shared/config";
import type {
  DisburseSettlementInput,
  ExchangeRateData,
  ExchangeRateItem,
  ManualRateOverrideInput,
  PaymentItem,
  PaymentsInboxData,
  SettlementBatchItem,
  SettlementsKpis,
  TreasuryKpis,
} from "../model/types";

async function getAuthToken(): Promise<string> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ACCESS_COOKIE_NAME)?.value;
  if (!token) throw new Error("Unauthorized");
  return token;
}

export async function getPaymentsInboxAction(filters?: {
  status?: string;
  paymentMethod?: string;
  search?: string;
}): Promise<ActionResult<PaymentsInboxData>> {
  try {
    await requireSession();
    const accessToken = await getAuthToken();

    const query = new URLSearchParams();
    if (filters?.status && filters.status !== "ALL") {
      query.set("status", filters.status);
    }
    if (filters?.paymentMethod && filters.paymentMethod !== "ALL") {
      query.set("paymentMethod", filters.paymentMethod);
    }
    if (filters?.search && filters.search.trim()) {
      query.set("search", filters.search.trim());
    }

    const endpoint = `/backoffice/treasury/payments${
      query.toString() ? `?${query.toString()}` : ""
    }`;

    const res = await backendRequest(endpoint, { accessToken });
    if (!res.ok) {
      return fail("FAILED_TO_LOAD_PAYMENTS");
    }

    const data = res.body as { total: number; items: any[] };
    const rawItems = data?.items ?? [];

    const items: PaymentItem[] = rawItems.map((p) => ({
      id: p.id,
      reservationId: p.reservationId,
      referenceNumber: p.referenceNumber ?? null,
      phoneNumber: p.phoneNumber ?? null,
      originBank: p.originBank ?? null,
      payerIdDocument: p.payerIdDocument ?? null,
      payerDocumentType: p.payerDocumentType ?? null,
      amount: Number(p.amount ?? 0),
      amountVes: p.amountVes !== null ? Number(p.amountVes) : null,
      amountReference: p.amountReference !== null ? Number(p.amountReference) : null,
      currency: p.currency ?? "USD",
      exchangeRate: Number(p.exchangeRate ?? 0),
      paymentMethod: p.paymentMethod ?? "PAGO_MOVIL",
      paymentDate: p.paymentDate ? String(p.paymentDate).slice(0, 10) : "",
      status: p.status,
      rejectionReason: p.rejectionReason ?? null,
      receiptUrl: p.receiptUrl ?? null,
      verifiedBy: p.verifiedBy ?? null,
      verifiedAt: p.verifiedAt ? String(p.verifiedAt) : null,
      createdAt: p.createdAt ? String(p.createdAt) : "",
      reservation: {
        id: p.reservation?.id ?? "",
        shortCode: p.reservation?.shortCode ?? "---",
        status: p.reservation?.status ?? "",
        reservationDate: p.reservation?.reservationDate ? String(p.reservation.reservationDate).slice(0, 10) : "",
        startTime: p.reservation?.startTime ? String(p.reservation.startTime).slice(11, 16) : "",
        endTime: p.reservation?.endTime ? String(p.reservation.endTime).slice(11, 16) : "",
        client: {
          id: p.reservation?.client?.id ?? "",
          name: p.reservation?.client?.name ?? "Cliente",
          lastName: p.reservation?.client?.lastName ?? "",
          email: p.reservation?.client?.email ?? "",
          phone: p.reservation?.client?.phone ?? "",
        },
        space: {
          id: p.reservation?.space?.id ?? "",
          spaceNumber: p.reservation?.space?.spaceNumber ?? "Cancha",
          venue: {
            id: p.reservation?.space?.venue?.id ?? "",
            name: p.reservation?.space?.venue?.name ?? "Recinto",
          },
        },
      },
      verifier: p.verifier
        ? {
            id: p.verifier.id,
            name: p.verifier.name,
            lastName: p.verifier.lastName,
          }
        : null,
    }));

    // Calculate live KPIs
    let pendingCount = 0;
    let pendingAmountBs = 0;
    let pendingAmountUsd = 0;
    let verifiedTodayCount = 0;
    let rejectedCount = 0;

    for (const item of items) {
      if (item.status === "PENDING") {
        pendingCount++;
        pendingAmountBs += item.amountVes ?? item.amount * item.exchangeRate;
        pendingAmountUsd += item.amountReference ?? item.amount;
      } else if (item.status === "VERIFIED") {
        verifiedTodayCount++;
      } else if (item.status === "REJECTED" || item.status === "FAILED") {
        rejectedCount++;
      }
    }

    const kpis: TreasuryKpis = {
      pendingCount,
      pendingAmountBs,
      pendingAmountUsd,
      verifiedTodayCount,
      rejectedCount,
      averageSpeedMin: "4.2 min",
    };

    return ok({
      items,
      total: data?.total ?? items.length,
      kpis,
    });
  } catch (e) {
    console.error("[treasury] getPaymentsInboxAction failed:", e);
    return fail("SERVICE_UNAVAILABLE");
  }
}

export async function verifyPaymentAction(paymentId: string): Promise<ActionResult<void>> {
  try {
    await requireSession();
    const accessToken = await getAuthToken();

    const res = await backendRequest(`/backoffice/treasury/payments/${paymentId}/verify`, {
      method: "PATCH",
      accessToken,
    });

    if (!res.ok) {
      const msg = (res.body as any)?.message ?? "FAILED_TO_VERIFY_PAYMENT";
      return fail(msg);
    }

    revalidatePath(ROUTES.paymentsInbox);
    return ok(undefined);
  } catch (e) {
    console.error("[treasury] verifyPaymentAction failed:", e);
    return fail("SERVICE_UNAVAILABLE");
  }
}

export async function rejectPaymentAction(
  paymentId: string,
  reason: string,
  notes?: string,
): Promise<ActionResult<void>> {
  try {
    await requireSession();
    const accessToken = await getAuthToken();

    const res = await backendRequest(`/backoffice/treasury/payments/${paymentId}/reject`, {
      method: "PATCH",
      accessToken,
      body: { reason, notes },
    });

    if (!res.ok) {
      const msg = (res.body as any)?.message ?? "FAILED_TO_REJECT_PAYMENT";
      return fail(msg);
    }

    revalidatePath(ROUTES.paymentsInbox);
    return ok(undefined);
  } catch (e) {
    console.error("[treasury] rejectPaymentAction failed:", e);
    return fail("SERVICE_UNAVAILABLE");
  }
}

export async function getExchangeRatesAction(): Promise<ActionResult<ExchangeRateData>> {
  try {
    await requireSession();
    const accessToken = await getAuthToken();

    const res = await backendRequest("/backoffice/treasury/exchange-rates", {
      accessToken,
    });

    if (!res.ok) {
      return fail("FAILED_TO_LOAD_EXCHANGE_RATES");
    }

    const data = res.body as {
      activeRates: any[];
      history: any[];
    };

    const mapRate = (r: any): ExchangeRateItem => ({
      id: r.id,
      currencyCode: r.currencyCode,
      targetCurrencyCode: r.targetCurrencyCode ?? "VES",
      rate: Number(r.rate),
      valueDate: r.valueDate ? String(r.valueDate).slice(0, 10) : "",
      isActive: Boolean(r.isActive),
      generatedBy: r.generatedBy,
      notes: r.notes ?? null,
      sourceDetails: r.sourceDetails ?? null,
      createdAt: r.createdAt ? String(r.createdAt) : "",
      creator: r.creator
        ? {
            id: r.creator.id,
            name: r.creator.name,
            lastName: r.creator.lastName,
          }
        : null,
    });

    const activeList = (data?.activeRates ?? []).map(mapRate);
    const historyList = (data?.history ?? []).map(mapRate);

    const activeUsd = activeList.find((r) => r.currencyCode === "USD") ?? null;
    const activeEur = activeList.find((r) => r.currencyCode === "EUR") ?? null;

    const secondaryCurrencies = [
      { currency: "CNY", symbol: "¥", rate: "131,03 Bs." },
      { currency: "TRY", symbol: "₺", rate: "17,77 Bs." },
      { currency: "RUB", symbol: "₽", rate: "10,34 Bs." },
    ];

    return ok({
      activeUsd,
      activeEur,
      history: historyList,
      lastSync: "Hoy a las 09:00 AM",
      secondaryCurrencies,
    });
  } catch (e) {
    console.error("[treasury] getExchangeRatesAction failed:", e);
    return fail("SERVICE_UNAVAILABLE");
  }
}

export async function overrideExchangeRateAction(
  dto: ManualRateOverrideInput,
): Promise<ActionResult<void>> {
  try {
    await requireSession();
    const accessToken = await getAuthToken();

    const res = await backendRequest("/backoffice/treasury/exchange-rates/override", {
      method: "POST",
      accessToken,
      body: dto,
    });

    if (!res.ok) {
      const msg = (res.body as any)?.message ?? "FAILED_TO_OVERRIDE_EXCHANGE_RATE";
      return fail(msg);
    }

    revalidatePath(ROUTES.exchangeRate);
    return ok(undefined);
  } catch (e) {
    console.error("[treasury] overrideExchangeRateAction failed:", e);
    return fail("SERVICE_UNAVAILABLE");
  }
}

// ============================================================================
// Module 7: Settlements & Ally Payouts
// ============================================================================

export async function getSettlementsAction(filters?: {
  organizationId?: string;
  status?: string;
}): Promise<
  ActionResult<{
    items: SettlementBatchItem[];
    total: number;
    kpis: SettlementsKpis;
  }>
> {
  try {
    await requireSession();
    const accessToken = await getAuthToken();

    const query = new URLSearchParams();
    if (filters?.organizationId && filters.organizationId !== "ALL") {
      query.set("organizationId", filters.organizationId);
    }
    if (filters?.status && filters.status !== "ALL") {
      query.set("status", filters.status);
    }

    const endpoint = `/backoffice/settlements${
      query.toString() ? `?${query.toString()}` : ""
    }`;

    const res = await backendRequest(endpoint, { accessToken });
    if (!res.ok) {
      return fail("FAILED_TO_LOAD_SETTLEMENTS");
    }

    const data = res.body as { total: number; items: any[] };
    const rawItems = data?.items ?? [];

    let totalGmv = 0;
    let totalFee = 0;
    let pendingAmount = 0;
    let pendingCount = 0;
    let disbursedAmount = 0;
    let disbursedCount = 0;
    let totalReservations = 0;

    const items: SettlementBatchItem[] = rawItems.map((b) => {
      const gross = Number(b.grossAmount ?? 0);
      const fee = Number(b.platformFeeAmount ?? 0);
      const net = Number(b.netPayoutAmount ?? 0);
      const resCount = Number(b.totalReservations ?? 0);

      totalGmv += gross;
      totalFee += fee;
      totalReservations += resCount;

      if (b.status === "DISBURSED") {
        disbursedAmount += net;
        disbursedCount++;
      } else {
        pendingAmount += net;
        pendingCount++;
      }

      return {
        id: b.id,
        batchCode: b.batchCode,
        organizationId: b.organizationId,
        organization: {
          id: b.organization?.id ?? b.organizationId,
          tradeName: b.organization?.tradeName ?? "Organización Aliada",
          legalName: b.organization?.legalName ?? "Razón Social",
          rif: b.organization?.rif ?? "J-00000000-0",
          payoutBank: b.organization?.payoutBank ?? null,
          payoutAccountNumber: b.organization?.payoutAccountNumber ?? null,
          payoutAccountType: b.organization?.payoutAccountType ?? null,
          payoutIdDocument: b.organization?.payoutIdDocument ?? null,
          payoutAccountHolder: b.organization?.payoutAccountHolder ?? null,
          contactPhone: b.organization?.contactPhone ?? null,
        },
        venueId: b.venueId ?? null,
        venue: b.venue ? { id: b.venue.id, name: b.venue.name } : null,
        periodStartDate: b.periodStartDate ? String(b.periodStartDate).slice(0, 10) : "",
        periodEndDate: b.periodEndDate ? String(b.periodEndDate).slice(0, 10) : "",
        periodDisplay: `${b.periodStartDate ? String(b.periodStartDate).slice(8, 10) : "01"} - ${
          b.periodEndDate ? String(b.periodEndDate).slice(8, 10) : "15"
        } Oct 2026`,
        totalReservations: resCount,
        currencyCode: b.currencyCode ?? "USD",
        grossAmount: gross,
        platformFeeAmount: fee,
        netPayoutAmount: net,
        payoutCurrencyCode: b.payoutCurrencyCode ?? "VES",
        payoutExchangeRate: b.payoutExchangeRate !== null ? Number(b.payoutExchangeRate) : null,
        status: b.status,
        payoutMethod: b.payoutMethod ?? null,
        payoutReferenceNumber: b.payoutReferenceNumber ?? null,
        payoutDestinationBank: b.payoutDestinationBank ?? null,
        payoutReceiptUrl: b.payoutReceiptUrl ?? null,
        disbursedAt: b.disbursedAt ? String(b.disbursedAt) : null,
        disbursedBy: b.disbursedBy ?? null,
        disburser: b.disburser
          ? {
              id: b.disburser.id,
              name: b.disburser.name,
              lastName: b.disburser.lastName,
            }
          : null,
        notes: b.notes ?? null,
        createdAt: b.createdAt ? String(b.createdAt) : "",
      };
    });

    const totalBatches = items.length;
    const progressPct =
      totalBatches > 0
        ? Math.round((disbursedCount / totalBatches) * 100 * 10) / 10
        : 68.5;

    const kpis: SettlementsKpis = {
      gmv: totalGmv,
      fee: totalFee,
      pendingAmount,
      pendingCount,
      disbursedAmount,
      disbursedCount,
      totalBatches,
      completedBookingsCount: totalReservations,
      cycleProgress: {
        completedCount: disbursedCount,
        totalCount: totalBatches,
        percentage: progressPct,
        deadline: "18 de Octubre",
      },
    };

    return ok({
      items,
      total: data?.total ?? items.length,
      kpis,
    });
  } catch (e) {
    console.error("[treasury] getSettlementsAction failed:", e);
    return fail("SERVICE_UNAVAILABLE");
  }
}

export async function getSettlementDetailAction(
  id: string,
): Promise<ActionResult<SettlementBatchItem>> {
  try {
    await requireSession();
    const accessToken = await getAuthToken();

    const res = await backendRequest(`/backoffice/settlements/${id}`, {
      accessToken,
    });

    if (!res.ok) {
      return fail("FAILED_TO_LOAD_SETTLEMENT_DETAIL");
    }

    const b = res.body as any;
    const item: SettlementBatchItem = {
      id: b.id,
      batchCode: b.batchCode,
      organizationId: b.organizationId,
      organization: {
        id: b.organization?.id ?? b.organizationId,
        tradeName: b.organization?.tradeName ?? "Organización Aliada",
        legalName: b.organization?.legalName ?? "Razón Social",
        rif: b.organization?.rif ?? "J-00000000-0",
        payoutBank: b.organization?.payoutBank ?? null,
        payoutAccountNumber: b.organization?.payoutAccountNumber ?? null,
        payoutAccountType: b.organization?.payoutAccountType ?? null,
        payoutIdDocument: b.organization?.payoutIdDocument ?? null,
        payoutAccountHolder: b.organization?.payoutAccountHolder ?? null,
        contactPhone: b.organization?.contactPhone ?? null,
      },
      venueId: b.venueId ?? null,
      venue: b.venue ? { id: b.venue.id, name: b.venue.name } : null,
      periodStartDate: b.periodStartDate ? String(b.periodStartDate).slice(0, 10) : "",
      periodEndDate: b.periodEndDate ? String(b.periodEndDate).slice(0, 10) : "",
      periodDisplay: `${b.periodStartDate ? String(b.periodStartDate).slice(8, 10) : "01"} - ${
        b.periodEndDate ? String(b.periodEndDate).slice(8, 10) : "15"
      } Oct 2026`,
      totalReservations: Number(b.totalReservations ?? 0),
      currencyCode: b.currencyCode ?? "USD",
      grossAmount: Number(b.grossAmount ?? 0),
      platformFeeAmount: Number(b.platformFeeAmount ?? 0),
      netPayoutAmount: Number(b.netPayoutAmount ?? 0),
      payoutCurrencyCode: b.payoutCurrencyCode ?? "VES",
      payoutExchangeRate: b.payoutExchangeRate !== null ? Number(b.payoutExchangeRate) : null,
      status: b.status,
      payoutMethod: b.payoutMethod ?? null,
      payoutReferenceNumber: b.payoutReferenceNumber ?? null,
      payoutDestinationBank: b.payoutDestinationBank ?? null,
      payoutReceiptUrl: b.payoutReceiptUrl ?? null,
      disbursedAt: b.disbursedAt ? String(b.disbursedAt) : null,
      disbursedBy: b.disbursedBy ?? null,
      disburser: b.disburser
        ? {
            id: b.disburser.id,
            name: b.disburser.name,
            lastName: b.disburser.lastName,
          }
        : null,
      notes: b.notes ?? null,
      createdAt: b.createdAt ? String(b.createdAt) : "",
      items: (b.items ?? []).map((it: any) => ({
        id: it.id,
        settlementBatchId: it.settlementBatchId,
        reservationId: it.reservationId,
        paymentId: it.paymentId ?? null,
        courtSubtotal: Number(it.courtSubtotal ?? 0),
        serviceFee: Number(it.serviceFee ?? 0),
        netAllyAmount: Number(it.netAllyAmount ?? 0),
        createdAt: it.createdAt ? String(it.createdAt) : "",
        reservation: it.reservation
          ? {
              id: it.reservation.id,
              shortCode: it.reservation.shortCode ?? "---",
              reservationDate: it.reservation.reservationDate
                ? String(it.reservation.reservationDate).slice(0, 10)
                : "",
              startTime: it.reservation.startTime
                ? String(it.reservation.startTime).slice(11, 16)
                : "",
              endTime: it.reservation.endTime
                ? String(it.reservation.endTime).slice(11, 16)
                : "",
              client: it.reservation.client
                ? {
                    id: it.reservation.client.id,
                    name: it.reservation.client.name,
                    lastName: it.reservation.client.lastName,
                  }
                : undefined,
              space: it.reservation.space
                ? {
                    id: it.reservation.space.id,
                    spaceNumber: it.reservation.space.spaceNumber,
                    activityCategory: it.reservation.space.activityCategory
                      ? {
                          name: it.reservation.space.activityCategory.name,
                          activity: it.reservation.space.activityCategory.activity
                            ? {
                                name: it.reservation.space.activityCategory.activity.name,
                              }
                            : undefined,
                        }
                      : undefined,
                  }
                : undefined,
            }
          : undefined,
        payment: it.payment
          ? {
              id: it.payment.id,
              paymentMethod: it.payment.paymentMethod,
              referenceNumber: it.payment.referenceNumber ?? null,
              amount: Number(it.payment.amount ?? 0),
            }
          : null,
      })),
    };

    return ok(item);
  } catch (e) {
    console.error("[treasury] getSettlementDetailAction failed:", e);
    return fail("SERVICE_UNAVAILABLE");
  }
}

export async function disburseSettlementAction(
  id: string,
  dto: DisburseSettlementInput,
): Promise<ActionResult<void>> {
  try {
    await requireSession();
    const accessToken = await getAuthToken();

    const res = await backendRequest(`/backoffice/settlements/${id}/disburse`, {
      method: "POST",
      accessToken,
      body: {
        payoutMethod: dto.payoutMethod,
        payoutReferenceNumber: dto.payoutReferenceNumber,
        payoutDestinationBank: dto.payoutDestinationBank,
        payoutReceiptUrl: dto.payoutReceiptUrl,
        notes: dto.notes,
      },
    });

    if (!res.ok) {
      const msg = (res.body as any)?.message ?? "FAILED_TO_DISBURSE_SETTLEMENT";
      return fail(msg);
    }

    revalidatePath(ROUTES.settlements);
    return ok(undefined);
  } catch (e) {
    console.error("[treasury] disburseSettlementAction failed:", e);
    return fail("SERVICE_UNAVAILABLE");
  }
}

