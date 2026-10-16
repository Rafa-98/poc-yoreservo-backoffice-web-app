"use server";

import { revalidatePath } from "next/cache";
import { backendRequest } from "@/shared/api/index.server";
import {
  getRefreshToken,
  requireSessionWithToken,
  setAuthCookies,
} from "@/shared/auth/index.server";
import { refreshTokens } from "@/shared/auth/token-refresh";
import { fail, ok, type ActionResult } from "@/shared/lib";
import {
  getDefaultRouteForRole,
  ROUTES,
  type BackofficeRole,
} from "@/shared/config";
import type {
  ChangePasswordInput,
  ProfileSessionItem,
  UpdateProfileInput,
  UserProfileData,
} from "../model/types";

const CURRENT_SESSION_FALLBACK: ProfileSessionItem = {
  id: "current-session-id",
  deviceIp: "—",
  userAgent: "Sesión Actual",
  deviceLabel: "Sesión Actual",
  deviceType: "desktop",
  location: "—",
  lastActiveText: "Activo ahora",
  isCurrent: true,
  createdAt: new Date().toISOString(),
};

function enrichSession(s: any): ProfileSessionItem {
  const ua = s.userAgent || "";
  let deviceLabel = ua || "Navegador Web";
  let deviceType: "desktop" | "mobile" | "tablet" = "desktop";

  if (ua.includes("iPhone")) {
    deviceLabel = "Safari en iPhone";
    deviceType = "mobile";
  } else if (ua.includes("Android")) {
    deviceLabel = "Chrome en Android";
    deviceType = "mobile";
  } else if (ua.includes("Macintosh") || ua.includes("Mac OS")) {
    deviceLabel = "Chrome en macOS";
    deviceType = "desktop";
  } else if (ua.includes("Windows")) {
    deviceLabel = "Google Chrome en Windows";
    deviceType = "desktop";
  }

  return {
    id: s.id,
    deviceIp: s.deviceIp || "—",
    userAgent: s.userAgent || deviceLabel,
    deviceLabel,
    deviceType,
    location: s.location || "—",
    lastActiveText: s.isCurrent ? "Activo ahora" : "Reciente",
    isCurrent: !!s.isCurrent,
    createdAt: s.createdAt ? new Date(s.createdAt).toISOString() : new Date().toISOString(),
    rotatedAt: s.rotatedAt,
  };
}

export async function getProfileAction(): Promise<UserProfileData> {
  const { user, accessToken } = await requireSessionWithToken();

  try {
    const res = await backendRequest("/backoffice/profile", {
      method: "GET",
      accessToken,
    });

    if (res.ok && res.body) {
      const data = res.body as any;
      const rawSessions: any[] = data.sessions || [];
      const mappedSessions = rawSessions.map(enrichSession);
      const allSessions =
        mappedSessions.length > 0 ? mappedSessions : [CURRENT_SESSION_FALLBACK];

      const effectiveRole = String(data.role || user.role || "");
      const isPlatformRole = effectiveRole.startsWith("PLATFORM_");

      const resolvedOrganization =
        data.organization ??
        (isPlatformRole ? "YoReservo (Plataforma Central)" : "Sin asignar");

      const resolvedManagedVenue =
        data.managedVenue ??
        (isPlatformRole
          ? "Todas las Sedes (Global)"
          : data.organization?.tradeName || "Sin asignar");

      return {
        id: data.id || user.id,
        name: data.name || user.name,
        lastName: data.lastName || user.lastName || "",
        fullName: data.fullName || `${user.name} ${user.lastName || ""}`.trim(),
        email: data.email || user.email,
        documentType: data.documentType || "V",
        documentNumber: data.documentNumber || "",
        phone: data.phone || "",
        imageUrl: data.imageUrl || data.avatarUrl || user.imageUrl || null,
        role: effectiveRole,
        status: data.status || "ACTIVE",
        preferredLanguage: data.preferredLanguage || "es",
        createdAt: data.createdAt || "",
        organization: resolvedOrganization,
        managedVenue: resolvedManagedVenue,
        sessions: allSessions,
      };
    }
  } catch {
    // Fallback gracefully to session user
  }

  const isPlatformRole = String(user.role || "").startsWith("PLATFORM_");

  return {
    id: user.id,
    name: user.name,
    lastName: user.lastName || "",
    fullName: `${user.name} ${user.lastName || ""}`.trim(),
    email: user.email,
    documentType: "V",
    documentNumber: "",
    phone: "",
    imageUrl: user.imageUrl || null,
    role: user.role,
    status: "ACTIVE",
    preferredLanguage: "es",
    createdAt: "",
    organization: isPlatformRole ? "YoReservo (Plataforma Central)" : "Sin asignar",
    managedVenue: isPlatformRole ? "Todas las Sedes (Global)" : "Sin asignar",
    sessions: [CURRENT_SESSION_FALLBACK],
  };
}

export async function updateProfileAction(
  input: UpdateProfileInput,
): Promise<ActionResult<UserProfileData>> {
  const { accessToken } = await requireSessionWithToken();
  try {
    const resolvedImage = input.imageUrl ?? input.avatarUrl;
    const payload =
      resolvedImage !== undefined
        ? { ...input, imageUrl: resolvedImage, avatarUrl: resolvedImage }
        : input;

    const res = await backendRequest("/backoffice/profile", {
      method: "PATCH",
      accessToken,
      body: payload,
    });

    if (!res.ok) {
      return fail("PROFILE_UPDATE_FAILED");
    }

    revalidatePath(ROUTES.profile);
    const updated = await getProfileAction();
    return ok(updated);
  } catch {
    return fail("NETWORK_ERROR");
  }
}

export async function switchTestingRoleAction(
  role: BackofficeRole,
): Promise<ActionResult<{ role: BackofficeRole; redirectTo: string }>> {
  const { accessToken } = await requireSessionWithToken();
  try {
    const res = await backendRequest("/backoffice/profile/role", {
      method: "PATCH",
      accessToken,
      body: { role },
    });

    if (!res.ok) {
      return fail("ROLE_SWITCH_FAILED");
    }

    const refreshToken = await getRefreshToken();
    if (refreshToken) {
      const refreshResult = await refreshTokens(refreshToken, true);
      if (refreshResult.kind === "refreshed") {
        await setAuthCookies(refreshResult.tokens);
      }
    }

    revalidatePath("/", "layout");
    return ok({
      role,
      redirectTo: getDefaultRouteForRole(role),
    });
  } catch {
    return fail("NETWORK_ERROR");
  }
}

export async function changePasswordAction(
  input: ChangePasswordInput,
): Promise<ActionResult<{ success: boolean; message: string }>> {
  const { accessToken } = await requireSessionWithToken();
  try {
    const res = await backendRequest("/backoffice/profile/change-password", {
      method: "POST",
      accessToken,
      body: input,
    });

    if (!res.ok) {
      if (res.status === 401) {
        return fail("INVALID_CURRENT_PASSWORD");
      }
      return fail("PASSWORD_UPDATE_FAILED");
    }

    return ok({ success: true, message: "Password updated successfully" });
  } catch {
    return fail("NETWORK_ERROR");
  }
}

export async function revokeOtherSessionsAction(): Promise<ActionResult<{ count: number }>> {
  const { accessToken } = await requireSessionWithToken();
  try {
    const res = await backendRequest("/backoffice/profile/sessions/revoke-others", {
      method: "DELETE",
      accessToken,
    });

    if (!res.ok) {
      return fail("SESSION_REVOKE_FAILED");
    }

    revalidatePath(ROUTES.profile);
    return ok({ count: 1 });
  } catch {
    return fail("NETWORK_ERROR");
  }
}

export async function revokeSessionAction(
  sessionId: string,
): Promise<ActionResult<{ sessionId: string }>> {
  const { accessToken } = await requireSessionWithToken();
  try {
    const res = await backendRequest(`/backoffice/profile/sessions/${sessionId}`, {
      method: "DELETE",
      accessToken,
    });

    if (!res.ok) {
      return fail("SESSION_REVOKE_FAILED");
    }

    revalidatePath(ROUTES.profile);
    return ok({ sessionId });
  } catch {
    return fail("NETWORK_ERROR");
  }
}
