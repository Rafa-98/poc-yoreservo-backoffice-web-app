"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Eye } from "lucide-react";
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
}: ReservationsTableProps) {
  const t = useTranslations("reservations.table");
  const { formatTime } = useTimeFormat();

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

  function copyCode(e: React.MouseEvent, code: string) {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
  }

  return (
    <div className="rounded-2xl border border-border bg-surface shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse" id="bookings-table">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              <th className="py-3.5 px-5">Código</th>
              <th className="py-3.5 px-4">Cliente</th>
              <th className="py-3.5 px-4">Cancha & Sede</th>
              <th className="py-3.5 px-4">Fecha & Horario</th>
              <th className="py-3.5 px-4">Total</th>
              <th className="py-3.5 px-4">{t("thStatus")}</th>
              <th className="py-3.5 px-5 text-right">{t("thActions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-xs" id="bookings-tbody">
            {paginatedReservations.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-muted-foreground">
                  {t("noResults")}
                </td>
              </tr>
            ) : (
              paginatedReservations.map((res) => {
                const isEurRow = res.currencyCode === "EUR";
                const currencySymbol = isEurRow ? "€" : "$";

                // Status Badge
                let statusBadgeClass =
                  "bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400";
                let statusBadgeLabel = t("statusConfirmed");
                if ((res.status as string) === "PAYMENT_UNDER_REVIEW") {
                  statusBadgeClass =
                    "bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-400";
                  statusBadgeLabel = t("statusUnderReview");
                } else if (res.status === "PENDING_PAYMENT") {
                  statusBadgeClass =
                    "bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-400";
                  statusBadgeLabel = t("statusPendingPayment");
                } else if (res.status === "COMPLETED") {
                  statusBadgeClass =
                    "bg-blue-500/15 border-blue-500/30 text-blue-600 dark:text-blue-400";
                  statusBadgeLabel = t("statusCompleted");
                } else if (
                  res.status === "CANCELLED" ||
                  res.status === "REJECTED"
                ) {
                  statusBadgeClass =
                    "bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-400";
                  statusBadgeLabel = t("statusCancelled");
                }

                return (
                  <tr
                    key={res.id}
                    onClick={() => onSelectReservation(res)}
                    className="hover:bg-muted/40 transition-colors cursor-pointer"
                  >
                    {/* 1. Code */}
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => copyCode(e, res.code)}
                        title={t("copyCodeTitle")}
                        className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg border border-border bg-muted/60 text-foreground hover:border-accent transition-all cursor-pointer"
                      >
                        #{res.code}
                      </button>
                    </td>

                    {/* 2. Client */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-bold text-foreground text-sm">
                        {res.clientName}
                      </div>
                    </td>

                    {/* 3. Court & Venue */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-foreground">
                        {res.court}
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate max-w-[220px]">
                        {res.venue}
                      </div>
                    </td>

                    {/* 4. Date & Time Slot */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-bold text-foreground">
                        {formatTime(res.dateDisplay)}
                      </div>
                      <div className="text-[11px] font-semibold text-link">
                        {formatTime(res.timeSlot)}
                      </div>
                    </td>

                    {/* 5. Total Amount */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-extrabold text-sm text-foreground">
                        {currencySymbol}
                        {res.priceUsd.toFixed(2)}
                      </span>{" "}
                      <span className="text-[10px] font-semibold text-muted-foreground">
                        {isEurRow ? "EUR" : "USD"}
                      </span>
                    </td>

                    {/* 6. Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${statusBadgeClass}`}
                      >
                        {statusBadgeLabel}
                      </span>
                    </td>

                    {/* 7. View Details CTA */}
                    <td className="py-3.5 px-5 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectReservation(res);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface hover:bg-muted hover:border-border-strong px-3 py-1.5 text-xs font-bold text-foreground transition-all cursor-pointer"
                      >
                        <Eye className="size-3.5 text-link" />
                        <span>Ver detalles</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION FOOTER */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border bg-muted/30 px-5 py-3 text-xs">
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
