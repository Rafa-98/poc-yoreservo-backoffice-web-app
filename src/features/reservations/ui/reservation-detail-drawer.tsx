"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import type { BackofficeRole } from "@/shared/config";
import { useTimeFormat } from "@/shared/lib/time-format";
import { Button } from "@/shared/ui/button";
import { checkInReservationAction } from "../actions/reservations-actions";
import type { ReservationItem } from "../model/types";

interface ReservationDetailDrawerProps {
  isOpen: boolean;
  reservation: ReservationItem | null;
  onClose: () => void;
  onRefresh: () => void;
  onOpenCancel: (res: ReservationItem) => void;
  userRole?: BackofficeRole;
}

export function ReservationDetailDrawer({
  isOpen,
  reservation,
  onClose,
  onRefresh,
  onOpenCancel,
  userRole,
}: ReservationDetailDrawerProps) {
  const t = useTranslations("reservations.drawer");
  const { formatTime } = useTimeFormat();
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkInError, setCheckInError] = useState<string | null>(null);
  const isValidator = userRole === "ALLY_VALIDATOR";

  React.useEffect(() => {
    setCheckInError(null);
  }, [reservation?.id, isOpen]);

  if (!isOpen || !reservation) return null;

  const isEur = reservation.currencyCode === "EUR";
  const currencySymbol = isEur ? "€" : "$";
  const currencyLabel = isEur ? "EUR" : "USD";

  const rawStatus = String(reservation.status);
  const isPendingPayment =
    rawStatus === "PENDING_PAYMENT" || rawStatus === "PAYMENT_UNDER_REVIEW";
  const isCancelled =
    rawStatus === "CANCELLED" || rawStatus === "REJECTED";
  const canCheckIn =
    !reservation.checkedIn && rawStatus === "CONFIRMED";

  let statusBadgeClass =
    "bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400";
  let statusBadgeLabel = t("statusConfirmed");
  if (rawStatus === "PAYMENT_UNDER_REVIEW") {
    statusBadgeClass =
      "bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-400";
    statusBadgeLabel = t("statusUnderReview");
  } else if (rawStatus === "PENDING_PAYMENT") {
    statusBadgeClass =
      "bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-400";
    statusBadgeLabel = t("statusPendingPayment");
  } else if (rawStatus === "COMPLETED") {
    statusBadgeClass =
      "bg-blue-500/15 border-blue-500/30 text-blue-600 dark:text-blue-400";
    statusBadgeLabel = t("statusCompleted");
  } else if (isCancelled) {
    statusBadgeClass =
      "bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-400";
    statusBadgeLabel = t("statusCancelled");
  }

  async function handleCheckIn() {
    if (!reservation || !canCheckIn) return;
    setCheckingIn(true);
    setCheckInError(null);
    const res = await checkInReservationAction(reservation.id, "SHORT_CODE_MANUAL");
    setCheckingIn(false);
    if (res.ok) {
      onRefresh();
    } else if (res.error.code === "CHECK_IN_PENDING_PAYMENT") {
      setCheckInError(t("checkInErrorPendingPayment"));
    } else {
      setCheckInError(t("checkInErrorGeneric"));
    }
  }

  const cleanPhone = reservation.phone.replace(/[^0-9]/g, "");
  const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
    t("waGreeting", { name: reservation.clientName, code: reservation.code })
  )}`;

  return (
    <div
      className="modal-backdrop fixed inset-0 z-50 flex justify-end"
      onClick={onClose}
      id="detail-drawer-backdrop"
    >
      <div
        className="w-full max-w-lg bg-surface border-l border-border h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
        id="detail-drawer-panel"
      >
        {/* DRAWER HEADER */}
        <div className="flex items-center justify-between border-b border-border p-6 bg-surface">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎟️</span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-lg font-bold text-foreground" id="drawer-code-title">
                  {t("title", { code: reservation.code })}
                </h3>
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${statusBadgeClass}`}
                >
                  {statusBadgeLabel}
                </span>
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {t("issuedAt", {
                  date: formatTime(reservation.dateDisplay),
                  origin:
                    reservation.origin === "walk-in"
                      ? t("originWalkIn")
                      : t("originApp"),
                })}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-all cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* DRAWER BODY */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Check-In Action Card */}
          <div className="rounded-2xl border border-border bg-muted/50 p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="max-w-xs">
                <div className="text-sm font-bold text-foreground">
                  {t("checkInTitle")}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {reservation.checkedIn
                    ? t("checkInDescDone", {
                        validator: reservation.checkedInBy || t("defaultValidator"),
                        date: reservation.validatedAt
                          ? formatTime(
                              new Date(reservation.validatedAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: false,
                              }),
                            )
                          : t("today"),
                      })
                    : isPendingPayment
                      ? t("checkInDescPendingPayment")
                      : isCancelled
                        ? t("checkInDescCancelled")
                        : t("checkInDesc")}
                </div>
              </div>

              {reservation.checkedIn ? (
                <span className="rounded-xl border border-emerald-500/30 bg-emerald-500/15 px-3 py-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  {t("btnCheckedInDone")}
                </span>
              ) : isPendingPayment ? (
                <span
                  className="rounded-xl border border-amber-500/30 bg-amber-500/15 px-3 py-1.5 text-xs font-bold text-amber-700 dark:text-amber-300"
                  id="drawer-checkin-pending-badge"
                >
                  {t("badgePendingPaymentBlock")}
                </span>
              ) : isCancelled ? (
                <span className="rounded-xl border border-rose-500/30 bg-rose-500/15 px-3 py-1.5 text-xs font-bold text-rose-600 dark:text-rose-400">
                  {t("badgeCancelledBlock")}
                </span>
              ) : (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleCheckIn}
                  isLoading={checkingIn}
                  disabled={checkingIn || !canCheckIn}
                  id="drawer-checkin-btn"
                >
                  {checkingIn ? t("btnCheckingIn") : t("btnCheckIn")}
                </Button>
              )}
            </div>

            {checkInError && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400">
                {checkInError}
              </div>
            )}
          </div>

          {/* Player Identity */}
          <div className="rounded-2xl border border-border bg-surface p-5 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {t("sectionPlayer")}
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="font-display text-base font-bold text-foreground">
                  {reservation.clientName}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {reservation.isFrequentPlayer
                    ? t("playerDniMeta", { dni: reservation.dni })
                    : t("playerDniOnly", { dni: reservation.dni })}
                </div>
              </div>
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 transition-all inline-flex items-center gap-1.5 cursor-pointer"
                id="drawer-wa-btn"
              >
                <span>💬</span> {t("whatsappLabel")}
              </a>
            </div>
          </div>

          {/* Court & Slot Specs */}
          <div className="rounded-2xl border border-border bg-surface p-5 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {t("sectionCourt")}
            </div>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <div className="text-muted-foreground">{t("venueLabel")}</div>
                <div className="font-bold text-foreground mt-0.5">{reservation.venue}</div>
              </div>
              <div>
                <div className="text-muted-foreground">{t("courtLabel")}</div>
                <div className="font-bold text-foreground mt-0.5">
                  {reservation.court} ({reservation.sport})
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">{t("dateLabel")}</div>
                <div className="font-bold text-foreground mt-0.5">{formatTime(reservation.dateDisplay)}</div>
              </div>
              <div>
                <div className="text-muted-foreground">{t("scheduleLabel")}</div>
                <div className="font-bold text-link mt-0.5">
                  {formatTime(reservation.timeSlot)} ({reservation.duration})
                </div>
              </div>
            </div>
          </div>

          {/* Financial Settlement */}
          <div className="rounded-2xl border border-border bg-surface p-5 space-y-3.5">
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {t("sectionFinance")}
            </div>
            <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-2.5 text-xs">
              {/* 1. Base Court Reservation Price */}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  {t("reservationSubtotalLabel")}
                </span>
                <span className="font-semibold text-foreground">
                  {currencySymbol}
                  {(reservation.subtotalUsd ?? reservation.priceUsd).toFixed(2)}{" "}
                  {currencyLabel}
                </span>
              </div>

              {/* 2. App Service Fee */}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  {t("appServiceFeeLabel")}
                </span>
                {(reservation.serviceFeeUsd ?? 0) > 0 ? (
                  <span className="font-semibold text-foreground">
                    +{currencySymbol}
                    {reservation.serviceFeeUsd.toFixed(2)} {currencyLabel}
                  </span>
                ) : (
                  <span className="rounded-md bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[11px] font-bold text-emerald-500">
                    {t("appServiceFeeExempt")}
                  </span>
                )}
              </div>

              {/* 3. Total in Foreign Currency */}
              <div className="flex items-center justify-between border-t border-dashed border-border pt-2">
                <span className="font-bold text-foreground">
                  {t("totalCurrencyLabel", { currency: currencyLabel })}
                </span>
                <span className="font-extrabold text-foreground text-sm">
                  {currencySymbol}
                  {reservation.priceUsd.toFixed(2)} {currencyLabel}
                </span>
              </div>

              {/* 4. Official BCV Exchange Rate */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-muted-foreground">{t("bcvRateLabel")}</span>
                <span className="font-medium text-foreground">
                  {reservation.rateBcv.toFixed(2)} Bs. / {currencyLabel}
                </span>
              </div>

              {/* 5. Total in Bolívares */}
              <div className="flex items-center justify-between border-t border-border pt-2.5 text-sm">
                <span className="font-bold text-foreground">{t("totalBsLabel")}</span>
                <span className="font-extrabold text-link">
                  {reservation.priceBs.toLocaleString("es-VE", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  Bs.
                </span>
              </div>
            </div>

            {/* Friendly Payment Method & Reference Breakdown */}
            <div className="rounded-xl border border-border bg-muted/25 px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground font-medium">
                  {t("paymentMethodLabel")}
                </span>
                <span
                  className={`font-bold ${
                    isCancelled && reservation.paymentMethod === "pending"
                      ? "text-rose-500"
                      : "text-foreground"
                  }`}
                >
                  {isCancelled && reservation.paymentMethod === "pending"
                    ? "Sin pago registrado (Reserva Cancelada)"
                    : reservation.paymentMethodLabel || reservation.paymentMeta}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {reservation.paymentBank && (
                  <span className="rounded-lg border border-border bg-surface px-2 py-0.5 text-[11px] font-semibold text-foreground">
                    🏦 {t("paymentBankLabel")} {reservation.paymentBank}
                  </span>
                )}
                {reservation.paymentReference && (
                  <span className="rounded-lg border border-border bg-surface px-2 py-0.5 font-mono text-[11px] font-bold text-foreground">
                    {t("paymentRefLabel")} {reservation.paymentReference}
                  </span>
                )}
              </div>
            </div>

            {isCancelled && reservation.cancellationReason && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-xs">
                <span className="font-bold text-rose-500">Motivo de cancelación: </span>
                <span className="text-foreground">{reservation.cancellationReason}</span>
              </div>
            )}
          </div>
        </div>

        {/* DRAWER FOOTER */}
        <div className="border-t border-border bg-muted/50 p-5 flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
          >
            {t("btnClose")}
          </Button>

          {!isValidator && reservation.status !== "CANCELLED" && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => onOpenCancel(reservation)}
            >
              {t("btnCancelBooking")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
