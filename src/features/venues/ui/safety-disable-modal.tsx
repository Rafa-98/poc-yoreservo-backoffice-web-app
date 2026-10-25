"use client";

import React, { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
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
  const locale = useLocale();
  const isEn = locale.toLowerCase().startsWith("en");
  const t = useTranslations("venues.safety");
  const [selectedAction, setSelectedAction] = useState<
    "reassign" | "defer" | "cancel"
  >("reassign");
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
      className="modal-backdrop z-[10000]"
      id="safety-modal-backdrop"
      onClick={onClose}
    >
      <div
        className="modal-card w-full max-w-[520px] overflow-hidden rounded-2xl border border-border-medium bg-surface shadow-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-5">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">⚠️</span>
            <h3 className="m-0 text-lg font-bold text-status-cancelled-fg">
              {t("title")}
            </h3>
          </div>
          <button
            type="button"
            aria-label={isEn ? "Close modal" : "Cerrar modal"}
            className="btn-icon cursor-pointer border-none bg-transparent text-lg text-muted-foreground hover:text-foreground"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="p-6">
          <div className="mb-4.5 rounded-xl border border-status-cancelled-border bg-status-cancelled-bg p-3.5 text-[13px] leading-relaxed text-foreground">
            {t("conflictBanner", {
              courtName: space.spaceNumber,
              count: activeBookingsCount,
            })}
          </div>

          <div className="mb-2.5 text-[13px] font-bold text-foreground">
            {t("optionsTitle")}
          </div>

          <div className="mb-5 flex flex-col gap-2.5">
            <label
              className={`flex cursor-pointer items-start gap-2.5 rounded-xl border border-border-medium p-3 ${
                selectedAction === "reassign" ? "bg-muted" : "bg-surface"
              }`}
            >
              <input
                type="radio"
                name="safety_action"
                value="reassign"
                checked={selectedAction === "reassign"}
                onChange={() => setSelectedAction("reassign")}
                className="mt-1 accent-accent"
              />
              <div>
                <div className="text-[13px] font-bold text-foreground">
                  {t("optReassignTitle")}
                </div>
                <div className="text-[11.5px] text-muted-foreground">
                  {t("optReassignDesc")}
                </div>
              </div>
            </label>

            <label
              className={`flex cursor-pointer items-start gap-2.5 rounded-xl border border-border-medium p-3 ${
                selectedAction === "defer" ? "bg-muted" : "bg-surface"
              }`}
            >
              <input
                type="radio"
                name="safety_action"
                value="defer"
                checked={selectedAction === "defer"}
                onChange={() => setSelectedAction("defer")}
                className="mt-1 accent-accent"
              />
              <div>
                <div className="text-[13px] font-bold text-foreground">
                  {t("optDeferTitle")}
                </div>
                <div className="text-[11.5px] text-muted-foreground">
                  {t("optDeferDesc")}
                </div>
              </div>
            </label>

            <label
              className={`flex cursor-pointer items-start gap-2.5 rounded-xl border border-border-medium p-3 ${
                selectedAction === "cancel" ? "bg-muted" : "bg-surface"
              }`}
            >
              <input
                type="radio"
                name="safety_action"
                value="cancel"
                checked={selectedAction === "cancel"}
                onChange={() => setSelectedAction("cancel")}
                className="mt-1 accent-accent"
              />
              <div>
                <div className="text-[13px] font-bold text-status-cancelled-fg">
                  {t("optCancelTitle")}
                </div>
                <div className="text-[11.5px] text-muted-foreground">
                  {t("optCancelDesc")}
                </div>
              </div>
            </label>
          </div>

          <div className="mt-6 flex justify-end gap-3">
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
