"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Eye } from "lucide-react";
import { useLocale } from "next-intl";
import { Button, Spinner } from "@/shared/ui";
import type {
  SupportTicketItem,
  SupportTicketStatus,
  SupportTicketsData,
} from "@/features/support/model/types";
import {
  getSupportTicketsAction,
  updateSupportTicketAction,
} from "@/features/support/actions/support-actions";

interface SupportTicketsPageProps {
  initialData: SupportTicketsData;
  userRole?: string;
}

export function SupportTicketsPage({
  initialData,
  userRole,
}: SupportTicketsPageProps) {
  const locale = useLocale();
  const isEn = locale.toLowerCase().startsWith("en");

  const [tickets, setTickets] = useState<SupportTicketItem[]>(
    initialData.items
  );
  const [typeFilter, setTypeFilter] = useState<
    "ALL" | "BUG_REPORT" | "FEEDBACK"
  >("ALL");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | SupportTicketStatus
  >("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pendingTicketId, setPendingTicketId] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] =
    useState<SupportTicketItem | null>(null);
  const [modalStatus, setModalStatus] = useState<SupportTicketStatus>("OPEN");
  const [modalNotes, setModalNotes] = useState("");
  const [isSavingModal, setIsSavingModal] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    isError: boolean;
  } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const canManage =
    userRole === "PLATFORM_ADMIN" || userRole === "ALLY_ADMIN";

  function showToast(message: string, isError = false) {
    setToast({ message, isError });
    setTimeout(() => setToast(null), 4000);
  }

  // Compute live KPIs from current tickets state
  const kpis = useMemo(() => {
    const totalCount = tickets.length;
    const openCount = tickets.filter((t) => t.status === "OPEN").length;
    const inProgressCount = tickets.filter(
      (t) => t.status === "IN_PROGRESS"
    ).length;
    const resolvedCount = tickets.filter(
      (t) => t.status === "RESOLVED" || t.status === "CLOSED"
    ).length;
    const feedbackCount = tickets.filter((t) => t.type === "FEEDBACK").length;
    const bugReportCount = tickets.filter(
      (t) => t.type === "BUG_REPORT"
    ).length;
    const rated = tickets.filter(
      (t) => t.type === "FEEDBACK" && typeof t.rating === "number"
    );
    const averageRating =
      rated.length > 0
        ? Math.round(
            (rated.reduce((sum, t) => sum + (t.rating ?? 0), 0) /
              rated.length) *
              10
          ) / 10
        : null;

    return {
      totalCount,
      openCount,
      inProgressCount,
      resolvedCount,
      feedbackCount,
      bugReportCount,
      averageRating,
    };
  }, [tickets]);

  const filteredTickets = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return tickets.filter((t) => {
      if (typeFilter !== "ALL" && t.type !== typeFilter) return false;
      if (statusFilter !== "ALL" && t.status !== statusFilter) return false;
      if (q) {
        const userStr = t.user
          ? `${t.user.name} ${t.user.lastName} ${t.user.email} ${t.user.phoneNumber ?? ""}`
          : "";
        const haystack = [
          t.ticketCode,
          t.category,
          t.subject ?? "",
          t.description,
          t.reservationCode ?? "",
          userStr,
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [tickets, typeFilter, statusFilter, searchQuery]);

  const totalItems = filteredTickets.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  useEffect(() => {
    setCurrentPage(1);
  }, [typeFilter, statusFilter, searchQuery, pageSize]);

  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedTickets = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredTickets.slice(start, start + pageSize);
  }, [filteredTickets, safeCurrentPage, pageSize]);

  const startIndex =
    totalItems === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
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

  async function handleRefresh() {
    setIsRefreshing(true);
    try {
      const res = await getSupportTicketsAction();
      if (res.ok) {
        setTickets(res.data.items);
        showToast(
          isEn
            ? "✓ Support tickets refreshed"
            : "✓ Bandeja de tickets actualizada"
        );
      } else {
        showToast(
          isEn
            ? "Could not refresh support tickets"
            : "No se pudo actualizar la bandeja de tickets",
          true
        );
      }
    } finally {
      setIsRefreshing(false);
    }
  }

  async function handleQuickStatusChange(
    ticket: SupportTicketItem,
    nextStatus: SupportTicketStatus
  ) {
    setPendingTicketId(ticket.id);
    try {
      const res = await updateSupportTicketAction(ticket.id, {
        status: nextStatus,
        adminNotes: ticket.adminNotes ?? undefined,
      });
      if (!res.ok) {
        showToast(
          isEn
            ? "Could not update ticket status"
            : "Error al actualizar el estado del ticket",
          true
        );
        return;
      }
      setTickets((prev) =>
        prev.map((item) => (item.id === ticket.id ? res.data : item))
      );
      if (selectedTicket?.id === ticket.id) {
        setSelectedTicket(res.data);
        setModalStatus(res.data.status);
      }
      showToast(
        isEn
          ? `✓ Ticket #${ticket.ticketCode} updated to ${nextStatus}`
          : `✓ Ticket #${ticket.ticketCode} actualizado a ${getStatusLabel(nextStatus, false)}`
      );
    } finally {
      setPendingTicketId(null);
    }
  }

  function openInspector(ticket: SupportTicketItem) {
    setSelectedTicket(ticket);
    setModalStatus(ticket.status);
    setModalNotes(ticket.adminNotes ?? "");
  }

  async function handleSaveModal(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTicket) return;
    setIsSavingModal(true);
    try {
      const res = await updateSupportTicketAction(selectedTicket.id, {
        status: modalStatus,
        adminNotes: modalNotes,
      });
      if (!res.ok) {
        showToast(
          isEn
            ? "Could not save ticket changes"
            : "Error al guardar los cambios del ticket",
          true
        );
        return;
      }
      setTickets((prev) =>
        prev.map((item) => (item.id === selectedTicket.id ? res.data : item))
      );
      setSelectedTicket(res.data);
      showToast(
        isEn
          ? `✓ Ticket #${selectedTicket.ticketCode} saved`
          : `✓ Gestión del ticket #${selectedTicket.ticketCode} guardada`
      );
      setSelectedTicket(null);
    } finally {
      setIsSavingModal(false);
    }
  }

  return (
    <div className="min-h-screen bg-background pb-12">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 rounded-xl px-4 py-3 text-xs font-bold shadow-lg border transition-all ${
            toast.isError
              ? "bg-status-cancelled-bg text-status-cancelled-fg border-status-cancelled-border"
              : "bg-status-available-bg text-status-available-fg border-status-available-border"
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Top Header */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border bg-surface px-5 py-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/15 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-link">
            🛟 {isEn ? "YoReservo Helpdesk & Triage" : "Centro de Soporte & Atención al Atleta"}
          </span>
          <h1 className="mt-1 font-display text-lg font-extrabold text-foreground">
            {isEn
              ? "Support Tickets, Bug Reports & Suggestions"
              : "Bandeja de Soporte, Reportes de Error y Sugerencias"}
          </h1>
          <p className="text-xs text-muted-foreground">
            {isEn
              ? "Real-time management of technical issues (#BUG) and product suggestions (#SUG) submitted by athletes."
              : "Gestión en tiempo real de reportes técnicos (#BUG) y sugerencias de mejora (#SUG) enviadas desde la App de Atletas."}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            isLoading={isRefreshing}
            disabled={isRefreshing}
            onClick={handleRefresh}
          >
            🔄 {isEn ? "Refresh Inbox" : "Actualizar Bandeja"}
          </Button>
        </div>
      </header>

      {/* KPI Summary Row */}
      <section className="px-5 pt-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-border bg-surface p-4 shadow-card">
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              {isEn ? "Total Tickets" : "Total de Tickets"}
            </div>
            <div className="mt-1 font-display text-2xl font-extrabold text-foreground">
              {kpis.totalCount}
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground">
              {kpis.openCount} {isEn ? "open" : "abiertos"} •{" "}
              {kpis.inProgressCount} {isEn ? "in review" : "en revisión"} •{" "}
              {kpis.resolvedCount} {isEn ? "resolved" : "resueltos"}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-4 shadow-card">
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              {isEn ? "Pending Attention" : "Pendientes de Atención"}
            </div>
            <div className="mt-1 font-display text-2xl font-extrabold text-amber-500">
              {kpis.openCount + kpis.inProgressCount}
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground">
              {kpis.openCount} {isEn ? "new" : "nuevos"} •{" "}
              {kpis.inProgressCount}{" "}
              {isEn ? "in review" : "en revisión"}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-4 shadow-card">
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              🐛 {isEn ? "Bug Reports" : "Reportes de Error"}
            </div>
            <div className="mt-1 font-display text-2xl font-extrabold text-rose-500">
              {kpis.bugReportCount}
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground">
              {isEn
                ? "Payments, QR codes, bookings & login"
                : "Pagos, códigos QR, horarios y acceso"}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-4 shadow-card">
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              💡 {isEn ? "Suggestions & Rating" : "Sugerencias & Calificación"}
            </div>
            <div className="mt-1 flex items-baseline gap-2 font-display text-2xl font-extrabold text-emerald-500">
              <span>{kpis.feedbackCount}</span>
              {kpis.averageRating !== null && (
                <span className="text-sm font-bold text-amber-500">
                  ★ {kpis.averageRating.toFixed(1)} / 5.0
                </span>
              )}
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground">
              {isEn
                ? "New courts, features & UX ideas"
                : "Nuevas canchas, funciones y mejoras"}
            </div>
          </div>
        </div>
      </section>

      {/* Filters & Search Bar */}
      <section className="px-5 pt-6">
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-card">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            {/* Type Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  {
                    id: "ALL",
                    label: isEn
                      ? `All (${tickets.length})`
                      : `Todos (${tickets.length})`,
                  },
                  {
                    id: "BUG_REPORT",
                    label: isEn
                      ? `🐛 Bug Reports (${kpis.bugReportCount})`
                      : `🐛 Reportes de Error (${kpis.bugReportCount})`,
                  },
                  {
                    id: "FEEDBACK",
                    label: isEn
                      ? `💡 Suggestions (${kpis.feedbackCount})`
                      : `💡 Sugerencias (${kpis.feedbackCount})`,
                  },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setTypeFilter(tab.id)}
                  className={`rounded-xl border px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                    typeFilter === tab.id
                      ? "border-accent bg-accent text-accent-foreground"
                      : "border-border bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Status Filter & Search */}
            <div className="flex flex-wrap items-center gap-2.5">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                aria-label={isEn ? "Filter by status" : "Filtrar por estado"}
                className="h-9 rounded-xl border border-border bg-background px-3 text-xs font-semibold text-foreground focus:border-accent focus:outline-none"
              >
                <option value="ALL">
                  {isEn ? "All Statuses" : "Todos los Estados"}
                </option>
                <option value="OPEN">
                  {isEn ? "🟢 Open" : "🟢 Abiertos"}
                </option>
                <option value="IN_PROGRESS">
                  {isEn ? "🟡 In Review" : "🟡 En Revisión"}
                </option>
                <option value="RESOLVED">
                  {isEn ? "✅ Resolved" : "✅ Resueltos"}
                </option>
                <option value="CLOSED">
                  {isEn ? "🔒 Closed" : "🔒 Cerrados"}
                </option>
              </select>

              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  isEn
                    ? "Search #BUG-1001, athlete, booking code..."
                    : "Buscar #BUG-1001, atleta, código reserva..."
                }
                className="h-9 w-full min-w-[240px] rounded-xl border border-border bg-background px-3.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none sm:w-64"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Tickets Table */}
      <section className="px-5 pt-5">
        <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
          {filteredTickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
              <div className="mb-2 text-3xl">🛟</div>
              <h3 className="text-sm font-bold text-foreground">
                {isEn
                  ? "No support tickets match the selected filters"
                  : "No hay tickets de soporte con los filtros seleccionados"}
              </h3>
              <p className="mt-1 max-w-md text-xs text-muted-foreground">
                {isEn
                  ? "New suggestions and bug reports submitted from /account/support in the Client App will appear here in real time."
                  : "Las sugerencias y reportes de error enviados desde /account/support en la App de Clientes aparecerán aquí en tiempo real."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/50 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    <th className="px-5 py-3.5">Ticket</th>
                    <th className="px-4 py-3.5">
                      {isEn ? "Type & Category" : "Tipo & Categoría"}
                    </th>
                    <th className="px-4 py-3.5">
                      {isEn ? "Subject" : "Asunto"}
                    </th>
                    <th className="px-4 py-3.5">
                      {isEn ? "Athlete" : "Atleta"}
                    </th>
                    <th className="px-4 py-3.5">
                      {isEn ? "Date" : "Fecha"}
                    </th>
                    <th className="px-4 py-3.5">
                      {isEn ? "Status" : "Estado"}
                    </th>
                    <th className="px-5 py-3.5 text-right">
                      {isEn ? "Actions" : "Acciones"}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paginatedTickets.map((ticket) => {
                    const isBug = ticket.type === "BUG_REPORT";

                    return (
                      <tr
                        key={ticket.id}
                        onClick={() => openInspector(ticket)}
                        className="cursor-pointer transition-colors hover:bg-muted/40"
                      >
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span className="inline-flex rounded-lg border border-border bg-muted/60 px-2.5 py-1 font-mono text-xs font-bold text-foreground">
                            #{ticket.ticketCode}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            <span
                              className={`inline-flex w-fit items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${
                                isBug
                                  ? "border-rose-500/30 bg-rose-500/10 text-rose-500"
                                  : "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
                              }`}
                            >
                              {isBug
                                ? isEn
                                  ? "🐛 Bug Report"
                                  : "🐛 Reporte de Error"
                                : isEn
                                ? "💡 Suggestion"
                                : "💡 Sugerencia"}
                            </span>
                            <span className="text-[11px] font-medium text-muted-foreground">
                              {formatCategoryLabel(ticket.category, isEn)}
                            </span>
                          </div>
                        </td>

                        <td className="max-w-[280px] px-4 py-3.5">
                          <div className="truncate font-bold text-foreground text-sm">
                            {ticket.subject ||
                              (isBug
                                ? isEn
                                  ? "Technical Issue"
                                  : "Reporte técnico"
                                : isEn
                                ? "User Suggestion"
                                : "Sugerencia de mejora")}
                          </div>
                        </td>

                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {ticket.user ? (
                            <div className="font-bold text-foreground text-sm">
                              {ticket.user.name} {ticket.user.lastName}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>

                        <td className="px-4 py-3.5 whitespace-nowrap text-muted-foreground font-semibold">
                          {formatDateTime(ticket.createdAt, locale)}
                        </td>

                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <StatusPill status={ticket.status} isEn={isEn} />
                        </td>

                        <td className="px-5 py-3.5 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openInspector(ticket);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface hover:bg-muted hover:border-border-strong px-3 py-1.5 text-xs font-bold text-foreground transition-all cursor-pointer"
                          >
                            <Eye className="size-3.5 text-link" />
                            <span>{isEn ? "View details" : "Ver detalles"}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* PAGINATION FOOTER */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border bg-muted/30 px-5 py-3 text-xs">
            <div className="flex flex-wrap items-center gap-3 text-muted-foreground">
              <span>
                {isEn ? "Showing" : "Mostrando"}{" "}
                <strong className="text-foreground">{startIndex}</strong>–
                <strong className="text-foreground">{endIndex}</strong>{" "}
                {isEn ? "of" : "de"}{" "}
                <strong className="text-foreground">{totalItems}</strong>{" "}
                {totalItems === 1 ? "ticket" : "tickets"}
              </span>

              <div className="flex items-center gap-1.5">
                <span>{isEn ? "Rows per page:" : "Filas por página:"}</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="rounded-lg border border-border bg-surface px-2 py-1 text-xs font-semibold text-foreground focus:border-accent focus:outline-none cursor-pointer"
                  aria-label={isEn ? "Rows per page" : "Filas por página"}
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
                ← {isEn ? "Previous" : "Anterior"}
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
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                className="rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
              >
                {isEn ? "Next" : "Siguiente"} →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Ticket Inspector & Resolution Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-surface p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-sm font-extrabold text-foreground">
                    #{selectedTicket.ticketCode}
                  </span>
                  <StatusPill status={selectedTicket.status} isEn={isEn} />
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${
                      selectedTicket.type === "BUG_REPORT"
                        ? "border-rose-500/30 bg-rose-500/10 text-rose-500"
                        : "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
                    }`}
                  >
                    {selectedTicket.type === "BUG_REPORT"
                      ? isEn
                        ? "🐛 Bug Report"
                        : "🐛 Reporte de Error"
                      : isEn
                      ? "💡 Suggestion"
                      : "💡 Sugerencia"}
                  </span>
                </div>
                <h2 className="mt-1.5 font-display text-base font-extrabold text-foreground">
                  {selectedTicket.subject ||
                    formatCategoryLabel(selectedTicket.category, isEn)}
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {isEn ? "Submitted on" : "Recibido el"}{" "}
                  {formatDateTime(selectedTicket.createdAt, locale)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="rounded-lg border border-border px-2.5 py-1 text-xs font-bold text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {/* Athlete & Context Grid */}
              <div className="grid grid-cols-1 gap-3 rounded-xl border border-border bg-muted/40 p-3.5 sm:grid-cols-2">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {isEn ? "Athlete Information" : "Datos del Atleta"}
                  </div>
                  {selectedTicket.user ? (
                    <div className="mt-1 space-y-0.5 text-xs">
                      <div className="font-bold text-foreground">
                        {selectedTicket.user.name}{" "}
                        {selectedTicket.user.lastName}
                      </div>
                      <div className="text-muted-foreground">
                        ✉️{" "}
                        <a
                          href={`mailto:${selectedTicket.user.email}?subject=Re: Ticket %23${selectedTicket.ticketCode} - YoReservo`}
                          className="text-link hover:underline"
                        >
                          {selectedTicket.user.email}
                        </a>
                      </div>
                      {selectedTicket.user.phoneNumber && (
                        <div className="text-muted-foreground">
                          💬{" "}
                          <a
                            href={`https://wa.me/${selectedTicket.user.phoneNumber.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noreferrer"
                            className="font-mono text-link hover:underline"
                          >
                            {selectedTicket.user.phoneNumber} (WhatsApp ↗)
                          </a>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mt-1 text-xs text-muted-foreground">—</div>
                  )}
                </div>

                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {isEn ? "Ticket Metadata" : "Metadatos del Ticket"}
                  </div>
                  <div className="mt-1 space-y-1 text-xs">
                    <div>
                      <span className="text-muted-foreground">
                        {isEn ? "Category:" : "Categoría:"}
                      </span>{" "}
                      <strong className="text-foreground">
                        {formatCategoryLabel(selectedTicket.category, isEn)}
                      </strong>
                    </div>
                    {selectedTicket.reservationCode && (
                      <div>
                        <span className="text-muted-foreground">
                          {isEn ? "Booking Code:" : "Código Reserva:"}
                        </span>{" "}
                        <span className="rounded bg-accent/20 px-1.5 py-0.5 font-mono font-bold text-foreground">
                          #{selectedTicket.reservationCode}
                        </span>
                      </div>
                    )}
                    {typeof selectedTicket.rating === "number" && (
                      <div>
                        <span className="text-muted-foreground">
                          {isEn ? "Experience Rating:" : "Calificación:"}
                        </span>{" "}
                        <span className="font-bold text-amber-500">
                          {"★".repeat(selectedTicket.rating)} (
                          {selectedTicket.rating}/5)
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {isEn ? "Detailed Description" : "Descripción Detallada"}
                </div>
                <div className="whitespace-pre-wrap rounded-xl border border-border bg-background p-3.5 text-xs leading-relaxed text-foreground">
                  {selectedTicket.description}
                </div>
              </div>

              {/* Attachment Preview */}
              {selectedTicket.attachmentUrl && (
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      📎{" "}
                      {isEn
                        ? "Attached Screenshot / Image"
                        : "Captura o Imagen Adjunta"}
                    </span>
                    <a
                      href={selectedTicket.attachmentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-bold text-link hover:underline"
                    >
                      {isEn
                        ? "Open original in new tab ↗"
                        : "Abrir imagen original en pestaña nueva ↗"}
                    </a>
                  </div>
                  <div className="overflow-hidden rounded-xl border border-border bg-muted/40 p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={selectedTicket.attachmentUrl}
                      alt={`Attachment for #${selectedTicket.ticketCode}`}
                      className="max-h-72 w-full rounded-lg object-contain"
                    />
                  </div>
                </div>
              )}

              {/* Technical Diagnostic Info if present */}
              {selectedTicket.diagnosticInfo && (
                <div className="rounded-xl border border-border bg-muted/30 p-3 text-[11px] text-muted-foreground">
                  <div className="mb-1 font-bold uppercase text-foreground">
                    🖥️{" "}
                    {isEn
                      ? "Technical Diagnostic Info"
                      : "Información Técnica & Auditoría"}
                  </div>
                  <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                    {Boolean(selectedTicket.diagnosticInfo.browser) && (
                      <div className="truncate">
                        • Browser:{" "}
                        {String(selectedTicket.diagnosticInfo.browser)}
                      </div>
                    )}
                    {Boolean(selectedTicket.diagnosticInfo.platform) && (
                      <div>
                        • Platform:{" "}
                        {String(selectedTicket.diagnosticInfo.platform)}
                      </div>
                    )}
                    {Boolean(selectedTicket.diagnosticInfo.version) && (
                      <div>
                        • App Version:{" "}
                        {String(selectedTicket.diagnosticInfo.version)}
                      </div>
                    )}
                    {selectedTicket.lastUpdatedByEmail && (
                      <div>
                        •{" "}
                        {isEn ? "Last updated by:" : "Última gestión por:"}{" "}
                        <strong>{selectedTicket.lastUpdatedByEmail}</strong>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Triage & Resolution Form */}
              <form
                onSubmit={handleSaveModal}
                className="space-y-3 border-t border-border pt-4"
              >
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:items-end">
                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      {isEn ? "Ticket Status" : "Estado del Ticket"}
                    </label>
                    <select
                      value={modalStatus}
                      disabled={!canManage}
                      onChange={(e) =>
                        setModalStatus(e.target.value as SupportTicketStatus)
                      }
                      className="h-10 w-full rounded-lg border border-border bg-background px-3 text-xs font-bold text-foreground focus:border-accent focus:outline-none disabled:opacity-60"
                    >
                      <option value="OPEN">
                        🟢 {isEn ? "Open" : "Abierto"}
                      </option>
                      <option value="IN_PROGRESS">
                        🟡 {isEn ? "In Review" : "En Revisión"}
                      </option>
                      <option value="RESOLVED">
                        ✅ {isEn ? "Resolved" : "Resuelto"}
                      </option>
                      <option value="CLOSED">
                        🔒 {isEn ? "Closed" : "Cerrado"}
                      </option>
                    </select>
                  </div>

                  {canManage && (
                    <div className="flex flex-wrap items-center gap-2">
                      {selectedTicket.status === "OPEN" && (
                        <button
                          type="button"
                          disabled={pendingTicketId === selectedTicket.id}
                          onClick={() =>
                            handleQuickStatusChange(
                              selectedTicket,
                              "IN_PROGRESS"
                            )
                          }
                          className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 text-xs font-bold text-amber-500 transition hover:bg-amber-500/20 cursor-pointer disabled:opacity-60"
                        >
                          {pendingTicketId === selectedTicket.id && (
                            <Spinner className="size-3.5" />
                          )}
                          <span>
                            🟡 {isEn ? "Take Ticket" : "Tomar Ticket"}
                          </span>
                        </button>
                      )}

                      {(selectedTicket.status === "OPEN" ||
                        selectedTicket.status === "IN_PROGRESS") && (
                        <button
                          type="button"
                          disabled={pendingTicketId === selectedTicket.id}
                          onClick={() =>
                            handleQuickStatusChange(selectedTicket, "RESOLVED")
                          }
                          className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 text-xs font-bold text-emerald-500 transition hover:bg-emerald-500/20 cursor-pointer disabled:opacity-60"
                        >
                          {pendingTicketId === selectedTicket.id && (
                            <Spinner className="size-3.5" />
                          )}
                          <span>
                            ✓{" "}
                            {isEn
                              ? "Mark as Resolved"
                              : "Marcar como Resuelto"}
                          </span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    {isEn
                      ? "Internal Resolution Notes (Staff)"
                      : "Notas Internas de Resolución (Staff YoReservo)"}
                  </label>
                  <textarea
                    rows={3}
                    value={modalNotes}
                    disabled={!canManage}
                    onChange={(e) => setModalNotes(e.target.value)}
                    placeholder={
                      isEn
                        ? "Document the resolution steps or follow-up actions taken..."
                        : "Registra las acciones tomadas, seguimiento con el atleta o solución aplicada..."
                    }
                    className="w-full rounded-lg border border-border bg-background p-3 text-xs text-foreground focus:border-accent focus:outline-none disabled:opacity-60"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={isSavingModal}
                    onClick={() => setSelectedTicket(null)}
                  >
                    {isEn ? "Close" : "Cerrar"}
                  </Button>
                  {canManage && (
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      isLoading={isSavingModal}
                      disabled={isSavingModal}
                    >
                      💾 {isEn ? "Save Ticket Update" : "Guardar Gestión"}
                    </Button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusPill({
  status,
  isEn,
}: {
  status: SupportTicketStatus;
  isEn: boolean;
}) {
  const styles: Record<SupportTicketStatus, string> = {
    OPEN: "border-amber-500/30 bg-amber-500/15 text-amber-500",
    IN_PROGRESS: "border-blue-500/30 bg-blue-500/15 text-blue-500",
    RESOLVED:
      "border-status-available-border bg-status-available-bg text-status-available-fg",
    CLOSED: "border-border bg-muted text-muted-foreground",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${
        styles[status] || styles.OPEN
      }`}
    >
      {getStatusLabel(status, isEn)}
    </span>
  );
}

function getStatusLabel(status: SupportTicketStatus, isEn: boolean): string {
  switch (status) {
    case "OPEN":
      return isEn ? "OPEN" : "ABIERTO";
    case "IN_PROGRESS":
      return isEn ? "IN REVIEW" : "EN REVISIÓN";
    case "RESOLVED":
      return isEn ? "RESOLVED" : "RESUELTO";
    case "CLOSED":
      return isEn ? "CLOSED" : "CERRADO";
    default:
      return status;
  }
}

function formatCategoryLabel(category: string, isEn: boolean): string {
  const mapEs: Record<string, string> = {
    payment: "💳 Pagos (Pago Móvil / Tarjeta)",
    qr: "📲 Código QR de Acceso",
    schedule: "🗓️ Horarios / Disponibilidad",
    login: "🔐 Inicio de Sesión / Cuenta",
    other: "⚙️ Otro problema técnico",
  };
  const mapEn: Record<string, string> = {
    payment: "💳 Payments (Pago Móvil / Card)",
    qr: "📲 QR Code Access",
    schedule: "🗓️ Schedules / Availability",
    login: "🔐 Sign-in / Account",
    other: "⚙️ Other technical issue",
  };
  return (isEn ? mapEn[category] : mapEs[category]) || category;
}

function formatDateTime(iso: string, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

