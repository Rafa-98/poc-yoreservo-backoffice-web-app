"use server";

import { z } from "zod";
import { backendRequest } from "@/shared/api/index.server";
import { fail, ok, type ActionResult } from "@/shared/lib";

const recoverSchema = z.object({
  email: z.string().email(),
});

export type RecoverPasswordInput = z.infer<typeof recoverSchema>;

export async function recoverPasswordAction(
  input: RecoverPasswordInput,
): Promise<ActionResult<{ sent: boolean }>> {
  const parsed = recoverSchema.safeParse(input);
  if (!parsed.success) {
    return fail("VALIDATION_FAILED");
  }

  try {
    const res = await backendRequest("/auth/forgot-password", {
      method: "POST",
      body: { email: parsed.data.email },
    });

    if (!res.ok && res.status !== 404) {
      console.warn("[auth] forgot-password returned status:", res.status);
    }

    return ok({ sent: true });
  } catch (error) {
    console.error("[auth] Recover password error:", error);
    return ok({ sent: true });
  }
}
