/**
 * Base error for failures we anticipate and can explain to the user.
 *
 * `code`    -> stable machine-readable identifier (safe to branch on). The UI
 *              translates it through `errors.<code>` in `/locales`.
 * `message` -> developer-facing text (English). It is only used for logs; the
 *              user never sees it. Never put secrets in it.
 * `correlationId` -> id of the backend request that failed (`x-correlation-id`),
 *              when one was involved. It is appended to `message` so server logs
 *              (including Next.js error digests) can be matched with the
 *              backend's logs, and it is forwarded to the UI as a reference code.
 */
export class AppError<TCode extends string = string> extends Error {
  readonly code: TCode;
  readonly correlationId?: string;

  constructor(
    code: TCode,
    message?: string,
    options?: { cause?: unknown; correlationId?: string },
  ) {
    const text = message ?? code;
    super(
      options?.correlationId
        ? `${text} [correlationId=${options.correlationId}]`
        : text,
      options?.cause === undefined ? undefined : { cause: options.cause },
    );
    this.name = "AppError";
    this.code = code;
    this.correlationId = options?.correlationId;
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
