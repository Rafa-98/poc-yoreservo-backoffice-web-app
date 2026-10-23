"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
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
  PanelLeftClose,
  Pin,
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
  isPinned?: boolean;
  onTogglePinned?: () => void;
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
        roles: ["PLATFORM_ADMIN"],
      },
      {
        labelKey: "navCatalogs",
        href: ROUTES.catalogs,
        icon: <BarChart3 className="size-4" />,
        roles: ["PLATFORM_ADMIN"],
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
  isPinned = false,
  onTogglePinned,
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

  const [isHovered, setIsHovered] = useState(false);
  const ignoreHoverUntilLeaveRef = useRef(false);

  // Effective desktop expanded state: open if pinned OR if currently hovered while collapsed
  const isExpanded = isPinned || isHovered;

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

  const cleanLastName = (user.lastName ?? "").replace(/\s*\([^)]*\)\s*/g, "").trim();
  const displayName = `${user.name ?? ""} ${cleanLastName}`.trim() || user.email;
  const nameWords = displayName.split(/\s+/).filter(Boolean);
  const initials =
    (nameWords.length >= 2
      ? `${nameWords[0][0]}${nameWords[1][0]}`
      : nameWords[0]?.slice(0, 2) || "YO"
    ).toUpperCase();

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
        onMouseEnter={() => {
          if (!ignoreHoverUntilLeaveRef.current) {
            setIsHovered(true);
          }
        }}
        onMouseLeave={() => {
          ignoreHoverUntilLeaveRef.current = false;
          setIsHovered(false);
        }}
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-[width,transform,box-shadow] duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } ${isExpanded ? "lg:w-64" : "lg:w-[4.5rem]"} ${
          !isPinned && isHovered ? "lg:shadow-2xl" : ""
        }`}
      >
        {/* Brand Header */}
        <div
          className={`flex h-16 shrink-0 items-center border-b border-sidebar-border transition-all ${
            isExpanded
              ? "justify-between px-4"
              : "justify-between px-5 lg:justify-center lg:px-2"
          }`}
        >
          {/* Expanded Brand Logo (always on mobile, and on desktop when expanded) */}
          <Link
            href={getDefaultRouteForRole(user.role)}
            className={`flex min-w-0 items-center gap-2 ${
              !isExpanded ? "lg:hidden" : ""
            }`}
          >
            <div className="relative h-6 w-24 shrink-0">
              <Image
                src="/yoreservo-logo-transparent.png"
                alt="YoReservo"
                fill
                sizes="96px"
                className="object-contain brightness-0 invert"
                priority
              />
            </div>
            <span className="shrink-0 rounded bg-accent/20 px-1.5 py-0.5 font-display text-[9px] font-extrabold uppercase tracking-wider text-accent border border-accent/30">
              {t("brandBadge")}
            </span>
          </Link>

          {/* Collapsed Icon-Only Brand Monogram (desktop only when collapsed) */}
          {!isExpanded && (
            <Link
              href={getDefaultRouteForRole(user.role)}
              title="YoReservo"
              className="hidden lg:flex size-10 items-center justify-center rounded-xl border border-accent/30 bg-accent/15 font-display text-xs font-black tracking-tight text-accent hover:bg-accent/25 transition-colors"
            >
              YR
            </Link>
          )}

          {/* Desktop Keep Open / Collapse Toggle Button (visible when expanded) */}
          {isExpanded && onTogglePinned && (
            <button
              type="button"
              id="sidebar-pin-toggle"
              onClick={() => {
                if (isPinned) {
                  // Collapsing: immediately collapse even while cursor is still inside sidebar
                  ignoreHoverUntilLeaveRef.current = true;
                  setIsHovered(false);
                }
                onTogglePinned();
              }}
              title={isPinned ? t("collapseMenu") : t("keepMenuOpen")}
              aria-label={isPinned ? t("collapseMenu") : t("keepMenuOpen")}
              className={`hidden lg:inline-flex shrink-0 items-center justify-center gap-1 rounded-lg transition-all cursor-pointer ${
                isPinned
                  ? "size-8 text-sidebar-foreground hover:bg-sidebar-hover hover:text-white"
                  : "border border-accent/40 bg-accent/15 px-2 py-1 text-[10px] font-extrabold text-accent hover:bg-accent hover:text-accent-foreground shadow-xs"
              }`}
            >
              {isPinned ? (
                <PanelLeftClose className="size-4" />
              ) : (
                <>
                  <Pin className="size-3" />
                  <span>{t("keepOpenShort")}</span>
                </>
              )}
            </button>
          )}

          {/* Mobile Close Button */}
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
        <nav
          className={`flex-1 overflow-y-auto overflow-x-hidden py-4 transition-all ${
            isExpanded ? "space-y-5 px-3.5" : "space-y-5 px-3.5 lg:space-y-3 lg:px-2"
          }`}
        >
          {NAV_SECTIONS.map((section, sectionIdx) => {
            // Filter section items by current user's role
            const visibleItems = section.items.filter((item) =>
              item.roles.includes(user.role),
            );

            if (visibleItems.length === 0) return null;

            return (
              <div key={section.titleKey} className="space-y-1">
                {/* Section Header (expanded) or Divider (collapsed on desktop) */}
                <div
                  className={`px-3 text-[10px] font-bold uppercase tracking-wider text-[#697566] whitespace-nowrap ${
                    !isExpanded ? "lg:hidden" : ""
                  }`}
                >
                  {t(section.titleKey as any)}
                </div>

                {!isExpanded && sectionIdx > 0 && (
                  <div className="hidden lg:block mx-auto my-2 h-px w-8 bg-sidebar-border" />
                )}

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

                    const itemLabel = t(item.labelKey as any);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onClose}
                        title={!isExpanded ? itemLabel : undefined}
                        className={`group relative flex items-center rounded-xl text-xs font-semibold transition-all ${
                          isExpanded
                            ? "justify-between px-3 py-2"
                            : "justify-between px-3 py-2 lg:justify-center lg:px-0 lg:py-2.5"
                        } ${
                          isActive
                            ? "bg-sidebar-active text-sidebar-foreground-active shadow-xs"
                            : "text-sidebar-foreground hover:bg-sidebar-hover hover:text-white"
                        }`}
                      >
                        <div
                          className={`flex min-w-0 items-center ${
                            isExpanded ? "gap-3" : "gap-3 lg:gap-0"
                          }`}
                        >
                          <span
                            className={`shrink-0 ${
                              isActive
                                ? "text-accent"
                                : "text-sidebar-foreground group-hover:text-white"
                            }`}
                          >
                            {item.icon}
                          </span>
                          <span
                            className={`truncate whitespace-nowrap ${
                              !isExpanded ? "lg:hidden" : ""
                            }`}
                          >
                            {itemLabel}
                          </span>
                        </div>

                        {itemBadge && (
                          <span
                            className={`rounded-full bg-accent font-mono font-extrabold text-accent-foreground ${
                              isExpanded
                                ? "px-1.5 py-0.2 text-[10px]"
                                : "px-1.5 py-0.2 text-[10px] lg:absolute lg:top-1 lg:right-1.5 lg:px-1 lg:py-0 lg:text-[9px] lg:leading-tight"
                            }`}
                          >
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
        <div
          className={`border-t border-sidebar-border transition-all ${
            isExpanded ? "p-3.5" : "p-3.5 lg:p-2"
          }`}
        >
          <div
            className={`flex items-center rounded-xl bg-sidebar-hover/80 transition-all ${
              isExpanded
                ? "gap-3 p-2.5"
                : "gap-3 p-2.5 lg:flex-col lg:justify-center lg:gap-2 lg:p-2"
            }`}
          >
            <Link
              href={ROUTES.profile}
              title={!isExpanded ? `${displayName} (${friendlyRole})` : undefined}
              className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent/20 font-display text-xs font-bold text-accent border border-accent/25"
            >
              {initials}
            </Link>

            <Link
              href={ROUTES.profile}
              className={`min-w-0 flex-1 ${!isExpanded ? "lg:hidden" : ""}`}
            >
              <div className="text-xs font-bold text-white truncate">
                {displayName}
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
              className="flex size-8 shrink-0 items-center justify-center rounded-lg text-sidebar-foreground hover:bg-status-cancelled-bg/20 hover:text-status-cancelled-fg transition-colors disabled:opacity-50 cursor-pointer"
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
