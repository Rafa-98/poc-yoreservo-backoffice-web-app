import { z } from "zod";
import { AppError } from "@/shared/lib";

/**
 * Validates data coming from the backend before the UI touches it.
 * A mismatch is a server contract problem, not a user-input problem, so it is
 * logged and surfaced as a generic `INVALID_SERVER_RESPONSE` AppError. Pass the
 * request's `correlationId` so the failure can be traced in the backend logs.
 */
export function parseApiResponse<TSchema extends z.ZodType>(
  schema: TSchema,
  data: unknown,
  context: string,
  correlationId?: string,
): z.output<TSchema> {
  const result = schema.safeParse(data);

  if (!result.success) {
    console.error(
      `[api] Invalid response for "${context}"${
        correlationId ? ` (correlationId=${correlationId})` : ""
      }:`,
      z.prettifyError(result.error),
    );
    throw new AppError(
      "INVALID_SERVER_RESPONSE",
      `Invalid server response for "${context}"`,
      { correlationId },
    );
  }

  return result.data;
}
