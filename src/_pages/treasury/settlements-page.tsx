"use client";

import React, { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import type { BackofficeRole } from "@/shared/config";
import { Button } from "@/shared/ui/button";
import { TreasurySubnav } from "@/features/treasury/ui/treasury-subnav";
import { SettlementsKpiStrip } from "@/features/treasury/ui/settlements-kpi-strip";
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
  getSettlementsAction,
  reportInvoicePaymentAction,
} from "@/features/treasury/actions/treasury-actions";
import type {
  SettlementBatchItem,
  SettlementFilter,
  SettlementsKpis,
} from "@/features/treasury/model/types";

interface SettlementsPageProps {
  initialBatches: SettlementBatchItem[];
  initialKpis: SettlementsKpis;
  organizations: Array<{ id: string; name: string }>;
  bcvRate: number;
  userRole?: BackofficeRole;
}

export function SettlementsPage({
  initialBatches,
  initialKpis,
  organizations,
  bcvRate,
  userRole = "PLATFORM_ADMIN",
}: SettlementsPageProps) {
  const t = useTranslations("settlements");

  const [batches, setBatches] = useState<SettlementBatchItem[]>(initialBatches);
  const [kpis, setKpis] = useState<SettlementsKpis>(initialKpis);

  const [filter, setFilter] = useState<SettlementFilter>({
    search: "",
    period: "CURRENT_FORTNIGHT",
    organizationId: "ALL",
    status: "ALL",
  });

  const [selectedForDrawer, setSelectedForDrawer] = useState<SettlementBatchItem | null>(null);
  const [selectedForPayout, setSelectedForPayout] = useState<SettlementBatchItem | null>(null);

  const isPlatformUser =
    userRole === "PLATFORM_ADMIN" || userRole === "PLATFORM_ACCOUNTING";

  // Client-side filtering
  const displayedBatches = useMemo(() => {
    return batches.filter((b) => {
      // 1. Status Filter
      if (filter.status === "PENDING" && b.status === "DISBURSED") return false;
      if (filter.status === "DISBURSED" && b.status !== "DISBURSED") return false;

      // 2. Organization Filter
      if (filter.organizationId !== "ALL" && b.organizationId !== filter.organizationId) {
        return false;
      }

      // 3. Search Filter
      if (filter.search.trim()) {
        const q = filter.search.toLowerCase().trim();
        const matchesCode = b.batchCode.toLowerCase().includes(q);
        const matchesTrade = b.organization?.tradeName?.toLowerCase().includes(q);
        const matchesLegal = b.organization?.legalName?.toLowerCase().includes(q);
        const matchesRif = b.organization?.rif?.toLowerCase().includes(q);
        const matchesVenue = b.venue?.name?.toLowerCase().includes(q);
        if (!matchesCode && !matchesTrade && !matchesLegal && !matchesRif && !matchesVenue) {
          return false;
        }
      }

      return true;
    });
  }, [batches, filter]);

  // Counts for status chips
  const counts = useMemo(() => {
    let all = 0;
    let pending = 0;
    let disbursed = 0;

    for (const b of batches) {
      all++;
      if (b.status === "DISBURSED") {
        disbursed++;
      } else {
        pending++;
      }
    }

    return { all, pending, disbursed };
  }, [batches]);

  async function refreshSettlements() {
    const res = await getSettlementsAction();
    if (res.ok && res.data) {
      setBatches(res.data.items);
      setKpis(res.data.kpis);
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

  function handleExportCsv() {
    const headers = [
      "Lote",
      "Organizacion",
      "RIF",
      "Sede",
      "Inicio_Periodo",
      "Fin_Periodo",
      "Total_Reservas",
      "GMV_USD",
      "Fee_5_USD",
      "Neto_USD",
      "Tasa_BCV",
      "Neto_Bs",
      "Banco_Destino",
      "Cuenta_Destino",
      "Estatus",
      "Referencia_Pago",
    ];

    const rows = displayedBatches.map((b) => [
      `#${b.batchCode}`,
      `"${b.organization?.tradeName || ""}"`,
      b.organization?.rif || "",
      `"${b.venue?.name || t("allVenues")}"`,
      b.periodStartDate,
      b.periodEndDate,
      b.totalReservations,
      b.grossAmount.toFixed(2),
      b.platformFeeAmount.toFixed(2),
      b.netPayoutAmount.toFixed(2),
      bcvRate.toFixed(2),
      (b.netPayoutAmount * bcvRate).toFixed(2),
      `"${b.organization?.payoutBank || ""}"`,
      `"${b.organization?.payoutAccountNumber || ""}"`,
      b.status,
      `"${b.payoutReferenceNumber || ""}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `YoReservo_Liquidaciones_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
              {t("badgeClosingPeriod")}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleExportCsv}
            id="btn-export-settlements-csv"
          >
            <span>📥</span> {t("btnExportAll")}
          </Button>

          {isPlatformUser && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => {
                const pendingBatch = batches.find((b) => b.status !== "DISBURSED") || batches[0];
                if (pendingBatch) setSelectedForPayout(pendingBatch);
              }}
              id="btn-new-payout"
            >
              <span>💸</span> {t("btnRecordPayout")}
            </Button>
          )}
        </div>
      </header>

      {/* SUBNAV TABS */}
      <TreasurySubnav currentTab="settlements" />

      {/* MAIN CONTENT AREA */}
      <main className="p-6 space-y-6">
        {/* FINANCIAL SUMMARY METRICS */}
        <SettlementsKpiStrip kpis={kpis} bcvRate={bcvRate} />

        {/* FORTNIGHTLY CLOSING PROGRESS CARD */}
        <SettlementsCycleCard
          kpis={kpis}
          onFilterPending={() => setFilter((prev) => ({ ...prev, status: "PENDING" }))}
        />

        {/* FILTER TOOLBAR */}
        <SettlementsFilterBar
          filter={filter}
          onChangeFilter={(upd) => setFilter((prev) => ({ ...prev, ...upd }))}
          organizations={organizations}
          counts={counts}
        />

        {/* MASTER SETTLEMENTS LEDGER TABLE */}
        <SettlementsTable
          batches={displayedBatches}
          bcvRate={bcvRate}
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
        onClose={() => setSelectedForDrawer(null)}
      />

      {/* MODAL: EXECUTE PAYOUT OR REPORT INVOICE */}
      <SettlementPayoutModal
        isOpen={!!selectedForPayout}
        batch={selectedForPayout}
        bcvRate={bcvRate}
        onClose={() => setSelectedForPayout(null)}
        onDisburse={handleDisburse}
        onReportInvoice={handleReportInvoice}
      />
    </div>
  );
}
