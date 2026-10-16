"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CalendarPlus,
  ChevronDown,
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

  const getRoleBadge = (role: SessionUser["role"]) => {
    switch (role) {
      case "PLATFORM_ADMIN":
        return {
          label: t("roleAdmin"),
          color: "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30",
        };
      case "PLATFORM_ACCOUNTING":
        return {
          label: t("roleAccounting"),
          color: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
        };
      case "ALLY_ADMIN":
        return {
          label: t("roleAlly"),
          color: "bg-accent/20 text-accent-foreground border-accent/40 font-bold",
        };
      case "ALLY_ACCOUNTING":
        return {
          label: t("roleAllyAccounting"),
          color: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
        };
      case "ALLY_VALIDATOR":
        return {
          label: t("roleValidator"),
          color: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30",
        };
      default:
        return {
          label: role,
          color: "bg-muted text-foreground border-border",
        };
    }
  };

  const roleBadge = getRoleBadge(user.role);
  const initials = `${user.name?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase() || "YO";

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-surface/90 px-4 sm:px-6 backdrop-blur-md">
      {/* LEFT SECTION: Mobile Toggle & Active Venue */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Mobile Hamburger */}
        <button
          type="button"
          onClick={onToggleSidebar}
          className="inline-flex size-9 items-center justify-center rounded-lg border border-border bg-surface text-foreground hover:bg-muted lg:hidden"
          aria-label={t("openMenu")}
        >
          <Menu className="size-5" />
        </button>

        {/* Interactive Multi-Branch Venue Selector (Decoupled v2.0) */}
        <VenueHeaderSelector />

        {/* Static Authenticated Role Badge */}
        <div
          className={`hidden sm:inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${roleBadge.color}`}
          title={`${t("activeRole")}: ${roleBadge.label}`}
        >
          <Shield className="size-3 shrink-0" />
          <span>{roleBadge.label}</span>
        </div>
      </div>

      {/* RIGHT SECTION: Quick Actions, Theme, Lang & Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* QR Check-in Quick CTA (Module 2 / 6) */}
        {(user.role === "ALLY_VALIDATOR" ||
          user.role === "ALLY_ADMIN" ||
          user.role === "PLATFORM_ADMIN") && (
          <Link
            href={`${ROUTES.agenda}?qr=open`}
            className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-border-medium bg-surface px-3 py-2 text-xs font-semibold text-foreground shadow-xs hover:bg-muted active:scale-95 transition-all"
          >
            <QrCode className="size-4 text-foreground" />
            <span className="hidden md:inline">{t("btnScanQr")}</span>
          </Link>
        )}

        {/* New Walk-in Reservation Quick CTA (Module 2) */}
        {(user.role === "ALLY_ADMIN" ||
          user.role === "PLATFORM_ADMIN" ||
          user.role === "ALLY_VALIDATOR") && (
          <Link
            href={`${ROUTES.agenda}?drawer=open`}
            className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-3 py-2 text-xs font-bold text-accent-foreground shadow-xs hover:brightness-105 active:scale-95 transition-all"
          >
            <CalendarPlus className="size-4" />
            <span className="hidden sm:inline">{t("btnNewWalkin")}</span>
          </Link>
        )}

        {/* Time Format, Theme and Language */}
        <TimeFormatToggle />
        <ThemeToggle />
        <LanguageSwitcher />


        {/* User Profile Dropdown */}
        <div className="relative ml-1 sm:ml-2">
          <button
            type="button"
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 rounded-xl p-1 text-left transition-all hover:bg-muted focus:outline-none"
            aria-expanded={isUserMenuOpen}
          >
            <div className="flex size-9 items-center justify-center rounded-lg bg-accent/25 font-display text-xs font-bold text-accent-foreground border border-accent/30">
              {initials}
            </div>
            <div className="hidden text-left xl:block">
              <div className="text-xs font-bold text-foreground leading-tight">
                {user.name} {user.lastName}
              </div>
              <div className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                {user.email}
              </div>
            </div>
            <ChevronDown className="hidden size-3.5 text-muted-foreground xl:block" />
          </button>

          {isUserMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsUserMenuOpen(false)}
              />
              <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-2xl border border-border bg-surface p-1.5 shadow-modal animate-in fade-in zoom-in-95 duration-150">
                <div className="border-b border-border px-3 py-2">
                  <div className="text-xs font-bold text-foreground">
                    {user.name} {user.lastName}
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    {user.email}
                  </div>
                  <div className="mt-1.5 inline-block rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {roleBadge.label}
                  </div>
                </div>

                <div className="py-1">
                  <Link
                    href={ROUTES.profile}
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-foreground hover:bg-muted"
                  >
                    <User className="size-4 text-muted-foreground" />
                    <span>{t("navProfile")}</span>
                  </Link>
                </div>

                <div className="border-t border-border pt-1">
                  <form action={logoutAction}>
                    <button
                      type="submit"
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-status-cancelled-fg hover:bg-status-cancelled-bg transition-colors"
                    >
                      <LogOut className="size-4" />
                      <span>{t("navLogout")}</span>
                    </button>
                  </form>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
