"use client";

import { useTranslations } from "next-intl";
import { AlertTriangle, X } from "lucide-react";

interface ProfileRevokeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isSubmitting?: boolean;
}

export function ProfileRevokeModal({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting = false,
}: ProfileRevokeModalProps) {
  const t = useTranslations("profile");

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-surface-muted transition-colors cursor-pointer"
        >
          <X className="size-4" />
        </button>

        <div className="flex items-start gap-4">
          <div className="size-10 rounded-xl bg-red-500/15 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="size-5" />
          </div>

          <div>
            <h3 className="font-display text-base font-bold text-foreground">
              {t("sessions.modalTitle")}
            </h3>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              {t("sessions.modalDesc")}
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl border border-border bg-surface text-foreground text-xs font-semibold hover:bg-surface-muted active:scale-95 transition-all cursor-pointer shadow-2xs"
          >
            {t("sessions.modalCancel")}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 active:scale-95 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? t("general.saving") : t("sessions.modalConfirm")}
          </button>
        </div>
      </div>
    </div>
  );
}
