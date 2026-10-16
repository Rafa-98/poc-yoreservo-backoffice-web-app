"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { useTimeFormat } from "@/shared/lib/time-format";
import type { ReservationItem } from "../model/types";

interface ReservationsTableProps {
  reservations: ReservationItem[];
  onSelectReservation: (reservation: ReservationItem) => void;
  onCancelReservation: (reservation: ReservationItem) => void;
}

export function ReservationsTable({
  reservations,
  onSelectReservation,
  onCancelReservation,
}: ReservationsTableProps) {
  const t = useTranslations("reservations.table");
  const { formatTime } = useTimeFormat();

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
  }

  return (
    <div className="rounded-2xl border border-border bg-surface shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse" id="bookings-table">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              <th className="py-3.5 px-4">{t("thCode")}</th>
              <th className="py-3.5 px-4">{t("thClient")}</th>
              <th className="py-3.5 px-4">{t("thCourt")}</th>
              <th className="py-3.5 px-4">{t("thSchedule")}</th>
              <th className="py-3.5 px-4">{t("thFinancial")}</th>
              <th className="py-3.5 px-4">{t("thPayment")}</th>
              <th className="py-3.5 px-4">{t("thStatus")}</th>
              <th className="py-3.5 px-4 text-right">{t("thActions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-xs" id="bookings-tbody">
            {reservations.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-muted-foreground">
                  {t("noResults")}
                </td>
              </tr>
            ) : (
              reservations.map((res) => {
                // Payment Badge
                let payBadgeClass = "bg-emerald-500/15 border-emerald-500/30 text-emerald-400";
                let payBadgeLabel = t("payPagoMovil");
                if (res.paymentMethod === "cash") {
                  payBadgeClass = "bg-amber-500/15 border-amber-500/30 text-amber-400";
                  payBadgeLabel = t("payCash");
                } else if (res.paymentMethod === "pos" || res.paymentMethod === "card") {
                  payBadgeClass = "bg-sky-500/15 border-sky-500/30 text-sky-400";
                  payBadgeLabel = t("payPos");
                }

                // Status Badge
                let statusBadgeClass = "bg-emerald-500/15 border-emerald-500/30 text-emerald-400";
                let statusBadgeLabel = t("statusConfirmed");
                if (res.status === "PENDING_PAYMENT") {
                  statusBadgeClass = "bg-amber-500/15 border-amber-500/30 text-amber-400";
                  statusBadgeLabel = t("statusPendingPayment");
                } else if (res.status === "COMPLETED") {
                  statusBadgeClass = "bg-blue-500/15 border-blue-500/30 text-blue-400";
                  statusBadgeLabel = t("statusCompleted");
                } else if (res.status === "CANCELLED") {
                  statusBadgeClass = "bg-rose-500/15 border-rose-500/30 text-rose-400";
                  statusBadgeLabel = t("statusCancelled");
                }

                const cleanPhone = res.phone.replace(/[^0-9]/g, "");
                const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                  t("waGreeting", {
                    name: res.clientName,
                    code: res.code,
                    venue: res.venue,
                  })
                )}`;

                return (
                  <tr
                    key={res.id}
                    className="hover:bg-muted/40 transition-colors"
                  >
                    {/* 1. Code & Origin */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">
                          {res.origin === "walk-in" ? "🎟️" : "📱"}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyCode(res.code)}
                          title={t("copyCodeTitle")}
                          className="font-mono text-xs font-bold px-2 py-0.5 rounded-lg border border-border bg-muted/60 text-foreground hover:border-accent transition-all cursor-pointer"
                        >
                          #{res.code}
                        </button>
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        {res.origin === "walk-in" ? t("originWalkIn") : t("originApp")}
                      </div>
                    </td>

                    {/* 2. Client & WhatsApp */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-bold text-foreground">{res.clientName}</div>
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:underline mt-0.5"
                      >
                        <span>💬</span>
                        <span>{res.phone}</span>
                      </a>
                    </td>

                    {/* 3. Court & Venue */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-semibold text-foreground">
                        {res.court} ({res.sport})
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        📍 {res.venue}
                      </div>
                    </td>

                    {/* 4. Schedule & Duration */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-bold text-foreground">{formatTime(res.dateDisplay)}</div>
                      <div className="text-[11px] font-semibold text-accent">
                        {formatTime(res.timeSlot)} ({res.duration})
                      </div>
                    </td>

                    {/* 5. Financial Amount */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-bold text-foreground">
                        ${res.priceUsd.toFixed(2)}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        ≈ {res.priceBs.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs.
                      </div>
                    </td>

                    {/* 6. Payment Badge */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${payBadgeClass}`}>
                        {payBadgeLabel}
                      </span>
                    </td>

                    {/* 7. Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${statusBadgeClass}`}>
                        {statusBadgeLabel}
                      </span>
                      {res.checkedIn && (
                        <div className="text-[10px] font-bold text-emerald-400 mt-1">
                          {t("checkedInBadge")}
                        </div>
                      )}
                    </td>

                    {/* 8. Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onSelectReservation(res)}
                          title={t("actionDetail")}
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-all cursor-pointer"
                        >
                          👁️
                        </button>
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={t("actionWhatsApp")}
                          className="rounded-lg p-1.5 text-emerald-400 hover:bg-emerald-500/10 transition-all cursor-pointer"
                        >
                          💬
                        </a>
                        {res.status !== "CANCELLED" && (
                          <button
                            type="button"
                            onClick={() => onCancelReservation(res)}
                            title={t("actionCancel")}
                            className="rounded-lg p-1.5 text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                          >
                            ❌
                          </button>
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
    </div>
  );
}
