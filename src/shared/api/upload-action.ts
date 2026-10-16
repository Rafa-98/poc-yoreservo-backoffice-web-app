"use server";

import { getServerEnv } from "@/shared/config/index.server";
import { requireSessionWithToken } from "@/shared/auth/index.server";
import { fail, ok, type ActionResult } from "@/shared/lib";

export interface UploadedFileMetadata {
  id: string;
  url: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
}

export async function uploadBackofficeFileAction(
  formData: FormData,
): Promise<ActionResult<UploadedFileMetadata>> {
  const { accessToken } = await requireSessionWithToken();

  try {
    const baseUrl = getServerEnv().BACKEND_API_URL;
    const response = await fetch(`${baseUrl}/files/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData,
      cache: "no-store",
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      let errMsg = "FILE_UPLOAD_FAILED";
      try {
        const parsed = JSON.parse(errText);
        if (parsed?.message) {
          errMsg = Array.isArray(parsed.message)
            ? parsed.message[0]
            : String(parsed.message);
        }
      } catch {
        // ignore JSON parse error
      }
      return fail(errMsg);
    }

    const data = (await response.json()) as any;
    const rawUrl = String(data.url ?? "");
    const fullUrl = rawUrl.startsWith("http")
      ? rawUrl
      : `${baseUrl}${rawUrl.startsWith("/") ? "" : "/"}${rawUrl}`;

    return ok({
      id: String(data.id ?? ""),
      url: fullUrl,
      originalName: String(data.originalName ?? data.filename ?? "file"),
      mimeType: String(data.mimeType ?? data.mimetype ?? "application/octet-stream"),
      sizeBytes: Number(data.sizeBytes ?? data.size ?? 0),
    });
  } catch (error) {
    console.error("[upload] File upload failed:", error);
    return fail("SERVICE_UNAVAILABLE");
  }
}
