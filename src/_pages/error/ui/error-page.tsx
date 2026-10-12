"use client";

import { useEffect } from "react";
import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { ROUTES } from "@/shared/config";
import { Button, buttonVariants, StatusScreen } from "@/shared/ui";

interface ErrorPageProps {
  error: Error & { digest?: string };
  onRetry: () => void;
}

/** UI for the route error boundary (`app/error.tsx`). */
export function ErrorPage({ error, onRetry }: ErrorPageProps) {
  const t = useTranslations();

  useEffect(() => {
    console.error("[app] Unhandled render error:", error);
  }, [error]);

  return (
    <StatusScreen
      icon={TriangleAlert}
      title={t("status.error.title")}
      description={t("status.error.description")}
    >
      <Button size="lg" onClick={onRetry}>
        {t("common.actions.retry")}
      </Button>
      <Link
        href={ROUTES.root}
        className={buttonVariants({ variant: "secondary", size: "lg" })}
      >
        {t("common.actions.goHome")}
      </Link>
      {error.digest ? (
        <p className="w-full pt-2 text-center text-xs text-muted-foreground">
          {t("status.error.reference", { digest: error.digest })}
        </p>
      ) : null}
    </StatusScreen>
  );
}