"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/shared/ui/button";
import { UsersKpiStrip } from "@/features/users/ui/users-kpi-strip";
import { UsersTable } from "@/features/users/ui/users-table";
import { RbacMatrixTable } from "@/features/users/ui/rbac-matrix-table";
import { ActiveSessionsTable } from "@/features/users/ui/active-sessions-table";
import { InviteUserModal } from "@/features/users/ui/invite-user-modal";
import { EditUserModal } from "@/features/users/ui/edit-user-modal";
import { ResetPasswordModal } from "@/features/users/ui/reset-password-modal";
import {
  getSessionsAction,
  getUsersAction,
  revokeAllSessionsAction,
  revokeSessionAction,
} from "@/features/users/actions/users-actions";
import { useActiveVenue } from "@/features/venues/context/venue-context";
import type {
  ActiveSessionItem,
  UserItem,
  UsersKpi,
} from "@/features/users/model/types";

interface UsersPageProps {
  initialKpi: UsersKpi;
  initialUsers: UserItem[];
  initialSessions: ActiveSessionItem[];
  venues: Array<{ id: string; name: string }>;
  currentUserRole?: string;
}

export function UsersPage({
  initialKpi,
  initialUsers,
  initialSessions,
  venues,
  currentUserRole,
}: UsersPageProps) {
  const t = useTranslations("users");

  let activeVenueId = "ALL";
  try {
    const venueCtx = useActiveVenue();
    activeVenueId = venueCtx.activeVenueId;
  } catch {
    // Fallback when rendered outside VenueProvider in isolated tests
  }

  const [activeTab, setActiveTab] = useState<"directory" | "matrix" | "sessions">("directory");

  const [kpi, setKpi] = useState<UsersKpi>(initialKpi);
  const [users, setUsers] = useState<UserItem[]>(initialUsers);
  const [sessions, setSessions] = useState<ActiveSessionItem[]>(initialSessions);

  // Modals state
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [resettingUser, setResettingUser] = useState<UserItem | null>(null);

  async function refreshUsers() {
    const res = await getUsersAction();
    if (res.ok && res.data) {
      setKpi(res.data.kpi);
      setUsers(res.data.users);
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
      <nav className="flex gap-2 border-b border-border bg-surface px-6">
        <button
          type="button"
          onClick={() => setActiveTab("directory")}
          className={`inline-flex items-center gap-2 border-b-2 py-3.5 px-3 text-sm font-semibold transition-all cursor-pointer ${
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
          className={`inline-flex items-center gap-2 border-b-2 py-3.5 px-3 text-sm font-semibold transition-all cursor-pointer ${
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
          className={`inline-flex items-center gap-2 border-b-2 py-3.5 px-3 text-sm font-semibold transition-all cursor-pointer ${
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
            <UsersKpiStrip kpi={kpi} />
            <UsersTable
              users={users}
              venues={venues}
              activeVenueId={activeVenueId}
              onEditUser={(u) => setEditingUser(u)}
              onResetPassword={(u) => setResettingUser(u)}
              onInviteClick={() => setIsInviteOpen(true)}
            />
          </div>
        )}

        {activeTab === "matrix" && <RbacMatrixTable />}

        {activeTab === "sessions" && (
          <ActiveSessionsTable
            sessions={sessions}
            onRevokeSession={handleRevokeSession}
            onRevokeAllSessions={handleRevokeAllSessions}
          />
        )}
      </main>

      {/* MODALS */}
      <InviteUserModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        venues={venues}
        currentUserRole={currentUserRole}
        onSuccess={async () => {
          await refreshUsers();
        }}
      />

      <EditUserModal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        user={editingUser}
        venues={venues}
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
