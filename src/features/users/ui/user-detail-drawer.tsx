"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { useTimeFormat } from "@/shared/lib/time-format";
import { Button } from "@/shared/ui/button";
import type { UserItem, UserRole } from "../model/types";

interface UserDetailDrawerProps {
  isOpen: boolean;
  user: UserItem | null;
  onClose: () => void;
  onEdit: (user: UserItem) => void;
  onResetPassword: (user: UserItem) => void;
}

export function UserDetailDrawer({
  isOpen,
  user,
  onClose,
  onEdit,
  onResetPassword,
}: UserDetailDrawerProps) {
  const t = useTranslations("users");
  const { formatTime } = useTimeFormat();

  if (!isOpen || !user) return null;

  function getRoleMeta(role: UserRole) {
    switch (role) {
      case "PLATFORM_ADMIN":
        return {
          icon: "👑",
          label: t("roles.PLATFORM_ADMIN"),
          desc: t("rolesDesc.PLATFORM_ADMIN"),
          badgeClass:
            "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30",
        };
      case "PLATFORM_ACCOUNTING":
        return {
          icon: "💳",
          label: t("roles.PLATFORM_ACCOUNTING"),
          desc: t("rolesDesc.PLATFORM_ACCOUNTING"),
          badgeClass:
            "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
        };
      case "ALLY_ADMIN":
        return {
          icon: "🏢",
          label: t("roles.ALLY_ADMIN"),
          desc: t("rolesDesc.ALLY_ADMIN"),
          badgeClass:
            "bg-accent/20 text-foreground border-accent/40",
        };
      case "ALLY_ACCOUNTING":
        return {
          icon: "📊",
          label: t("roles.ALLY_ACCOUNTING"),
          desc: t("rolesDesc.ALLY_ACCOUNTING"),
          badgeClass:
            "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
        };
      case "ALLY_VALIDATOR":
        return {
          icon: "🎟️",
          label: t("roles.ALLY_VALIDATOR"),
          desc: t("rolesDesc.ALLY_VALIDATOR"),
          badgeClass:
            "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30",
        };
      default:
        return {
          icon: "👤",
          label: role,
          desc: "",
          badgeClass: "bg-muted text-foreground border-border",
        };
    }
  }

  function getStatusMeta(status: string) {
    if (status === "ACTIVE") {
      return {
        label: t("filters.active"),
        badgeClass:
          "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
        dotClass: "bg-emerald-500",
      };
    }
    if (status === "INVITATION_PENDING") {
      return {
        label: t("filters.pending"),
        badgeClass:
          "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
        dotClass: "bg-amber-500",
      };
    }
    return {
      label: t("filters.inactive"),
      badgeClass:
        "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30",
      dotClass: "bg-rose-500",
    };
  }

  const cleanName = user.name.replace(/\s*\([^)]*\)\s*/g, "").trim() || user.name;
  const nameWords = cleanName.split(/\s+/).filter(Boolean);
  const initials = (
    nameWords.length >= 2
      ? `${nameWords[0][0]}${nameWords[1][0]}`
      : nameWords[0]?.slice(0, 2) || "US"
  ).toUpperCase();

  const roleMeta = getRoleMeta(user.role);
  const statusMeta = getStatusMeta(user.status);
  const isOnline = user.status === "ACTIVE" && user.activeSessions > 0;

  const isValidatorRole = user.role === "ALLY_VALIDATOR";
  const isPlatformRole =
    user.role === "PLATFORM_ADMIN" || user.role === "PLATFORM_ACCOUNTING";

  const scopeLabel = isPlatformRole
    ? `🌐 ${t("filters.globalScope")}`
    : isValidatorRole && user.venueName && user.venueName !== "Toda la Organización"
      ? `📍 ${user.venueName}`
      : `🏢 ${t("filters.allOrg")}`;

  const scopeSubtitle = isPlatformRole
    ? t("table.globalPlatform")
    : isValidatorRole
      ? t("table.specificVenue")
      : t("table.entireOrg");

  const cleanPhone = (user.phone || "").replace(/[^0-9]/g, "");
  const cleanLastSession = formatTime(
    (user.lastSession || "").replace(/\(node\)/gi, "(Web)"),
  );

  return (
    <div
      className="modal-backdrop fixed inset-0 z-50 flex justify-end"
      onClick={onClose}
      id="user-detail-drawer-backdrop"
    >
      <div
        className="w-full max-w-lg bg-surface border-l border-border h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
        id="user-detail-drawer-panel"
      >
        {/* DRAWER HEADER */}
        <div className="flex items-center justify-between border-b border-border p-6 bg-surface">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="relative flex size-12 shrink-0 items-center justify-center rounded-2xl bg-accent/20 border border-accent/30 font-display text-sm font-bold text-foreground">
              {initials}
              <span
                className={`absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-surface ${
                  isOnline
                    ? "bg-emerald-500"
                    : user.status === "INVITATION_PENDING"
                      ? "bg-amber-500"
                      : "bg-zinc-400"
                }`}
              />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-display text-lg font-bold text-foreground truncate">
                  {user.name}
                </h3>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${statusMeta.badgeClass}`}
                >
                  <span className={`size-1.5 rounded-full ${statusMeta.dotClass}`} />
                  {statusMeta.label}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {t("drawer.subtitle")}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-all cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* DRAWER BODY */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* 1. ROLE & AUTHORIZATION SCOPE */}
          <div className="rounded-2xl border border-border bg-muted/40 p-5 space-y-3.5">
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              🛡️ {t("drawer.sectionRoleScope")}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">
                {t("drawer.roleAssigned")}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${roleMeta.badgeClass}`}
              >
                <span>{roleMeta.icon}</span>
                <span>{roleMeta.label}</span>
              </span>
            </div>

            {roleMeta.desc && (
              <p className="rounded-xl border border-border bg-surface p-3 text-xs text-muted-foreground leading-relaxed">
                {roleMeta.desc}
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-border/70 text-xs">
              <div>
                <div className="text-muted-foreground">
                  {t("drawer.scopeAssigned")}
                </div>
                <div className="font-bold text-foreground mt-0.5">
                  {scopeLabel}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">
                  {t("drawer.scopeTypeLabel")}
                </div>
                <div className="font-semibold text-foreground mt-0.5">
                  {scopeSubtitle}
                </div>
              </div>
            </div>
          </div>

          {/* 2. PERSONAL & CONTACT DETAILS */}
          <div className="rounded-2xl border border-border bg-surface p-5 space-y-3.5">
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              👤 {t("drawer.sectionContact")}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <div className="text-muted-foreground">{t("drawer.fullName")}</div>
                <div className="font-bold text-foreground mt-0.5">
                  {user.name}
                </div>
              </div>

              <div>
                <div className="text-muted-foreground">{t("drawer.dniLabel")}</div>
                <div className="font-bold font-mono text-foreground mt-0.5">
                  {user.dni && user.dni !== "N/A"
                    ? user.dni
                    : t("drawer.dniNotRegistered")}
                </div>
              </div>

              <div className="sm:col-span-2">
                <div className="text-muted-foreground">{t("drawer.emailLabel")}</div>
                <div className="font-semibold text-foreground mt-0.5 break-all">
                  {user.email}
                </div>
              </div>

              <div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/70">
                <div>
                  <div className="text-muted-foreground">{t("drawer.phoneLabel")}</div>
                  <div className="font-semibold text-foreground mt-0.5">
                    {user.phone || t("drawer.phoneNotRegistered")}
                  </div>
                </div>

                {cleanPhone && (
                  <a
                    href={`https://wa.me/${cleanPhone}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-all inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>💬</span>
                    <span>{t("drawer.whatsappBtn")}</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* 3. SECURITY & SESSION ACTIVITY */}
          <div className="rounded-2xl border border-border bg-surface p-5 space-y-3.5">
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              🔐 {t("drawer.sectionSecurity")}
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  {t("drawer.activeDevices")}
                </span>
                <span className="font-bold text-foreground">
                  {user.activeSessions > 0
                    ? t("drawer.activeDevicesCount", {
                        count: user.activeSessions,
                      })
                    : t("drawer.noActiveDevices")}
                </span>
              </div>

              <div className="flex items-center justify-between border-t border-border/70 pt-2.5">
                <span className="text-muted-foreground">
                  {t("drawer.lastActivity")}
                </span>
                <span className="font-medium text-foreground text-right">
                  {cleanLastSession}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* DRAWER FOOTER */}
        <div className="border-t border-border bg-muted/50 p-5 flex flex-wrap items-center justify-between gap-3">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
          >
            {t("drawer.btnClose")}
          </Button>

          <div className="flex items-center gap-2">
            {!user.isInvitation && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  onClose();
                  onResetPassword(user);
                }}
                id="drawer-btn-reset-pass"
              >
                🔑 {t("drawer.btnResetPass")}
              </Button>
            )}

            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => {
                onClose();
                onEdit(user);
              }}
              id="drawer-btn-edit-user"
            >
              ✏️ {t("drawer.btnEdit")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

