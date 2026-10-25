"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Clock, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { DEFAULT_BCV_USD_RATE, todayInTimezone, useTimeFormat } from "@/shared/lib";
import { Button } from "@/shared/ui/button";
import { Alert } from "@/shared/ui/alert";
import type { CourtSpace } from "../model/types";
import { createWalkInAction } from "../actions/agenda-actions";

const ALL_HOURS = [
  "07:00",
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
  "21:00",
  "22:00",
];

function addHoursToTime(timeStr: string, addH: number): string {
  const [h] = timeStr.split(":").map(Number);
  return `${String(h + addH).padStart(2, "0")}:00`;
}

function isSlotAvailableOnCourt(court: CourtSpace, hour: string): boolean {
  const hasReservation = court.reservations.some(
    (r) => r.startTime <= hour && r.endTime > hour
  );
  if (hasReservation) return false;

  const hasBlock = court.blocks.some(
    (b) => b.startTime <= hour && b.endTime > hour
  );
  if (hasBlock) return false;

  const isWithinShift =
    Array.isArray(court.shifts) &&
    court.shifts.length > 0 &&
    court.shifts.some((s) => s.openTime <= hour && s.closeTime > hour);

  return isWithinShift;
}

export interface WalkInDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  court: CourtSpace | null;
  spaces?: CourtSpace[];
  selectedDate: string;
  startTime: string;
  endTime?: string;
  onSelectionChange?: (court: CourtSpace, startTime: string, endTime: string) => void;
  onSuccess: () => void;
  bcvRate?: number;
}

export function WalkInDrawer({
  isOpen,
  onClose,
  court,
  spaces = [],
  selectedDate,
  startTime,
  endTime: initialEndTime,
  onSelectionChange,
  onSuccess,
  bcvRate = DEFAULT_BCV_USD_RATE,
}: WalkInDrawerProps) {
  const t = useTranslations("agenda");
  const { formatTime } = useTimeFormat();

  const [activeCourtId, setActiveCourtId] = useState<string>(court?.id || "");
  const [selectedStartTime, setSelectedStartTime] = useState<string>(startTime);
  const [selectedEndTime, setSelectedEndTime] = useState<string>(
    initialEndTime || addHoursToTime(startTime, 1)
  );
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && court) {
      setActiveCourtId(court.id);
      setSelectedStartTime(startTime);
      setSelectedEndTime(initialEndTime || addHoursToTime(startTime, 1));
      setErrorMessage(null);
    }
  }, [isOpen, court, startTime, initialEndTime]);

  const activeCourt = useMemo(() => {
    if (!court) return null;
    return spaces.find((s) => s.id === activeCourtId) || court;
  }, [court, spaces, activeCourtId]);

  // Available start hours on the active court
  const availableStartHours = useMemo(() => {
    if (!activeCourt) return [selectedStartTime];
    const avail = ALL_HOURS.filter((h) => isSlotAvailableOnCourt(activeCourt, h));
    if (!avail.includes(selectedStartTime)) {
      return [selectedStartTime, ...avail].sort();
    }
    return avail;
  }, [activeCourt, selectedStartTime]);

  // Consecutive available end times starting from selectedStartTime
  const consecutiveEndOptions = useMemo(() => {
    const [startH] = selectedStartTime.split(":").map(Number);
    if (!activeCourt || Number.isNaN(startH)) {
      const fallbackEnd = addHoursToTime(selectedStartTime, 1);
      return [{ endTime: fallbackEnd, hours: 1 }];
    }

    const options: { endTime: string; hours: number }[] = [];
    for (let h = startH; h <= 22; h++) {
      const slotStr = `${String(h).padStart(2, "0")}:00`;
      if (h > startH && !isSlotAvailableOnCourt(activeCourt, slotStr)) {
        break;
      }
      const nextEnd = `${String(h + 1).padStart(2, "0")}:00`;
      options.push({
        endTime: nextEnd,
        hours: h - startH + 1,
      });
    }

    return options.length > 0
      ? options
      : [{ endTime: addHoursToTime(selectedStartTime, 1), hours: 1 }];
  }, [activeCourt, selectedStartTime]);

  // Keep selectedEndTime valid when startTime or court changes
  useEffect(() => {
    const isValidEnd = consecutiveEndOptions.some(
      (opt) => opt.endTime === selectedEndTime
    );
    if (!isValidEnd && consecutiveEndOptions[0]) {
      setSelectedEndTime(consecutiveEndOptions[0].endTime);
    }
  }, [consecutiveEndOptions, selectedEndTime]);

  if (!isOpen || !activeCourt) return null;

  const effectiveDate = selectedDate || todayInTimezone("America/Caracas");
  const [startH] = selectedStartTime.split(":").map(Number);
  const [endH] = selectedEndTime.split(":").map(Number);
  const durationHours = Math.max(1, endH - startH);
  const unitPrice = Number(activeCourt.pricePerHour || 0);
  const price = unitPrice * durationHours;
  const priceVes = Math.round(price * bcvRate);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    const res = await createWalkInAction({
      spaceId: activeCourt.id,
      reservationDate: effectiveDate,
      startTime: selectedStartTime,
      endTime: selectedEndTime,
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
        className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Flyout Drawer */}
      <div className="fixed inset-y-0 right-0 z-[70] flex w-full max-w-md flex-col border-l border-border bg-surface p-6 shadow-modal animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <div className="inline-block rounded bg-accent/20 px-2 py-0.5 font-display text-[10px] font-bold uppercase tracking-wider text-foreground border border-accent/30 mb-1">
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
          {/* Court & Consecutive Hours Selector */}
          <div className="rounded-xl border border-border bg-background p-3.5 space-y-3 text-xs">
            {spaces.length > 1 ? (
              <div className="space-y-1">
                <label className="block font-semibold uppercase text-muted-foreground">
                  {t("labelCourt")}
                </label>
                <select
                  value={activeCourt.id}
                  onChange={(e) => {
                    const nextCourt = spaces.find((s) => s.id === e.target.value);
                    if (nextCourt) {
                      setActiveCourtId(nextCourt.id);
                      const firstAvail = ALL_HOURS.find((h) =>
                        isSlotAvailableOnCourt(nextCourt, h)
                      );
                      const nextStart =
                        !isSlotAvailableOnCourt(nextCourt, selectedStartTime) &&
                        firstAvail
                          ? firstAvail
                          : selectedStartTime;
                      const nextEnd = addHoursToTime(nextStart, 1);
                      setSelectedStartTime(nextStart);
                      setSelectedEndTime(nextEnd);
                      onSelectionChange?.(nextCourt, nextStart, nextEnd);
                    }
                  }}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground focus:border-accent focus:outline-none cursor-pointer"
                >
                  {spaces.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.venueName ? `${s.venueName} · ` : ""}
                      {s.spaceNumber} (${Number(s.pricePerHour || 0).toFixed(2)}/h)
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">{t("labelCourt")}:</span>
                <strong className="font-semibold text-foreground">
                  {activeCourt.venueName ? `${activeCourt.venueName} · ` : ""}
                  {activeCourt.spaceNumber}
                </strong>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="block font-semibold uppercase text-muted-foreground">
                  {t("labelStartTime")}
                </label>
                <select
                  value={selectedStartTime}
                  onChange={(e) => {
                    const nextStart = e.target.value;
                    const nextEnd = addHoursToTime(nextStart, 1);
                    setSelectedStartTime(nextStart);
                    setSelectedEndTime(nextEnd);
                    onSelectionChange?.(activeCourt, nextStart, nextEnd);
                  }}
                  className="w-full rounded-xl border border-border bg-surface px-2.5 py-2 font-mono text-xs font-semibold text-foreground focus:border-accent focus:outline-none cursor-pointer"
                >
                  {availableStartHours.map((h) => (
                    <option key={h} value={h}>
                      {formatTime(h)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block font-semibold uppercase text-muted-foreground">
                  {t("labelEndTime")}
                </label>
                <select
                  value={selectedEndTime}
                  onChange={(e) => {
                    const nextEnd = e.target.value;
                    setSelectedEndTime(nextEnd);
                    onSelectionChange?.(activeCourt, selectedStartTime, nextEnd);
                  }}
                  className="w-full rounded-xl border border-border bg-surface px-2.5 py-2 font-mono text-xs font-semibold text-foreground focus:border-accent focus:outline-none cursor-pointer"
                >
                  {consecutiveEndOptions.map((opt) => (
                    <option key={opt.endTime} value={opt.endTime}>
                      {formatTime(opt.endTime)} ({t("selectionHoursCount", { count: opt.hours })})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Consecutive Duration Pills */}
            {consecutiveEndOptions.length > 1 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground mr-1">
                  <Clock className="size-3" />
                  <span>{t("labelTime")}:</span>
                </span>
                {consecutiveEndOptions.slice(0, 6).map((opt) => {
                  const isSelected = selectedEndTime === opt.endTime;
                  return (
                    <button
                      key={opt.endTime}
                      type="button"
                      onClick={() => {
                        setSelectedEndTime(opt.endTime);
                        onSelectionChange?.(
                          activeCourt,
                          selectedStartTime,
                          opt.endTime
                        );
                      }}
                      className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all ${
                        isSelected
                          ? "bg-accent text-accent-foreground shadow-xs"
                          : "border border-border bg-surface text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {opt.hours}h
                    </button>
                  );
                })}
              </div>
            )}

            <div className="flex justify-between items-center border-t border-border pt-2">
              <span className="text-muted-foreground">{t("labelTime")}:</span>
              <strong className="font-semibold text-foreground font-mono">
                {formatTime(selectedStartTime)} - {formatTime(selectedEndTime)} ·{" "}
                {t("selectionHoursCount", { count: durationHours })} ({selectedDate})
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
              <span>
                {t("breakdownSubtotal")} ({durationHours}h × ${unitPrice.toFixed(2)}):
              </span>
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
