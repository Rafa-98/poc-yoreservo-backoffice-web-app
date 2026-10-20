"use client";

import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useTimeFormat } from "@/shared/lib/time-format";
import { Button } from "@/shared/ui/button";
import type { UserItem, UserRole } from "../model/types";

interface UsersTableProps {
  users: UserItem[];
  venues: Array<{ id: string; name: string }>;
  activeVenueId?: string;
  onEditUser: (user: UserItem) => void;
  onResetPassword: (user: UserItem) => void;
  onInviteClick: () => void;
}

export function UsersTable({
  users,
  venues,
  activeVenueId,
  onEditUser,
  onResetPassword,
  onInviteClick,
}: UsersTableProps) {
  const t = useTranslations("users");
  const { formatTime } = useTimeFormat();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [selectedVenue, setSelectedVenue] = useState<string>(
    activeVenueId && activeVenueId !== "ALL" ? activeVenueId : "all"
  );
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  useEffect(() => {
    if (!activeVenueId) return;
    setSelectedVenue(activeVenueId === "ALL" ? "all" : activeVenueId);
  }, [activeVenueId]);

  const filteredUsers = users.filter((u) => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchName = u.name.toLowerCase().includes(term);
      const matchEmail = u.email.toLowerCase().includes(term);
      const matchDni = u.dni.toLowerCase().includes(term);
      if (!matchName && !matchEmail && !matchDni) return false;
    }
    if (selectedRole !== "all" && u.role !== selectedRole) {
      return false;
    }
    if (selectedVenue !== "all") {
      if (selectedVenue === "org-all" && u.venueId) return false;
      if (selectedVenue !== "org-all" && u.venueId !== selectedVenue) return false;
    }
    if (selectedStatus !== "all" && u.status !== selectedStatus) {
      return false;
    }
    return true;
  });

  function getRoleBadge(role: UserRole) {
    switch (role) {
      case "PLATFORM_ADMIN":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">
            👑 PLATFORM_ADMIN
          </span>
        );
      case "PLATFORM_ACCOUNTING":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
            💳 PLATFORM_ACCOUNTING
          </span>
        );
      case "ALLY_ADMIN":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-accent/20 text-foreground border border-accent/40">
            🏢 ALLY_ADMIN
          </span>
        );
      case "ALLY_ACCOUNTING":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-500 border border-amber-500/30">
            📊 ALLY_ACCOUNTING
          </span>
        );
      case "ALLY_VALIDATOR":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
            🎟️ ALLY_VALIDATOR
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
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          {t("filters.active")}
        </span>
      );
    }
    if (status === "INVITATION_PENDING") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-500 border border-amber-500/30">
          <span className="size-1.5 rounded-full bg-amber-500" />
          {t("filters.pending")}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-500 border border-rose-500/30">
        <span className="size-1.5 rounded-full bg-rose-500" />
        {t("filters.inactive")}
      </span>
    );
  }

  function getAvatarInitials(name: string) {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  return (
    <div className="space-y-4">
      {/* FILTER TOOLBAR */}
      <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-3 flex-1 min-w-[300px]">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t("filters.searchPlaceholder")}
            className="form-input max-w-xs"
          />

          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="form-select w-auto min-w-[160px]"
          >
            <option value="all">{t("filters.allRoles")}</option>
            <option value="PLATFORM_ADMIN">{t("simulator.admin")}</option>
            <option value="PLATFORM_ACCOUNTING">{t("simulator.accounting")}</option>
            <option value="ALLY_ADMIN">{t("simulator.ally")}</option>
            <option value="ALLY_ACCOUNTING">{t("simulator.allyAccounting")}</option>
            <option value="ALLY_VALIDATOR">{t("simulator.validator")}</option>
          </select>

          <select
            value={selectedVenue}
            onChange={(e) => setSelectedVenue(e.target.value)}
            className="form-select w-auto min-w-[180px]"
          >
            <option value="all">{t("filters.allScopes")}</option>
            <option value="org-all">{t("filters.allOrg")}</option>
            {venues.map((v) => (
              <option key={v.id} value={v.id}>
                📍 {v.name}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="form-select w-auto min-w-[150px]"
          >
            <option value="all">{t("filters.allStatus")}</option>
            <option value="ACTIVE">{t("filters.active")}</option>
            <option value="INVITATION_PENDING">{t("filters.pending")}</option>
            <option value="INACTIVE">{t("filters.inactive")}</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          {(searchTerm || selectedRole !== "all" || selectedVenue !== "all" || selectedStatus !== "all") && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                setSearchTerm("");
                setSelectedRole("all");
                setSelectedVenue("all");
                setSelectedStatus("all");
              }}
            >
              🔄 {t("filters.clearFilters")}
            </Button>
          )}

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={onInviteClick}
            id="btn-toolbar-invite"
          >
            + {t("btnInviteUser")}
          </Button>
        </div>
      </div>

      {/* DATA TABLE */}
      <div className="overflow-x-auto rounded-2xl border border-border bg-surface shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border">
            <tr>
              <th className="px-5 py-3.5">{t("table.thUser")}</th>
              <th className="px-5 py-3.5">{t("table.thContact")}</th>
              <th className="px-5 py-3.5">{t("table.thRole")}</th>
              <th className="px-5 py-3.5">{t("table.thScope")}</th>
              <th className="px-5 py-3.5">{t("table.thStatus")}</th>
              <th className="px-5 py-3.5">{t("table.thLastSession")}</th>
              <th className="px-5 py-3.5 text-right">{t("table.thActions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-muted-foreground">
                  {t("table.empty")}
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => {
                const initials = getAvatarInitials(u.name);
                const isOnline = u.status === "ACTIVE" && u.activeSessions > 0;
                return (
                  <tr key={u.id} className="transition-colors hover:bg-muted/40">
                    {/* User & DNI */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative flex size-9 items-center justify-center rounded-full bg-muted border border-border font-bold text-xs text-foreground">
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
                        <div>
                          <div className="font-bold text-foreground">{u.name}</div>
                          <div className="text-xs text-muted-foreground">{u.dni}</div>
                        </div>
                      </div>
                    </td>

                    {/* Contact & WhatsApp */}
                    <td className="px-5 py-4">
                      <div className="text-xs text-foreground">{u.email}</div>
                      {u.phone && (
                        <a
                          href={`https://wa.me/${u.phone.replace(/[^0-9]/g, "")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-emerald-500 hover:underline mt-0.5"
                        >
                          <span>💬</span>
                          <span>{u.phone}</span>
                        </a>
                      )}
                    </td>

                    {/* Role */}
                    <td className="px-5 py-4">{getRoleBadge(u.role)}</td>

                    {/* Scope */}
                    <td className="px-5 py-4">
                      <div className="text-xs font-semibold text-foreground">
                        {u.venueName || t("filters.allOrg")}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {u.scopeType === "VENUE" ? t("table.specificVenue") : t("table.entireOrg")}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">{getStatusBadge(u.status)}</td>

                    {/* Last Session */}
                    <td className="px-5 py-4 text-xs text-muted-foreground">
                      {formatTime(u.lastSession)}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => onEditUser(u)}
                          className="h-8 px-2.5 text-xs"
                          id={`btn-edit-user-${u.id}`}
                        >
                          ✏️ {t("table.btnEdit")}
                        </Button>
                        {!u.isInvitation && (
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => onResetPassword(u)}
                            className="h-8 px-2.5 text-xs"
                            id={`btn-reset-user-${u.id}`}
                          >
                            🔑 {t("table.btnReset")}
                          </Button>
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
