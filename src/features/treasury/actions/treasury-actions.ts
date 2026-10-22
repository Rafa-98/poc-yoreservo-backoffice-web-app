"use server";

import { revalidatePath } from "next/cache";
import { backendRequest } from "@/shared/api/index.server";
import { requireSessionWithToken } from "@/shared/auth/index.server";
import { ROUTES } from "@/shared/config";
import {
  DEFAULT_BCV_EUR_RATE,
  DEFAULT_BCV_USD_RATE,
  fail,
  ok,
  type ActionResult,
} from "@/shared/lib";
import type {
  DisburseSettlementInput,
  ExchangeRateData,
  ExchangeRateItem,
  ManualRateOverrideInput,
  PaymentItem,
  PaymentsInboxData,
  SettlementBatchItem,
  SettlementDirection,
  SettlementsKpis,
  TreasuryKpis,
  UnsettledPoolItem,
} from "../model/types";

function formatSettlementPeriod(
  periodStartDate?: string | null,
  periodEndDate?: string | null,
  backendDisplay?: string | null,
): string {
  if (backendDisplay) return String(backendDisplay);
  const startStr = periodStartDate ? String(periodStartDate).slice(0, 10) : "";
  const endStr = periodEndDate ? String(periodEndDate).slice(0, 10) : "";
  const refDate = endStr ? new Date(`${endStr}T00:00:00Z`) : new Date();
  const safeDate = Number.isNaN(refDate.getTime()) ? new Date() : refDate;
  const monthYear = new Intl.DateTimeFormat("es-VE", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(safeDate);
  const startDay = startStr ? startStr.slice(8, 10) : "01";
  const endDay = endStr ? endStr.slice(8, 10) : "15";
  return `${startDay} - ${endDay} ${monthYear}`;
}

function getCurrentCycleDeadline(backendDeadline?: string | null): string {
  if (backendDeadline) return String(backendDeadline);
  const now = new Date();
  const deadlineDate =
    now.getDate() <= 15
      ? new Date(now.getFullYear(), now.getMonth(), 18)
      : new Date(now.getFullYear(), now.getMonth() + 1, 3);
  return new Intl.DateTimeFormat("es-VE", {
    day: "2-digit",
    month: "long",
  }).format(deadlineDate);
}

export async function getPaymentsInboxAction(filters?: {
  status?: string;
  paymentMethod?: string;
  search?: string;
  venueId?: string;
  fromDate?: string;
  toDate?: string;
}): Promise<ActionResult<PaymentsInboxData>> {
  const { accessToken } = await requireSessionWithToken([
    "PLATFORM_ADMIN",
    "PLATFORM_ACCOUNTING",
    "ALLY_ADMIN",
    "ALLY_ACCOUNTING",
  ]);
  try {
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
    if (filters?.venueId && filters.venueId !== "ALL") {
      query.set("venueId", filters.venueId);
    }
    if (filters?.fromDate) {
      query.set("fromDate", filters.fromDate);
    }
    if (filters?.toDate) {
      query.set("toDate", filters.toDate);
    }

    const endpoint = `/backoffice/treasury/payments${
      query.toString() ? `?${query.toString()}` : ""
    }`;

    const res = await backendRequest(endpoint, { accessToken });
    if (!res.ok) {
      return fail("FAILED_TO_LOAD_PAYMENTS");
    }

    const data = res.body as {
      total: number;
      items: any[];
      kpis?: Partial<TreasuryKpis>;
    };
    const rawItems = data?.items ?? [];

    const items: PaymentItem[] = rawItems.map((p) => {
      const rawAmount = Number(p.amount ?? 0);
      const rate = Number(p.exchangeRate) || DEFAULT_BCV_USD_RATE;
      const isVesCurrency = p.currency === "VES";
      const computedAmountVes =
        p.amountVes !== null && p.amountVes !== undefined
          ? Number(p.amountVes)
          : isVesCurrency
            ? rawAmount
            : Number((rawAmount * rate).toFixed(2));
      const computedAmountReference =
        p.amountReference !== null && p.amountReference !== undefined
          ? Number(p.amountReference)
          : p.reservation?.totalAmount !== null &&
              p.reservation?.totalAmount !== undefined
            ? Number(p.reservation.totalAmount)
            : isVesCurrency
              ? Number((rawAmount / rate).toFixed(2))
              : rawAmount;

      const refCurrency =
        p.reservation?.currencyCode ||
        (p.currencyCode && p.currencyCode !== "VES" ? p.currencyCode : "USD");

      return {
        id: p.id,
        reservationId: p.reservationId,
        referenceNumber: p.referenceNumber ?? null,
        phoneNumber: p.phoneNumber ?? null,
        originBank: p.originBank ?? null,
        payerIdDocument: p.payerIdDocument ?? null,
        payerDocumentType: p.payerDocumentType ?? null,
        amount: computedAmountReference,
        amountVes: computedAmountVes,
        amountReference: computedAmountReference,
        currency: refCurrency,
        currencyCode: refCurrency,
        exchangeRate: rate,
        paymentMethod: p.paymentMethod ?? "PAGO_MOVIL",
        paymentDate: p.paymentDate ? String(p.paymentDate).slice(0, 10) : "",
        status: p.status,
        rejectionReason: p.rejectionReason ?? null,
        receiptUrl: p.receiptUrl ?? null,
        verifiedBy: p.verifiedBy ?? null,
        verifiedAt: p.verifiedAt ? String(p.verifiedAt) : null,
        createdAt: p.createdAt ? String(p.createdAt) : "",
        collectionMode:
          p.collectionMode === "ALLY_DIRECT" ? "ALLY_DIRECT" : "PLATFORM_CUSTODY",
        isDuplicateReference: Boolean(p.isDuplicateReference),
        reservation: {
          id: p.reservation?.id ?? "",
          shortCode: p.reservation?.shortCode ?? "---",
          status: p.reservation?.status ?? "",
          currencyCode: refCurrency,
          reservationDate: p.reservation?.reservationDate
            ? String(p.reservation.reservationDate).slice(0, 10)
            : "",
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
      };
    });

    // Calculate live KPIs from real payment items
    const todayIso = new Date().toISOString().slice(0, 10);
    let pendingCount = 0;
    let pendingAmountBs = 0;
    let pendingAmountUsd = 0;
    let verifiedTodayCount = 0;
    let totalVerifiedCount = 0;
    let rejectedCount = 0;
    const verificationMinutes: number[] = [];

    for (const item of items) {
      if (item.status === "PENDING") {
        pendingCount++;
        pendingAmountBs += item.amountVes ?? item.amount * item.exchangeRate;
        pendingAmountUsd += item.amountReference ?? item.amount;
      } else if (item.status === "VERIFIED") {
        totalVerifiedCount++;
        const verifiedDateStr = item.verifiedAt
          ? item.verifiedAt.slice(0, 10)
          : item.paymentDate;
        if (verifiedDateStr === todayIso) {
          verifiedTodayCount++;
        }
      } else if (item.status === "REJECTED" || item.status === "FAILED") {
        rejectedCount++;
      }

      if (item.verifiedAt && item.createdAt) {
        const diffMin =
          (new Date(item.verifiedAt).getTime() - new Date(item.createdAt).getTime()) /
          60000;
        if (Number.isFinite(diffMin) && diffMin >= 0 && diffMin <= 1440) {
          verificationMinutes.push(diffMin);
        }
      }
    }

    const totalDecided = totalVerifiedCount + rejectedCount;
    const computedApprovalRatePct =
      totalDecided > 0 ? Math.round((totalVerifiedCount / totalDecided) * 100) : 100;

    const computedAverageSpeed =
      verificationMinutes.length > 0
        ? `${(
            verificationMinutes.reduce((acc, v) => acc + v, 0) /
            verificationMinutes.length
          ).toFixed(1)} min`
        : "—";

    const kpis: TreasuryKpis = {
      pendingCount: data?.kpis?.pendingCount ?? pendingCount,
      pendingAmountBs: data?.kpis?.pendingAmountBs ?? pendingAmountBs,
      pendingAmountUsd: data?.kpis?.pendingAmountUsd ?? pendingAmountUsd,
      verifiedTodayCount: data?.kpis?.verifiedTodayCount ?? verifiedTodayCount,
      rejectedCount: data?.kpis?.rejectedCount ?? rejectedCount,
      averageSpeedMin: data?.kpis?.averageSpeedMin || computedAverageSpeed,
      approvalRatePct: data?.kpis?.approvalRatePct ?? computedApprovalRatePct,
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
  const { accessToken } = await requireSessionWithToken([
    "PLATFORM_ADMIN",
    "PLATFORM_ACCOUNTING",
    "ALLY_ADMIN",
    "ALLY_ACCOUNTING",
  ]);
  try {
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

export const approvePaymentAction = verifyPaymentAction;

export async function rejectPaymentAction(
  paymentId: string,
  reason: string,
  action: "RETRY" | "CANCEL" = "RETRY",
  notes?: string,
): Promise<ActionResult<void>> {
  const { accessToken } = await requireSessionWithToken([
    "PLATFORM_ADMIN",
    "PLATFORM_ACCOUNTING",
    "ALLY_ADMIN",
    "ALLY_ACCOUNTING",
  ]);
  try {
    const res = await backendRequest(`/backoffice/treasury/payments/${paymentId}/reject`, {
      method: "PATCH",
      accessToken,
      body: { reason, action, notes },
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

export async function getExchangeRatesAction(params?: {
  currencyCode?: "USD" | "EUR";
  page?: number;
  limit?: number;
  fromDate?: string;
  toDate?: string;
}): Promise<ActionResult<ExchangeRateData>> {
  const { accessToken } = await requireSessionWithToken([
    "PLATFORM_ADMIN",
    "PLATFORM_ACCOUNTING",
    "ALLY_ADMIN",
    "ALLY_ACCOUNTING",
  ]);
  try {
    const query = new URLSearchParams();
    query.set("currencyCode", params?.currencyCode ?? "USD");
    query.set("page", String(params?.page ?? 1));
    query.set("limit", String(params?.limit ?? 5));
    if (params?.fromDate) {
      query.set("fromDate", params.fromDate);
    }
    if (params?.toDate) {
      query.set("toDate", params.toDate);
    }

    const res = await backendRequest(
      `/backoffice/treasury/exchange-rates?${query.toString()}`,
      {
        accessToken,
      },
    );

    if (!res.ok) {
      return fail("FAILED_TO_LOAD_EXCHANGE_RATES");
    }

    const data = res.body as {
      activeRates: any[];
      history: any[];
      historyPagination?: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
      lastSync?: string;
      secondaryCurrencies?: Array<{ currency: string; symbol: string; rate: string }>;
    };

    const mapRate = (r: any): ExchangeRateItem => ({
      id: r.id,
      currencyCode: r.currencyCode,
      targetCurrencyCode: r.targetCurrencyCode ?? "VES",
      rate:
        Number(r.rate) ||
        (r.currencyCode === "EUR" ? DEFAULT_BCV_EUR_RATE : DEFAULT_BCV_USD_RATE),
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
      previousRate:
        r.previousRate !== null && r.previousRate !== undefined
          ? Number(r.previousRate)
          : undefined,
      variationPct: r.variationPct ?? undefined,
    });

    const activeList = (data?.activeRates ?? []).map(mapRate);
    const historyList = (data?.history ?? []).map(mapRate);

    const activeUsd = activeList.find((r) => r.currencyCode === "USD") ?? null;
    const activeEur = activeList.find((r) => r.currencyCode === "EUR") ?? null;

    // Attach previous rate and variation % from history ledger if not already computed by backend
    if (activeUsd && !activeUsd.previousRate) {
      const prevUsd = historyList.find(
        (h) => h.currencyCode === "USD" && h.id !== activeUsd.id,
      );
      if (prevUsd && prevUsd.rate > 0) {
        activeUsd.previousRate = prevUsd.rate;
        const diffPct = ((activeUsd.rate - prevUsd.rate) / prevUsd.rate) * 100;
        activeUsd.variationPct = `${diffPct >= 0 ? "+" : ""}${diffPct.toFixed(2)}%`;
      }
    }

    if (activeEur && !activeEur.previousRate) {
      const prevEur = historyList.find(
        (h) => h.currencyCode === "EUR" && h.id !== activeEur.id,
      );
      if (prevEur && prevEur.rate > 0) {
        activeEur.previousRate = prevEur.rate;
        const diffPct = ((activeEur.rate - prevEur.rate) / prevEur.rate) * 100;
        activeEur.variationPct = `${diffPct >= 0 ? "+" : ""}${diffPct.toFixed(2)}%`;
      }
    }

    // Build secondary ticker items from real active USD/EUR rates or backend response (no fake CNY/TRY/RUB)
    const secondaryCurrencies = Array.isArray(data?.secondaryCurrencies)
      ? data.secondaryCurrencies
      : [
          ...(activeUsd
            ? [
                {
                  currency: "USD / VES",
                  symbol: "$",
                  rate: `${activeUsd.rate.toLocaleString("es-VE", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })} Bs.${activeUsd.variationPct ? ` (${activeUsd.variationPct})` : ""}`,
                },
              ]
            : []),
          ...(activeEur
            ? [
                {
                  currency: "EUR / VES",
                  symbol: "€",
                  rate: `${activeEur.rate.toLocaleString("es-VE", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })} Bs.${activeEur.variationPct ? ` (${activeEur.variationPct})` : ""}`,
                },
              ]
            : []),
          ...(activeUsd && activeEur && activeUsd.rate > 0
            ? [
                {
                  currency: "EUR / USD",
                  symbol: "€/$",
                  rate: (activeEur.rate / activeUsd.rate).toFixed(2),
                },
              ]
            : []),
        ];

    const latestCreatedAt = activeUsd?.createdAt || activeEur?.createdAt;
    const formattedSyncTime =
      data?.lastSync ||
      (latestCreatedAt
        ? new Date(latestCreatedAt).toLocaleTimeString("es-VE", {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "—");

    return ok({
      activeUsd,
      activeEur,
      history: historyList,
      historyPagination: data?.historyPagination ?? {
        total: historyList.length,
        page: params?.page ?? 1,
        limit: params?.limit ?? 5,
        totalPages: 1,
      },
      lastSync: formattedSyncTime,
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
  const { accessToken } = await requireSessionWithToken(["PLATFORM_ADMIN", "PLATFORM_ACCOUNTING"]);
  try {
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
    organizations: Array<{ id: string; name: string }>;
    unsettledPools: UnsettledPoolItem[];
    autoBatchSchedule?: {
      morningTime: string;
      nightTime: string;
      timeZone: string;
    };
  }>
> {
  const { accessToken } = await requireSessionWithToken([
    "PLATFORM_ADMIN",
    "PLATFORM_ACCOUNTING",
    "ALLY_ADMIN",
    "ALLY_ACCOUNTING",
  ]);
  try {
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

    const [res, venuesRes] = await Promise.all([
      backendRequest(endpoint, { accessToken }),
      backendRequest("/backoffice/venues", { accessToken }).catch(() => null),
    ]);

    if (!res.ok) {
      return fail("FAILED_TO_LOAD_SETTLEMENTS");
    }

    const data = res.body as {
      total: number;
      items: any[];
      cycleDeadline?: string;
      organizations?: Array<{ id: string; name?: string; tradeName?: string }>;
      unsettledPools?: any[];
      autoBatchSchedule?: {
        morningTime?: string;
        nightTime?: string;
        timeZone?: string;
      };
    };
    const rawItems = data?.items ?? [];
    const unsettledPools: UnsettledPoolItem[] = (data?.unsettledPools ?? []).map((p: any) => ({
      organizationId: String(p.organizationId),
      organizationName: String(p.organizationName ?? "Organización Aliada"),
      legalName: p.legalName ? String(p.legalName) : undefined,
      rif: String(p.rif ?? "J-00000000-0"),
      currencyCode: p.currencyCode ? String(p.currencyCode) : "USD",
      payoutBank: p.payoutBank ?? null,
      payoutAccountNumber: p.payoutAccountNumber ?? null,
      payoutAccountHolder: p.payoutAccountHolder ?? null,
      direction:
        p.direction === "ALLY_TO_PLATFORM" ? "ALLY_TO_PLATFORM" : "PLATFORM_TO_ALLY",
      reservationsCount: Number(p.reservationsCount ?? 0),
      grossAmount: Number(p.grossAmount ?? 0),
      platformFeeAmount: Number(p.platformFeeAmount ?? 0),
      netAmount: Number(p.netAmount ?? 0),
      oldestVerifiedAt: p.oldestVerifiedAt ? String(p.oldestVerifiedAt) : null,
      latestVerifiedAt: p.latestVerifiedAt ? String(p.latestVerifiedAt) : null,
    }));

    let totalGmv = 0;
    let totalFee = 0;
    let pendingAmount = 0;
    let pendingCount = 0;
    let disbursedAmount = 0;
    let disbursedCount = 0;
    let totalReservations = 0;

    const orgMap = new Map<string, { id: string; name: string }>();

    if (Array.isArray(data?.organizations)) {
      for (const org of data.organizations) {
        if (org?.id) {
          orgMap.set(org.id, {
            id: org.id,
            name: org.tradeName || org.name || "Organización Aliada",
          });
        }
      }
    }

    if (venuesRes?.ok && venuesRes.body) {
      const venuesBody = venuesRes.body as any;
      const rawVenues: any[] = Array.isArray(venuesBody)
        ? venuesBody
        : Array.isArray(venuesBody.items)
          ? venuesBody.items
          : [];
      for (const v of rawVenues) {
        const orgId = v.organizationId || v.organization?.id;
        const orgName =
          v.organization?.tradeName || v.organization?.legalName || v.organizationName;
        if (orgId && orgName && !orgMap.has(orgId)) {
          orgMap.set(orgId, { id: String(orgId), name: String(orgName) });
        }
      }
    }

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

      const orgId = b.organization?.id ?? b.organizationId;
      const orgTradeName = b.organization?.tradeName ?? "Organización Aliada";
      if (orgId && !orgMap.has(orgId)) {
        orgMap.set(orgId, { id: String(orgId), name: String(orgTradeName) });
      }

      return {
        id: b.id,
        batchCode: b.batchCode,
        organizationId: b.organizationId,
        organization: {
          id: orgId,
          tradeName: orgTradeName,
          legalName: b.organization?.legalName ?? "Razón Social",
          rif: b.organization?.rif ?? "J-00000000-0",
          referenceCurrencyCode:
            b.organization?.referenceCurrencyCode ?? b.currencyCode ?? "USD",
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
        periodDisplay: formatSettlementPeriod(
          b.periodStartDate,
          b.periodEndDate,
          b.periodDisplay,
        ),
        totalReservations: resCount,
        currencyCode:
          b.currencyCode ?? b.organization?.referenceCurrencyCode ?? "USD",
        grossAmount: gross,
        platformFeeAmount: fee,
        netPayoutAmount: net,
        payoutCurrencyCode: b.payoutCurrencyCode ?? "VES",
        payoutExchangeRate:
          b.payoutExchangeRate !== null && b.payoutExchangeRate !== undefined
            ? Number(b.payoutExchangeRate)
            : null,
        direction:
          b.direction === "ALLY_TO_PLATFORM"
            ? "ALLY_TO_PLATFORM"
            : "PLATFORM_TO_ALLY",
        dueDate: b.dueDate ? String(b.dueDate).slice(0, 10) : null,
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
        : 0;

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
        deadline: getCurrentCycleDeadline(data?.cycleDeadline),
      },
    };

    return ok({
      items,
      total: data?.total ?? items.length,
      kpis,
      organizations: Array.from(orgMap.values()),
      unsettledPools,
      autoBatchSchedule: {
        morningTime: data?.autoBatchSchedule?.morningTime || "07:00",
        nightTime: data?.autoBatchSchedule?.nightTime || "23:00",
        timeZone: data?.autoBatchSchedule?.timeZone || "America/Caracas",
      },
    });
  } catch (e) {
    console.error("[treasury] getSettlementsAction failed:", e);
    return fail("SERVICE_UNAVAILABLE");
  }
}

export async function getSettlementDetailAction(
  id: string,
): Promise<ActionResult<SettlementBatchItem>> {
  const { accessToken } = await requireSessionWithToken([
    "PLATFORM_ADMIN",
    "PLATFORM_ACCOUNTING",
    "ALLY_ADMIN",
    "ALLY_ACCOUNTING",
  ]);
  try {
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
      periodDisplay: formatSettlementPeriod(
        b.periodStartDate,
        b.periodEndDate,
        b.periodDisplay,
      ),
      totalReservations: Number(b.totalReservations ?? 0),
      currencyCode:
        b.currencyCode ?? b.organization?.referenceCurrencyCode ?? "USD",
      grossAmount: Number(b.grossAmount ?? 0),
      platformFeeAmount: Number(b.platformFeeAmount ?? 0),
      netPayoutAmount: Number(b.netPayoutAmount ?? 0),
      payoutCurrencyCode: b.payoutCurrencyCode ?? "VES",
      payoutExchangeRate:
        b.payoutExchangeRate !== null && b.payoutExchangeRate !== undefined
          ? Number(b.payoutExchangeRate)
          : null,
      direction:
        b.direction === "ALLY_TO_PLATFORM"
          ? "ALLY_TO_PLATFORM"
          : "PLATFORM_TO_ALLY",
      dueDate: b.dueDate ? String(b.dueDate).slice(0, 10) : null,
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
      items: (b.items ?? []).map((it: any) => {
        const resolveName = (val: unknown, fallback = ""): string => {
          if (!val) return fallback;
          if (typeof val === "string") return val;
          if (typeof val === "object") {
            const obj = val as Record<string, unknown>;
            if (typeof obj.es === "string") return obj.es;
            if (typeof obj.en === "string") return obj.en;
            const first = Object.values(obj).find((v) => typeof v === "string");
            if (typeof first === "string") return first;
          }
          return fallback;
        };

        const rawServiceFee = Number(it.serviceFee ?? 0);
        const rawAllyComm = Number(it.allyCommission ?? 0);
        const effectiveFee =
          it.totalPlatformFee !== null && it.totalPlatformFee !== undefined
            ? Number(it.totalPlatformFee)
            : rawServiceFee + rawAllyComm;

        return {
          id: it.id,
          settlementBatchId: it.settlementBatchId,
          reservationId: it.reservationId,
          paymentId: it.paymentId ?? null,
          courtSubtotal: Number(it.courtSubtotal ?? 0),
          serviceFee: effectiveFee,
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
                      name: resolveName(it.reservation.client.name, "Cliente"),
                      lastName: resolveName(it.reservation.client.lastName, ""),
                    }
                  : it.reservation.customerName
                    ? {
                        id: "walk-in",
                        name: String(it.reservation.customerName),
                        lastName: "",
                      }
                    : undefined,
                space: it.reservation.space
                  ? {
                      id: it.reservation.space.id,
                      spaceNumber: resolveName(it.reservation.space.spaceNumber, "Cancha"),
                      activityCategory: it.reservation.space.activityCategory
                        ? {
                            name: resolveName(it.reservation.space.activityCategory.name),
                            activity: it.reservation.space.activityCategory.activity
                              ? {
                                  name: resolveName(
                                    it.reservation.space.activityCategory.activity.name,
                                  ),
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
        };
      }),
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
  const { accessToken } = await requireSessionWithToken(["PLATFORM_ADMIN", "PLATFORM_ACCOUNTING"]);
  try {
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

export async function reportInvoicePaymentAction(
  id: string,
  dto: DisburseSettlementInput,
): Promise<ActionResult<void>> {
  const { accessToken } = await requireSessionWithToken([
    "PLATFORM_ADMIN",
    "PLATFORM_ACCOUNTING",
    "ALLY_ADMIN",
    "ALLY_ACCOUNTING",
  ]);
  try {
    const res = await backendRequest(`/backoffice/settlements/${id}/report-payment`, {
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
      const msg = (res.body as any)?.message ?? "FAILED_TO_REPORT_INVOICE_PAYMENT";
      return fail(msg);
    }

    revalidatePath(ROUTES.settlements);
    return ok(undefined);
  } catch (e) {
    console.error("[treasury] reportInvoicePaymentAction failed:", e);
    return fail("SERVICE_UNAVAILABLE");
  }
}

export async function syncBcvExchangeRatesAction(): Promise<
  ActionResult<{ message: string; usdRate?: number; eurRate?: number }>
> {
  const { accessToken } = await requireSessionWithToken(["PLATFORM_ADMIN", "PLATFORM_ACCOUNTING"]);
  try {
    const res = await backendRequest("/backoffice/treasury/exchange-rates/sync", {
      method: "POST",
      accessToken,
    });

    if (!res.ok) {
      return fail("FAILED_TO_SYNC_BCV");
    }

    revalidatePath(ROUTES.exchangeRate);
    return ok(res.body as any);
  } catch (e) {
    console.error("[treasury] syncBcvExchangeRatesAction failed:", e);
    return fail("SERVICE_UNAVAILABLE");
  }
}

export const syncBcvRatesAction = syncBcvExchangeRatesAction;

export async function generateSettlementBatchAction(input: {
  organizationId: string;
  periodStartDate?: string;
  periodEndDate?: string;
  direction?: SettlementDirection;
  venueId?: string;
}): Promise<ActionResult<any>> {
  const { accessToken } = await requireSessionWithToken([
    "PLATFORM_ADMIN",
    "PLATFORM_ACCOUNTING",
    "ALLY_ADMIN",
    "ALLY_ACCOUNTING",
  ]);
  try {
    const res = await backendRequest("/backoffice/settlements/generate", {
      method: "POST",
      accessToken,
      body: input,
    });

    if (!res.ok) {
      const msg = (res.body as any)?.message ?? "FAILED_TO_GENERATE_BATCH";
      return fail(msg);
    }

    revalidatePath(ROUTES.settlements);
    return ok(res.body);
  } catch (e) {
    console.error("[settlements] generateSettlementBatchAction failed:", e);
    return fail("SERVICE_UNAVAILABLE");
  }
}

export async function exportSettlementBankingFileAction(
  id: string,
  format: "BDV" | "BANESCO" | "PAGO_MOVIL" | "CSV" = "CSV",
): Promise<ActionResult<{ filename: string; mimeType: string; content: string }>> {
  const { accessToken } = await requireSessionWithToken([
    "PLATFORM_ADMIN",
    "PLATFORM_ACCOUNTING",
    "ALLY_ADMIN",
    "ALLY_ACCOUNTING",
  ]);
  try {
    const res = await backendRequest(`/backoffice/settlements/${id}/export?format=${format}`, {
      accessToken,
    });

    if (!res.ok) {
      return fail("FAILED_TO_EXPORT_FILE");
    }

    return ok(res.body as any);
  } catch (e) {
    console.error("[settlements] exportSettlementBankingFileAction failed:", e);
    return fail("SERVICE_UNAVAILABLE");
  }
}
