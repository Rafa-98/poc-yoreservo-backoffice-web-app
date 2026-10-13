"use server";

import { redirect } from "next/navigation";
import { backendRequest } from "@/shared/api/index.server";
import { destroySession, readRefreshToken } from "@/shared/auth/index.server";
import { ROUTES } from "@/shared/config";

export async function logoutAction(): Promise<never> {
  const refreshToken = await readRefreshToken();
  if (refreshToken) {
    try {
      await backendRequest("/auth/logout", {
        method: "POST",
        refreshToken,
      });
    } catch (e) {
      // Best-effort logout: ignore network failures and proceed to clear cookies
      console.warn("[auth] Backend logout failed:", e);
    }
  }

  await destroySession();
  redirect(ROUTES.login);
}
