"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { PaymentItem } from "../model/types";

interface PaymentRejectModalProps {
  payment: PaymentItem | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (paymentId: string, reason: string, notes?: string) => Promise<void>;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onConfirm(payment.id, reason, notes);
  };

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.6)",
        backdropFilter: "blur(4px)",
        zIndex: 10000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        id="reject-payment-modal-card"
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
          borderRadius: 20,
          width: "100%",
          maxWidth: 480,
          boxShadow: "var(--shadow-lg)",
          overflow: "hidden",
        }}
      >
        {/* HEADER */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid var(--border-subtle)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>⚠️</span>
            <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: "var(--text-main)" }}>
              {t("title")}
            </h3>
          </div>
          <button
            type="button"
            className="btn-icon"
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: 18,
              cursor: "pointer",
              color: "var(--text-muted)",
            }}
          >
            ✕
          </button>
        </div>

        {/* BODY */}
        <form onSubmit={handleSubmit} style={{ padding: 24 }}>
          <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5, marginBottom: 18 }}>
            {t("desc")}
          </p>

          <div className="form-group" style={{ marginBottom: 16 }}>
            <label
              className="form-label"
              htmlFor="reject-reason-select"
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 700,
                color: "var(--text-main)",
                marginBottom: 6,
              }}
            >
              {t("reasonLabel")}
            </label>
            <select
              id="reject-reason-select"
              className="input-field"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              style={{
                width: "100%",
                padding: "9px 12px",
                fontSize: 13,
                borderRadius: 10,
                background: "var(--bg-muted)",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-main)",
                cursor: "pointer",
              }}
            >
              <option value="NOT_FOUND">{t("reasons.notFound")}</option>
              <option value="INCORRECT_AMOUNT">{t("reasons.incorrectAmount")}</option>
              <option value="DUPLICATED">{t("reasons.duplicated")}</option>
              <option value="OTHER">{t("reasons.other")}</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 22 }}>
            <label
              className="form-label"
              htmlFor="reject-notes-textarea"
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 700,
                color: "var(--text-main)",
                marginBottom: 6,
              }}
            >
              {t("notesLabel")}
            </label>
            <textarea
              id="reject-notes-textarea"
              className="input-field"
              rows={3}
              placeholder={t("notesPlaceholder")}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{
                width: "100%",
                padding: "9px 12px",
                fontSize: 13,
                borderRadius: 10,
                background: "var(--bg-muted)",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-main)",
                fontFamily: "inherit",
                resize: "vertical",
              }}
            />
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              className="btn btn-outline"
              style={{ flex: 1, padding: "10px 16px", fontSize: 13, borderRadius: 10 }}
              onClick={onClose}
              disabled={isProcessing}
            >
              {t("cancel")}
            </button>
            <button
              id="confirm-reject-button"
              type="submit"
              className="btn btn-destructive"
              style={{ flex: 1.5, padding: "10px 16px", fontSize: 13, borderRadius: 10 }}
              disabled={isProcessing}
            >
              {isProcessing ? "Rechazando..." : t("confirm")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
