"use client";

import { ErrorPage } from "@/_pages/error";

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return <ErrorPage error={error} onRetry={retry} />;
}