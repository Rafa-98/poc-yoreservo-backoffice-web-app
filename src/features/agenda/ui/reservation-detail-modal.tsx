"use client";

import { useState } from "react";
import {
  CheckCircle2,
  DollarSign,
  MapPin,
  MessageSquare,
  Phone,
  ShieldCheck,
  User,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useTimeFormat } from "@/shared/lib";
import { Button } from "@/shared/ui/button";
import type { CourtReservation, CourtSpace } from "../model/types";
import { checkInAction } from "../actions/agenda-actions";

export interface ReservationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservation: CourtReservation | null;
  court: CourtSpace | null;
  onRefresh: () => void;
}

export function ReservationDetailModal({
  isOpen,
  onClose,
  reservation,
  court,
  onRefresh,
}: ReservationDetailModalProps) {
  const t = useTranslations("agenda");
  const { formatTime } = useTimeFormat();
  const [isCheckingIn, setIsCheckingIn] = useState(false);

  if (!isOpen || !reservation || !court) return null;

  const isCompleted = reservation.status === "COMPLETED";
  const isConfirmed = reservation.status === "CONFIRMED";

  const handleCheckInNow = async () => {
    setIsCheckingIn(true);
    await checkInAction({
      code: reservation.shortCode,
      method: "SHORT_CODE_MANUAL",
    });
    setIsCheckingIn(false);
    onRefresh();
    onClose();
  };

  const cleanPhone = reservation.customerPhone?.replace(/[^0-9]/g, "") || "";

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="relative w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-modal animate-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-base font-bold text-foreground">
                  #{reservation.shortCode}
                </span>
                <span
                  className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                    isCompleted
                      ? "bg-status-completed-fg/15 text-status-completed-fg"
                      : isConfirmed
                      ? "bg-status-confirmed-fg/15 text-status-confirmed-fg"
                      : "bg-status-hold-fg/15 text-status-hold-fg"
                  }`}
                >
                  {isCompleted
                    ? t("badgeChecked")
                    : isConfirmed
                    ? t("badgePaid")
                    : t("badgePending")}
                </span>
              </div>
              <h3 className="font-display text-lg font-bold text-foreground mt-0.5">
                {t("detailModalTitle")}
              </h3>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Details Body */}
          <div className="py-4 space-y-3.5 text-xs">
            {/* Player */}
            <div className="rounded-xl border border-border bg-background p-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded-lg bg-accent/20 text-accent-foreground font-bold">
                  <User className="size-4" />
                </div>
                <div>
                  <div className="font-semibold text-foreground text-sm">
                    {reservation.customerName}
                  </div>
                  <div className="text-muted-foreground text-[11px] flex items-center gap-1">
                    <Phone className="size-3" />
                    <span>{reservation.customerPhone || t("noPhoneRegistered")}</span>
                  </div>
                </div>
              </div>

              {cleanPhone && (
                <a
                  href={`https://wa.me/${cleanPhone}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 rounded-lg bg-emerald-500/20 px-2.5 py-1.5 font-bold text-emerald-600 hover:bg-emerald-500/30 transition-colors"
                >
                  <MessageSquare className="size-3.5" />
                  <span>{t("whatsappLabel")}</span>
                </a>
              )}
            </div>

            {/* Court & Time */}
            <div className="rounded-xl border border-border bg-background p-3 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">{t("detailCourt")}:</span>
                <strong className="font-semibold text-foreground">
                  {court.spaceNumber}
                </strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">{t("detailTime")}:</span>
                <strong className="font-mono font-semibold text-foreground">
                  {formatTime(reservation.startTime)} - {formatTime(reservation.endTime)}
                </strong>
              </div>

              <div className="flex justify-between items-center border-t border-border pt-2 font-bold text-sm">
                <span className="text-muted-foreground">{t("detailAmount")}:</span>
                <span className="text-link">
                  ${reservation.totalAmount.toFixed(2)} {reservation.currencyCode}
                </span>
              </div>
            </div>

            {/* Notes if any */}
            {reservation.internalNotes && (
              <div className="rounded-xl border border-border bg-muted/60 p-3 text-muted-foreground">
                <span className="block font-semibold text-[11px] uppercase mb-0.5">
                  {t("deskNotesLabel")}:
                </span>
                <p>{reservation.internalNotes}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="border-t border-border pt-4 flex gap-3">
            {!isCompleted && (
              <Button
                variant="primary"
                fullWidth
                isLoading={isCheckingIn}
                onClick={handleCheckInNow}
              >
                <CheckCircle2 className="size-4" />
                <span>{t("btnCheckIn")}</span>
              </Button>
            )}
            <Button variant="secondary" fullWidth onClick={onClose}>
              {t("btnClose")}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
