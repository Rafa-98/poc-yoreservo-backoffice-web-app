"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { backendRequest } from "@/shared/api/index.server";
import { ACCESS_COOKIE_NAME } from "@/shared/auth";
import { requireSession } from "@/shared/auth/index.server";
import { fail, ok, type ActionResult } from "@/shared/lib";
import type {
  ActiveSessionItem,
  InviteUserInput,
  UpdateUserPrivilegesInput,
  UserItem,
  UsersKpi,
} from "../model/types";

async function getAuthToken(): Promise<string> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ACCESS_COOKIE_NAME)?.value;
  if (!token) throw new Error("Unauthorized");
  return token;
}

export async function getUsersAction(filter?: {
  search?: string;
  role?: string;
  venueId?: string;
  status?: string;
}): Promise<ActionResult<{ kpi: UsersKpi; users: UserItem[] }>> {
  try {
    await requireSession();
    const accessToken = await getAuthToken();

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

    return ok(res.body as { kpi: UsersKpi; users: UserItem[] });
  } catch (err: any) {
    return fail(err instanceof Error ? err.message : "USERS_FETCH_FAILED");
  }
}

export async function inviteUserAction(
  input: InviteUserInput
): Promise<ActionResult<any>> {
  try {
    await requireSession();
    const accessToken = await getAuthToken();

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
  try {
    await requireSession();
    const accessToken = await getAuthToken();

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
  try {
    await requireSession();
    const accessToken = await getAuthToken();

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
  try {
    await requireSession();
    const accessToken = await getAuthToken();

    const res = await backendRequest("/backoffice/users/sessions", {
      method: "GET",
      accessToken,
    });

    if (!res.ok) {
      return fail("SESSIONS_FETCH_FAILED");
    }

    return ok(res.body as ActiveSessionItem[]);
  } catch (err: any) {
    return fail(err instanceof Error ? err.message : "SESSIONS_FETCH_FAILED");
  }
}

export async function revokeSessionAction(sessionId: string): Promise<ActionResult<{ success: boolean }>> {
  try {
    await requireSession();
    const accessToken = await getAuthToken();

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
  try {
    await requireSession();
    const accessToken = await getAuthToken();

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
