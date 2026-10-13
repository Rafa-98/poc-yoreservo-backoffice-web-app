"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Banknote,
  BarChart3,
  Building2,
  Calendar,
  Clock,
  CreditCard,
  Layers,
  LayoutDashboard,
  LogOut,
  Settings2,
  TrendingUp,
  User,
  Users2,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { SessionUser } from "@/shared/auth";
import { ROUTES, type BackofficeRole } from "@/shared/config";
import { logoutAction } from "@/features/auth/actions/logout-action";

export interface AppSidebarProps {
  user: SessionUser;
  isOpen: boolean;
  onClose: () => void;
}

interface NavItemDef {
  labelKey: string;
  href: string;
  icon: ReactNode;
  roles: readonly BackofficeRole[];
  badge?: string;
}

interface NavSectionDef {
  titleKey: string;
  items: readonly NavItemDef[];
}

const NAV_SECTIONS: readonly NavSectionDef[] = [
  {
    titleKey: "navOverview",
    items: [
      {
        labelKey: "navDashboard",
        href: ROUTES.dashboard,
        icon: <LayoutDashboard className="size-4" />,
        roles: ["ADMIN", "ALLY", "ACCOUNTING"],
      },
    ],
  },
  {
    titleKey: "navOps",
    items: [
      {
        labelKey: "navAgenda",
        href: ROUTES.agenda,
        icon: <Calendar className="size-4" />,
        roles: ["ADMIN", "ALLY", "VALIDATOR"],
      },
      {
        labelKey: "navReservations",
        href: ROUTES.reservations,
        icon: <Layers className="size-4" />,
        roles: ["ADMIN", "ALLY", "VALIDATOR", "ACCOUNTING"],
      },
    ],
  },
  {
    titleKey: "navFinance",
    items: [
      {
        labelKey: "navReconciliation",
        href: ROUTES.paymentsInbox,
        icon: <CreditCard className="size-4" />,
        badge: "3",
        roles: ["ADMIN", "ALLY", "ACCOUNTING"],
      },
      {
        labelKey: "navRate",
        href: ROUTES.exchangeRate,
        icon: <TrendingUp className="size-4" />,
        roles: ["ADMIN", "ALLY", "ACCOUNTING"],
      },
      {
        labelKey: "navSettlements",
        href: ROUTES.settlements,
        icon: <Banknote className="size-4" />,
        roles: ["ADMIN", "ALLY", "ACCOUNTING"],
      },
    ],
  },
  {
    titleKey: "navFacilities",
    items: [
      {
        labelKey: "navVenues",
        href: ROUTES.venues,
        icon: <Building2 className="size-4" />,
        roles: ["ADMIN", "ALLY", "ACCOUNTING"],
      },
      {
        labelKey: "navSpaces",
        href: ROUTES.spaces,
        icon: <Settings2 className="size-4" />,
        roles: ["ADMIN", "ALLY", "ACCOUNTING"],
      },
      {
        labelKey: "navSchedules",
        href: ROUTES.schedules,
        icon: <Clock className="size-4" />,
        roles: ["ADMIN", "ALLY", "ACCOUNTING"],
      },
      {
        labelKey: "navStaff",
        href: ROUTES.users,
        icon: <Users2 className="size-4" />,
        roles: ["ADMIN", "ALLY"],
      },
    ],
  },
  {
    titleKey: "navSystem",
    items: [
      {
        labelKey: "navCatalogs",
        href: ROUTES.catalogs,
        icon: <BarChart3 className="size-4" />,
        roles: ["ADMIN", "ALLY"],
      },
      {
        labelKey: "navProfile",
        href: ROUTES.profile,
        icon: <User className="size-4" />,
        roles: ["ADMIN", "ALLY", "VALIDATOR", "ACCOUNTING"],
      },
    ],
  },
];

export function AppSidebar({ user, isOpen, onClose }: AppSidebarProps) {
  const t = useTranslations("shell");
  const pathname = usePathname();

  const initials = `${user.name?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase() || "YO";

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-64 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-5 border-b border-sidebar-border">
          <Link href={ROUTES.dashboard} className="flex items-center gap-2.5">
            <div className="relative h-7 w-28">
              <Image
                src="/yoreservo-logo-transparent.png"
                alt="YoReservo"
                fill
                className="object-contain brightness-0 invert"
                priority
              />
            </div>
            <span className="rounded bg-accent/20 px-1.5 py-0.5 font-display text-[10px] font-extrabold uppercase tracking-wider text-accent border border-accent/30">
              {t("brandBadge")}
            </span>
          </Link>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-8 items-center justify-center rounded-lg text-sidebar-foreground hover:bg-sidebar-hover lg:hidden"
            aria-label="Cerrar menú"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 space-y-6 overflow-y-auto px-3.5 py-5">
          {NAV_SECTIONS.map((section) => {
            // Filter section items by current user's role
            const visibleItems = section.items.filter((item) =>
              item.roles.includes(user.role),
            );

            if (visibleItems.length === 0) return null;

            return (
              <div key={section.titleKey} className="space-y-1">
                <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#697566]">
                  {t(section.titleKey as any)}
                </div>

                <div className="space-y-0.5">
                  {visibleItems.map((item) => {
                    const isActive =
                      pathname === item.href ||
                      (item.href !== ROUTES.dashboard &&
                        pathname.startsWith(`${item.href}/`));

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onClose}
                        className={`group flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                          isActive
                            ? "bg-sidebar-active text-sidebar-foreground-active shadow-xs"
                            : "text-sidebar-foreground hover:bg-sidebar-hover hover:text-white"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={
                              isActive
                                ? "text-accent"
                                : "text-sidebar-foreground group-hover:text-white"
                            }
                          >
                            {item.icon}
                          </span>
                          <span>{t(item.labelKey as any)}</span>
                        </div>

                        {item.badge && (
                          <span className="rounded-full bg-accent px-1.5 py-0.2 font-mono text-[10px] font-extrabold text-accent-foreground">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* User Card Footer */}
        <div className="border-t border-sidebar-border p-3.5">
          <div className="flex items-center gap-3 rounded-xl bg-sidebar-hover/80 p-2.5">
            <Link
              href={ROUTES.profile}
              className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent/20 font-display text-xs font-bold text-accent border border-accent/25"
            >
              {initials}
            </Link>

            <Link href={ROUTES.profile} className="min-w-0 flex-1">
              <div className="text-xs font-bold text-white truncate">
                {user.name} {user.lastName}
              </div>
              <div className="text-[10px] text-accent font-medium truncate">
                {user.role}
              </div>
            </Link>

            <form action={logoutAction}>
              <button
                type="submit"
                title={t("navLogout")}
                className="flex size-8 items-center justify-center rounded-lg text-sidebar-foreground hover:bg-status-cancelled-bg/20 hover:text-status-cancelled-fg transition-colors"
              >
                <LogOut className="size-4" />
              </button>
            </form>
          </div>
        </div>
      </aside>
    </>
  );
}
