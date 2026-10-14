"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/shared/ui/button";
import type { SettlementBatchItem } from "../model/types";

interface SettlementsTableProps {
  batches: SettlementBatchItem[];
  bcvRate: number;
  onOpenDrawer: (batch: SettlementBatchItem) => void;
  onOpenPayout: (batch: SettlementBatchItem) => void;
}

export function SettlementsTable({
  batches,
  bcvRate,
  onOpenDrawer,
  onOpenPayout,
}: SettlementsTableProps) {
  const t = useTranslations("settlements");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 1800);
  }

  return (
    <div className="card overflow-hidden border border-border">
      {/* Table Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border bg-surface px-6 py-4">
        <div>
          <h3 className="font-display text-base font-bold text-foreground">
            {t("tableHeaderTitle")}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t("tableHeaderSub")}
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/50 px-3 py-1.5 text-xs">
          <span className="text-muted-foreground">{t("bcvRateLabel")}</span>
          <span className="font-bold text-foreground">
            {bcvRate.toFixed(2)} Bs./USD
          </span>
        </div>
      </div>

      {/* Responsive Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs" id="settlements-table">
          <thead>
            <tr className="border-b border-border bg-muted/40 font-bold uppercase tracking-wider text-[11px] text-muted-foreground">
              <th className="px-5 py-3.5">{t("thBatch")}</th>
              <th className="px-4 py-3.5">{t("thPeriod")}</th>
              <th className="px-4 py-3.5 text-right">{t("thGmv")}</th>
              <th className="px-4 py-3.5 text-right">{t("thFee")}</th>
              <th className="px-4 py-3.5 text-right">{t("thNet")}</th>
              <th className="px-4 py-3.5">{t("thAccount")}</th>
              <th className="px-4 py-3.5 text-center">{t("thStatus")}</th>
              <th className="px-5 py-3.5 text-right">{t("thActions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {batches.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-16 text-center">
                  <div className="mx-auto max-w-sm space-y-2">
                    <span className="text-4xl">🔍</span>
                    <h4 className="font-display text-sm font-bold text-foreground">
                      {t("emptyTitle")}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {t("emptyDesc")}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              batches.map((batch) => {
                const gmvBs = batch.grossAmount * bcvRate;
                const feeBs = batch.platformFeeAmount * bcvRate;
                const netBs = batch.netPayoutAmount * bcvRate;
                const isDisbursed = batch.status === "DISBURSED";

                return (
                  <tr
                    key={batch.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    {/* Batch Code & Organization */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => copyToClipboard(batch.batchCode)}
                          className="font-mono text-xs font-bold text-foreground bg-muted hover:bg-muted/80 px-2 py-1 rounded-md border border-border transition-all cursor-pointer flex items-center gap-1.5"
                          title={t("copyBatchCode")}
                        >
                          <span>#{batch.batchCode}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {copiedCode === batch.batchCode ? "✓" : "📋"}
                          </span>
                        </button>
                      </div>
                      <div className="font-bold text-foreground text-xs mt-1.5">
                        {batch.organization?.tradeName}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {batch.organization?.rif} • {batch.venue?.name || t("allVenues")}
                      </div>
                    </td>

                    {/* Period & Reservations */}
                    <td className="px-4 py-4">
                      <div className="font-semibold text-foreground">
                        {batch.periodDisplay || `${batch.periodStartDate} - ${batch.periodEndDate}`}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        {batch.totalReservations} {t("reconciledBookingsShort")}
                      </div>
                    </td>

                    {/* Gross Volume (GMV) */}
                    <td className="px-4 py-4 text-right">
                      <div className="font-bold text-foreground">
                        ${batch.grossAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        ≈ Bs. {gmvBs.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </td>

                    {/* Platform Fee (5%) */}
                    <td className="px-4 py-4 text-right">
                      <div className="font-bold text-status-cancelled-fg">
                        -${batch.platformFeeAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        ≈ Bs. -{feeBs.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </td>

                    {/* Net Amount to Pay */}
                    <td className="px-4 py-4 text-right">
                      <div className="font-extrabold text-status-available-fg text-sm">
                        ${batch.netPayoutAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        ≈ Bs. {netBs.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </td>

                    {/* Destination Account */}
                    <td className="px-4 py-4">
                      <div className="font-semibold text-foreground truncate max-w-[190px]">
                        {batch.organization?.payoutBank || "—"}
                      </div>
                      <div className="font-mono text-[11px] text-muted-foreground mt-0.5">
                        {batch.organization?.payoutAccountNumber
                          ? `••• ${batch.organization.payoutAccountNumber.slice(-6)}`
                          : "—"}
                      </div>
                      <div className="text-[10px] text-muted-foreground truncate max-w-[190px]">
                        {batch.organization?.payoutAccountHolder || batch.organization?.legalName}
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="px-4 py-4 text-center">
                      {isDisbursed ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-status-confirmed-bg border border-status-confirmed-border px-2.5 py-1 text-[11px] font-bold text-status-confirmed-fg">
                          <span>✓</span>
                          <span>{t("statusDisbursed")}</span>
                        </span>
                      ) : batch.status === "DRAFT" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-muted border border-border px-2.5 py-1 text-[11px] font-bold text-muted-foreground">
                          {t("statusDraft")}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-status-hold-bg border border-status-hold-border px-2.5 py-1 text-[11px] font-bold text-status-hold-fg">
                          <span>⏳</span>
                          <span>{t("statusPending")}</span>
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Statement Drawer CTA */}
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => onOpenDrawer(batch)}
                          className="px-2.5 py-1 text-xs"
                          title={t("btnStatementTitle")}
                        >
                          <span>📄</span>
                          <span className="hidden sm:inline">{t("btnStatement")}</span>
                        </Button>

                        {/* Payout or Receipt CTA */}
                        {isDisbursed ? (
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => onOpenDrawer(batch)}
                            className="px-2.5 py-1 text-xs text-status-confirmed-fg"
                            title={t("btnReceiptTitle")}
                          >
                            <span>🧾</span>
                            <span className="hidden sm:inline">{t("btnReceipt")}</span>
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            onClick={() => onOpenPayout(batch)}
                            className="px-2.5 py-1 text-xs"
                            title={t("btnPayNowTitle")}
                          >
                            <span>💸</span>
                            <span>{t("btnPayNow")}</span>
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between border-t border-border bg-surface px-6 py-3.5 text-xs text-muted-foreground">
        <div>
          {t("showing")}{" "}
          <strong className="text-foreground">{batches.length}</strong>{" "}
          {t("of")}{" "}
          <strong className="text-foreground">{batches.length}</strong>{" "}
          {t("batches")}
        </div>

        <div className="flex gap-2">
          <Button type="button" variant="secondary" size="sm" disabled className="px-2.5 py-1 text-xs">
            {t("btnPrev")}
          </Button>
          <Button type="button" variant="secondary" size="sm" disabled className="px-2.5 py-1 text-xs">
            {t("btnNext")}
          </Button>
        </div>
      </div>
    </div>
  );
}
