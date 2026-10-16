"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Key, Check, Circle, ShieldAlert } from "lucide-react";
import type { ChangePasswordInput } from "../model/types";

interface ProfilePasswordFormProps {
  onSubmit: (input: ChangePasswordInput) => Promise<boolean | void>;
  isSubmitting?: boolean;
}

export function ProfilePasswordForm({
  onSubmit,
  isSubmitting = false,
}: ProfilePasswordFormProps) {
  const t = useTranslations("profile");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const hasLength = newPassword.length >= 8 && newPassword.length <= 72;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSymbol = /[@$!%*?&#^()_+=\-[\]{};:'",.<>/|\\~`]/.test(newPassword);

  const allRulesValid =
    hasLength && hasUpper && hasLower && hasNumber && hasSymbol;
  const passwordsMatch =
    confirmPassword.length > 0 && newPassword === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allRulesValid || !passwordsMatch) return;

    const res = await onSubmit({
      currentPassword,
      newPassword,
    });

    if (res !== false) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
      {/* Current Password */}
      <div>
        <label className="block text-xs font-bold text-foreground mb-1.5">
          {t("security.currentPass")}
        </label>
        <input
          type="password"
          required
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          placeholder={t("security.currentPassPlaceholder")}
          className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface text-foreground text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-accent/40 shadow-2xs"
        />
      </div>

      {/* New Password */}
      <div>
        <label className="block text-xs font-bold text-foreground mb-1.5">
          {t("security.newPass")}
        </label>
        <input
          type="password"
          required
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder={t("security.newPassPlaceholder")}
          className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface text-foreground text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-accent/40 shadow-2xs"
        />

        {/* Bcrypt Rules Checklist */}
        <div className="mt-3 rounded-xl border border-border bg-surface-muted p-3.5 space-y-2 text-xs">
          <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            {t("security.passReqsTitle")}
          </div>

          <div
            className={`flex items-center gap-2 ${
              hasLength
                ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                : "text-muted-foreground"
            }`}
          >
            {hasLength ? <Check className="size-3.5" /> : <Circle className="size-3" />}
            <span>{t("security.reqLength")}</span>
          </div>

          <div
            className={`flex items-center gap-2 ${
              hasUpper
                ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                : "text-muted-foreground"
            }`}
          >
            {hasUpper ? <Check className="size-3.5" /> : <Circle className="size-3" />}
            <span>{t("security.reqUpper")}</span>
          </div>

          <div
            className={`flex items-center gap-2 ${
              hasLower
                ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                : "text-muted-foreground"
            }`}
          >
            {hasLower ? <Check className="size-3.5" /> : <Circle className="size-3" />}
            <span>{t("security.reqLower")}</span>
          </div>

          <div
            className={`flex items-center gap-2 ${
              hasNumber
                ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                : "text-muted-foreground"
            }`}
          >
            {hasNumber ? <Check className="size-3.5" /> : <Circle className="size-3" />}
            <span>{t("security.reqNumber")}</span>
          </div>

          <div
            className={`flex items-center gap-2 ${
              hasSymbol
                ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                : "text-muted-foreground"
            }`}
          >
            {hasSymbol ? <Check className="size-3.5" /> : <Circle className="size-3" />}
            <span>{t("security.reqSymbol")}</span>
          </div>
        </div>
      </div>

      {/* Confirm Password */}
      <div>
        <label className="block text-xs font-bold text-foreground mb-1.5">
          {t("security.confirmPass")}
        </label>
        <input
          type="password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder={t("security.confirmPassPlaceholder")}
          className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface text-foreground text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-accent/40 shadow-2xs"
        />

        {confirmPassword.length > 0 && (
          <div className="mt-1.5 text-xs font-medium">
            {passwordsMatch ? (
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <Check className="size-3.5" />
                <span>{t("security.passwordsMatch")}</span>
              </span>
            ) : (
              <span className="text-red-500 flex items-center gap-1">
                <ShieldAlert className="size-3.5" />
                <span>{t("security.passwordsMismatch")}</span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Submit Button */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={!allRulesValid || !passwordsMatch || isSubmitting}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-accent-foreground font-bold text-xs sm:text-sm shadow-xs hover:brightness-105 active:scale-98 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          <Key className="size-4" />
          <span>
            {isSubmitting ? t("security.updating") : t("security.updatePass")}
          </span>
        </button>
      </div>
    </form>
  );
}
