"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/shared/ui/button";
import { resetPasswordAction } from "../actions/users-actions";
import type { UserItem } from "../model/types";

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserItem | null;
}

export function ResetPasswordModal({
  isOpen,
  onClose,
  user,
}: ResetPasswordModalProps) {
  const t = useTranslations("users.modalReset");

  const [tempPass, setTempPass] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !user) return null;

  async function handleReset() {
    if (!user) return;
    setLoading(true);
    setErrorMsg(null);

    const res = await resetPasswordAction(user.id);
    setLoading(false);

    if (res.ok && res.data?.tempPassword) {
      setTempPass(res.data.tempPassword);
    } else if (!res.ok) {
      setErrorMsg(res.error.code || t("errorReset"));
    }
  }

  function handleCopy() {
    if (!tempPass) return;
    navigator.clipboard.writeText(tempPass);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      className="modal-backdrop"
      id="reset-pass-modal-backdrop"
      onClick={onClose}
    >
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "460px" }}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🔑</span>
            <div>
              <h3 className="font-display text-lg font-bold text-foreground">
                {t("title")}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t("desc")}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-lg cursor-pointer p-1"
          >
            ✕
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {errorMsg && (
            <div className="rounded-xl border border-destructive/30 bg-destructive-subtle p-3 text-xs text-destructive">
              ⚠️ {errorMsg}
            </div>
          )}

          <div className="rounded-xl border border-border bg-muted/60 p-3.5 text-xs text-foreground">
            {t("collaboratorLabel")}: <strong>{user.name}</strong> ({user.email})
          </div>

          {tempPass ? (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-muted-foreground">
                {t("tempPassLabel")}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={tempPass}
                  className="form-input flex-1 font-mono text-sm font-bold text-link bg-accent/20 border-accent"
                />
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleCopy}
                  id="btn-copy-temp-pass"
                >
                  {copied ? t("copied") : t("btnCopy")}
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t("confirmDesc")}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-border">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onClose}
              id="btn-close-reset"
            >
              {t("cancel")}
            </Button>
            {!tempPass && (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleReset}
                isLoading={loading}
                id="btn-submit-reset"
              >
                {t("submit")}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
