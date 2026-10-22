"use client";

import React from "react";
import type { SettlementDirection } from "../model/types";

export interface SettlementsDynamicKpis {
  primaryCurrencyCode: "USD" | "EUR";
  unsettledNetRef: number;
  unsettledGrossRef: number;
  unsettledTotalBs: number;
  unsettledReservationsCount: number;
  unsettledOrgsCount: number;
  pendingBatchesNetRef: number;
  pendingBatchesFeeRef: number;
  pendingBatchesTotalBs: number;
  pendingBatchesCount: number;
  disbursedBatchesNetRef: number;
  disbursedBatchesFeeRef: number;
  disbursedBatchesTotalBs: number;
  disbursedBatchesCount: number;
}

interface SettlementsKpiStripProps {
  dynamicKpis: SettlementsDynamicKpis;
  direction: SettlementDirection;
  periodRangeLabel: string;
}

export function SettlementsKpiStrip({
  dynamicKpis,
  direction,
  periodRangeLabel,
}: SettlementsKpiStripProps) {
  const isAllyToPlatform = direction === "ALLY_TO_PLATFORM";
  const currCode = dynamicKpis.primaryCurrencyCode;
  const sym = currCode === "EUR" ? "€" : "$";

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Card 1: Live Unsettled Accumulative Pool (Real-time counter) */}
      <div className="card p-5 border-l-4 border-l-accent flex flex-col justify-between">
        <div className="flex items-start justify-between gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {isAllyToPlatform
              ? "⚡ Comisión Acumulada (Sin Lote)"
              : "⚡ Saldo Acumulado (Sin Lote)"}
          </span>
          <span className="rounded-full bg-accent/15 border border-accent/40 px-2.5 py-0.5 text-[11px] font-bold text-foreground">
            {dynamicKpis.unsettledReservationsCount}{" "}
            {dynamicKpis.unsettledReservationsCount === 1
              ? "reserva verificada"
              : "reservas verificadas"}
          </span>
        </div>

        <div className="mt-3">
          <div className="flex items-baseline gap-1.5">
            <span className="font-display text-2xl font-black text-foreground">
              {sym}
              {dynamicKpis.unsettledNetRef.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
            <span className="text-xs font-bold text-muted-foreground">
              {currCode}
            </span>
          </div>
          <div className="mt-1 text-xs font-semibold text-muted-foreground">
            ≈ Bs.{" "}
            {dynamicKpis.unsettledTotalBs.toLocaleString("es-VE", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
          <div className="mt-2 pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>🟢 Tiempo real (Pagos verificados)</span>
            <span className="font-semibold text-foreground">
              Bruto: {sym}
              {dynamicKpis.unsettledGrossRef.toFixed(2)} {currCode}
            </span>
          </div>
        </div>
      </div>

      {/* Card 2: Snapshot Batches Waiting to be Paid/Transferred in Selected Period */}
      <div className="card p-5 border-l-4 border-l-status-hold-fg flex flex-col justify-between">
        <div className="flex items-start justify-between gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {isAllyToPlatform
              ? "⏳ Lotes de Comisión por Cobrar"
              : "⏳ Lotes por Transferir a Aliados"}
          </span>
          <span className="rounded-full bg-status-hold-bg border border-status-hold-border px-2.5 py-0.5 text-[11px] font-bold text-status-hold-fg">
            {dynamicKpis.pendingBatchesCount}{" "}
            {dynamicKpis.pendingBatchesCount === 1
              ? "lote en espera"
              : "lotes en espera"}
          </span>
        </div>

        <div className="mt-3">
          <div className="flex items-baseline gap-1.5">
            <span className="font-display text-2xl font-black text-status-hold-fg">
              {sym}
              {dynamicKpis.pendingBatchesNetRef.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
            <span className="text-xs font-bold text-muted-foreground">
              {currCode}
            </span>
          </div>
          <div className="mt-1 text-xs font-semibold text-muted-foreground">
            ≈ Bs.{" "}
            {dynamicKpis.pendingBatchesTotalBs.toLocaleString("es-VE", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
          <div className="mt-2 pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>📅 {periodRangeLabel}</span>
            {!isAllyToPlatform ? (
              <span className="font-semibold text-foreground">
                Fee retenido: {sym}
                {dynamicKpis.pendingBatchesFeeRef.toFixed(2)}
              </span>
            ) : (
              <span>Cortes congelados</span>
            )}
          </div>
        </div>
      </div>

      {/* Card 3: Settled / Disbursed Batches in Selected Period */}
      <div className="card p-5 border-l-4 border-l-status-confirmed-fg flex flex-col justify-between">
        <div className="flex items-start justify-between gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {isAllyToPlatform
              ? "✓ Comisiones Recibidas en el Período"
              : "✓ Total Transferido en el Período"}
          </span>
          <span className="rounded-full bg-status-confirmed-bg border border-status-confirmed-border px-2.5 py-0.5 text-[11px] font-bold text-status-confirmed-fg">
            {dynamicKpis.disbursedBatchesCount}{" "}
            {dynamicKpis.disbursedBatchesCount === 1
              ? "lote pagado"
              : "lotes pagados"}
          </span>
        </div>

        <div className="mt-3">
          <div className="flex items-baseline gap-1.5">
            <span className="font-display text-2xl font-black text-status-available-fg">
              {sym}
              {dynamicKpis.disbursedBatchesNetRef.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
            <span className="text-xs font-bold text-muted-foreground">
              {currCode}
            </span>
          </div>
          <div className="mt-1 text-xs font-semibold text-muted-foreground">
            ≈ Bs.{" "}
            {dynamicKpis.disbursedBatchesTotalBs.toLocaleString("es-VE", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
          <div className="mt-2 pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>📅 {periodRangeLabel}</span>
            {!isAllyToPlatform && (
              <span className="font-semibold text-foreground">
                Fee liquidado: {sym}
                {dynamicKpis.disbursedBatchesFeeRef.toFixed(2)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
