"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useTransition,
  type ReactNode,
} from "react";
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
  Landmark,
  Layers,
  LayoutDashboard,
  LifeBuoy,
  Loader2,
  LogOut,
  Settings2,
  TrendingUp,
  User,
  Users2,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { SessionUser } from "@/shared/auth";
import {
  getDefaultRouteForRole,
  ROUTE_ALLOWED_ROLES,
  ROUTES,
  type BackofficeRole,
} from "@/shared/config";
import { logoutAction } from "@/features/auth/actions/logout-action";
import { getPaymentsInboxAction } from "@/features/treasury/actions/treasury-actions";
import { useActiveVenue } from "@/features/venues/context/venue-context";

interface SidebarBadgeContextValue {
  pendingPaymentsCount: number | undefined;
  setPendingPaymentsCount: (count: number) => void;
}

const SidebarBadgeContext = createContext<SidebarBadgeContextValue>({
  pendingPaymentsCount: undefined,
  setPendingPaymentsCount: () => {},
});

export function useSidebarBadge() {
  return useContext(SidebarBadgeContext);
}

export function SidebarBadgeProvider({
  pendingPaymentsCount,
  children,
}: {
  pendingPaymentsCount?: number;
  children: ReactNode;
}) {
  const [count, setCount] = useState<number | undefined>(pendingPaymentsCount);

  useEffect(() => {
    setCount(pendingPaymentsCount);
  }, [pendingPaymentsCount]);

  return (
    <SidebarBadgeContext.Provider
      value={{
        pendingPaymentsCount: count,
        setPendingPaymentsCount: setCount,
      }}
    >
      {children}
    </SidebarBadgeContext.Provider>
  );
}

export interface AppSidebarProps {
  user: SessionUser;
  isOpen: boolean;
  onClose: () => void;
  pendingPaymentsCount?: number;
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
        roles: [
          "PLATFORM_ADMIN",
          "ALLY_ADMIN",
        ],
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
        roles: [
          "PLATFORM_ADMIN",
          "ALLY_ADMIN",
          "ALLY_VALIDATOR",
        ],
      },
      {
        labelKey: "navReservations",
        href: ROUTES.reservations,
        icon: <Layers className="size-4" />,
        roles: [
          "PLATFORM_ADMIN",
          "ALLY_ADMIN",
          "ALLY_VALIDATOR",
        ],
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
        roles: [
          "PLATFORM_ADMIN",
          "PLATFORM_ACCOUNTING",
          "ALLY_ADMIN",
          "ALLY_ACCOUNTING",
        ],
      },
      {
        labelKey: "navRate",
        href: ROUTES.exchangeRate,
        icon: <TrendingUp className="size-4" />,
        roles: [
          "PLATFORM_ADMIN",
          "PLATFORM_ACCOUNTING",
          "ALLY_ADMIN",
          "ALLY_ACCOUNTING",
        ],
      },
      {
        labelKey: "navSettlements",
        href: ROUTES.settlements,
        icon: <Banknote className="size-4" />,
        roles: [
          "PLATFORM_ADMIN",
          "PLATFORM_ACCOUNTING",
          "ALLY_ADMIN",
          "ALLY_ACCOUNTING",
        ],
      },
    ],
  },
  {
    titleKey: "navFacilities",
    items: [
      {
        labelKey: "navOrganization",
        href: ROUTES.organization,
        icon: <Landmark className="size-4" />,
        roles: [
          "PLATFORM_ADMIN",
          "PLATFORM_ACCOUNTING",
          "ALLY_ADMIN",
          "ALLY_ACCOUNTING",
        ],
      },
      {
        labelKey: "navVenues",
        href: ROUTES.venues,
        icon: <Building2 className="size-4" />,
        roles: ["PLATFORM_ADMIN", "ALLY_ADMIN"],
      },
      {
        labelKey: "navSpaces",
        href: ROUTES.spaces,
        icon: <Settings2 className="size-4" />,
        roles: ["PLATFORM_ADMIN", "ALLY_ADMIN"],
      },
      {
        labelKey: "navSchedules",
        href: ROUTES.schedules,
        icon: <Clock className="size-4" />,
        roles: ["PLATFORM_ADMIN", "ALLY_ADMIN"],
      },
      {
        labelKey: "navStaff",
        href: ROUTES.users,
        icon: <Users2 className="size-4" />,
        roles: ["PLATFORM_ADMIN", "ALLY_ADMIN"],
      },
    ],
  },
  {
    titleKey: "navSystem",
    items: [
      {
        labelKey: "navSupport",
        href: ROUTES.support,
        icon: <LifeBuoy className="size-4" />,
        roles: ["PLATFORM_ADMIN", "ALLY_ADMIN"],
      },
      {
        labelKey: "navCatalogs",
        href: ROUTES.catalogs,
        icon: <BarChart3 className="size-4" />,
        roles: ["PLATFORM_ADMIN", "ALLY_ADMIN"],
      },
      {
        labelKey: "navProfile",
        href: ROUTES.profile,
        icon: <User className="size-4" />,
        roles: [
          "PLATFORM_ADMIN",
          "PLATFORM_ACCOUNTING",
          "ALLY_ADMIN",
          "ALLY_ACCOUNTING",
          "ALLY_VALIDATOR",
        ],
      },
    ],
  },
];

export function AppSidebar({
  user,
  isOpen,
  onClose,
  pendingPaymentsCount,
}: AppSidebarProps) {
  const t = useTranslations("shell");
  const pathname = usePathname();
  const { activeVenueId } = useActiveVenue();
  const {
    pendingPaymentsCount: contextPendingCount,
    setPendingPaymentsCount,
  } = useContext(SidebarBadgeContext);
  const resolvedPendingCount = pendingPaymentsCount ?? contextPendingCount;
  const [isLoggingOut, startLogoutTransition] = useTransition();

  useEffect(() => {
    if (!ROUTE_ALLOWED_ROLES[ROUTES.paymentsInbox].includes(user.role)) {
      return;
    }
    // On /treasury/payments, PaymentsInboxPage manages the badge directly with its active filters
    if (pathname === ROUTES.paymentsInbox) {
      return;
    }

    let cancelled = false;
    const todayIso = new Intl.DateTimeFormat("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: "America/Caracas",
    }).format(new Date());
    const fromDateObj = new Date(`${todayIso}T12:00:00Z`);
    fromDateObj.setUTCDate(fromDateObj.getUTCDate() - 6);
    const fromDateIso = fromDateObj.toISOString().slice(0, 10);

    getPaymentsInboxAction({
      status: "PENDING",
      venueId:
        activeVenueId && activeVenueId !== "ALL" ? activeVenueId : undefined,
      fromDate: fromDateIso,
      toDate: todayIso,
    }).then((res) => {
      if (!cancelled && res.ok && res.data) {
        const count = (res.data.items ?? []).filter(
          (p) => p.status === "PENDING",
        ).length;
        setPendingPaymentsCount(count);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [activeVenueId, pathname, user.role, setPendingPaymentsCount]);

  const firstInit =
    user.name?.replace(/[^a-zA-ZÀ-ÿ]/g, "")?.[0]?.toUpperCase() ?? "";
  const secondInit =
    user.lastName?.replace(/[^a-zA-ZÀ-ÿ]/g, "")?.[0]?.toUpperCase() ?? "";
  const initials = `${firstInit}${secondInit}` || "YO";

  const roleTranslationKeyMap: Record<BackofficeRole, string> = {
    PLATFORM_ADMIN: "roleAdmin",
    PLATFORM_ACCOUNTING: "roleAccounting",
    ALLY_ADMIN: "roleAlly",
    ALLY_ACCOUNTING: "roleAllyAccounting",
    ALLY_VALIDATOR: "roleValidator",
  };
  const friendlyRole = roleTranslationKeyMap[user.role]
    ? t(roleTranslationKeyMap[user.role] as any)
    : user.role;

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
          <Link
            href={getDefaultRouteForRole(user.role)}
            className="flex items-center gap-2.5"
          >
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
            aria-label={t("closeMenu")}
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
                        item.href !== ROUTES.venues &&
                        pathname.startsWith(`${item.href}/`));

                    const itemBadge =
                      item.href === ROUTES.paymentsInbox
                        ? resolvedPendingCount && resolvedPendingCount > 0
                          ? String(resolvedPendingCount)
                          : undefined
                        : item.badge;

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

                        {itemBadge && (
                          <span className="rounded-full bg-accent px-1.5 py-0.2 font-mono text-[10px] font-extrabold text-accent-foreground">
                            {itemBadge}
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
                {friendlyRole}
              </div>
            </Link>

            <button
              type="button"
              disabled={isLoggingOut}
              onClick={() => {
                startLogoutTransition(async () => {
                  await logoutAction();
                });
              }}
              title={t("navLogout")}
              className="flex size-8 items-center justify-center rounded-lg text-sidebar-foreground hover:bg-status-cancelled-bg/20 hover:text-status-cancelled-fg transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isLoggingOut ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <LogOut className="size-4" />
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
