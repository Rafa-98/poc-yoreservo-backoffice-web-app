"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Eye, Pencil } from "lucide-react";
import { Button } from "@/shared/ui/button";
import type { UserItem, UserRole } from "../model/types";

interface UsersTableProps {
  users: UserItem[];
  onViewDetails: (user: UserItem) => void;
  onEditUser: (user: UserItem) => void;
}

export function UsersTable({
  users,
  onViewDetails,
  onEditUser,
}: UsersTableProps) {
  const t = useTranslations("users");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const topRef = useRef<HTMLDivElement | null>(null);

  function handlePageChange(nextPage: number) {
    setCurrentPage(nextPage);
    if (topRef.current) {
      topRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    if (typeof document !== "undefined") {
      const mainEl = document.querySelector("main");
      if (mainEl) {
        mainEl.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  const totalItems = users.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  useEffect(() => {
    setCurrentPage(1);
  }, [users, pageSize]);

  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedUsers = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return users.slice(start, start + pageSize);
  }, [users, safeCurrentPage, pageSize]);

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

  function getRoleBadge(role: UserRole) {
    switch (role) {
      case "PLATFORM_ADMIN":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30">
            <span>👑</span>
            <span>{t("roles.PLATFORM_ADMIN")}</span>
          </span>
        );
      case "PLATFORM_ACCOUNTING":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
            <span>💳</span>
            <span>{t("roles.PLATFORM_ACCOUNTING")}</span>
          </span>
        );
      case "ALLY_ADMIN":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-accent/20 text-foreground border border-accent/40">
            <span>🏢</span>
            <span>{t("roles.ALLY_ADMIN")}</span>
          </span>
        );
      case "ALLY_ACCOUNTING":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
            <span>📊</span>
            <span>{t("roles.ALLY_ACCOUNTING")}</span>
          </span>
        );
      case "ALLY_VALIDATOR":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30">
            <span>🎟️</span>
            <span>{t("roles.ALLY_VALIDATOR")}</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-muted text-muted-foreground border border-border">
            {role}
          </span>
        );
    }
  }

  function getStatusBadge(status: string) {
    if (status === "ACTIVE") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          {t("filters.active")}
        </span>
      );
    }
    if (status === "INVITATION_PENDING") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
          <span className="size-1.5 rounded-full bg-amber-500" />
          {t("filters.pending")}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
        <span className="size-1.5 rounded-full bg-rose-500" />
        {t("filters.inactive")}
      </span>
    );
  }

  function getAvatarInitials(name: string) {
    const cleaned = name.replace(/\s*\([^)]*\)\s*/g, "").trim() || name;
    const parts = cleaned.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return cleaned.substring(0, 2).toUpperCase();
  }

  return (
    <div
      ref={topRef}
      className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm"
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/60 text-[11px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border">
            <tr>
              <th className="px-5 py-3.5">{t("table.thUser")}</th>
              <th className="px-5 py-3.5">{t("table.thRole")}</th>
              <th className="px-5 py-3.5">{t("table.thScope")}</th>
              <th className="px-5 py-3.5">{t("table.thStatus")}</th>
              <th className="px-5 py-3.5 text-right">{t("table.thActions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-xs">
            {paginatedUsers.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-5 py-12 text-center text-muted-foreground"
                >
                  {t("table.empty")}
                </td>
              </tr>
            ) : (
              paginatedUsers.map((u) => {
                const initials = getAvatarInitials(u.name);
                const isOnline = u.status === "ACTIVE" && u.activeSessions > 0;
                const isValidatorRole = u.role === "ALLY_VALIDATOR";
                const isPlatformRole =
                  u.role === "PLATFORM_ADMIN" ||
                  u.role === "PLATFORM_ACCOUNTING";

                const scopePrimary = isPlatformRole
                  ? `🌐 ${t("filters.globalScope")}`
                  : isValidatorRole &&
                      u.venueName &&
                      u.venueName !== "Toda la Organización"
                    ? `📍 ${u.venueName}`
                    : `🏢 ${t("filters.allOrg")}`;

                const scopeSecondary = isPlatformRole
                  ? t("table.globalPlatform")
                  : isValidatorRole
                    ? t("table.specificVenue")
                    : t("table.entireOrg");

                return (
                  <tr
                    key={u.id}
                    className="transition-colors hover:bg-muted/40"
                  >
                    {/* 1. Colaborador (Avatar + Name + Email) */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="relative flex size-9 shrink-0 items-center justify-center rounded-full bg-muted border border-border font-bold text-xs text-foreground">
                          {initials}
                          <span
                            className={`absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-surface ${
                              isOnline
                                ? "bg-emerald-500"
                                : u.status === "INVITATION_PENDING"
                                  ? "bg-amber-500"
                                  : "bg-zinc-400"
                            }`}
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-foreground text-sm truncate">
                            {u.name}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {u.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* 2. Rol Asignado (Friendly Name) */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {getRoleBadge(u.role)}
                    </td>

                    {/* 3. Ámbito / Sede */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="font-semibold text-foreground">
                        {scopePrimary}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        {scopeSecondary}
                      </div>
                    </td>

                    {/* 4. Estado */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {getStatusBadge(u.status)}
                    </td>

                    {/* 5. Acciones (Detalles + Editar) */}
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center justify-end gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => onViewDetails(u)}
                          className="h-8 px-2.5 text-xs"
                          id={`btn-details-user-${u.id}`}
                        >
                          <Eye className="size-3.5" />
                          <span>{t("table.btnDetails")}</span>
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => onEditUser(u)}
                          className="h-8 px-2.5 text-xs"
                          id={`btn-edit-user-${u.id}`}
                        >
                          <Pencil className="size-3.5" />
                          <span>{t("table.btnEdit")}</span>
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

      {/* PAGINATION FOOTER */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border bg-muted/30 px-5 py-3 text-xs">
        <div className="flex flex-wrap items-center gap-3 text-muted-foreground">
          <span>
            {t("table.showing")}{" "}
            <strong className="text-foreground">{startIndex}</strong>–
            <strong className="text-foreground">{endIndex}</strong>{" "}
            {t("table.of")}{" "}
            <strong className="text-foreground">{totalItems}</strong>{" "}
            {totalItems === 1
              ? t("table.staffUnitSingular")
              : t("table.staffUnitPlural")}
          </span>

          <div className="flex items-center gap-1.5">
            <span>{t("table.rowsPerPage")}</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="rounded-lg border border-border bg-surface px-2 py-1 text-xs font-semibold text-foreground focus:border-accent focus:outline-none cursor-pointer"
              aria-label={t("table.rowsPerPage")}
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
            onClick={() => handlePageChange(Math.max(1, safeCurrentPage - 1))}
            className="rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
          >
            {t("table.prevPage")}
          </button>

          {pageNumbers.map((pageNum) => (
            <button
              key={pageNum}
              type="button"
              onClick={() => handlePageChange(pageNum)}
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
              handlePageChange(Math.min(totalPages, safeCurrentPage + 1))
            }
            className="rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
          >
            {t("table.nextPage")}
          </button>
        </div>
      </div>
    </div>
  );
}
