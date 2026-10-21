"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
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
}

export function ReservationDetailDrawer({
  isOpen,
  reservation,
  onClose,
  onRefresh,
  onOpenCancel,
}: ReservationDetailDrawerProps) {
  const t = useTranslations("reservations.drawer");
  const { formatTime } = useTimeFormat();
  const [checkingIn, setCheckingIn] = useState(false);

  if (!isOpen || !reservation) return null;

  async function handleCheckIn() {
    if (!reservation) return;
    setCheckingIn(true);
    const res = await checkInReservationAction(reservation.id, "SHORT_CODE_MANUAL");
    setCheckingIn(false);
    if (res.ok) {
      onRefresh();
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
                <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-bold text-emerald-400">
                  {reservation.status}
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
          <div className="rounded-2xl border border-border bg-muted/50 p-5 flex flex-wrap items-center justify-between gap-4">
            <div>
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
                  : t("checkInDesc")}
              </div>
            </div>

            {reservation.checkedIn ? (
              <span className="rounded-xl border border-emerald-500/30 bg-emerald-500/15 px-3 py-1.5 text-xs font-bold text-emerald-400">
                {t("btnCheckedInDone")}
              </span>
            ) : (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleCheckIn}
                isLoading={checkingIn}
                disabled={checkingIn || reservation.status === "CANCELLED"}
                id="drawer-checkin-btn"
              >
                {checkingIn ? t("btnCheckingIn") : t("btnCheckIn")}
              </Button>
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
                <div className="font-bold text-accent mt-0.5">
                  {formatTime(reservation.timeSlot)} ({reservation.duration})
                </div>
              </div>
            </div>
          </div>

          {/* Financial Settlement */}
          <div className="rounded-2xl border border-border bg-surface p-5 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {t("sectionFinance")}
            </div>
            <div className="rounded-xl border border-border bg-muted/40 p-3.5 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("courtRateLabel")}</span>
                <span className="font-bold text-foreground">${reservation.priceUsd.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("bcvRateLabel")}</span>
                <span className="text-foreground">{reservation.rateBcv.toFixed(2)} Bs. / USD</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2 text-sm">
                <span className="font-bold text-foreground">{t("totalBsLabel")}</span>
                <span className="font-extrabold text-accent">
                  {reservation.priceBs.toLocaleString("es-VE", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  Bs.
                </span>
              </div>
            </div>

            <div className="text-xs text-muted-foreground">
              {t("paymentMeta", {
                method: reservation.paymentMethod.toUpperCase(),
                ref: reservation.paymentMeta,
              })}
            </div>
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

          {reservation.status !== "CANCELLED" && (
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
