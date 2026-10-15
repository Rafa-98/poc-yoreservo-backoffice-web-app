import React from "react";
import { Metadata } from "next";
import { requireSession } from "@/shared/auth/index.server";
import { ROUTE_ALLOWED_ROLES, ROUTES } from "@/shared/config";
import { getSessionsAction, getUsersAction } from "@/features/users/actions/users-actions";
import { getVenuesListAction } from "@/features/venues/actions/venues-actions";
import { UsersPage } from "@/_pages/users/users-page";

export const metadata: Metadata = {
  title: "Equipo & Control de Acceso RBAC | YoReservo Backoffice",
  description:
    "Gestión de equipo, colaboradores, roles RBAC y sesiones activas en la red deportiva YoReservo.",
};

export default async function Page() {
  const session = await requireSession(ROUTE_ALLOWED_ROLES[ROUTES.users]);

  const [usersRes, sessionsRes, venuesRes] = await Promise.all([
    getUsersAction(),
    getSessionsAction(),
    getVenuesListAction(),
  ]);

  const kpi = usersRes.ok && usersRes.data
    ? usersRes.data.kpi
    : {
        totalStaff: 0,
        frontdeskValidators: 0,
        pendingInvitations: 0,
        activeSessions: 0,
      };

  const users = usersRes.ok && usersRes.data ? usersRes.data.users : [];
  const sessions = sessionsRes.ok && sessionsRes.data ? sessionsRes.data : [];
  const venues = venuesRes.ok && venuesRes.data
    ? venuesRes.data.map((v) => ({ id: v.id, name: v.name }))
    : [];

  return (
    <UsersPage
      initialKpi={kpi}
      initialUsers={users}
      initialSessions={sessions}
      venues={venues}
      currentUserRole={session.user.role}
    />
  );
}
