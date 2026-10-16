"use server";

import { backendRequest } from "@/shared/api/index.server";
import { getAccessToken } from "@/shared/auth/index.server";

export async function syncBackofficeTimeFormatAction(
  preferredTimeFormat: "12h" | "24h"
): Promise<void> {
  try {
    const accessToken = await getAccessToken();
    if (!accessToken) return;
    await backendRequest("/backoffice/profile", {
      method: "PATCH",
      accessToken,
      body: { preferredTimeFormat },
    });
  } catch {
    // Non-blocking preference sync
  }
}

