"use server";

import { revalidatePath } from "next/cache";
import { backendRequest } from "@/shared/api/index.server";
import { requireSessionWithToken } from "@/shared/auth/index.server";
import { normalizeBackofficeRole } from "@/shared/config";
import { fail, ok, type ActionResult } from "@/shared/lib";
import type {
  ActiveSessionItem,
  InviteUserInput,
  UpdateUserPrivilegesInput,
  UserItem,
  UserOrganizationOption,
  UserRole,
  UsersKpi,
} from "../model/types";

export async function getUsersAction(filter?: {
  search?: string;
  role?: string;
  venueId?: string;
  status?: string;
}): Promise<
  ActionResult<{
    kpi: UsersKpi;
    users: UserItem[];
    organizations?: UserOrganizationOption[];
  }>
> {
  const { accessToken } = await requireSessionWithToken(["PLATFORM_ADMIN", "ALLY_ADMIN"]);
  try {
    const query = new URLSearchParams();
    if (filter?.search) query.append("search", filter.search);
    if (filter?.role && filter.role !== "all") query.append("role", filter.role);
    if (filter?.venueId && filter.venueId !== "all") query.append("venueId", filter.venueId);
    if (filter?.status && filter.status !== "all") query.append("status", filter.status);

    const queryString = query.toString() ? `?${query.toString()}` : "";
    const res = await backendRequest(`/backoffice/users${queryString}`, {
      method: "GET",
      accessToken,
    });

    if (!res.ok) {
      return fail("USERS_FETCH_FAILED");
    }

    const body = res.body as {
      kpi: UsersKpi;
      users: UserItem[];
      organizations?: UserOrganizationOption[];
    };
    const normalizedUsers = (body?.users ?? []).map((u) => ({
      ...u,
      role: (normalizeBackofficeRole(u.role) ?? u.role) as UserRole,
    }));

    return ok({
      kpi: body.kpi,
      users: normalizedUsers,
      organizations: Array.isArray(body?.organizations)
        ? body.organizations
        : undefined,
    });
  } catch (err: any) {
    return fail(err instanceof Error ? err.message : "USERS_FETCH_FAILED");
  }
}

export async function inviteUserAction(
  input: InviteUserInput
): Promise<ActionResult<any>> {
  const { accessToken } = await requireSessionWithToken(["PLATFORM_ADMIN", "ALLY_ADMIN"]);
  try {
    const res = await backendRequest("/backoffice/users/invite", {
      method: "POST",
      accessToken,
      body: input,
    });

    if (!res.ok) {
      const errBody = res.body as any;
      return fail(errBody?.message || "USER_INVITE_FAILED");
    }

    revalidatePath("/users");
    return ok(res.body);
  } catch (err: any) {
    return fail(err instanceof Error ? err.message : "USER_INVITE_FAILED");
  }
}

export async function updateUserPrivilegesAction(
  id: string,
  input: UpdateUserPrivilegesInput
): Promise<ActionResult<any>> {
  const { accessToken } = await requireSessionWithToken(["PLATFORM_ADMIN", "ALLY_ADMIN"]);
  try {
    const res = await backendRequest(`/backoffice/users/${id}`, {
      method: "PUT",
      accessToken,
      body: input,
    });

    if (!res.ok) {
      const errBody = res.body as any;
      return fail(errBody?.message || "USER_UPDATE_FAILED");
    }

    revalidatePath("/users");
    return ok(res.body);
  } catch (err: any) {
    return fail(err instanceof Error ? err.message : "USER_UPDATE_FAILED");
  }
}

export async function resetPasswordAction(
  id: string,
  newPassword?: string
): Promise<ActionResult<{ tempPassword?: string; message: string }>> {
  const { accessToken } = await requireSessionWithToken(["PLATFORM_ADMIN", "ALLY_ADMIN"]);
  try {
    const res = await backendRequest(`/backoffice/users/${id}/reset-password`, {
      method: "POST",
      accessToken,
      body: { newPassword },
    });

    if (!res.ok) {
      return fail("PASSWORD_RESET_FAILED");
    }

    revalidatePath("/users");
    return ok(res.body as { tempPassword?: string; message: string });
  } catch (err: any) {
    return fail(err instanceof Error ? err.message : "PASSWORD_RESET_FAILED");
  }
}

export async function getSessionsAction(): Promise<ActionResult<ActiveSessionItem[]>> {
  const { accessToken } = await requireSessionWithToken(["PLATFORM_ADMIN", "ALLY_ADMIN"]);
  try {
    const res = await backendRequest("/backoffice/users/sessions", {
      method: "GET",
      accessToken,
    });

    if (!res.ok) {
      return fail("SESSIONS_FETCH_FAILED");
    }

    const sessions = ((res.body as ActiveSessionItem[]) ?? []).map((s) => ({
      ...s,
      role: (normalizeBackofficeRole(s.role) ?? s.role) as UserRole,
    }));

    return ok(sessions);
  } catch (err: any) {
    return fail(err instanceof Error ? err.message : "SESSIONS_FETCH_FAILED");
  }
}

export async function revokeSessionAction(sessionId: string): Promise<ActionResult<{ success: boolean }>> {
  const { accessToken } = await requireSessionWithToken(["PLATFORM_ADMIN", "ALLY_ADMIN"]);
  try {
    const res = await backendRequest(`/backoffice/users/sessions/${sessionId}`, {
      method: "DELETE",
      accessToken,
    });

    if (!res.ok) {
      return fail("SESSION_REVOKE_FAILED");
    }

    revalidatePath("/users");
    return ok({ success: true });
  } catch (err: any) {
    return fail(err instanceof Error ? err.message : "SESSION_REVOKE_FAILED");
  }
}

export async function revokeAllSessionsAction(): Promise<ActionResult<{ success: boolean }>> {
  const { accessToken } = await requireSessionWithToken(["PLATFORM_ADMIN", "ALLY_ADMIN"]);
  try {
    const res = await backendRequest("/backoffice/users/sessions", {
      method: "DELETE",
      accessToken,
    });

    if (!res.ok) {
      return fail("SESSIONS_REVOKE_ALL_FAILED");
    }

    revalidatePath("/users");
    return ok({ success: true });
  } catch (err: any) {
    return fail(err instanceof Error ? err.message : "SESSIONS_REVOKE_ALL_FAILED");
  }
}
