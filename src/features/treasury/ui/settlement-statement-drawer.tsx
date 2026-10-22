"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import type { BackofficeRole } from "@/shared/config";
import { Button } from "@/shared/ui/button";
import type { SettlementBatchItem, SettlementItemDetail } from "../model/types";
import { getSettlementDetailAction } from "../actions/treasury-actions";

interface SettlementStatementDrawerProps {
  isOpen: boolean;
  batch: SettlementBatchItem | null;
  bcvRate: number;
  bcvEurRate?: number;
  userRole?: BackofficeRole;
  onClose: () => void;
  onOpenPayout?: (batch: SettlementBatchItem) => void;
}

export function SettlementStatementDrawer({
  isOpen,
  batch,
  bcvRate,
  bcvEurRate,
  userRole = "PLATFORM_ADMIN",
  onClose,
  onOpenPayout,
}: SettlementStatementDrawerProps) {
  const t = useTranslations("settlements");
  const [detailBatch, setDetailBatch] = useState<SettlementBatchItem | null>(null);
  const [loading, setLoading] = useState(false);

  const isPlatformUser =
    userRole === "PLATFORM_ADMIN" || userRole === "PLATFORM_ACCOUNTING";
  const isAllyFinanceOrAdmin =
    userRole === "ALLY_ADMIN" ||
    userRole === "ALLY_ACCOUNTING" ||
    userRole === "PLATFORM_ADMIN";

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
  const isAllyToPlatform = current.direction === "ALLY_TO_PLATFORM";
  const rawCurr =
    current.currencyCode ||
    current.organization?.referenceCurrencyCode ||
    "USD";
  const isEur = rawCurr === "EUR";
  const currCode = isEur ? "EUR" : "USD";
  const sym = isEur ? "€" : "$";
  const rateUsed =
    current.payoutExchangeRate && current.payoutExchangeRate > 0
      ? current.payoutExchangeRate
      : isEur
        ? (bcvEurRate ?? bcvRate)
        : bcvRate;

  const gmvBs = current.grossAmount * rateUsed;
  const feeBs = current.platformFeeAmount * rateUsed;
  const netBs = current.netPayoutAmount * rateUsed;

  const netBoxTitle = isAllyToPlatform
    ? isDisbursed
      ? "Comisión Pagada"
      : "Comisión por Pagar"
    : isDisbursed
      ? "Neto Transferido"
      : "Neto por Transferir";

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

            {/* Bank coordinates & reference snippet */}
            <div className="border-t border-border pt-3 space-y-2 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-muted-foreground">Cuenta Destino: </span>
                  <span className="font-semibold text-foreground">
                    {current.direction === "ALLY_TO_PLATFORM"
                      ? "Banesco (0134) — YoReservo C.A. (J-50123456-7 • 0414-9001122)"
                      : `${current.organization?.payoutBank || "—"} ${
                          current.organization?.payoutAccountNumber
                            ? `• ${current.organization.payoutAccountNumber}`
                            : ""
                        }`}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-muted-foreground">{t("lblBankRef")} </span>
                  <span className="font-mono font-bold text-foreground" id="drawer-bank-ref">
                    {current.payoutReferenceNumber || "—"}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-muted-foreground">Moneda / Tasa BCV: </span>
                  <span className="font-bold text-foreground">
                    {isEur ? "💶 EUR" : "💵 USD"} •{" "}
                    {rateUsed.toLocaleString("es-VE", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    Bs./{currCode}
                  </span>
                </div>
              </div>

              {current.payoutReceiptUrl && (
                <div className="pt-1">
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
                {isAllyToPlatform ? "Cobrado por Aliado" : t("drawerGmv")}
              </div>
              <div className="font-display text-base font-extrabold text-foreground mt-1" id="drawer-gmv">
                {sym}{current.grossAmount.toFixed(2)} {currCode}
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
                {isAllyToPlatform ? "" : "−"}{sym}{current.platformFeeAmount.toFixed(2)} {currCode}
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5" id="drawer-fee-bs">
                Bs. {isAllyToPlatform ? "" : "−"}{feeBs.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            <div
              className={`rounded-xl border p-3.5 text-center ${
                isDisbursed
                  ? "border-status-available-border bg-status-available-bg"
                  : "border-status-hold-border bg-status-hold-bg"
              }`}
            >
              <div
                className={`text-[10px] font-bold uppercase tracking-wider ${
                  isDisbursed ? "text-status-available-fg" : "text-status-hold-fg"
                }`}
              >
                {netBoxTitle}
              </div>
              <div
                className={`font-display text-base font-extrabold mt-1 ${
                  isDisbursed ? "text-status-available-fg" : "text-status-hold-fg"
                }`}
                id="drawer-net"
              >
                {sym}{current.netPayoutAmount.toFixed(2)} {currCode}
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
                          {sym}{item.courtSubtotal.toFixed(2)}
                        </td>

                        <td className="px-3 py-2.5 text-right font-medium text-status-cancelled-fg">
                          −{sym}{item.serviceFee.toFixed(2)}
                        </td>

                        <td className="px-3 py-2.5 text-right font-bold text-status-available-fg">
                          {sym}{item.netAllyAmount.toFixed(2)}
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
                Tasa Oficial BCV Aplicada: Bs.{" "}
                {rateUsed.toLocaleString("es-VE", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                / {currCode} • Lote #{current.batchCode}
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
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
          >
            {t("btnClose")}
          </Button>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handlePrintPdf}
              id="btn-print-statement"
            >
              <span>🖨️</span>
              <span>{t("btnPrintPdf")}</span>
            </Button>

            {!isDisbursed &&
              current.direction !== "ALLY_TO_PLATFORM" &&
              isPlatformUser &&
              onOpenPayout && (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    onClose();
                    onOpenPayout(current);
                  }}
                  id="btn-drawer-pay-now"
                >
                  <span>💸</span>
                  <span>{t("btnPayNow")}</span>
                </Button>
              )}

            {!isDisbursed &&
              current.direction === "ALLY_TO_PLATFORM" &&
              current.status !== "PAYMENT_UNDER_REVIEW" &&
              isAllyFinanceOrAdmin &&
              onOpenPayout && (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    onClose();
                    onOpenPayout(current);
                  }}
                  id="btn-drawer-report-invoice"
                >
                  <span>💳</span>
                  <span>{t("btnPayInvoice")}</span>
                </Button>
              )}

            {!isDisbursed &&
              current.direction === "ALLY_TO_PLATFORM" &&
              current.status === "PAYMENT_UNDER_REVIEW" &&
              isPlatformUser &&
              onOpenPayout && (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    onClose();
                    onOpenPayout(current);
                  }}
                  id="btn-drawer-verify-invoice"
                >
                  <span>✓</span>
                  <span>{t("btnVerifyInvoice")}</span>
                </Button>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}
