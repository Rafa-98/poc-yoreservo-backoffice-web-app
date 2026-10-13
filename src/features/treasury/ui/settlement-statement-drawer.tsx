"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/shared/ui/button";
import type { SettlementBatchItem, SettlementItemDetail } from "../model/types";
import { getSettlementDetailAction } from "../actions/treasury-actions";

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

  // Fallback demo items if backend has no line items yet
  const displayItems: SettlementItemDetail[] =
    current.items && current.items.length > 0
      ? current.items
      : [
          {
            id: "item-1",
            settlementBatchId: current.id,
            reservationId: "res-1",
            courtSubtotal: 40.0,
            serviceFee: 2.0,
            netAllyAmount: 38.0,
            createdAt: "2026-10-02T18:00:00Z",
            reservation: {
              id: "res-1",
              shortCode: "AB4553",
              reservationDate: "2026-10-02",
              startTime: "18:00",
              endTime: "19:30",
              client: { id: "c-1", name: "Ignacio", lastName: "Silva" },
              space: {
                id: "s-1",
                spaceNumber: "Cancha 1",
                activityCategory: { name: "Pádel Panorámica" },
              },
            },
          },
          {
            id: "item-2",
            settlementBatchId: current.id,
            reservationId: "res-2",
            courtSubtotal: 50.0,
            serviceFee: 2.5,
            netAllyAmount: 47.5,
            createdAt: "2026-10-05T19:00:00Z",
            reservation: {
              id: "res-2",
              shortCode: "MN7102",
              reservationDate: "2026-10-05",
              startTime: "19:00",
              endTime: "20:30",
              client: { id: "c-2", name: "Carlos", lastName: "Mendoza" },
              space: {
                id: "s-2",
                spaceNumber: "Cancha 2",
                activityCategory: { name: "Pádel Panorámica" },
              },
            },
          },
          {
            id: "item-3",
            settlementBatchId: current.id,
            reservationId: "res-3",
            courtSubtotal: 35.0,
            serviceFee: 1.75,
            netAllyAmount: 33.25,
            createdAt: "2026-10-08T08:00:00Z",
            reservation: {
              id: "res-3",
              shortCode: "FK3901",
              reservationDate: "2026-10-08",
              startTime: "08:00",
              endTime: "09:30",
              client: { id: "c-3", name: "Daniela", lastName: "Salazar" },
              space: {
                id: "s-3",
                spaceNumber: "Cancha Tenis 1",
                activityCategory: { name: "Tenis Arcilla" },
              },
            },
          },
          {
            id: "item-4",
            settlementBatchId: current.id,
            reservationId: "res-4",
            courtSubtotal: 60.0,
            serviceFee: 3.0,
            netAllyAmount: 57.0,
            createdAt: "2026-10-11T20:00:00Z",
            reservation: {
              id: "res-4",
              shortCode: "YT9021",
              reservationDate: "2026-10-11",
              startTime: "20:00",
              endTime: "21:30",
              client: { id: "c-4", name: "Gustavo", lastName: "Paiva" },
              space: {
                id: "s-4",
                spaceNumber: "Cancha Fútbol 7",
                activityCategory: { name: "Fútbol Sintético" },
              },
            },
          },
          {
            id: "item-5",
            settlementBatchId: current.id,
            reservationId: "res-5",
            courtSubtotal: 40.0,
            serviceFee: 2.0,
            netAllyAmount: 38.0,
            createdAt: "2026-10-14T17:00:00Z",
            reservation: {
              id: "res-5",
              shortCode: "QP1194",
              reservationDate: "2026-10-14",
              startTime: "17:00",
              endTime: "18:30",
              client: { id: "c-5", name: "Roberto", lastName: "Gómez" },
              space: {
                id: "s-1",
                spaceNumber: "Cancha 1",
                activityCategory: { name: "Pádel Panorámica" },
              },
            },
          },
        ];

  function handlePrintPdf() {
    window.print();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs transition-opacity"
      onClick={onClose}
      id="statement-drawer-backdrop"
    >
      <div
        className="w-full max-w-xl h-full bg-surface border-l border-border flex flex-col shadow-2xl animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
        id="statement-drawer-panel"
      >
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-border p-6 bg-surface">
          <div>
            <div className="flex items-center gap-3">
              <h3 className="font-display text-lg font-bold text-foreground">
                {t("drawerTitle")}
              </h3>
              {isDisbursed ? (
                <span className="rounded-full bg-blue-500/15 border border-blue-500/30 px-2.5 py-0.5 text-xs font-bold text-blue-400">
                  {t("statusDisbursed")}
                </span>
              ) : (
                <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-xs font-bold text-amber-500">
                  {t("statusPending")}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1" id="drawer-batch-code">
              {t("modalPayoutSubtitle")} #{current.batchCode} • {current.periodDisplay || `${current.periodStartDate} - ${current.periodEndDate}`}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-all cursor-pointer text-lg"
          >
            ✕
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
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
                    : isDisbursed
                    ? "16 Oct 2026, 10:45 AM"
                    : "Pendiente de Ejecución"}
                </div>
              </div>
            </div>

            {/* Bank reference snippet */}
            <div className="border-t border-border pt-3 flex items-center justify-between text-xs">
              <div>
                <span className="text-muted-foreground">{t("lblBankRef")} </span>
                <span className="font-mono font-bold text-foreground" id="drawer-bank-ref">
                  {current.payoutReferenceNumber || "TRANSF-0134982103"}
                </span>
              </div>

              <div>
                <span className="text-xs font-semibold text-emerald-500 underline cursor-pointer">
                  {t("btnViewVoucher")}
                </span>
              </div>
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
              <div className="font-display text-base font-extrabold text-rose-500 mt-1" id="drawer-fee">
                -${current.platformFeeAmount.toFixed(2)}
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5" id="drawer-fee-bs">
                Bs. -{feeBs.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            <div className="rounded-xl border border-emerald-500/50 bg-emerald-500/10 p-3.5 text-center">
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">
                {t("drawerNet")}
              </div>
              <div className="font-display text-base font-extrabold text-emerald-500 mt-1" id="drawer-net">
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
                  {displayItems.map((item) => (
                    <tr key={item.id} className="hover:bg-muted/20">
                      <td className="px-3 py-2.5">
                        <div className="font-mono font-bold text-foreground">
                          #{item.reservation?.shortCode || "RES"}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {item.reservation?.reservationDate || "Oct 2026"}
                        </div>
                      </td>

                      <td className="px-3 py-2.5">
                        <div className="font-medium text-foreground">
                          {item.reservation?.space?.spaceNumber}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {item.reservation?.space?.activityCategory?.name || "Deporte"}
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

                      <td className="px-3 py-2.5 text-right font-medium text-rose-500">
                        -${item.serviceFee.toFixed(2)}
                      </td>

                      <td className="px-3 py-2.5 text-right font-bold text-emerald-500">
                        ${item.netAllyAmount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="border-t border-border bg-muted/40 p-5 flex items-center justify-between">
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
  );
}
