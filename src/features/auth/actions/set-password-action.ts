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
import { fail, ok, type ActionResult } from "@/shared/lib";

const invitationDetailsSchema = z.object({
  email: z.string(),
  role: z.string(),
  organizationName: z.string().nullable().optional(),
  venueName: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
});

export type InvitationDetails = z.infer<typeof invitationDetailsSchema>;

export async function validateInvitationAction(
  token: string,
): Promise<ActionResult<InvitationDetails>> {
  if (!token) {
    return fail("INVALID_TOKEN");
  }

  try {
    const res = await backendRequest(
      `/backoffice/invitations/validate?token=${encodeURIComponent(token)}`,
    );

    if (!res.ok) {
      return fail("INVALID_TOKEN");
    }

    const data = parseApiResponse(
      invitationDetailsSchema,
      res.body,
      "GET /backoffice/invitations/validate",
      res.correlationId,
    );

    return ok(data);
  } catch (error) {
    console.error("[auth] Validate token error:", error);
    return fail("SERVICE_UNAVAILABLE");
  }
}

const setPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
  name: z.string().optional(),
  lastName: z.string().optional(),
});

export type SetPasswordInput = z.infer<typeof setPasswordSchema>;

const loginResponseSchema = authTokensResponseSchema.extend({
  user: sessionUserSchema.passthrough(),
});

export async function setPasswordAction(
  input: SetPasswordInput,
): Promise<ActionResult<{ activated: boolean }>> {
  const parsed = setPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return fail("VALIDATION_FAILED");
  }

  try {
    // 1. Accept invitation and set password
    const res = await backendRequest("/backoffice/invitations/accept", {
      method: "POST",
      body: {
        token: parsed.data.token,
        password: parsed.data.password,
        name: parsed.data.name,
        lastName: parsed.data.lastName,
      },
    });

    if (!res.ok) {
      return fail("INVITATION_FAILED");
    }

    const invitationResult = res.body as { user?: { email: string } };
    const email = invitationResult?.user?.email;

    // 2. Automatically log the user in if email is returned
    if (email) {
      try {
        const loginRes = await backendRequest("/auth/login", {
          method: "POST",
          body: {
            email,
            password: parsed.data.password,
          },
        });
        if (loginRes.ok) {
          const payload = parseApiResponse(
            loginResponseSchema,
            loginRes.body,
            "POST /auth/login after accept",
            loginRes.correlationId,
          );
          const tokens = buildAuthTokens(payload, loginRes.refreshCookie);
          await createSession(tokens);
        }
      } catch (err) {
        console.warn("[auth] Automatic login after invitation failed:", err);
      }
    }

    return ok({ activated: true });
  } catch (error) {
    console.error("[auth] Set password error:", error);
    return fail("SERVICE_UNAVAILABLE");
  }
}
