"use client";

import { useRef, useState } from "react";
import { Check, CheckCircle2, QrCode, ScanLine, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTimeFormat } from "@/shared/lib";
import { Button } from "@/shared/ui/button";
import { Alert } from "@/shared/ui/alert";
import { checkInAction } from "../actions/agenda-actions";

export interface ExpressCheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onValidate?: (code: string) => Promise<void> | void;
}

export function ExpressCheckInModal({
  isOpen,
  onClose,
  onSuccess,
  onValidate,
}: ExpressCheckInModalProps) {
  const t = useTranslations("agenda");
  const { formatTime } = useTimeFormat();

  const [code, setCode] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error" | "already";
    message: string;
    details?: any;
  } | null>(null);

  if (!isOpen) return null;

  const handleFocusInput = () => {
    setFeedback(null);
    inputRef.current?.focus();
    inputRef.current?.select();
  };

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedCode = code.trim();
    if (!trimmedCode) return;

    setIsValidating(true);
    setFeedback(null);

    if (onValidate) {
      await onValidate(trimmedCode);
    }

    const res = await checkInAction({
      code: trimmedCode,
      method: "SHORT_CODE_MANUAL",
    });

    setIsValidating(false);

    if (!res.ok) {
      if (res.error.code === "CHECK_IN_NOT_FOUND") {
        setFeedback({
          type: "error",
          message: t("checkInNotFound"),
        });
      } else {
        setFeedback({
          type: "error",
          message: t("checkInError"),
        });
      }
      return;
    }

    if (res.data.alreadyCheckedIn) {
      setFeedback({
        type: "already",
        message: t("checkInAlready"),
        details: res.data.reservation,
      });
    } else {
      setFeedback({
        type: "success",
        message: t("checkInSuccess"),
        details: res.data.reservation,
      });
      onSuccess();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="relative w-full max-w-lg rounded-2xl border border-border bg-surface p-6 sm:p-8 shadow-modal animate-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-accent/20 text-accent-foreground border border-accent/30">
                <QrCode className="size-5" />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-foreground">
                  {t("qrModalTitle")}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {t("qrModalSubtitle")}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Feedback Banners */}
          {feedback && (
            <div className="mt-4">
              {feedback.type === "success" ? (
                <div className="rounded-xl border border-status-available-border bg-status-available-bg p-3.5 text-xs text-status-available-fg flex items-start gap-2.5">
                  <CheckCircle2 className="size-5 shrink-0 mt-0.5 text-emerald-500" />
                  <div className="space-y-1">
                    <strong className="block text-sm font-bold">{feedback.message}</strong>
                    {feedback.details && (
                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs opacity-95">
                        <span>
                          <strong>{t("labelCourt")}:</strong>{" "}
                          {feedback.details.space?.spaceNumber || t("defaultCourt")}
                        </span>
                        <span>
                          <strong>{t("checkInHolder")}:</strong>{" "}
                          {feedback.details.client
                            ? `${feedback.details.client.name} ${feedback.details.client.lastName}`
                            : feedback.details.customerName || t("defaultPlayer")}
                        </span>
                        <span>
                          <strong>{t("checkInCode")}:</strong> #{feedback.details.shortCode}
                        </span>
                        <span>
                          <strong>{t("checkInStatusLabel")}:</strong>{" "}
                          {t("checkInStatusValidated")}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ) : feedback.type === "already" ? (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2.5">
                  <CheckCircle2 className="size-5 shrink-0 mt-0.5 text-amber-500" />
                  <div className="space-y-1">
                    <strong className="block text-sm font-bold">{feedback.message}</strong>
                    {feedback.details && (
                      <div className="mt-1 text-xs">
                        <span>
                          {t("checkInValidatedAt", {
                            time: feedback.details.validatedAt
                              ? formatTime(
                                  new Date(feedback.details.validatedAt)
                                    .toTimeString()
                                    .slice(0, 5)
                                )
                              : t("checkInPreviously"),
                          })}
                        </span>

                        {feedback.details.space && (
                          <span className="ml-2 font-semibold">
                            {t("labelCourt")}: {feedback.details.space.spaceNumber}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <Alert variant="error">{feedback.message}</Alert>
              )}
            </div>
          )}

          {/* Body */}
          <form onSubmit={handleCheckIn} className="mt-5 space-y-4">
            {/* Optical Scanner / Input Focus Box */}
            <div className="relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-background p-6 text-center overflow-hidden">
              <ScanLine className="size-12 text-muted-foreground" />
              <span className="mt-2 text-xs font-semibold text-foreground">
                {t("qrScannerTitle")}
              </span>
              <p className="mt-0.5 text-[11px] text-muted-foreground max-w-xs">
                {t("qrScannerHint")}
              </p>
              <button
                type="button"
                onClick={handleFocusInput}
                className="mt-3 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:border-accent hover:text-foreground transition-all cursor-pointer"
              >
                {t("btnFocusCodeInput")}
              </button>
            </div>

            {/* Short-Code or QR Hash Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("qrCodeLabel")}
                </label>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const text = await navigator.clipboard.readText();
                      if (text) setCode(text.trim());
                    } catch {}
                  }}
                  className="text-[11px] font-semibold text-accent hover:underline cursor-pointer"
                >
                  {t("btnPasteClipboard")}
                </button>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 font-mono text-sm font-bold text-muted-foreground">
                  #
                </span>
                <input
                  ref={inputRef}
                  type="text"
                  maxLength={64}
                  autoFocus
                  value={code}
                  onChange={(e) => setCode(e.target.value.trim())}
                  placeholder={t("qrInputPlaceholder")}
                  className="w-full rounded-xl border border-border bg-background py-2.5 pl-8 pr-4 font-mono text-sm font-bold tracking-wider text-foreground focus:border-accent focus:outline-none"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex gap-3">
              <Button
                type="button"
                variant="secondary"
                fullWidth
                onClick={onClose}
              >
                {t("btnClose")}
              </Button>
              <Button
                type="submit"
                variant="primary"
                fullWidth
                isLoading={isValidating}
                disabled={!code.trim() || isValidating}
              >
                <span>{isValidating ? t("btnCheckingIn") : t("btnCheckIn")}</span>
                {!isValidating && <Check className="size-4" />}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
