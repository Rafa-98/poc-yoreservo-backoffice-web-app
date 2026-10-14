"use client";

import { useState } from "react";
import { ShieldAlert, Trash2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/shared/ui/button";
import type { CourtBlock, CourtSpace } from "../model/types";
import {
  createBlockAction,
  deleteBlockAction,
} from "../actions/agenda-actions";

export interface SpaceBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  court: CourtSpace | null;
  selectedDate: string;
  startTime: string;
  existingBlock?: CourtBlock | null;
  onRefresh: () => void;
}

export function SpaceBlockModal({
  isOpen,
  onClose,
  court,
  selectedDate,
  startTime,
  existingBlock,
  onRefresh,
}: SpaceBlockModalProps) {
  const t = useTranslations("agenda");

  const [reason, setReason] = useState(t("blockRain"));
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !court) return null;

  const [h] = startTime.split(":").map(Number);
  const endTime = `${String(h + 1).padStart(2, "0")}:00`;

  const handleCreateBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    await createBlockAction({
      spaceId: court.id,
      blockDate: selectedDate,
      startTime,
      endTime,
      reason,
      notes: notes || undefined,
    });

    setIsSubmitting(false);
    onRefresh();
    onClose();
  };

  const handleDeleteBlock = async () => {
    if (!existingBlock) return;
    setIsSubmitting(true);

    await deleteBlockAction(existingBlock.id);

    setIsSubmitting(false);
    onRefresh();
    onClose();
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="relative w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-modal animate-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-xl bg-status-blocked-bg text-status-blocked-fg border border-status-blocked-border">
                <ShieldAlert className="size-5" />
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-foreground">
                  {existingBlock ? t("blockDisabledTitle") : t("blockModalTitle")}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {court.spaceNumber} ({startTime} - {endTime})
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="size-5" />
            </button>
          </div>

          {existingBlock ? (
            <div className="py-4 space-y-4">
              <div className="rounded-xl border border-border bg-background p-3.5 space-y-2 text-xs">
                <div>
                  <span className="text-muted-foreground">{t("blockReasonLabel")}:</span>
                  <strong className="block text-foreground text-sm font-semibold mt-0.5">
                    {existingBlock.reason}
                  </strong>
                </div>
                {existingBlock.notes && (
                  <div>
                    <span className="text-muted-foreground">{t("blockNotesLabel")}:</span>
                    <p className="text-foreground mt-0.5">{existingBlock.notes}</p>
                  </div>
                )}
                {existingBlock.creator && (
                  <div className="text-[11px] text-muted-foreground pt-1 border-t border-border">
                    {t("blockCreatedBy", { name: existingBlock.creator })}
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Button variant="secondary" fullWidth onClick={onClose}>
                  {t("btnClose")}
                </Button>
                <Button
                  variant="destructive"
                  fullWidth
                  isLoading={isSubmitting}
                  onClick={handleDeleteBlock}
                >
                  <Trash2 className="size-4" />
                  <span>{t("btnUnblock")}</span>
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleCreateBlock} className="py-4 space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="block font-semibold uppercase text-muted-foreground">
                  {t("blockReason")}
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none cursor-pointer"
                >
                  <option value={t("blockRain")}>{t("blockRain")}</option>
                  <option value={t("blockMaintenance")}>{t("blockMaintenance")}</option>
                  <option value={t("blockPrivate")}>{t("blockPrivate")}</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block font-semibold uppercase text-muted-foreground">
                  {t("blockNotes")}
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t("blockNotesPlaceholder")}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-foreground focus:border-accent focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="secondary" fullWidth onClick={onClose}>
                  {t("btnCancel")}
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  isLoading={isSubmitting}
                >
                  <span>{t("btnConfirmBlock")}</span>
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
