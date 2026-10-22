"use client";

import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import type { BackofficeRole } from "@/shared/config";
import { Button } from "@/shared/ui/button";
import type { SettlementBatchItem, SettlementDirection } from "../model/types";

interface SettlementsTableProps {
  batches: SettlementBatchItem[];
  direction: SettlementDirection;
  bcvRate: number;
  bcvEurRate: number;
  userRole?: BackofficeRole;
  onOpenDrawer: (batch: SettlementBatchItem) => void;
  onOpenPayout?: (batch: SettlementBatchItem) => void;
}

const PAGE_SIZE = 5;

function formatBatchDateEs(batch: SettlementBatchItem): {
  primaryDate: string;
  secondaryWindow: string;
} {
  if (batch.createdAt) {
    const dt = new Date(batch.createdAt);
    if (!Number.isNaN(dt.getTime())) {
      const primaryDate = new Intl.DateTimeFormat("es-VE", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(dt);
      const start = batch.periodStartDate
        ? new Date(`${batch.periodStartDate.slice(0, 10)}T12:00:00Z`)
        : null;
      const end = batch.periodEndDate
        ? new Date(`${batch.periodEndDate.slice(0, 10)}T12:00:00Z`)
        : null;
      const fmtShort = new Intl.DateTimeFormat("es-VE", {
        day: "2-digit",
        month: "short",
      });
      const secondaryWindow =
        start && end && !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())
          ? start.toISOString().slice(0, 10) === end.toISOString().slice(0, 10)
            ? `Corte del ${fmtShort.format(end)}`
            : `Ventana: ${fmtShort.format(start)} – ${fmtShort.format(end)}`
          : batch.periodDisplay || "";
      return { primaryDate, secondaryWindow };
    }
  }

  return {
    primaryDate:
      batch.periodDisplay || `${batch.periodStartDate} – ${batch.periodEndDate}`,
    secondaryWindow: "Corte registrado",
  };
}

export function SettlementsTable({
  batches,
  direction,
  bcvRate,
  bcvEurRate,
  onOpenDrawer,
}: SettlementsTableProps) {
  const t = useTranslations("settlements");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const isAllyToPlatform = direction === "ALLY_TO_PLATFORM";

  useEffect(() => {
    setCurrentPage(1);
  }, [batches.length, direction]);

  const totalPages = Math.max(1, Math.ceil(batches.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const paginatedBatches = batches.slice(startIndex, startIndex + PAGE_SIZE);

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
            {isAllyToPlatform
              ? "🧾 Lotes de Comisiones (Cobro Directo del Aliado → YoReservo)"
              : "💸 Lotes de Liquidación (Custodia YoReservo → Aliado)"}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isAllyToPlatform
              ? "Cortes generados sobre reservas cobradas directamente por el Aliado y pendientes o pagadas a YoReservo"
              : "Cortes generados sobre reservas cobradas por YoReservo: Recaudado Bruto − Comisión YoReservo = Neto para el Aliado"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-xl border border-border bg-muted/50 px-3 py-1.5 text-xs">
            <span className="text-muted-foreground">💵 BCV USD:</span>
            <span className="font-bold text-foreground">
              {bcvRate.toLocaleString("es-VE", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{" "}
              Bs.
            </span>
          </div>
          <div className="flex items-center gap-1.5 rounded-xl border border-border bg-muted/50 px-3 py-1.5 text-xs">
            <span className="text-muted-foreground">💶 BCV EUR:</span>
            <span className="font-bold text-foreground">
              {bcvEurRate.toLocaleString("es-VE", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{" "}
              Bs.
            </span>
          </div>
        </div>
      </div>

      {/* Responsive Atomic 6-Column Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs" id="settlements-table">
          <thead>
            <tr className="border-b border-border bg-muted/40 font-bold uppercase tracking-wider text-[11px] text-muted-foreground">
              <th className="px-5 py-3.5">Lote & Fecha de Corte</th>
              <th className="px-4 py-3.5">Organización / Moneda</th>
              <th className="px-4 py-3.5 text-right">
                {isAllyToPlatform ? "Cobrado por Aliado" : "Recaudado Bruto"}
              </th>
              <th className="px-4 py-3.5 text-right">Comisión YoReservo</th>
              <th className="px-4 py-3.5 text-right">
                {isAllyToPlatform
                  ? "Total a Pagar a YoReservo"
                  : "Neto para el Aliado"}
              </th>
              <th className="px-5 py-3.5 text-right">Estado & Detalle</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {paginatedBatches.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-14 text-center">
                  <div className="mx-auto max-w-sm space-y-2">
                    <span className="text-3xl">📂</span>
                    <h4 className="font-display text-sm font-bold text-foreground">
                      {isAllyToPlatform
                        ? "No hay lotes de comisión en este período"
                        : "No hay lotes de liquidación en este período"}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Ajusta el rango de fechas o genera un nuevo lote desde la bolsa acumulada superior cuando existan pagos verificados.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedBatches.map((batch) => {
                const rawCurr =
                  batch.currencyCode ||
                  batch.organization?.referenceCurrencyCode ||
                  "USD";
                const isEur = rawCurr === "EUR";
                const currCode = isEur ? "EUR" : "USD";
                const sym = isEur ? "€" : "$";
                const rateUsed =
                  batch.payoutExchangeRate && batch.payoutExchangeRate > 0
                    ? batch.payoutExchangeRate
                    : isEur
                      ? bcvEurRate
                      : bcvRate;
                const netBs = batch.netPayoutAmount * rateUsed;
                const isDisbursed = batch.status === "DISBURSED";
                const isUnderReview = batch.status === "PAYMENT_UNDER_REVIEW";
                const isOverdue = batch.status === "OVERDUE";
                const { primaryDate, secondaryWindow } = formatBatchDateEs(batch);

                return (
                  <tr
                    key={batch.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    {/* Col 1: Batch Code & Snapshot Timestamp */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
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
                      <div className="font-semibold text-foreground text-xs mt-1.5">
                        {primaryDate}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {secondaryWindow}
                      </div>
                    </td>

                    {/* Col 2: Organization, Currency & Reservation Count */}
                    <td className="px-4 py-4">
                      <div className="font-bold text-foreground text-xs">
                        {batch.organization?.tradeName}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        {batch.organization?.rif} •{" "}
                        {batch.venue?.name || t("allVenues")}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <span className="inline-flex items-center rounded-md bg-muted border border-border px-2 py-0.5 text-[10px] font-bold text-foreground">
                          {batch.totalReservations}{" "}
                          {batch.totalReservations === 1
                            ? "reserva"
                            : "reservas"}
                        </span>
                        <span className="inline-flex items-center rounded-md bg-muted border border-border px-2 py-0.5 text-[10px] font-bold text-foreground">
                          {isEur ? "💶 EUR" : "💵 USD"}
                        </span>
                      </div>
                    </td>

                    {/* Col 3: Gross Amount */}
                    <td className="px-4 py-4 text-right">
                      <div className="font-bold text-foreground text-xs">
                        {sym}
                        {batch.grossAmount.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        {currCode}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        {isAllyToPlatform ? "Cobrado directo" : "Recaudado"}
                      </div>
                    </td>

                    {/* Col 4: YoReservo Fee */}
                    <td className="px-4 py-4 text-right">
                      <div
                        className={`font-bold text-xs ${
                          isAllyToPlatform
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-status-cancelled-fg"
                        }`}
                      >
                        {isAllyToPlatform ? "" : "−"}
                        {sym}
                        {batch.platformFeeAmount.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        {currCode}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        {isAllyToPlatform ? "Comisión generada" : "Retención YoReservo"}
                      </div>
                    </td>

                    {/* Col 5: Net Payout / Commission Owed */}
                    <td className="px-4 py-4 text-right">
                      <div
                        className={`font-extrabold text-sm ${
                          isAllyToPlatform
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-status-available-fg"
                        }`}
                      >
                        {sym}
                        {batch.netPayoutAmount.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        {currCode}
                      </div>
                      <div className="text-[11px] font-semibold text-muted-foreground">
                        ≈ Bs.{" "}
                        {netBs.toLocaleString("es-VE", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        Tasa:{" "}
                        {rateUsed.toLocaleString("es-VE", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        Bs./{currCode}
                      </div>
                    </td>

                    {/* Col 6: Status & Single View Details Button */}
                    <td className="px-5 py-4 text-right">
                      <div className="flex flex-wrap items-center justify-end gap-2.5">
                        {isDisbursed ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-status-confirmed-bg border border-status-confirmed-border px-2.5 py-1 text-[11px] font-bold text-status-confirmed-fg">
                            <span>✓</span>
                            <span>
                              {isAllyToPlatform ? "Pagado" : "Transferido"}
                            </span>
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
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-status-hold-bg border border-status-hold-border px-2.5 py-1 text-[11px] font-bold text-status-hold-fg">
                            <span>⏳</span>
                            <span>
                              {isAllyToPlatform
                                ? "Por Pagar"
                                : "Por Transferir"}
                            </span>
                          </span>
                        )}

                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => onOpenDrawer(batch)}
                          className="px-3 py-1.5 text-xs font-semibold"
                          id={`btn-view-settlement-${batch.id}`}
                        >
                          <span>👁️</span>
                          <span>Ver Detalles</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer (5 per page) */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border bg-surface px-6 py-3.5 text-xs text-muted-foreground">
        <div>
          {batches.length === 0 ? (
            <span>Mostrando 0 lotes</span>
          ) : (
            <span>
              {t("showing")}{" "}
              <strong className="text-foreground">
                {startIndex + 1}–
                {Math.min(startIndex + PAGE_SIZE, batches.length)}
              </strong>{" "}
              {t("of")}{" "}
              <strong className="text-foreground">{batches.length}</strong>{" "}
              {t("batches")}
            </span>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={safePage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1 text-xs"
            >
              ← {t("btnPrev")}
            </Button>
            <span className="px-2 font-semibold text-foreground">
              Página {safePage} de {totalPages}
            </span>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={safePage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1 text-xs"
            >
              {t("btnNext")} →
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
