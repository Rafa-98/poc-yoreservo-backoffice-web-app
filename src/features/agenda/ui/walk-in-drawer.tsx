"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { DEFAULT_BCV_USD_RATE, todayInTimezone, useTimeFormat } from "@/shared/lib";
import { Button } from "@/shared/ui/button";
import { Alert } from "@/shared/ui/alert";
import type { CourtSpace } from "../model/types";
import { createWalkInAction } from "../actions/agenda-actions";

export interface WalkInDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  court: CourtSpace | null;
  selectedDate: string;
  startTime: string;
  onSuccess: () => void;
  bcvRate?: number;
}

export function WalkInDrawer({
  isOpen,
  onClose,
  court,
  selectedDate,
  startTime,
  onSuccess,
  bcvRate = DEFAULT_BCV_USD_RATE,
}: WalkInDrawerProps) {
  const t = useTranslations("agenda");
  const { formatTime } = useTimeFormat();

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !court) return null;

  const effectiveDate = selectedDate || todayInTimezone("America/Caracas");
  const [h] = startTime.split(":").map(Number);
  const endTime = `${String(h + 1).padStart(2, "0")}:00`;
  const price = court.pricePerHour;
  const priceVes = Math.round(price * bcvRate);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    const res = await createWalkInAction({
      spaceId: court.id,
      reservationDate: effectiveDate,
      startTime,
      endTime,
      customerName,
      customerPhone: customerPhone || undefined,
      paymentMethod,
      referenceNumber: referenceNumber || undefined,
      internalNotes: internalNotes || undefined,
    });

    setIsSubmitting(false);

    if (!res.ok) {
      setErrorMessage(t("errorWalkIn"));
      return;
    }

    onSuccess();
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Flyout Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-border bg-surface p-6 shadow-modal animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <div className="inline-block rounded bg-accent/20 px-2 py-0.5 font-display text-[10px] font-bold uppercase tracking-wider text-accent-foreground border border-accent/30 mb-1">
              {t("drawerBadge")}
            </div>
            <h3 className="font-display text-lg font-bold text-foreground">
              {t("drawerTitle")}
            </h3>
            <p className="text-xs text-muted-foreground">
              {t("drawerSubtitle")}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="my-3">
            <Alert variant="error">{errorMessage}</Alert>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-4 space-y-4">
          {/* Readonly Court & Time details */}
          <div className="rounded-xl border border-border bg-background p-3.5 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">{t("labelCourt")}:</span>
              <strong className="font-semibold text-foreground">
                {court.spaceNumber}
              </strong>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">{t("labelTime")}:</span>
              <strong className="font-semibold text-foreground font-mono">
                {formatTime(startTime)} - {formatTime(endTime)} ({selectedDate})
              </strong>
            </div>
          </div>


          {/* Customer Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase text-muted-foreground">
              {t("labelCustomerName")} *
            </label>
            <input
              type="text"
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder={t("customerNamePlaceholder")}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
            />
          </div>

          {/* Customer Phone */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase text-muted-foreground">
              {t("labelCustomerPhone")}
            </label>
            <input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder={t("customerPhonePlaceholder")}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
            />
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase text-muted-foreground">
              {t("labelPaymentMethod")} *
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none cursor-pointer"
            >
              <option value="CASH">{t("payCashUsd")}</option>
              <option value="PAGO_MOVIL">{t("payPagoMovil")}</option>
              <option value="POS">{t("payPos")}</option>
              <option value="PENDING">{t("payPending")}</option>
            </select>
          </div>

          {/* Optional Reference Number for Pago Móvil */}
          {paymentMethod === "PAGO_MOVIL" && (
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase text-muted-foreground">
                {t("labelRefNumber")}
              </label>
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder={t("refNumberPlaceholder")}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none font-mono"
              />
            </div>
          )}

          {/* Internal Notes */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase text-muted-foreground">
              {t("labelNotes")}
            </label>
            <textarea
              rows={2}
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              placeholder={t("notesPlaceholder")}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-accent focus:outline-none"
            />
          </div>

          {/* Financial Breakdown (Zero Platform Fee Proof) */}
          <div className="rounded-xl border border-border bg-muted/60 p-3.5 space-y-2 text-xs">
            <div className="flex justify-between items-center text-muted-foreground">
              <span>{t("breakdownSubtotal")}:</span>
              <span>${price.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center font-semibold text-status-available-fg">
              <span>{t("breakdownFee")}:</span>
              <span>{t("breakdownFeeZero")}</span>
            </div>
            <div className="border-t border-border pt-2 flex justify-between items-baseline font-bold text-base text-foreground">
              <span>{t("breakdownTotal")}:</span>
              <div className="text-right">
                <span className="text-link">${price.toFixed(2)}</span>
                <span className="block text-[11px] font-normal text-muted-foreground">
                  Bs. {priceVes.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isSubmitting}
            >
              <span>{isSubmitting ? t("btnRegistering") : t("btnRegisterBooking")}</span>
              {!isSubmitting && <Check className="size-4" />}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
