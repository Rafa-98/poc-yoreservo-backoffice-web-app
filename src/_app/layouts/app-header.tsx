"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  CalendarPlus,
  ChevronDown,
  Loader2,
  LogOut,
  Menu,
  QrCode,
  Shield,
  User,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { SessionUser } from "@/shared/auth";
import { ROUTES } from "@/shared/config";
import { ThemeToggle } from "@/shared/ui/theme-toggle";
import { LanguageSwitcher } from "@/shared/ui/language-switcher";
import { PwaInstallMenuItem } from "@/shared/ui/pwa-register";
import { TimeFormatToggle } from "@/shared/lib";
import { logoutAction } from "@/features/auth/actions/logout-action";
import { VenueHeaderSelector } from "@/features/venues/ui/venue-header-selector";

export interface AppHeaderProps {
  user: SessionUser;
  onToggleSidebar: () => void;
  activeVenueName?: string;
}

export function AppHeader({
  user,
  onToggleSidebar,
}: AppHeaderProps) {
  const t = useTranslations("shell");
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isLoggingOut, startLogoutTransition] = useTransition();

  const getRoleBadge = (role: SessionUser["role"]) => {
    switch (role) {
      case "PLATFORM_ADMIN":
        return {
          label: t("roleAdmin"),
          color: "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30",
          dotColor: "bg-purple-500",
        };
      case "PLATFORM_ACCOUNTING":
        return {
          label: t("roleAccounting"),
          color: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
          dotColor: "bg-emerald-500",
        };
      case "ALLY_ADMIN":
        return {
          label: t("roleAlly"),
          color: "bg-accent/20 text-accent-foreground border-accent/40 font-bold",
          dotColor: "bg-accent",
        };
      case "ALLY_ACCOUNTING":
        return {
          label: t("roleAllyAccounting"),
          color: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
          dotColor: "bg-amber-500",
        };
      case "ALLY_VALIDATOR":
        return {
          label: t("roleValidator"),
          color: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30",
          dotColor: "bg-blue-500",
        };
      default:
        return {
          label: role,
          color: "bg-muted text-foreground border-border",
          dotColor: "bg-muted-foreground",
        };
    }
  };

  const roleBadge = getRoleBadge(user.role);
  const cleanLastName = (user.lastName ?? "").replace(/\s*\([^)]*\)\s*/g, "").trim();
  const displayName = `${user.name ?? ""} ${cleanLastName}`.trim() || user.email;
  const initials =
    `${user.name?.[0] ?? ""}${cleanLastName?.[0] ?? user.lastName?.[0] ?? ""}`.toUpperCase() ||
    "YO";

  const canOperateBookings =
    user.role === "ALLY_VALIDATOR" ||
    user.role === "ALLY_ADMIN" ||
    user.role === "PLATFORM_ADMIN";

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between gap-4 border-b border-border bg-surface/95 px-4 sm:px-6 backdrop-blur-md">
      {/* LEFT SECTION: Mobile Toggle & Active Venue Context */}
      <div className="flex min-w-0 items-center gap-3">
        {/* Mobile Hamburger */}
        <button
          type="button"
          onClick={onToggleSidebar}
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl border border-border bg-surface text-foreground hover:bg-muted lg:hidden"
          aria-label={t("openMenu")}
        >
          <Menu className="size-5" />
        </button>

        {/* Interactive Multi-Branch Venue Selector */}
        <VenueHeaderSelector />
      </div>

      {/* RIGHT SECTION: Grouped Quick Actions, Preferences & User Profile */}
      <div className="flex shrink-0 items-center gap-2.5 sm:gap-3.5">
        {/* CLUSTER 1: Operational Quick Actions */}
        {canOperateBookings && (
          <div className="flex items-center gap-2">
            <Link
              href={`${ROUTES.agenda}?qr=open`}
              className="hidden sm:inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl border border-border bg-surface px-3 text-xs font-semibold text-foreground shadow-2xs hover:bg-muted active:scale-95 transition-all"
            >
              <QrCode className="size-3.5 text-muted-foreground shrink-0" />
              <span>{t("btnScanQr")}</span>
            </Link>

            <Link
              href={`${ROUTES.agenda}?drawer=open`}
              className="inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl bg-accent px-3.5 text-xs font-bold text-accent-foreground shadow-2xs hover:brightness-105 active:scale-95 transition-all"
            >
              <CalendarPlus className="size-3.5 shrink-0" />
              <span className="hidden sm:inline">{t("btnNewWalkin")}</span>
            </Link>
          </div>
        )}

        {/* DIVIDER */}
        <div
          aria-hidden="true"
          className="hidden md:block h-5 w-px bg-border"
        />

        {/* CLUSTER 2: Display & Locale Preferences */}
        <div className="hidden md:flex items-center gap-1.5">
          <TimeFormatToggle />
          <LanguageSwitcher />
          <ThemeToggle />
        </div>

        {/* DIVIDER */}
        <div
          aria-hidden="true"
          className="hidden md:block h-5 w-px bg-border"
        />

        {/* CLUSTER 3: User Profile Pill */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex h-10 shrink-0 items-center gap-2.5 rounded-xl border border-transparent px-2 py-1 text-left transition-all hover:border-border hover:bg-muted/60 focus:outline-none"
            aria-expanded={isUserMenuOpen}
          >
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent/25 font-display text-xs font-bold text-accent-foreground border border-accent/30">
              {initials}
            </div>
            <div className="hidden text-left lg:block">
              <div className="max-w-[140px] truncate whitespace-nowrap text-xs font-bold text-foreground leading-tight">
                {displayName}
              </div>
              <div className="mt-0.5 flex items-center gap-1 text-[10px] font-semibold text-muted-foreground whitespace-nowrap">
                <Shield className="size-2.5 text-accent-foreground shrink-0" />
                <span>{roleBadge.label}</span>
              </div>
            </div>
            <ChevronDown
              className={`hidden size-3.5 shrink-0 text-muted-foreground transition-transform duration-200 lg:block ${
                isUserMenuOpen ? "rotate-180 text-foreground" : ""
              }`}
            />
          </button>

          {isUserMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsUserMenuOpen(false)}
              />
              <div className="absolute right-0 top-full z-50 mt-2 w-60 rounded-2xl border border-border bg-surface p-1.5 shadow-modal animate-in fade-in zoom-in-95 duration-150">
                <div className="border-b border-border px-3 py-2.5">
                  <div className="text-xs font-bold text-foreground">
                    {user.name} {user.lastName}
                  </div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground truncate">
                    {user.email}
                  </div>
                  <div
                    className={`mt-2 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${roleBadge.color}`}
                  >
                    <Shield className="size-2.5 shrink-0" />
                    <span>{roleBadge.label}</span>
                  </div>
                </div>

                {/* Mobile-only preferences inside menu */}
                <div className="flex items-center justify-between gap-1.5 border-b border-border px-2.5 py-2 md:hidden">
                  <TimeFormatToggle size="xs" />
                  <div className="flex items-center gap-1">
                    <LanguageSwitcher />
                    <ThemeToggle />
                  </div>
                </div>

                <div className="py-1 space-y-0.5">
                  <Link
                    href={ROUTES.profile}
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                  >
                    <User className="size-4 text-muted-foreground shrink-0" />
                    <span>{t("navProfile")}</span>
                  </Link>

                  <PwaInstallMenuItem
                    onAfterClick={() => setIsUserMenuOpen(false)}
                  />
                </div>

                <div className="border-t border-border pt-1">
                  <button
                    type="button"
                    disabled={isLoggingOut}
                    onClick={() => {
                      startLogoutTransition(async () => {
                        await logoutAction();
                      });
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-status-cancelled-fg hover:bg-status-cancelled-bg transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {isLoggingOut ? (
                      <Loader2 className="size-4 shrink-0 animate-spin" />
                    ) : (
                      <LogOut className="size-4 shrink-0" />
                    )}
                    <span>{t("navLogout")}</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
