"use server";

import { z } from "zod";
import { backendRequest } from "@/shared/api/index.server";
import { parseApiResponse } from "@/shared/api";
import {
  authTokensResponseSchema,
  buildAuthTokens,
  sessionUserSchema,
} from "@/shared/auth";
import { createSession } from "@/shared/auth/index.server";
import { BACKOFFICE_ROLES } from "@/shared/config";
import { fail, ok, type ActionResult } from "@/shared/lib";

const loginInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  remember: z.boolean().optional(),
});

export type LoginInput = z.infer<typeof loginInputSchema>;

const loginResponseSchema = authTokensResponseSchema.extend({
  user: sessionUserSchema.passthrough(),
});

export async function loginAction(
  input: LoginInput,
): Promise<ActionResult<{ redirectTo?: string }>> {
  const parsed = loginInputSchema.safeParse(input);
  if (!parsed.success) {
    return fail("VALIDATION_FAILED");
  }

  try {
    const response = await backendRequest("/auth/login", {
      method: "POST",
      body: {
        email: parsed.data.email,
        password: parsed.data.password,
      },
    });

    if (response.status === 401 || response.status === 400) {
      return fail("INVALID_CREDENTIALS");
    }

    if (!response.ok) {
      return fail("SERVER_ERROR", undefined, response.correlationId);
    }

    const payload = parseApiResponse(
      loginResponseSchema,
      response.body,
      "POST /auth/login",
      response.correlationId,
    );

    // Reject CLIENT athletes attempting to sign in to Backoffice
    if (!(BACKOFFICE_ROLES as readonly string[]).includes(payload.user.role)) {
      return fail("FORBIDDEN_ROLE");
    }

    const tokens = buildAuthTokens(payload, response.refreshCookie);
    await createSession(tokens);

    return ok({});
  } catch (error) {
    console.error("[auth] Login error:", error);
    return fail("SERVICE_UNAVAILABLE");
  }
}
