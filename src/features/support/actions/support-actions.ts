"use server";

import { revalidatePath } from "next/cache";
import { backendRequest } from "@/shared/api/index.server";
import { requireSessionWithToken } from "@/shared/auth/index.server";
import { fail, ok, type ActionResult } from "@/shared/lib";
import { ROUTES } from "@/shared/config";
import type {
  SupportTicketItem,
  SupportTicketStatus,
  SupportTicketsData,
} from "../model/types";

function mapSupportTicketItem(raw: any): SupportTicketItem {
  return {
    id: String(raw?.id ?? ""),
    ticketCode: String(raw?.ticketCode ?? ""),
    userId: String(raw?.userId ?? ""),
    type: raw?.type === "BUG_REPORT" ? "BUG_REPORT" : "FEEDBACK",
    category: String(raw?.category ?? ""),
    rating: typeof raw?.rating === "number" ? raw.rating : null,
    subject: raw?.subject ? String(raw.subject) : null,
    description: String(raw?.description ?? ""),
    reservationCode: raw?.reservationCode ? String(raw.reservationCode) : null,
    attachmentUrl: raw?.attachmentUrl ? String(raw.attachmentUrl) : null,
    diagnosticInfo:
      raw?.diagnosticInfo && typeof raw.diagnosticInfo === "object"
        ? (raw.diagnosticInfo as Record<string, unknown>)
        : null,
    adminNotes: raw?.adminNotes ? String(raw.adminNotes) : null,
    lastUpdatedByEmail: raw?.lastUpdatedByEmail
      ? String(raw.lastUpdatedByEmail)
      : null,
    lastUpdatedAt: raw?.lastUpdatedAt ? String(raw.lastUpdatedAt) : null,
    status: (raw?.status as SupportTicketStatus) || "OPEN",
    createdAt: raw?.createdAt
      ? new Date(raw.createdAt).toISOString()
      : new Date().toISOString(),
    updatedAt: raw?.updatedAt
      ? new Date(raw.updatedAt).toISOString()
      : new Date().toISOString(),
    user: raw?.user
      ? {
          id: String(raw.user.id ?? ""),
          name: String(raw.user.name ?? ""),
          lastName: String(raw.user.lastName ?? ""),
          email: String(raw.user.email ?? ""),
          phoneNumber: raw.user.phoneNumber
            ? String(raw.user.phoneNumber)
            : null,
          role: String(raw.user.role ?? "CLIENT"),
        }
      : null,
  };
}

export async function getSupportTicketsAction(filters?: {
  type?: string;
  status?: string;
  search?: string;
}): Promise<ActionResult<SupportTicketsData>> {
  const { accessToken } = await requireSessionWithToken([
    "PLATFORM_ADMIN",
    "ALLY_ADMIN",
  ]);

  try {
    const params = new URLSearchParams();
    if (filters?.type && filters.type !== "ALL") {
      params.set("type", filters.type);
    }
    if (filters?.status && filters.status !== "ALL") {
      params.set("status", filters.status);
    }
    if (filters?.search?.trim()) {
      params.set("search", filters.search.trim());
    }

    const qs = params.toString();
    const res = await backendRequest(
      `/backoffice/support-tickets${qs ? `?${qs}` : ""}`,
      { accessToken }
    );

    if (!res.ok || !res.body) {
      return fail("FAILED_TO_LOAD_SUPPORT_TICKETS");
    }

    const body = res.body as any;
    const items = Array.isArray(body.items)
      ? body.items.map(mapSupportTicketItem)
      : [];

    return ok({
      kpis: {
        totalCount: Number(body.kpis?.totalCount ?? items.length),
        openCount: Number(body.kpis?.openCount ?? 0),
        inProgressCount: Number(body.kpis?.inProgressCount ?? 0),
        resolvedCount: Number(body.kpis?.resolvedCount ?? 0),
        feedbackCount: Number(body.kpis?.feedbackCount ?? 0),
        bugReportCount: Number(body.kpis?.bugReportCount ?? 0),
        averageRating:
          typeof body.kpis?.averageRating === "number"
            ? body.kpis.averageRating
            : null,
      },
      items,
    });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "UNKNOWN_ERROR");
  }
}

export async function updateSupportTicketAction(
  id: string,
  input: {
    status: SupportTicketStatus;
    adminNotes?: string;
  }
): Promise<ActionResult<SupportTicketItem>> {
  const { accessToken } = await requireSessionWithToken([
    "PLATFORM_ADMIN",
    "ALLY_ADMIN",
  ]);

  try {
    const res = await backendRequest(`/backoffice/support-tickets/${id}`, {
      method: "PATCH",
      accessToken,
      body: input,
    });

    if (!res.ok || !res.body) {
      const msg =
        (res.body as any)?.message || "FAILED_TO_UPDATE_SUPPORT_TICKET";
      return fail(msg);
    }

    revalidatePath(ROUTES.support);
    return ok(mapSupportTicketItem(res.body));
  } catch (error) {
    return fail(error instanceof Error ? error.message : "UNKNOWN_ERROR");
  }
}

