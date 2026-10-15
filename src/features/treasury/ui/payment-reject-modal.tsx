"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { PaymentItem } from "../model/types";

interface PaymentRejectModalProps {
  payment: PaymentItem | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    paymentId: string,
    reason: string,
    action: "RETRY" | "CANCEL",
    notes?: string,
  ) => Promise<void>;
  isProcessing?: boolean;
}

export function PaymentRejectModal({
  payment,
  isOpen,
  onClose,
  onConfirm,
  isProcessing = false,
}: PaymentRejectModalProps) {
  const t = useTranslations("treasury.inbox.rejectModal");

  const [reason, setReason] = useState("NOT_FOUND");
  const [notes, setNotes] = useState("");

  if (!isOpen || !payment) return null;

  const handleAction = async (action: "RETRY" | "CANCEL") => {
    await onConfirm(payment.id, reason, action, notes);
  };

  return (
    <div
      className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        id="reject-payment-modal-card"
        className="modal-card w-full max-w-[500px] overflow-hidden rounded-[20px] border border-border bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-border px-6 py-5">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">⚠️</span>
            <h3 className="m-0 text-[17px] font-bold text-foreground">
              {t("title")}
            </h3>
          </div>
          <button
            type="button"
            className="btn-icon cursor-pointer rounded-lg p-1.5 text-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* BODY */}
        <div className="p-6">
          <p className="mb-4.5 text-[13px] leading-relaxed text-muted-foreground">
            {t("desc")}
          </p>

          <div className="form-group mb-4">
            <label
              className="form-label mb-1.5 block text-xs font-bold text-foreground"
              htmlFor="reject-reason-select"
            >
              {t("reasonLabel")}
            </label>
            <select
              id="reject-reason-select"
              className="input-field w-full cursor-pointer rounded-[10px] border border-border bg-muted px-3 py-2 text-[13px] text-foreground"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            >
              <option value="NOT_FOUND">{t("reasons.notFound")}</option>
              <option value="INCORRECT_AMOUNT">{t("reasons.incorrectAmount")}</option>
              <option value="DUPLICATED">{t("reasons.duplicated")}</option>
              <option value="OTHER">{t("reasons.other")}</option>
            </select>
          </div>

          <div className="form-group mb-5.5">
            <label
              className="form-label mb-1.5 block text-xs font-bold text-foreground"
              htmlFor="reject-notes-textarea"
            >
              {t("notesLabel")}
            </label>
            <textarea
              id="reject-notes-textarea"
              className="input-field w-full resize-y rounded-[10px] border border-border bg-muted px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground"
              rows={3}
              placeholder={t("notesPlaceholder")}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2.5">
            <button
              id="confirm-reject-retry-button"
              type="button"
              className="w-full cursor-pointer rounded-[10px] border border-amber-500/40 bg-amber-500/15 px-4 py-2.5 text-[13px] font-bold text-amber-700 transition-colors hover:bg-amber-500/25 disabled:opacity-50 dark:text-amber-300"
              onClick={() => handleAction("RETRY")}
              disabled={isProcessing}
            >
              ⏳ {isProcessing ? t("rejecting") : t("confirmRetry")}
            </button>

            <button
              id="confirm-reject-button"
              type="button"
              className="btn btn-destructive w-full rounded-[10px] px-4 py-2.5 text-[13px]"
              onClick={() => handleAction("CANCEL")}
              disabled={isProcessing}
            >
              ✕ {isProcessing ? t("rejecting") : t("confirmCancelBooking")}
            </button>

            <button
              type="button"
              className="btn btn-outline w-full rounded-[10px] px-4 py-2 text-[13px]"
              onClick={onClose}
              disabled={isProcessing}
            >
              {t("cancel")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
