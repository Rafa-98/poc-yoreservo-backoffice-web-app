"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Mail, Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { ROUTES } from "@/shared/config";
import { Button } from "@/shared/ui/button";
import { Alert } from "@/shared/ui/alert";
import { recoverPasswordAction } from "../actions/recover-password-action";

export function RecoverPasswordForm() {
  const t = useTranslations("auth");

  const [email, setEmail] = useState("aliado@sanagustin.com");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isSent && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [isSent, countdown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    const res = await recoverPasswordAction({ email });

    setIsLoading(false);
    if (!res.ok) {
      setErrorMessage(t("errorServiceUnavailable"));
      return;
    }

    setIsSent(true);
    setCountdown(30);
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setIsLoading(true);
    setErrorMessage(null);
    const res = await recoverPasswordAction({ email });
    setIsLoading(false);
    if (!res.ok) {
      setErrorMessage(t("errorServiceUnavailable"));
      return;
    }
    setCountdown(30);
  };

  return (
    <div className="w-full rounded-2xl border border-border bg-surface p-6 sm:p-8 shadow-card">
      {!isSent ? (
        <>
          <div className="mb-6">
            <Link
              href={ROUTES.login}
              className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-link hover:underline"
            >
              <ArrowLeft className="size-3.5" />
              <span>{t("linkBackLogin")}</span>
            </Link>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
              {t("recoverTitle")}
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground">
              {t("recoverSubtitle")}
            </p>
          </div>

          {errorMessage && (
            <div className="mb-5">
              <Alert variant="error">{errorMessage}</Alert>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="recover-email"
                className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                {t("labelEmail")}
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted-foreground">
                  <Mail className="size-4" />
                </div>
                <input
                  id="recover-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="aliado@sanagustin.com"
                  className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm text-foreground transition-colors placeholder:text-muted-foreground/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
              <p className="text-[11px] text-muted-foreground pt-1">
                {t("helperEmail")}
              </p>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isLoading}
              className="mt-4"
            >
              <span>{isLoading ? t("btnSending") : t("btnSendLink")}</span>
              {!isLoading && <Send className="size-4" />}
            </Button>
          </form>
        </>
      ) : (
        <div className="text-center py-2">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-status-available-bg text-status-available-fg border-2 border-status-available-border">
            <CheckCircle2 className="size-8" />
          </div>

          <h2 className="font-display text-2xl font-bold text-foreground">
            {t("successTitle")}
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {t("successDesc1")}{" "}
            <strong className="text-foreground font-semibold">{email}</strong>.{" "}
            {t("successDesc2")}
          </p>

          <div className="my-6 rounded-xl border border-border bg-muted p-4 text-xs text-muted-foreground">
            <span>{t("timerDesc")} </span>
            <strong className="font-mono text-sm font-bold text-link">
              {countdown > 0 ? `${countdown}s` : "0s"}
            </strong>
          </div>

          <div className="flex flex-col gap-2.5">
            <Button
              type="button"
              variant="secondary"
              fullWidth
              disabled={countdown > 0 || isLoading}
              onClick={handleResend}
            >
              {t("btnResend")}
            </Button>
            <Link
              href={ROUTES.login}
              className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-accent px-4 font-semibold text-accent-foreground hover:brightness-105"
            >
              {t("btnBackHome")}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
