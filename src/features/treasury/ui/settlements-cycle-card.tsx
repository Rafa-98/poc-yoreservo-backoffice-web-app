"use client";

import React from "react";
import type { BackofficeRole } from "@/shared/config";
import { Button } from "@/shared/ui/button";
import type { SettlementDirection, UnsettledPoolItem } from "../model/types";

interface SettlementsCycleCardProps {
  unsettledPools: UnsettledPoolItem[];
  direction: SettlementDirection;
  bcvRate: number;
  bcvEurRate: number;
  userRole?: BackofficeRole;
  generatingOrgId: string | null;
  onGenerateSnapshot: (organizationId: string, direction: SettlementDirection) => void;
  autoBatchSchedule?: {
    morningTime: string;
    nightTime: string;
    timeZone: string;
  };
}

function formatClock12h(raw: string): string {
  const m = /^(\d{1,2}):(\d{2})$/.exec(raw.trim());
  if (!m) return raw;
  const h24 = Number(m[1]);
  const mins = m[2];
  const suffix = h24 >= 12 ? "p. m." : "a. m.";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${mins} ${suffix}`;
}

function formatDateTimeEs(iso?: string | null): string {
  if (!iso) return "Hoy";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Hoy";
  return new Intl.DateTimeFormat("es-VE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function SettlementsCycleCard({
  unsettledPools,
  direction,
  bcvRate,
  bcvEurRate,
  userRole = "PLATFORM_ADMIN",
  generatingOrgId,
  onGenerateSnapshot,
  autoBatchSchedule = {
    morningTime: "07:00",
    nightTime: "23:00",
    timeZone: "America/Caracas",
  },
}: SettlementsCycleCardProps) {
  const isAllyToPlatform = direction === "ALLY_TO_PLATFORM";
  const isPlatformUser =
    userRole === "PLATFORM_ADMIN" || userRole === "PLATFORM_ACCOUNTING";

  // Only YoReservo staff can generate PLATFORM_TO_ALLY batches; both can generate ALLY_TO_PLATFORM commission batches
  const canGenerateBatch = isAllyToPlatform ? true : isPlatformUser;
  const morningLabel = formatClock12h(autoBatchSchedule.morningTime);
  const nightLabel = formatClock12h(autoBatchSchedule.nightTime);

  return (
    <div className="card p-5 bg-gradient-to-r from-surface to-muted/30 border border-border space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="font-display text-sm font-bold text-foreground">
              {isAllyToPlatform
                ? "⚡ Bolsa Acumulada de Comisión (Cobro Directo del Aliado)"
                : "⚡ Bolsa Acumulada para Transferir al Aliado (Custodia YoReservo)"}
            </h2>
            <span className="rounded-full bg-status-available-bg border border-status-available-border px-2.5 py-0.5 text-[11px] font-bold text-status-available-fg">
              Acumulación Continua en Tiempo Real
            </span>
            <span className="rounded-full bg-muted border border-border px-2.5 py-0.5 text-[11px] font-semibold text-foreground">
              🕒 Cortes automáticos diarios: {morningLabel} y {nightLabel}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground max-w-3xl">
            {isAllyToPlatform
              ? "Cada vez que se verifica un pago recibido directamente en las cuentas del Aliado, su comisión se suma aquí. Al hacer clic en «Generar Lote de Comisión», se congela ese corte para su pago y este contador vuelve a 0,00 para las siguientes reservas."
              : isPlatformUser
                ? "Cada vez que se verifica un pago en las cuentas de YoReservo (sin importar la fecha del partido), el saldo entra inmediatamente aquí. Al hacer clic en «Generar Lote de Pago», se congela ese monto para transferirlo al Aliado y este contador vuelve a 0,00 para las siguientes reservas."
                : "Aquí puedes consultar en tiempo real el saldo acumulado por tus reservas cobradas en Custodia YoReservo. El equipo de Tesorería de YoReservo generará el lote de corte al momento de ejecutar tu transferencia."}
          </p>
        </div>
      </div>

      {unsettledPools.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface/70 px-5 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-status-confirmed-bg border border-status-confirmed-border text-base">
              ✓
            </span>
            <div>
              <div className="text-xs font-bold text-foreground">
                Contador acumulado en 0,00 (0 reservas verificadas sin lote)
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                Todas las reservas con pagos verificados hasta este momento ya fueron agrupadas en lotes. Los próximos pagos verificados en Conciliación se acumularán aquí al instante.
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center rounded-lg bg-muted px-3 py-1.5 text-xs font-bold text-muted-foreground">
              Sin saldo pendiente de lote
            </span>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {unsettledPools.map((pool) => {
            const isEur = pool.currencyCode === "EUR";
            const currCode = isEur ? "EUR" : "USD";
            const sym = isEur ? "€" : "$";
            const rateUsed = isEur ? bcvEurRate : bcvRate;
            const netBs = pool.netAmount * rateUsed;
            const isGeneratingThis = generatingOrgId === pool.organizationId;

            return (
              <div
                key={`${pool.organizationId}-${pool.direction}`}
                className="rounded-xl border border-border bg-surface p-4 flex flex-wrap items-center justify-between gap-4 shadow-xs"
              >
                {/* Left: Organization & Accumulation Time Window */}
                <div className="space-y-1 min-w-[240px]">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-display text-sm font-bold text-foreground">
                      {pool.organizationName}
                    </span>
                    <span className="rounded-md bg-muted border border-border px-2 py-0.5 font-mono text-[10px] font-semibold text-muted-foreground">
                      {pool.rif}
                    </span>
                    <span className="rounded-md bg-muted border border-border px-2 py-0.5 text-[10px] font-bold text-foreground">
                      {isEur ? "💶 EUR" : "💵 USD"} (Tasa BCV:{" "}
                      {rateUsed.toLocaleString("es-VE", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      Bs.)
                    </span>
                    <span className="rounded-full bg-accent/15 border border-accent/40 px-2.5 py-0.5 text-[11px] font-bold text-foreground">
                      {pool.reservationsCount}{" "}
                      {pool.reservationsCount === 1
                        ? "pago verificado acumulado"
                        : "pagos verificados acumulados"}
                    </span>
                  </div>

                  <div className="text-[11px] text-muted-foreground flex flex-wrap items-center gap-2">
                    <span>
                      🕒 Acumulado desde:{" "}
                      <strong className="text-foreground">
                        {formatDateTimeEs(pool.oldestVerifiedAt)}
                      </strong>{" "}
                      →{" "}
                      <strong className="text-foreground">Ahora</strong>
                    </span>
                    {!isAllyToPlatform && pool.payoutBank && (
                      <>
                        <span>•</span>
                        <span>
                          🏦 Destino: {pool.payoutBank}
                          {pool.payoutAccountNumber
                            ? ` (•••${pool.payoutAccountNumber.slice(-4)})`
                            : ""}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Middle: Atomic Breakdown */}
                <div className="flex flex-wrap items-center gap-5 text-right">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {isAllyToPlatform ? "Cobrado por Aliado" : "Recaudado Bruto"}
                    </div>
                    <div className="text-xs font-bold text-foreground mt-0.5">
                      {sym}
                      {pool.grossAmount.toFixed(2)} {currCode}
                    </div>
                  </div>

                  {!isAllyToPlatform && (
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Comisión YoReservo
                      </div>
                      <div className="text-xs font-bold text-status-cancelled-fg mt-0.5">
                        −{sym}
                        {pool.platformFeeAmount.toFixed(2)} {currCode}
                      </div>
                    </div>
                  )}

                  <div className="rounded-lg bg-status-available-bg/60 border border-status-available-border px-3 py-1.5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-status-available-fg">
                      {isAllyToPlatform
                        ? "Comisión a Pagar a YoReservo"
                        : "Neto a Transferir al Aliado"}
                    </div>
                    <div className="font-display text-sm font-black text-status-available-fg">
                      {sym}
                      {pool.netAmount.toFixed(2)} {currCode}{" "}
                      <span className="font-sans text-[11px] font-semibold text-muted-foreground">
                        (≈ Bs.{" "}
                        {netBs.toLocaleString("es-VE", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                        )
                      </span>
                    </div>
                  </div>

                  {/* Right: Snapshot Action (restricted for PLATFORM_TO_ALLY to YoReservo staff only) */}
                  {canGenerateBatch ? (
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      isLoading={isGeneratingThis}
                      disabled={generatingOrgId !== null}
                      onClick={() =>
                        onGenerateSnapshot(pool.organizationId, pool.direction)
                      }
                      className="text-xs font-bold"
                      id={`btn-generate-snapshot-${pool.organizationId}`}
                    >
                      <span>📸</span>
                      <span>
                        {isAllyToPlatform
                          ? "Generar Lote de Comisión"
                          : "Generar Lote de Pago"}
                      </span>
                    </Button>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-muted/60 px-3 py-2 text-[11px] font-semibold text-muted-foreground">
                      <span>🔒</span>
                      <span>Gestionado por YoReservo</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
