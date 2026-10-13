"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/shared/ui/button";
import type { SpaceItem } from "../model/types";

interface SafetyDisableModalProps {
  isOpen: boolean;
  onClose: () => void;
  space: SpaceItem | null;
  activeBookingsCount: number;
  onConfirm: (action: "reassign" | "defer" | "cancel") => Promise<void>;
}

export function SafetyDisableModal({
  isOpen,
  onClose,
  space,
  activeBookingsCount,
  onConfirm,
}: SafetyDisableModalProps) {
  const t = useTranslations("venues.safety");
  const [selectedAction, setSelectedAction] = useState<"reassign" | "defer" | "cancel">("reassign");
  const [loading, setLoading] = useState(false);

  if (!isOpen || !space) return null;

  async function handleApply() {
    setLoading(true);
    try {
      await onConfirm(selectedAction);
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="modal-backdrop"
      id="safety-modal-backdrop"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.65)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
        padding: "16px",
      }}
    >
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-medium)",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "520px",
          boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid var(--border-subtle)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "24px" }}>⚠️</span>
            <h3
              style={{
                fontSize: "18px",
                fontWeight: 700,
                color: "var(--status-cancelled-text, #ef4444)",
                margin: 0,
              }}
            >
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
              fontSize: "18px",
              cursor: "pointer",
              color: "var(--text-muted)",
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: "24px" }}>
          <div
            style={{
              background: "rgba(220, 38, 38, 0.1)",
              border: "1px solid rgba(220, 38, 38, 0.25)",
              borderRadius: "14px",
              padding: "14px",
              marginBottom: "18px",
              fontSize: "13px",
              lineHeight: "1.5",
            }}
          >
            <strong>{space.spaceNumber}</strong> tiene{" "}
            <strong>{activeBookingsCount} reservas confirmadas</strong> pendientes de jugar.
            Deshabilitarla directamente dejaría a los jugadores sin cancha asignada.
          </div>

          <div
            style={{
              fontWeight: 700,
              fontSize: "13px",
              marginBottom: "10px",
              color: "var(--text-main)",
            }}
          >
            {t("optionsTitle")}
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              marginBottom: "20px",
            }}
          >
            <label
              style={{
                display: "flex",
                gap: "10px",
                alignItems: "flex-start",
                padding: "12px",
                border: "1px solid var(--border-medium)",
                borderRadius: "12px",
                cursor: "pointer",
                background:
                  selectedAction === "reassign"
                    ? "var(--bg-muted)"
                    : "var(--bg-surface)",
              }}
            >
              <input
                type="radio"
                name="safety_action"
                value="reassign"
                checked={selectedAction === "reassign"}
                onChange={() => setSelectedAction("reassign")}
                style={{ marginTop: "3px", accentColor: "var(--brand-lime)" }}
              />
              <div>
                <div style={{ fontWeight: 700, fontSize: "13px" }}>
                  {t("optReassignTitle")}
                </div>
                <div style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>
                  {t("optReassignDesc")}
                </div>
              </div>
            </label>

            <label
              style={{
                display: "flex",
                gap: "10px",
                alignItems: "flex-start",
                padding: "12px",
                border: "1px solid var(--border-medium)",
                borderRadius: "12px",
                cursor: "pointer",
                background:
                  selectedAction === "defer"
                    ? "var(--bg-muted)"
                    : "var(--bg-surface)",
              }}
            >
              <input
                type="radio"
                name="safety_action"
                value="defer"
                checked={selectedAction === "defer"}
                onChange={() => setSelectedAction("defer")}
                style={{ marginTop: "3px", accentColor: "var(--brand-lime)" }}
              />
              <div>
                <div style={{ fontWeight: 700, fontSize: "13px" }}>
                  {t("optDeferTitle")}
                </div>
                <div style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>
                  {t("optDeferDesc")}
                </div>
              </div>
            </label>

            <label
              style={{
                display: "flex",
                gap: "10px",
                alignItems: "flex-start",
                padding: "12px",
                border: "1px solid var(--border-medium)",
                borderRadius: "12px",
                cursor: "pointer",
                background:
                  selectedAction === "cancel"
                    ? "var(--bg-muted)"
                    : "var(--bg-surface)",
              }}
            >
              <input
                type="radio"
                name="safety_action"
                value="cancel"
                checked={selectedAction === "cancel"}
                onChange={() => setSelectedAction("cancel")}
                style={{ marginTop: "3px", accentColor: "var(--brand-lime)" }}
              />
              <div>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: "13px",
                    color: "var(--status-cancelled-text, #ef4444)",
                  }}
                >
                  {t("optCancelTitle")}
                </div>
                <div style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>
                  {t("optCancelDesc")}
                </div>
              </div>
            </label>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onClose}
              disabled={loading}
              id="btn-safety-cancel"
            >
              {t("cancel")}
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleApply}
              isLoading={loading}
              id="btn-safety-confirm"
            >
              {t("btnApply")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
