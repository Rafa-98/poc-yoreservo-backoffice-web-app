"use client";

import { useState } from "react";
import { Check, CheckCircle2, QrCode, ScanLine, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/shared/ui/button";
import { Alert } from "@/shared/ui/alert";
import { checkInAction } from "../actions/agenda-actions";

export interface ExpressCheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ExpressCheckInModal({
  isOpen,
  onClose,
  onSuccess,
}: ExpressCheckInModalProps) {
  const t = useTranslations("agenda");

  const [code, setCode] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error" | "already";
    message: string;
    details?: any;
  } | null>(null);

  if (!isOpen) return null;

  const handleSimulateScan = () => {
    setIsScanning(true);
    setFeedback(null);
    setTimeout(() => {
      setIsScanning(false);
      setCode("AB4553");
    }, 1200);
  };

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setIsValidating(true);
    setFeedback(null);

    const res = await checkInAction({
      code: code.trim(),
      method: isScanning ? "QR_SCAN" : "SHORT_CODE_MANUAL",
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
          message: "Error al validar la entrada.",
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
                        <span><strong>Cancha:</strong> {feedback.details.space?.spaceNumber || "Cancha"}</span>
                        <span><strong>Titular:</strong> {feedback.details.client ? `${feedback.details.client.name} ${feedback.details.client.lastName}` : (feedback.details.customerName || "Jugador")}</span>
                        <span><strong>Código:</strong> #{feedback.details.shortCode}</span>
                        <span><strong>Estado:</strong> Entrada Validada (Completada)</span>
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
                        <span>Validada previamente el {feedback.details.validatedAt ? new Date(feedback.details.validatedAt).toLocaleTimeString() : "previamente"}.</span>
                        {feedback.details.space && <span className="ml-2 font-semibold">Cancha: {feedback.details.space.spaceNumber}</span>}
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
            {/* Simulated Camera Scanner Box */}
            <div className="relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-background p-6 text-center overflow-hidden">
              {isScanning && (
                <div className="absolute inset-x-0 h-1 bg-accent shadow-[0_0_12px_#c6f23b] animate-[bounce_1.5s_infinite]" />
              )}
              <ScanLine
                className={`size-12 ${
                  isScanning ? "text-accent animate-pulse" : "text-muted-foreground"
                }`}
              />
              <span className="mt-2 text-xs font-semibold text-foreground">
                {isScanning ? "Escaneando código QR con lector óptico..." : "Cámara de Recepción & Lector QR"}
              </span>
              <p className="mt-0.5 text-[11px] text-muted-foreground max-w-xs">
                Apunta el ticket QR del cliente hacia el lector o ingresa el código de 6 caracteres.
              </p>
              <button
                type="button"
                onClick={handleSimulateScan}
                disabled={isScanning}
                className="mt-3 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:border-accent hover:text-foreground transition-all"
              >
                {t("btnSimulateQr")}
              </button>
            </div>

            {/* Short-Code or QR Hash Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Código Corto (#AB4553) o Hash QR
                </label>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const text = await navigator.clipboard.readText();
                      if (text) setCode(text.trim());
                    } catch {}
                  }}
                  className="text-[11px] font-semibold text-accent hover:underline"
                >
                  Pegar Portapapeles
                </button>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 font-mono text-sm font-bold text-muted-foreground">
                  #
                </span>
                <input
                  type="text"
                  maxLength={64}
                  value={code}
                  onChange={(e) => setCode(e.target.value.trim())}
                  placeholder="Ej. AB4553 o hash QR"
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
                Cerrar
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
