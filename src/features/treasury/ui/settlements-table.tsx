"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import type { BackofficeRole } from "@/shared/config";
import { Button } from "@/shared/ui/button";
import type { SettlementBatchItem } from "../model/types";

interface SettlementsTableProps {
  batches: SettlementBatchItem[];
  bcvRate: number;
  userRole?: BackofficeRole;
  onOpenDrawer: (batch: SettlementBatchItem) => void;
  onOpenPayout: (batch: SettlementBatchItem) => void;
}

export function SettlementsTable({
  batches,
  bcvRate,
  userRole = "PLATFORM_ADMIN",
  onOpenDrawer,
  onOpenPayout,
}: SettlementsTableProps) {
  const t = useTranslations("settlements");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const isPlatformUser =
    userRole === "PLATFORM_ADMIN" || userRole === "PLATFORM_ACCOUNTING";
  const isAllyFinanceOrAdmin =
    userRole === "ALLY_ADMIN" ||
    userRole === "ALLY_ACCOUNTING" ||
    userRole === "PLATFORM_ADMIN";

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
                const isUnderReview = batch.status === "PAYMENT_UNDER_REVIEW";
                const isOverdue = batch.status === "OVERDUE";
                const isAllyToPlatform = batch.direction === "ALLY_TO_PLATFORM";

                return (
                  <tr
                    key={batch.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    {/* Batch Code & Organization */}
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap items-center gap-1.5">
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
                        <span
                          className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                            isAllyToPlatform
                              ? "border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                              : "border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          }`}
                        >
                          {isAllyToPlatform
                            ? t("directionAllyToPlatform")
                            : t("directionPlatformToAlly")}
                        </span>
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
                      {batch.dueDate && (
                        <div
                          className={`mt-0.5 text-[10.5px] font-semibold ${
                            isOverdue
                              ? "text-status-cancelled-fg"
                              : "text-amber-600 dark:text-amber-400"
                          }`}
                        >
                          📅 {t("dueDateLabel")}: {batch.dueDate}
                        </div>
                      )}
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
                      <div
                        className={`font-extrabold text-sm ${
                          isAllyToPlatform
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-status-available-fg"
                        }`}
                      >
                        ${batch.netPayoutAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        ≈ Bs. {netBs.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </td>

                    {/* Destination Account */}
                    <td className="px-4 py-4">
                      {isAllyToPlatform ? (
                        <>
                          <div className="font-semibold text-foreground truncate max-w-[190px]">
                            Banesco (0134) — YoReservo C.A.
                          </div>
                          <div className="font-mono text-[11px] text-muted-foreground mt-0.5">
                            J-50123456-7 • 0414-9001122
                          </div>
                          {batch.payoutReferenceNumber && (
                            <div className="text-[10px] font-semibold text-link truncate max-w-[190px]">
                              Ref: #{batch.payoutReferenceNumber}
                            </div>
                          )}
                        </>
                      ) : (
                        <>
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
                        </>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="px-4 py-4 text-center">
                      {isDisbursed ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-status-confirmed-bg border border-status-confirmed-border px-2.5 py-1 text-[11px] font-bold text-status-confirmed-fg">
                          <span>✓</span>
                          <span>{t("statusDisbursed")}</span>
                        </span>
                      ) : isUnderReview ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-sky-500/40 bg-sky-500/15 px-2.5 py-1 text-[11px] font-bold text-sky-600 dark:text-sky-400">
                          <span>🔍</span>
                          <span>{t("statusUnderReview")}</span>
                        </span>
                      ) : isOverdue ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-status-cancelled-bg border border-status-cancelled-border px-2.5 py-1 text-[11px] font-bold text-status-cancelled-fg">
                          <span>⚠️</span>
                          <span>{t("statusOverdue")}</span>
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

                        {/* Payout, Invoice Payment, or Receipt CTA */}
                        {isDisbursed && (
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
                        )}

                        {!isDisbursed && !isAllyToPlatform && isPlatformUser && (
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

                        {!isDisbursed &&
                          isAllyToPlatform &&
                          !isUnderReview &&
                          isAllyFinanceOrAdmin && (
                            <Button
                              type="button"
                              variant="primary"
                              size="sm"
                              onClick={() => onOpenPayout(batch)}
                              className="px-2.5 py-1 text-xs"
                            >
                              <span>💳</span>
                              <span>{t("btnPayInvoice")}</span>
                            </Button>
                          )}

                        {!isDisbursed &&
                          isAllyToPlatform &&
                          isUnderReview &&
                          isPlatformUser && (
                            <Button
                              type="button"
                              variant="primary"
                              size="sm"
                              onClick={() => onOpenPayout(batch)}
                              className="px-2.5 py-1 text-xs"
                            >
                              <span>✓</span>
                              <span>{t("btnVerifyInvoice")}</span>
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
