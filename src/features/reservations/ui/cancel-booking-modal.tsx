"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/shared/ui/button";
import { cancelReservationAction } from "../actions/reservations-actions";
import type { ReservationItem } from "../model/types";

interface CancelBookingModalProps {
  isOpen: boolean;
  reservation: ReservationItem | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function CancelBookingModal({
  isOpen,
  reservation,
  onClose,
  onSuccess,
}: CancelBookingModalProps) {
  const t = useTranslations("reservations.modalCancel");

  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !reservation) return null;

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    if (!reservation) return;
    setLoading(true);
    setErrorMsg(null);

    const res = await cancelReservationAction(reservation.id, reason.trim());
    setLoading(false);

    if (res.ok) {
      onSuccess();
      onClose();
    } else {
      setErrorMsg(res.error.code || "Error al cancelar la reserva");
    }
  }

  return (
    <div
      className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      id="cancel-modal-backdrop"
    >
      <div
        className="modal-card w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border p-6 bg-surface">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <h3 className="font-display text-lg font-bold text-foreground">
                {t("title", { code: reservation.code })}
              </h3>
              <p className="text-xs text-rose-400 font-semibold mt-0.5">
                {reservation.court} • {reservation.dateDisplay} ({reservation.timeSlot})
              </p>
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

        <form onSubmit={handleConfirm}>
          <div className="p-6 space-y-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t("desc")}
            </p>

            {errorMsg && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs font-semibold text-rose-400">
                {errorMsg}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                {t("reasonLabel")}
              </label>
              <textarea
                required
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t("reasonPlaceholder")}
                className="form-input resize-none"
                id="cancel-reason"
              />
            </div>
          </div>

          <div className="border-t border-border bg-muted/50 p-5 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onClose}
              disabled={loading}
            >
              {t("btnBack")}
            </Button>

            <Button
              type="submit"
              variant="destructive"
              size="sm"
              disabled={loading}
              id="btn-confirm-cancel"
            >
              {loading ? "Cancelando..." : t("btnConfirm")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
