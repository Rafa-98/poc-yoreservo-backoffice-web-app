"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/shared/ui/button";
import type { SettlementBatchItem, SettlementItemDetail } from "../model/types";
import {
  exportSettlementBankingFileAction,
  getSettlementDetailAction,
} from "../actions/treasury-actions";

interface SettlementStatementDrawerProps {
  isOpen: boolean;
  batch: SettlementBatchItem | null;
  bcvRate: number;
  onClose: () => void;
}

export function SettlementStatementDrawer({
  isOpen,
  batch,
  bcvRate,
  onClose,
}: SettlementStatementDrawerProps) {
  const t = useTranslations("settlements");
  const [detailBatch, setDetailBatch] = useState<SettlementBatchItem | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !batch) {
      setDetailBatch(null);
      return;
    }

    const styleId = "settlement-print-styles";
    if (!document.getElementById(styleId)) {
      const styleEl = document.createElement("style");
      styleEl.id = styleId;
      styleEl.textContent = `
        @page {
          size: A4 portrait;
          margin: 0mm;
        }
        @media print {
          html, body {
            background: #ffffff !important;
            color: #141a13 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          body * {
            visibility: hidden;
          }
          #statement-drawer-backdrop,
          #statement-drawer-panel,
          #statement-drawer-panel * {
            visibility: visible;
          }
          #statement-drawer-backdrop {
            position: fixed !important;
            inset: 0 !important;
            display: flex !important;
            justify-content: center !important;
            align-items: flex-start !important;
            background: #ffffff !important;
            backdrop-filter: none !important;
            padding: 18mm 20mm !important;
            overflow: visible !important;
          }
          #statement-drawer-panel {
            width: 100% !important;
            max-width: 170mm !important;
            margin: 0 auto !important;
            height: auto !important;
            border: none !important;
            box-shadow: none !important;
            background: #ffffff !important;
            overflow: visible !important;
          }
          .no-print,
          #statement-drawer-panel .no-print,
          #statement-drawer-panel .no-print * {
            display: none !important;
            visibility: hidden !important;
          }
        }
      `;
      document.head.appendChild(styleEl);
    }

    setLoading(true);
    getSettlementDetailAction(batch.id).then((res) => {
      setLoading(false);
      if (res.ok && res.data) {
        setDetailBatch(res.data);
      } else {
        setDetailBatch(batch);
      }
    });
  }, [isOpen, batch]);

  if (!isOpen || !batch) return null;

  const current = detailBatch || batch;
  const isDisbursed = current.status === "DISBURSED";

  const gmvBs = current.grossAmount * bcvRate;
  const feeBs = current.platformFeeAmount * bcvRate;
  const netBs = current.netPayoutAmount * bcvRate;

  const displayItems: SettlementItemDetail[] = current.items ?? [];

  function handlePrintPdf() {
    window.print();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end print:justify-center print:items-start bg-black/60 print:bg-white backdrop-blur-xs print:backdrop-blur-none transition-opacity"
      onClick={onClose}
      id="statement-drawer-backdrop"
    >
      <div
        className="w-full max-w-xl print:max-w-[170mm] print:mx-auto h-full print:h-auto bg-surface print:bg-white border-l border-border print:border-0 flex flex-col shadow-2xl print:shadow-none animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
        id="statement-drawer-panel"
      >
        {/* CORPORATE PRINT-ONLY HEADER */}
        <div className="hidden print:flex items-center justify-between border-b-2 border-foreground pb-4 mb-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-foreground text-surface font-display text-lg font-black">
              YR
            </div>
            <div>
              <div className="font-display text-base font-extrabold tracking-tight text-foreground">
                YoReservo C.A. • Tesorería & Liquidaciones
              </div>
              <div className="text-[11px] text-muted-foreground">
                RIF: J-50123456-7 • Comprobante Oficial de Conciliación Financiera
              </div>
            </div>
          </div>
          <div className="text-right text-[11px] text-muted-foreground">
            <div className="font-bold text-foreground">
              {current.direction === "ALLY_TO_PLATFORM"
                ? "FACTURA DE COMISIONES"
                : "FINIQUITO DE LIQUIDACIÓN"}
            </div>
            <div>
              Emitido:{" "}
              {new Date().toLocaleDateString("es-VE", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </div>
          </div>
        </div>

        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-border p-6 print:px-0 print:py-4 bg-surface">
          <div>
            <div className="flex items-center gap-3">
              <h3 className="font-display text-lg font-bold text-foreground">
                {t("drawerTitle")}
              </h3>
              {isDisbursed ? (
                <span className="rounded-full bg-status-confirmed-bg border border-status-confirmed-border px-2.5 py-0.5 text-xs font-bold text-status-confirmed-fg">
                  {t("statusDisbursed")}
                </span>
              ) : (
                <span className="rounded-full bg-status-hold-bg border border-status-hold-border px-2.5 py-0.5 text-xs font-bold text-status-hold-fg">
                  {t("statusPending")}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1" id="drawer-batch-code">
              {t("modalPayoutSubtitle")} #{current.batchCode} •{" "}
              {current.periodDisplay || `${current.periodStartDate} - ${current.periodEndDate}`}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="no-print print:hidden rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-all cursor-pointer text-lg"
          >
            ✕
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto print:overflow-visible p-6 print:px-0 print:py-4 space-y-5">
          {/* Legal & Bank Info */}
          <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-bold text-foreground text-sm" id="drawer-ally-name">
                  {current.organization?.tradeName}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5" id="drawer-ally-rif">
                  {current.organization?.rif} • {current.organization?.legalName}
                </div>
              </div>

              <div className="text-right">
                <div className="text-[11px] text-muted-foreground">
                  {t("lblDisbursedOn")}
                </div>
                <div className="text-xs font-bold text-foreground mt-0.5" id="drawer-payout-date">
                  {current.disbursedAt
                    ? new Date(current.disbursedAt).toLocaleDateString("es-VE", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : t("pendingExecution")}
                </div>
              </div>
            </div>

            {/* Bank reference snippet */}
            <div className="border-t border-border pt-3 flex items-center justify-between text-xs">
              <div>
                <span className="text-muted-foreground">{t("lblBankRef")} </span>
                <span className="font-mono font-bold text-foreground" id="drawer-bank-ref">
                  {current.payoutReferenceNumber || "—"}
                </span>
              </div>

              {current.payoutReceiptUrl && (
                <div>
                  <a
                    href={current.payoutReceiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-status-available-fg underline cursor-pointer"
                  >
                    {t("btnViewVoucher")}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* 3-Box Financial Breakdown */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-border bg-surface p-3.5 text-center">
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {t("drawerGmv")}
              </div>
              <div className="font-display text-base font-extrabold text-foreground mt-1" id="drawer-gmv">
                ${current.grossAmount.toFixed(2)}
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5" id="drawer-gmv-bs">
                Bs. {gmvBs.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-surface p-3.5 text-center">
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {t("drawerFee")}
              </div>
              <div className="font-display text-base font-extrabold text-status-cancelled-fg mt-1" id="drawer-fee">
                -${current.platformFeeAmount.toFixed(2)}
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5" id="drawer-fee-bs">
                Bs. -{feeBs.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            <div className="rounded-xl border border-status-available-border bg-status-available-bg p-3.5 text-center">
              <div className="text-[10px] font-bold uppercase tracking-wider text-status-available-fg">
                {t("drawerNet")}
              </div>
              <div className="font-display text-base font-extrabold text-status-available-fg mt-1" id="drawer-net">
                ${current.netPayoutAmount.toFixed(2)}
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5" id="drawer-net-bs">
                Bs. {netBs.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* Itemized Reservations List */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="font-display text-xs font-bold text-foreground">
                {t("drawerItemsTitle")} ({displayItems.length})
              </h4>
              <span className="text-[11px] text-muted-foreground">
                {t("drawerItemsSub")}
              </span>
            </div>

            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/40 font-bold uppercase tracking-wider text-[10px] text-muted-foreground">
                    <th className="px-3 py-2.5">{t("drawerThCodeDate")}</th>
                    <th className="px-3 py-2.5">{t("drawerThCourtSport")}</th>
                    <th className="px-3 py-2.5">{t("drawerThClient")}</th>
                    <th className="px-3 py-2.5 text-right">{t("drawerThGross")}</th>
                    <th className="px-3 py-2.5 text-right">{t("drawerThFee")}</th>
                    <th className="px-3 py-2.5 text-right">{t("drawerThNet")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-xs text-muted-foreground">
                        {t("drawerLoading")}
                      </td>
                    </tr>
                  ) : displayItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-xs text-muted-foreground">
                        {t("drawerEmptyItems")}
                      </td>
                    </tr>
                  ) : (
                    displayItems.map((item) => (
                      <tr key={item.id} className="hover:bg-muted/20">
                        <td className="px-3 py-2.5">
                          <div className="font-mono font-bold text-foreground">
                            #{item.reservation?.shortCode || "—"}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {item.reservation?.reservationDate || "—"}
                          </div>
                        </td>

                        <td className="px-3 py-2.5">
                          <div className="font-medium text-foreground">
                            {item.reservation?.space?.spaceNumber}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {(() => {
                              const rawName = item.reservation?.space?.activityCategory?.name as unknown;
                              if (typeof rawName === "string" && rawName) return rawName;
                              if (rawName && typeof rawName === "object") {
                                const obj = rawName as Record<string, unknown>;
                                if (typeof obj.es === "string") return obj.es;
                                if (typeof obj.en === "string") return obj.en;
                              }
                              return t("defaultSport");
                            })()}
                          </div>
                        </td>

                        <td className="px-3 py-2.5">
                          <div className="font-medium text-foreground">
                            {item.reservation?.client?.name} {item.reservation?.client?.lastName}
                          </div>
                        </td>

                        <td className="px-3 py-2.5 text-right font-medium text-foreground">
                          ${item.courtSubtotal.toFixed(2)}
                        </td>

                        <td className="px-3 py-2.5 text-right font-medium text-status-cancelled-fg">
                          -${item.serviceFee.toFixed(2)}
                        </td>

                        <td className="px-3 py-2.5 text-right font-bold text-status-available-fg">
                          ${item.netAllyAmount.toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* CORPORATE PRINT-ONLY AUDIT FOOTER */}
          <div className="hidden print:flex items-center justify-between border-t border-border pt-6 mt-8 text-[11px] text-muted-foreground">
            <div>
              <div className="font-bold text-foreground">
                Documento conciliado digitalmente por YoReservo C.A.
              </div>
              <div>
                Tasa Oficial BCV de Referencia: Bs.{" "}
                {bcvRate.toLocaleString("es-VE", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                / USD • Lote #{current.batchCode}
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold text-foreground">Sello de Auditoría Financiera</div>
              <div>Estado: {isDisbursed ? "LIQUIDADO / CONCILIADO" : "PENDIENTE DE EJECUCIÓN"}</div>
            </div>
          </div>
        </div>

        {/* FOOTER (Interactive controls hidden when printing) */}
        <div className="no-print print:hidden border-t border-border bg-muted/40 p-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground mr-1">
              {t("lblExportBankFile")}
            </span>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={async () => {
                const res = await exportSettlementBankingFileAction(current.id, "BDV");
                if (res.ok && res.data) {
                  const blob = new Blob([res.data.content], { type: res.data.mimeType });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = res.data.filename;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }
              }}
              title={t("exportBdvTitle")}
            >
              <span>🏛️</span>
              <span>{t("exportBdvBtn")}</span>
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={async () => {
                const res = await exportSettlementBankingFileAction(current.id, "BANESCO");
                if (res.ok && res.data) {
                  const blob = new Blob([res.data.content], { type: res.data.mimeType });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = res.data.filename;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }
              }}
              title={t("exportBanescoTitle")}
            >
              <span>🟩</span>
              <span>{t("exportBanescoBtn")}</span>
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={async () => {
                const res = await exportSettlementBankingFileAction(current.id, "PAGO_MOVIL");
                if (res.ok && res.data) {
                  const blob = new Blob([res.data.content], { type: res.data.mimeType });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = res.data.filename;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }
              }}
              title={t("exportPagoMovilTitle")}
            >
              <span>📱</span>
              <span>{t("exportPagoMovilBtn")}</span>
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={async () => {
                const res = await exportSettlementBankingFileAction(current.id, "CSV");
                if (res.ok && res.data) {
                  const blob = new Blob([res.data.content], { type: res.data.mimeType });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = res.data.filename;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }
              }}
              title={t("exportCsvTitle")}
            >
              <span>📊</span>
              <span>{t("exportCsvBtn")}</span>
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onClose}
            >
              {t("btnClose")}
            </Button>

            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handlePrintPdf}
              id="btn-print-statement"
            >
              <span>🖨️</span>
              <span>{t("btnPrintPdf")}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
