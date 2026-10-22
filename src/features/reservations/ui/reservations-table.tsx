"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import type { BackofficeRole } from "@/shared/config";
import { useTimeFormat } from "@/shared/lib/time-format";
import type { ReservationItem } from "../model/types";

interface ReservationsTableProps {
  reservations: ReservationItem[];
  onSelectReservation: (reservation: ReservationItem) => void;
  onCancelReservation: (reservation: ReservationItem) => void;
  currencyCode?: string;
  userRole?: BackofficeRole;
}

export function ReservationsTable({
  reservations,
  onSelectReservation,
  onCancelReservation,
  currencyCode = "USD",
  userRole,
}: ReservationsTableProps) {
  const t = useTranslations("reservations.table");
  const { formatTime } = useTimeFormat();
  const isValidator = userRole === "ALLY_VALIDATOR";

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const totalItems = reservations.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  useEffect(() => {
    setCurrentPage(1);
  }, [reservations, pageSize]);

  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedReservations = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return reservations.slice(start, start + pageSize);
  }, [reservations, safeCurrentPage, pageSize]);

  const startIndex = totalItems === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const endIndex = Math.min(safeCurrentPage * pageSize, totalItems);

  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    const maxButtons = 5;
    let startPage = Math.max(1, safeCurrentPage - Math.floor(maxButtons / 2));
    const endPage = Math.min(totalPages, startPage + maxButtons - 1);
    if (endPage - startPage + 1 < maxButtons) {
      startPage = Math.max(1, endPage - maxButtons + 1);
    }
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }, [safeCurrentPage, totalPages]);

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
  }

  const financialHeaderLabel =
    currencyCode === "EUR"
      ? "Monto EUR / Bs."
      : currencyCode === "MIXED"
        ? "Monto Ref. / Bs."
        : t("thFinancial");

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
              <th className="py-3.5 px-4">{financialHeaderLabel}</th>
              <th className="py-3.5 px-4">{t("thPayment")}</th>
              <th className="py-3.5 px-4">{t("thStatus")}</th>
              <th className="py-3.5 px-4 text-right">{t("thActions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-xs" id="bookings-tbody">
            {paginatedReservations.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-muted-foreground">
                  {t("noResults")}
                </td>
              </tr>
            ) : (
              paginatedReservations.map((res) => {
                const isEurRow = res.currencyCode === "EUR";
                const currencySymbol = isEurRow ? "€" : "$";

                // Payment Badge
                let payBadgeClass =
                  "bg-emerald-500/15 border-emerald-500/30 text-emerald-400";
                let payBadgeLabel = t("payPagoMovil");
                if (res.paymentMethod === "cash") {
                  payBadgeClass =
                    "bg-amber-500/15 border-amber-500/30 text-amber-400";
                  payBadgeLabel = t("payCash");
                } else if (
                  res.paymentMethod === "pos" ||
                  res.paymentMethod === "card"
                ) {
                  payBadgeClass = "bg-sky-500/15 border-sky-500/30 text-sky-400";
                  payBadgeLabel = t("payPos");
                } else if (res.paymentMethod === "pending") {
                  payBadgeClass =
                    "bg-muted border-border text-muted-foreground";
                  payBadgeLabel = "⏳ Sin pago";
                }

                // Status Badge
                let statusBadgeClass =
                  "bg-emerald-500/15 border-emerald-500/30 text-emerald-400";
                let statusBadgeLabel = t("statusConfirmed");
                if (
                  res.status === "PENDING_PAYMENT" ||
                  (res.status as string) === "PAYMENT_UNDER_REVIEW"
                ) {
                  statusBadgeClass =
                    "bg-amber-500/15 border-amber-500/30 text-amber-400";
                  statusBadgeLabel = t("statusPendingPayment");
                } else if (res.status === "COMPLETED") {
                  statusBadgeClass =
                    "bg-blue-500/15 border-blue-500/30 text-blue-400";
                  statusBadgeLabel = t("statusCompleted");
                } else if (
                  res.status === "CANCELLED" ||
                  res.status === "REJECTED"
                ) {
                  statusBadgeClass =
                    "bg-rose-500/15 border-rose-500/30 text-rose-400";
                  statusBadgeLabel = t("statusCancelled");
                }

                const cleanPhone = res.phone.replace(/[^0-9]/g, "");
                const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                  t("waGreeting", {
                    name: res.clientName,
                    code: res.code,
                    venue: res.venue,
                  }),
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
                        {res.origin === "walk-in"
                          ? t("originWalkIn")
                          : t("originApp")}
                      </div>
                    </td>

                    {/* 2. Client & WhatsApp */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-bold text-foreground">
                        {res.clientName}
                      </div>
                      {cleanPhone ? (
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:underline mt-0.5"
                        >
                          <span>💬</span>
                          <span>{res.phone}</span>
                        </a>
                      ) : (
                        <span className="text-[11px] text-muted-foreground mt-0.5 block">
                          {res.phone}
                        </span>
                      )}
                    </td>

                    {/* 3. Court & Venue */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-semibold text-foreground">
                        {res.court}{" "}
                        {res.sport && res.sport !== "—" ? `(${res.sport})` : ""}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        📍 {res.venue}
                      </div>
                    </td>

                    {/* 4. Schedule & Duration */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-bold text-foreground">
                        {formatTime(res.dateDisplay)}
                      </div>
                      <div className="text-[11px] font-semibold text-accent">
                        {formatTime(res.timeSlot)}{" "}
                        {res.duration && res.duration !== "—"
                          ? `(${res.duration})`
                          : ""}
                      </div>
                    </td>

                    {/* 5. Financial Amount */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-bold text-foreground">
                        {currencySymbol}
                        {res.priceUsd.toFixed(2)}{" "}
                        <span className="text-[10px] font-semibold text-muted-foreground">
                          {isEurRow ? "EUR" : "USD"}
                        </span>
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        ≈{" "}
                        {res.priceBs.toLocaleString("es-VE", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        Bs.
                      </div>
                    </td>

                    {/* 6. Payment Badge */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${payBadgeClass}`}
                      >
                        {payBadgeLabel}
                      </span>
                    </td>

                    {/* 7. Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${statusBadgeClass}`}
                      >
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
                        {cleanPhone && (
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={t("actionWhatsApp")}
                            className="rounded-lg p-1.5 text-emerald-400 hover:bg-emerald-500/10 transition-all cursor-pointer"
                          >
                            💬
                          </a>
                        )}
                        {!isValidator && res.status !== "CANCELLED" && (
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

      {/* PAGINATION FOOTER */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border bg-muted/30 px-4 py-3 text-xs">
        <div className="flex flex-wrap items-center gap-3 text-muted-foreground">
          <span>
            Mostrando{" "}
            <strong className="text-foreground">{startIndex}</strong>–
            <strong className="text-foreground">{endIndex}</strong> de{" "}
            <strong className="text-foreground">{totalItems}</strong>{" "}
            {totalItems === 1 ? "reserva" : "reservas"}
          </span>

          <div className="flex items-center gap-1.5">
            <span>Filas por página:</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="rounded-lg border border-border bg-surface px-2 py-1 text-xs font-semibold text-foreground focus:border-accent focus:outline-none cursor-pointer"
              aria-label="Filas por página"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={safeCurrentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
          >
            ← Anterior
          </button>

          {pageNumbers.map((pageNum) => (
            <button
              key={pageNum}
              type="button"
              onClick={() => setCurrentPage(pageNum)}
              className={`min-w-[30px] rounded-lg border px-2 py-1 text-xs font-bold transition-all cursor-pointer ${
                pageNum === safeCurrentPage
                  ? "border-accent bg-accent text-accent-foreground shadow-xs"
                  : "border-border bg-surface text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {pageNum}
            </button>
          ))}

          <button
            type="button"
            disabled={safeCurrentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
          >
            Siguiente →
          </button>
        </div>
      </div>
    </div>
  );
}
