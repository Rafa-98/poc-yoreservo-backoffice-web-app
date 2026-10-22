"use client";

import React, { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import type { BackofficeRole } from "@/shared/config";
import {
  SettlementsKpiStrip,
  type SettlementsDynamicKpis,
} from "@/features/treasury/ui/settlements-kpi-strip";
import { SettlementsCycleCard } from "@/features/treasury/ui/settlements-cycle-card";
import { SettlementsFilterBar } from "@/features/treasury/ui/settlements-filter-bar";
import { SettlementsTable } from "@/features/treasury/ui/settlements-table";
import {
  SettlementPayoutModal,
  type SettlementPayoutSubmitPayload,
} from "@/features/treasury/ui/settlement-payout-modal";
import { SettlementStatementDrawer } from "@/features/treasury/ui/settlement-statement-drawer";
import {
  disburseSettlementAction,
  generateSettlementBatchAction,
  getSettlementsAction,
  reportInvoicePaymentAction,
} from "@/features/treasury/actions/treasury-actions";
import type {
  SettlementBatchItem,
  SettlementDirection,
  SettlementFilter,
  SettlementsKpis,
  UnsettledPoolItem,
} from "@/features/treasury/model/types";

interface SettlementsPageProps {
  initialBatches: SettlementBatchItem[];
  initialKpis?: SettlementsKpis;
  initialUnsettledPools?: UnsettledPoolItem[];
  organizations: Array<{ id: string; name: string }>;
  bcvRate: number;
  bcvEurRate?: number;
  userRole?: BackofficeRole;
  autoBatchSchedule?: {
    morningTime: string;
    nightTime: string;
    timeZone: string;
  };
}

function getCaracasDateIso(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Caracas",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function getDateBoundsForPeriod(
  period: string,
  customFrom?: string,
  customTo?: string,
): { fromIso: string | null; toIso: string | null; label: string } {
  const now = new Date();
  const todayIso = getCaracasDateIso(now);

  const fmtHuman = (iso: string) => {
    const d = new Date(`${iso.slice(0, 10)}T12:00:00Z`);
    if (Number.isNaN(d.getTime())) return iso;
    return new Intl.DateTimeFormat("es-VE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    }).format(d);
  };

  if (period === "TODAY") {
    return {
      fromIso: todayIso,
      toIso: todayIso,
      label: `Hoy (${fmtHuman(todayIso)})`,
    };
  }

  if (period === "YESTERDAY") {
    const yest = getCaracasDateIso(new Date(now.getTime() - 24 * 60 * 60 * 1000));
    return {
      fromIso: yest,
      toIso: yest,
      label: `Ayer (${fmtHuman(yest)})`,
    };
  }

  if (period === "LAST_7_DAYS") {
    const start = getCaracasDateIso(
      new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000),
    );
    return {
      fromIso: start,
      toIso: todayIso,
      label: `${fmtHuman(start)} — ${fmtHuman(todayIso)}`,
    };
  }

  if (period === "THIS_MONTH") {
    const monthStart = `${todayIso.slice(0, 7)}-01`;
    return {
      fromIso: monthStart,
      toIso: todayIso,
      label: `${fmtHuman(monthStart)} — ${fmtHuman(todayIso)}`,
    };
  }

  if (period === "CUSTOM") {
    const f = customFrom || todayIso;
    const t = customTo || todayIso;
    return {
      fromIso: f,
      toIso: t,
      label: `${fmtHuman(f)} — ${fmtHuman(t)}`,
    };
  }

  return {
    fromIso: null,
    toIso: null,
    label: "Histórico completo",
  };
}

export function SettlementsPage({
  initialBatches,
  initialUnsettledPools = [],
  organizations,
  bcvRate,
  bcvEurRate,
  userRole = "PLATFORM_ADMIN",
  autoBatchSchedule = {
    morningTime: "07:00",
    nightTime: "23:00",
    timeZone: "America/Caracas",
  },
}: SettlementsPageProps) {
  const t = useTranslations("settlements");
  const effectiveEurRate = bcvEurRate ?? bcvRate;

  const [batches, setBatches] = useState<SettlementBatchItem[]>(initialBatches);
  const [unsettledPools, setUnsettledPools] =
    useState<UnsettledPoolItem[]>(initialUnsettledPools);

  const defaultFrom = useMemo(
    () => getCaracasDateIso(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)),
    [],
  );
  const defaultTo = useMemo(() => getCaracasDateIso(new Date()), []);

  const [filter, setFilter] = useState<SettlementFilter>({
    search: "",
    period: "LAST_7_DAYS",
    fromDate: defaultFrom,
    toDate: defaultTo,
    organizationId: "ALL",
    direction: "PLATFORM_TO_ALLY",
    status: "ALL",
  });

  const [selectedForDrawer, setSelectedForDrawer] =
    useState<SettlementBatchItem | null>(null);
  const [selectedForPayout, setSelectedForPayout] =
    useState<SettlementBatchItem | null>(null);
  const [generatingOrgId, setGeneratingOrgId] = useState<string | null>(null);
  const [feedbackBanner, setFeedbackBanner] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const { fromIso, toIso, label: periodRangeLabel } = useMemo(
    () => getDateBoundsForPeriod(filter.period, filter.fromDate, filter.toDate),
    [filter.period, filter.fromDate, filter.toDate],
  );

  // Filter unsettled pools by active direction and selected organization
  const activeUnsettledPools = useMemo(() => {
    return unsettledPools.filter((pool) => {
      if (pool.direction !== filter.direction) return false;
      if (
        filter.organizationId !== "ALL" &&
        pool.organizationId !== filter.organizationId
      ) {
        return false;
      }
      return pool.reservationsCount > 0;
    });
  }, [unsettledPools, filter.direction, filter.organizationId]);

  // Batches matching Organization + Period + Direction (used for KPI strip and status chip counts)
  const scopedBatches = useMemo(() => {
    return batches.filter((b) => {
      const batchDir = b.direction || "PLATFORM_TO_ALLY";
      if (batchDir !== filter.direction) return false;

      if (
        filter.organizationId !== "ALL" &&
        b.organizationId !== filter.organizationId
      ) {
        return false;
      }

      if (fromIso && toIso) {
        const refDate = b.createdAt
          ? getCaracasDateIso(new Date(b.createdAt))
          : b.periodEndDate?.slice(0, 10) ||
            b.periodStartDate?.slice(0, 10) ||
            "";
        if (refDate && (refDate < fromIso || refDate > toIso)) {
          return false;
        }
      }

      if (filter.search.trim()) {
        const q = filter.search.toLowerCase().trim();
        const matchesCode = b.batchCode.toLowerCase().includes(q);
        const matchesTrade = b.organization?.tradeName
          ?.toLowerCase()
          .includes(q);
        const matchesLegal = b.organization?.legalName
          ?.toLowerCase()
          .includes(q);
        const matchesRif = b.organization?.rif?.toLowerCase().includes(q);
        const matchesVenue = b.venue?.name?.toLowerCase().includes(q);
        if (
          !matchesCode &&
          !matchesTrade &&
          !matchesLegal &&
          !matchesRif &&
          !matchesVenue
        ) {
          return false;
        }
      }

      return true;
    });
  }, [batches, filter.direction, filter.organizationId, filter.search, fromIso, toIso]);

  // Final displayed batches after applying status chip filter
  const displayedBatches = useMemo(() => {
    return scopedBatches.filter((b) => {
      if (filter.status === "PENDING" && b.status === "DISBURSED") return false;
      if (filter.status === "DISBURSED" && b.status !== "DISBURSED") return false;
      return true;
    });
  }, [scopedBatches, filter.status]);

  // Counts for status chips within active direction & period
  const counts = useMemo(() => {
    let all = 0;
    let pending = 0;
    let disbursed = 0;

    for (const b of scopedBatches) {
      all++;
      if (b.status === "DISBURSED") {
        disbursed++;
      } else {
        pending++;
      }
    }

    return { all, pending, disbursed };
  }, [scopedBatches]);

  // Counts for the 2 top-level Direction Tabs
  const directionCounts = useMemo(() => {
    let platformToAllyBatches = 0;
    let allyToPlatformBatches = 0;
    for (const b of batches) {
      if (
        filter.organizationId !== "ALL" &&
        b.organizationId !== filter.organizationId
      ) {
        continue;
      }
      if (fromIso && toIso) {
        const refDate = b.createdAt
          ? getCaracasDateIso(new Date(b.createdAt))
          : b.periodEndDate?.slice(0, 10) ||
            b.periodStartDate?.slice(0, 10) ||
            "";
        if (refDate && (refDate < fromIso || refDate > toIso)) {
          continue;
        }
      }
      if (b.direction === "ALLY_TO_PLATFORM") {
        allyToPlatformBatches++;
      } else {
        platformToAllyBatches++;
      }
    }

    let platformToAllyUnsettledUsd = 0;
    let allyToPlatformUnsettledUsd = 0;
    for (const p of unsettledPools) {
      if (
        filter.organizationId !== "ALL" &&
        p.organizationId !== filter.organizationId
      ) {
        continue;
      }
      if (p.direction === "ALLY_TO_PLATFORM") {
        allyToPlatformUnsettledUsd += p.netAmount;
      } else {
        platformToAllyUnsettledUsd += p.netAmount;
      }
    }

    return {
      platformToAllyBatches,
      platformToAllyUnsettledUsd,
      allyToPlatformBatches,
      allyToPlatformUnsettledUsd,
    };
  }, [batches, unsettledPools, filter.organizationId, fromIso, toIso]);

  // Dynamic KPIs for the 3 top cards (100% live, currency-accurate & date-filtered)
  const dynamicKpis = useMemo<SettlementsDynamicKpis>(() => {
    let unsettledNetRef = 0;
    let unsettledGrossRef = 0;
    let unsettledTotalBs = 0;
    let unsettledReservationsCount = 0;
    let detectedEur = false;
    let detectedUsd = false;

    for (const p of activeUnsettledPools) {
      const isEur = p.currencyCode === "EUR";
      if (isEur) detectedEur = true;
      else detectedUsd = true;
      const rate = isEur ? effectiveEurRate : bcvRate;

      unsettledNetRef += p.netAmount;
      unsettledGrossRef += p.grossAmount;
      unsettledTotalBs += p.netAmount * rate;
      unsettledReservationsCount += p.reservationsCount;
    }

    let pendingBatchesNetRef = 0;
    let pendingBatchesFeeRef = 0;
    let pendingBatchesTotalBs = 0;
    let pendingBatchesCount = 0;
    let disbursedBatchesNetRef = 0;
    let disbursedBatchesFeeRef = 0;
    let disbursedBatchesTotalBs = 0;
    let disbursedBatchesCount = 0;

    for (const b of scopedBatches) {
      const rawCurr =
        b.currencyCode || b.organization?.referenceCurrencyCode || "USD";
      const isEur = rawCurr === "EUR";
      if (isEur) detectedEur = true;
      else detectedUsd = true;
      const rate =
        b.payoutExchangeRate && b.payoutExchangeRate > 0
          ? b.payoutExchangeRate
          : isEur
            ? effectiveEurRate
            : bcvRate;

      if (b.status === "DISBURSED") {
        disbursedBatchesNetRef += b.netPayoutAmount;
        disbursedBatchesFeeRef += b.platformFeeAmount;
        disbursedBatchesTotalBs += b.netPayoutAmount * rate;
        disbursedBatchesCount++;
      } else if (b.status !== "CANCELLED") {
        pendingBatchesNetRef += b.netPayoutAmount;
        pendingBatchesFeeRef += b.platformFeeAmount;
        pendingBatchesTotalBs += b.netPayoutAmount * rate;
        pendingBatchesCount++;
      }
    }

    const primaryCurrencyCode: "USD" | "EUR" =
      detectedEur && !detectedUsd ? "EUR" : "USD";

    return {
      primaryCurrencyCode,
      unsettledNetRef,
      unsettledGrossRef,
      unsettledTotalBs,
      unsettledReservationsCount,
      unsettledOrgsCount: activeUnsettledPools.length,
      pendingBatchesNetRef,
      pendingBatchesFeeRef,
      pendingBatchesTotalBs,
      pendingBatchesCount,
      disbursedBatchesNetRef,
      disbursedBatchesFeeRef,
      disbursedBatchesTotalBs,
      disbursedBatchesCount,
    };
  }, [activeUnsettledPools, scopedBatches, bcvRate, effectiveEurRate]);

  async function refreshSettlements() {
    const res = await getSettlementsAction();
    if (res.ok && res.data) {
      setBatches(res.data.items);
      setUnsettledPools(res.data.unsettledPools ?? []);
    }
  }

  async function handleGenerateSnapshot(
    organizationId: string,
    direction: SettlementDirection,
  ) {
    setGeneratingOrgId(organizationId);
    setFeedbackBanner(null);
    try {
      const res = await generateSettlementBatchAction({
        organizationId,
        direction,
      });
      if (res.ok) {
        await refreshSettlements();
        const code = res.data?.batchCode ? `#${res.data.batchCode}` : "";
        setFeedbackBanner({
          type: "success",
          message:
            direction === "ALLY_TO_PLATFORM"
              ? `Lote de comisión ${code} generado exitosamente. El contador acumulado se ha reiniciado a 0,00 para las próximas reservas.`
              : `Lote de pago ${code} generado exitosamente. El monto quedó congelado en espera de transferencia y el contador se reinició a 0,00.`,
        });
      } else {
        setFeedbackBanner({
          type: "error",
          message:
            res.error.code ||
            "No se encontraron reservas verificadas pendientes para generar el lote.",
        });
      }
    } finally {
      setGeneratingOrgId(null);
    }
  }

  async function handleDisburse(
    input: SettlementPayoutSubmitPayload,
  ): Promise<{ ok: boolean; error?: string }> {
    const res = await disburseSettlementAction(input.batchId, {
      payoutMethod: input.payoutMethod,
      payoutReferenceNumber: input.referenceNumber,
      payoutDestinationBank: input.destinationBank,
      originAccount: input.originAccount,
      payoutDate: input.disbursementDate,
      payoutReceiptUrl: input.receiptUrl,
      notes: input.notes,
    });

    if (res.ok) {
      setBatches((prev) =>
        prev.map((b) =>
          b.id === input.batchId
            ? {
                ...b,
                status: "DISBURSED",
                payoutReferenceNumber: input.referenceNumber,
                disbursedAt: input.disbursementDate,
              }
            : b,
        ),
      );
      await refreshSettlements();
      setSelectedForPayout(null);
      return { ok: true };
    }

    return { ok: false, error: res.error.code || t("payoutError") };
  }

  async function handleReportInvoice(
    input: SettlementPayoutSubmitPayload,
  ): Promise<{ ok: boolean; error?: string }> {
    const res = await reportInvoicePaymentAction(input.batchId, {
      payoutMethod: input.payoutMethod,
      payoutReferenceNumber: input.referenceNumber,
      payoutDestinationBank: input.destinationBank,
      originAccount: input.originAccount,
      payoutDate: input.disbursementDate,
      payoutReceiptUrl: input.receiptUrl,
      notes: input.notes,
    });

    if (res.ok) {
      setBatches((prev) =>
        prev.map((b) =>
          b.id === input.batchId
            ? {
                ...b,
                status: "PAYMENT_UNDER_REVIEW",
                payoutReferenceNumber: input.referenceNumber,
                payoutDestinationBank: input.destinationBank,
                notes: input.notes,
              }
            : b,
        ),
      );
      await refreshSettlements();
      setSelectedForPayout(null);
      return { ok: true };
    }

    return { ok: false, error: res.error.code || t("payoutError") };
  }

  return (
    <div className="space-y-0">
      {/* TOP HEADER */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border bg-surface px-6 py-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-bold text-foreground">
              {t("title")}
            </h1>
            <span className="rounded-full bg-status-available-bg border border-status-available-border px-2.5 py-0.5 text-xs font-bold text-status-available-fg">
              Liquidación Continua en Tiempo Real
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Control de saldos acumulados al instante tras cada pago verificado, generación de lotes de pago y liquidación a aliados
          </p>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="p-6 space-y-6">
        {feedbackBanner && (
          <div
            className={`rounded-xl border px-4 py-3 text-xs font-semibold flex items-center justify-between gap-3 ${
              feedbackBanner.type === "success"
                ? "border-status-confirmed-border bg-status-confirmed-bg text-status-confirmed-fg"
                : "border-status-cancelled-border bg-status-cancelled-bg text-status-cancelled-fg"
            }`}
          >
            <span>{feedbackBanner.message}</span>
            <button
              type="button"
              onClick={() => setFeedbackBanner(null)}
              className="text-current opacity-70 hover:opacity-100 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* FILTER & MODE SELECTION BAR */}
        <SettlementsFilterBar
          filter={filter}
          onChangeFilter={(upd) => setFilter((prev) => ({ ...prev, ...upd }))}
          organizations={organizations}
          periodRangeLabel={periodRangeLabel}
          directionCounts={directionCounts}
          counts={counts}
        />

        {/* DATE-AWARE & DIRECTION-AWARE KPI CARDS */}
        <SettlementsKpiStrip
          dynamicKpis={dynamicKpis}
          direction={filter.direction}
          periodRangeLabel={periodRangeLabel}
        />

        {/* LIVE ACCUMULATIVE SNAPSHOT PANEL */}
        <SettlementsCycleCard
          unsettledPools={activeUnsettledPools}
          direction={filter.direction}
          bcvRate={bcvRate}
          bcvEurRate={effectiveEurRate}
          userRole={userRole}
          generatingOrgId={generatingOrgId}
          onGenerateSnapshot={handleGenerateSnapshot}
          autoBatchSchedule={autoBatchSchedule}
        />

        {/* STREAMLINED ATOMIC SETTLEMENTS TABLE */}
        <SettlementsTable
          batches={displayedBatches}
          direction={filter.direction}
          bcvRate={bcvRate}
          bcvEurRate={effectiveEurRate}
          userRole={userRole}
          onOpenDrawer={(batch) => setSelectedForDrawer(batch)}
          onOpenPayout={(batch) => setSelectedForPayout(batch)}
        />
      </main>

      {/* FLYOUT DRAWER: STATEMENT BREAKDOWN */}
      <SettlementStatementDrawer
        isOpen={!!selectedForDrawer}
        batch={selectedForDrawer}
        bcvRate={bcvRate}
        bcvEurRate={effectiveEurRate}
        userRole={userRole}
        onClose={() => setSelectedForDrawer(null)}
        onOpenPayout={(batch) => setSelectedForPayout(batch)}
      />

      {/* MODAL: EXECUTE PAYOUT OR REPORT INVOICE */}
      <SettlementPayoutModal
        isOpen={!!selectedForPayout}
        batch={selectedForPayout}
        bcvRate={bcvRate}
        bcvEurRate={effectiveEurRate}
        onClose={() => setSelectedForPayout(null)}
        onDisburse={handleDisburse}
        onReportInvoice={handleReportInvoice}
      />
    </div>
  );
}
