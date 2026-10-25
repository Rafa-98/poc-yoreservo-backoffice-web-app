"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/shared/ui/button";
import { UsersKpiStrip } from "@/features/users/ui/users-kpi-strip";
import { UsersTable } from "@/features/users/ui/users-table";
import { RbacMatrixTable } from "@/features/users/ui/rbac-matrix-table";
import { ActiveSessionsTable } from "@/features/users/ui/active-sessions-table";
import { InviteUserModal } from "@/features/users/ui/invite-user-modal";
import { EditUserModal } from "@/features/users/ui/edit-user-modal";
import { ResetPasswordModal } from "@/features/users/ui/reset-password-modal";
import { UserDetailDrawer } from "@/features/users/ui/user-detail-drawer";
import { SearchableSelect } from "@/features/users/ui/searchable-select";
import {
  getSessionsAction,
  getUsersAction,
  revokeAllSessionsAction,
  revokeSessionAction,
} from "@/features/users/actions/users-actions";
import { useActiveVenue } from "@/features/venues/context/venue-context";
import {
  deriveOrganizationsFromVenues,
  type VenueItem,
} from "@/features/venues/model/types";
import type {
  ActiveSessionItem,
  UserItem,
  UsersKpi,
} from "@/features/users/model/types";

interface UsersPageProps {
  initialKpi: UsersKpi;
  initialUsers: UserItem[];
  initialSessions: ActiveSessionItem[];
  venues: Array<{
    id: string;
    name: string;
    organizationId?: string;
    organizationName?: string;
    spacesCount?: number;
  }>;
  currentUserRole?: string;
}

export function UsersPage({
  initialUsers,
  initialSessions,
  venues,
  currentUserRole,
}: UsersPageProps) {
  const t = useTranslations("users");
  const locale = useLocale();
  const isEn = locale === "en";

  const {
    activeVenueId,
    activeOrganizationId,
    setActiveOrganizationId: setGlobalOrgId,
    setActiveVenueId: setGlobalVenueId,
  } = useActiveVenue();

  const isAllyRole =
    currentUserRole === "ALLY_ADMIN" ||
    currentUserRole === "ALLY_ACCOUNTING" ||
    currentUserRole === "ALLY_VALIDATOR";

  const organizations = useMemo(
    () => deriveOrganizationsFromVenues(venues as unknown as VenueItem[]),
    [venues],
  );
  const showOrganizationFilter = !isAllyRole && organizations.length > 0;

  const [activeTab, setActiveTab] = useState<"directory" | "matrix" | "sessions">("directory");

  const [users, setUsers] = useState<UserItem[]>(initialUsers);
  const [sessions, setSessions] = useState<ActiveSessionItem[]>(initialSessions);

  // Filter state (placed at top of Directory tab before KPI cards & Table)
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [orgFilter, setOrgFilter] = useState<string>(
    !isAllyRole ? activeOrganizationId || "ALL" : "ALL",
  );
  const [venueFilter, setVenueFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    if (!isAllyRole && activeOrganizationId) {
      setOrgFilter(activeOrganizationId);
    }
  }, [isAllyRole, activeOrganizationId]);

  useEffect(() => {
    if (activeVenueId && activeVenueId !== "ALL") {
      setVenueFilter(activeVenueId);
    } else {
      setVenueFilter("all");
    }
  }, [activeVenueId]);

  // Modals & Drawer state
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [selectedUserForDetail, setSelectedUserForDetail] = useState<UserItem | null>(null);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [resettingUser, setResettingUser] = useState<UserItem | null>(null);

  async function refreshUsers() {
    const res = await getUsersAction();
    if (res.ok && res.data) {
      setUsers(res.data.users);
      if (selectedUserForDetail) {
        const updatedDetail = res.data.users.find((u) => u.id === selectedUserForDetail.id);
        setSelectedUserForDetail(updatedDetail || null);
      }
    }
  }

  async function refreshSessions() {
    const res = await getSessionsAction();
    if (res.ok && res.data) {
      setSessions(res.data);
    }
  }

  async function handleRevokeSession(sessionId: string) {
    const res = await revokeSessionAction(sessionId);
    if (res.ok) {
      await refreshSessions();
      await refreshUsers();
    }
  }

  async function handleRevokeAllSessions() {
    const res = await revokeAllSessionsAction();
    if (res.ok) {
      await refreshSessions();
      await refreshUsers();
    }
  }

  function clearFilters() {
    setSearch("");
    setRoleFilter("all");
    if (showOrganizationFilter) {
      setOrgFilter("ALL");
      setGlobalOrgId?.("ALL");
    }
    setVenueFilter("all");
    setGlobalVenueId?.("ALL");
    setStatusFilter("all");
  }

  const hasActiveFilters =
    search.trim() !== "" ||
    roleFilter !== "all" ||
    (showOrganizationFilter && orgFilter !== "ALL") ||
    venueFilter !== "all" ||
    statusFilter !== "all";

  const scopedVenues = useMemo(() => {
    if (!showOrganizationFilter || !orgFilter || orgFilter === "ALL" || orgFilter === "PLATFORM") {
      return venues;
    }
    return venues.filter((v) => v.organizationId === orgFilter);
  }, [venues, showOrganizationFilter, orgFilter]);

  const scopedVenueIds = useMemo(
    () => new Set(scopedVenues.map((v) => v.id)),
    [scopedVenues],
  );

  // Normalize user scope: only ALLY_VALIDATOR is venue-specific
  const normalizedUsers = useMemo(() => {
    return users.map((u) => {
      if (u.role !== "ALLY_VALIDATOR") {
        const isPlat =
          u.role === "PLATFORM_ADMIN" || u.role === "PLATFORM_ACCOUNTING";
        return {
          ...u,
          scopeType: "ORGANIZATION" as const,
          venueId: null,
          venueName: isPlat
            ? "Global"
            : !isAllyRole && u.organizationName
            ? `${u.organizationName} (${isEn ? "Organization" : "Organización"})`
            : isEn
            ? "Entire Organization"
            : "Toda la Organización",
        };
      }
      return u;
    });
  }, [users, isAllyRole, isEn]);

  const filteredUsers = useMemo(() => {
    return normalizedUsers.filter((u) => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.dni.toLowerCase().includes(q) ||
        (u.phone && u.phone.toLowerCase().includes(q));

      const matchesRole = roleFilter === "all" || u.role === roleFilter;

      let matchesOrg = true;
      if (showOrganizationFilter && orgFilter && orgFilter !== "ALL") {
        if (orgFilter === "PLATFORM") {
          matchesOrg =
            u.role === "PLATFORM_ADMIN" || u.role === "PLATFORM_ACCOUNTING";
        } else {
          matchesOrg =
            u.organizationId === orgFilter ||
            Boolean(u.venueId && scopedVenueIds.has(u.venueId));
        }
      }

      const matchesVenue =
        venueFilter === "all" ||
        (venueFilter === "org-all" && u.scopeType === "ORGANIZATION") ||
        u.venueId === venueFilter;

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "PENDING" && u.status === "INVITATION_PENDING") ||
        u.status === statusFilter;

      return (
        matchesSearch &&
        matchesRole &&
        matchesOrg &&
        matchesVenue &&
        matchesStatus
      );
    });
  }, [
    normalizedUsers,
    search,
    roleFilter,
    showOrganizationFilter,
    orgFilter,
    scopedVenueIds,
    venueFilter,
    statusFilter,
  ]);

  // Compute scope-aware KPIs from the active venue/scope + filtered list
  const kpiStats = useMemo(() => {
    const totalStaff = filteredUsers.length;
    const frontdeskValidators = filteredUsers.filter((u) => u.role === "ALLY_VALIDATOR").length;
    const pendingInvitations = filteredUsers.filter(
      (u) => u.status === "INVITATION_PENDING",
    ).length;
    const activeSessions = filteredUsers.reduce((acc, u) => acc + (u.activeSessions || 0), 0);
    const orgWideStaffCount = filteredUsers.filter(
      (u) => u.scopeType === "ORGANIZATION",
    ).length;
    const venueAssignedStaffCount = filteredUsers.filter(
      (u) => u.scopeType === "VENUE",
    ).length;

    return {
      kpi: {
        totalStaff,
        frontdeskValidators,
        pendingInvitations,
        activeSessions,
      },
      orgWideStaffCount,
      venueAssignedStaffCount,
    };
  }, [filteredUsers]);

  const selectedVenueName = useMemo(() => {
    if (venueFilter === "all" || venueFilter === "org-all") return undefined;
    return venues.find((v) => v.id === venueFilter)?.name;
  }, [venueFilter, venues]);

  const roleOptions = useMemo(() => {
    const base = [
      { value: "all", label: t("filters.allRoles") },
      { value: "ALLY_ADMIN", label: t("roles.ALLY_ADMIN"), icon: "🏢" },
      { value: "ALLY_ACCOUNTING", label: t("roles.ALLY_ACCOUNTING"), icon: "📊" },
      { value: "ALLY_VALIDATOR", label: t("roles.ALLY_VALIDATOR"), icon: "🎟️" },
    ];
    if (!isAllyRole) {
      base.push(
        { value: "PLATFORM_ACCOUNTING", label: t("roles.PLATFORM_ACCOUNTING"), icon: "💳" },
        { value: "PLATFORM_ADMIN", label: t("roles.PLATFORM_ADMIN"), icon: "👑" },
      );
    }
    return base;
  }, [isAllyRole, t]);

  const orgOptions = useMemo(() => {
    return [
      {
        value: "ALL",
        label: isEn ? "All organizations" : "Todas las organizaciones",
        icon: "🌐",
      },
      {
        value: "PLATFORM",
        label: isEn ? "YoReservo Team (Global)" : "Equipo YoReservo (Global)",
        icon: "👑",
      },
      ...organizations.map((org) => ({
        value: org.id,
        label: `${org.tradeName} (${org.venuesCount} ${
          isEn
            ? org.venuesCount === 1
              ? "venue"
              : "venues"
            : org.venuesCount === 1
            ? "sede"
            : "sedes"
        })`,
        icon: "🏢",
      })),
    ];
  }, [organizations, isEn]);

  const venueOptions = useMemo(() => {
    return [
      { value: "all", label: t("filters.allScopes") },
      { value: "org-all", label: t("filters.onlyOrgWide"), icon: "🏢" },
      ...scopedVenues.map((v) => ({
        value: v.id,
        label: v.name,
        icon: "📍",
      })),
    ];
  }, [scopedVenues, t]);

  const statusOptions = useMemo(() => {
    return [
      { value: "all", label: t("filters.allStatus") },
      { value: "ACTIVE", label: t("filters.active"), icon: "🟢" },
      { value: "PENDING", label: t("filters.pending"), icon: "⏳" },
      { value: "INACTIVE", label: t("filters.inactive"), icon: "⚪" },
    ];
  }, [t]);

  return (
    <div className="space-y-0">
      {/* TOP HEADER */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border bg-surface px-6 py-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-bold text-foreground">
              {t("title")}
            </h1>
            <span className="rounded-full bg-blue-500/15 border border-blue-500/30 px-2.5 py-0.5 text-xs font-bold text-blue-400">
              {t("badge")}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>

        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={() => setIsInviteOpen(true)}
          id="btn-topbar-invite"
        >
          + {t("btnInviteUser")}
        </Button>
      </header>

      {/* SUBNAV TABS */}
      <nav className="flex gap-2 border-b border-border bg-surface px-6 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("directory")}
          className={`inline-flex items-center gap-2 border-b-2 py-3.5 px-3 text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "directory"
              ? "border-accent text-foreground font-bold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
          id="tab-btn-directory"
        >
          <span>👥</span>
          <span>{t("tabs.directory")} ({users.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("matrix")}
          className={`inline-flex items-center gap-2 border-b-2 py-3.5 px-3 text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "matrix"
              ? "border-accent text-foreground font-bold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
          id="tab-btn-matrix"
        >
          <span>🛡️</span>
          <span>{t("tabs.matrix")}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("sessions")}
          className={`inline-flex items-center gap-2 border-b-2 py-3.5 px-3 text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "sessions"
              ? "border-accent text-foreground font-bold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
          id="tab-btn-sessions"
        >
          <span>🔐</span>
          <span>{t("tabs.sessions")} ({sessions.length})</span>
        </button>
      </nav>

      {/* MAIN CONTENT AREA */}
      <main className="p-6">
        {activeTab === "directory" && (
          <div className="space-y-6">
            {/* 1. MODERN FILTER BAR FIRST */}
            <section className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-12 items-end">
                {/* Search Input */}
                <div className={showOrganizationFilter ? "md:col-span-3" : "md:col-span-4"}>
                  <label
                    htmlFor="users-search-input"
                    className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5"
                  >
                    🔍 {t("filters.searchPlaceholder")}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder={t("filters.searchPlaceholder")}
                      className="h-10 w-full rounded-xl border border-border bg-surface pl-3.5 pr-8 text-xs text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all"
                      id="users-search-input"
                    />
                    {search && (
                      <button
                        type="button"
                        onClick={() => setSearch("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                        aria-label={isEn ? "Clear search" : "Limpiar búsqueda"}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* Role Filter (SearchableSelect) */}
                <div className={showOrganizationFilter ? "md:col-span-2" : "md:col-span-3"}>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                    🛡️ {t("filters.roleLabel")}
                  </label>
                  <SearchableSelect
                    id="users-role-filter"
                    value={roleFilter}
                    onChange={setRoleFilter}
                    options={roleOptions}
                    searchPlaceholder={t("filters.searchOptionPlaceholder")}
                    emptyText={t("filters.noOptionsFound")}
                  />
                </div>

                {/* Organization Filter (Platform Roles) */}
                {showOrganizationFilter && (
                  <div className="md:col-span-3">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                      🏢 {isEn ? "Organization" : "Organización"}
                    </label>
                    <SearchableSelect
                      id="users-org-filter"
                      value={orgFilter}
                      onChange={(nextOrg) => {
                        setOrgFilter(nextOrg);
                        if (nextOrg !== "PLATFORM") {
                          setGlobalOrgId?.(nextOrg);
                        }
                        setVenueFilter("all");
                        setGlobalVenueId?.("ALL");
                      }}
                      options={orgOptions}
                      searchPlaceholder={isEn ? "Search organization..." : "Buscar organización..."}
                      emptyText={t("filters.noOptionsFound")}
                    />
                  </div>
                )}

                {/* Scope / Venue Filter (SearchableSelect) */}
                <div className={showOrganizationFilter ? "md:col-span-2" : "md:col-span-3"}>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                    📍 {t("filters.scopeLabel")}
                  </label>
                  <SearchableSelect
                    id="users-venue-filter"
                    value={venueFilter}
                    onChange={(nextVenue) => {
                      setVenueFilter(nextVenue);
                      setGlobalVenueId?.(
                        nextVenue === "all" || nextVenue === "org-all"
                          ? "ALL"
                          : nextVenue,
                      );
                    }}
                    options={venueOptions}
                    searchPlaceholder={t("filters.searchOptionPlaceholder")}
                    emptyText={t("filters.noOptionsFound")}
                  />
                </div>

                {/* Status Filter (SearchableSelect) */}
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                    ⚡ {t("filters.statusLabel")}
                  </label>
                  <SearchableSelect
                    id="users-status-filter"
                    value={statusFilter}
                    onChange={setStatusFilter}
                    options={statusOptions}
                    searchPlaceholder={t("filters.searchOptionPlaceholder")}
                    emptyText={t("filters.noOptionsFound")}
                  />
                </div>
              </div>

              {hasActiveFilters && (
                <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-3">
                  <span className="text-xs text-muted-foreground">
                    {t("table.showing")}{" "}
                    <strong className="text-foreground">{filteredUsers.length}</strong>{" "}
                    {t("table.of")}{" "}
                    <strong className="text-foreground">{normalizedUsers.length}</strong>{" "}
                    {t("table.staffUnitPlural")}
                  </span>
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold text-link hover:bg-accent/10 transition-colors cursor-pointer"
                    id="btn-clear-user-filters"
                  >
                    <span>↺</span>
                    <span>{t("filters.clearFilters")}</span>
                  </button>
                </div>
              )}
            </section>

            {/* 2. EXPLICIT SCOPE KPI STRIP */}
            <UsersKpiStrip
              kpi={kpiStats.kpi}
              orgWideStaffCount={kpiStats.orgWideStaffCount}
              venueAssignedStaffCount={kpiStats.venueAssignedStaffCount}
              totalVenuesCount={venues.length}
              selectedScope={venueFilter}
              selectedVenueName={selectedVenueName}
            />

            {/* 3. SIMPLIFIED DIRECTORY TABLE WITH PAGINATION & DETAILS ACTION */}
            <UsersTable
              users={filteredUsers}
              onViewDetails={(u) => setSelectedUserForDetail(u)}
              onEditUser={(u) => setEditingUser(u)}
            />
          </div>
        )}

        {activeTab === "matrix" && (
          <RbacMatrixTable currentUserRole={currentUserRole} />
        )}

        {activeTab === "sessions" && (
          <ActiveSessionsTable
            sessions={sessions}
            onRevokeSession={handleRevokeSession}
            onRevokeAllSessions={handleRevokeAllSessions}
          />
        )}
      </main>

      {/* USER DETAIL DRAWER */}
      <UserDetailDrawer
        isOpen={!!selectedUserForDetail}
        user={selectedUserForDetail}
        onClose={() => setSelectedUserForDetail(null)}
        onEdit={(u) => {
          setSelectedUserForDetail(null);
          setEditingUser(u);
        }}
        onResetPassword={(u) => {
          setSelectedUserForDetail(null);
          setResettingUser(u);
        }}
      />

      {/* MODALS */}
      <InviteUserModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        venues={scopedVenues}
        currentUserRole={currentUserRole}
        onSuccess={async () => {
          await refreshUsers();
        }}
      />

      <EditUserModal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        user={editingUser}
        venues={scopedVenues}
        currentUserRole={currentUserRole}
        onSuccess={async () => {
          await refreshUsers();
        }}
      />

      <ResetPasswordModal
        isOpen={!!resettingUser}
        onClose={() => setResettingUser(null)}
        user={resettingUser}
      />
    </div>
  );
}
