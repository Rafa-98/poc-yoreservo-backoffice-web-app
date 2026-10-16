"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Check,
  Circle,
  Eye,
  EyeOff,
  Lock,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { getDefaultRouteForRole, isBackofficeRole, ROUTES } from "@/shared/config";
import { Button } from "@/shared/ui/button";
import { Alert } from "@/shared/ui/alert";
import {
  validateInvitationAction,
  setPasswordAction,
  type InvitationDetails,
} from "../actions/set-password-action";

interface SetPasswordFormProps {
  initialInvitation?: InvitationDetails | null;
  onInvitationLoaded?: (invitation: InvitationDetails | null) => void;
}

export function SetPasswordForm({
  initialInvitation = null,
  onInvitationLoaded,
}: SetPasswordFormProps = {}) {
  const t = useTranslations("auth");
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState(initialInvitation?.name || "");
  const [lastName, setLastName] = useState(initialInvitation?.lastName || "");

  const [isValidating, setIsValidating] = useState(!initialInvitation);
  const [invitation, setInvitation] = useState<InvitationDetails | null>(
    initialInvitation
  );
  const [validationError, setValidationError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Validate token on mount
  useEffect(() => {
    let isMounted = true;
    async function checkToken() {
      if (!token) {
        if (isMounted) {
          setValidationError(t("errorInvalidToken"));
          setIsValidating(false);
        }
        return;
      }

      const res = await validateInvitationAction(token);
      if (!isMounted) return;

      if (!res.ok) {
        setValidationError(t("errorInvalidToken"));
      } else {
        setInvitation(res.data);
        onInvitationLoaded?.(res.data);
        if (res.data.name) setName(res.data.name);
        if (res.data.lastName) setLastName(res.data.lastName);
      }
      setIsValidating(false);
    }

    checkToken();
    return () => {
      isMounted = false;
    };
  }, [token, t, onInvitationLoaded]);

  // Checklist validation criteria
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const isFormValid =
    hasMinLength &&
    hasUpper &&
    hasLower &&
    hasNumber &&
    hasSpecial &&
    passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || !token) return;

    setIsSubmitting(true);
    setSubmitError(null);

    const res = await setPasswordAction({
      token,
      password,
      name,
      lastName,
    });

    setIsSubmitting(false);

    if (!res.ok) {
      setSubmitError(t("errorInvalidToken"));
      return;
    }

    const resolvedRole = res.data.role || invitation?.role;
    const targetRoute =
      resolvedRole && isBackofficeRole(resolvedRole)
        ? getDefaultRouteForRole(resolvedRole)
        : ROUTES.login;

    setIsSuccess(true);
    setTimeout(() => {
      router.push(targetRoute);
      router.refresh();
    }, 1500);
  };

  if (isValidating) {
    return (
      <div className="w-full rounded-2xl border border-border bg-surface p-8 text-center shadow-card">
        <div className="mx-auto size-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        <p className="mt-4 text-xs font-medium text-muted-foreground">
          {t("btnActivating")}
        </p>
      </div>
    );
  }

  if (validationError && !invitation) {
    return (
      <div className="w-full rounded-2xl border border-border bg-surface p-6 sm:p-8 shadow-card text-center">
        <Alert variant="error">{validationError}</Alert>
        <Button
          variant="secondary"
          className="mt-6"
          onClick={() => router.push(ROUTES.login)}
        >
          {t("btnBackHome")}
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full rounded-2xl border border-border bg-surface p-6 sm:p-8 shadow-card">
      <div className="mb-6">
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-status-available-bg px-2.5 py-0.5 text-[11px] font-bold text-status-available-fg border border-status-available-border">
          <UserCheck className="size-3" />
          <span>{t("inviteBadge")}</span>
        </div>
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
          {t("setpassTitle")}
        </h2>
        <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground leading-relaxed">
          {t("setpassSubtitle")}{" "}
          <strong className="text-foreground font-semibold">
            {invitation?.email}
          </strong>
        </p>
      </div>

      {submitError && (
        <div className="mb-4">
          <Alert variant="error">{submitError}</Alert>
        </div>
      )}

      {isSuccess ? (
        <div className="py-4 text-center">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-status-available-bg text-status-available-fg border border-status-available-border">
            <Check className="size-6 stroke-[3]" />
          </div>
          <h3 className="font-display text-xl font-bold text-foreground">
            {t("activationSuccess")}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("redirectingToConsole")}
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* User Name inputs */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold uppercase text-muted-foreground">
                {t("labelFirstName")}
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold uppercase text-muted-foreground">
                {t("labelLastName")}
              </label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
              />
            </div>
          </div>

          {/* New password input */}
          <div className="space-y-1.5">
            <label
              htmlFor="new-password"
              className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              {t("labelNewPass")}
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted-foreground">
                <Lock className="size-4" />
              </div>
              <input
                id="new-password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-10 text-sm text-foreground transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? t("hidePassword") : t("showPassword")}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          {/* Confirm password input */}
          <div className="space-y-1.5">
            <label
              htmlFor="confirm-password"
              className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              {t("labelConfirmPass")}
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted-foreground">
                <Lock className="size-4" />
              </div>
              <input
                id="confirm-password"
                type={showPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm text-foreground transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
          </div>

          {/* Requirements checklist */}
          <div className="rounded-xl border border-border bg-muted/60 p-3.5 text-xs space-y-2">
            <CheckItem valid={hasMinLength} text={t("reqLen")} />
            <CheckItem valid={hasUpper} text={t("reqUpper")} />
            <CheckItem valid={hasLower} text={t("reqLower")} />
            <CheckItem valid={hasNumber} text={t("reqNum")} />
            <CheckItem valid={hasSpecial} text={t("reqSpecial")} />
            <CheckItem valid={passwordsMatch} text={t("reqMatch")} />
          </div>

          {/* Submit CTA */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            isLoading={isSubmitting}
            disabled={!isFormValid || isSubmitting}
            className="mt-2"
          >
            <span>{isSubmitting ? t("btnActivating") : t("btnActivate")}</span>
            {!isSubmitting && <ShieldCheck className="size-4" />}
          </Button>
        </form>
      )}
    </div>
  );
}

function CheckItem({ valid, text }: { valid: boolean; text: string }) {
  return (
    <div
      className={`flex items-center gap-2 transition-colors ${
        valid
          ? "text-status-available-fg font-semibold"
          : "text-muted-foreground"
      }`}
    >
      {valid ? (
        <Check className="size-3.5 shrink-0 stroke-[3]" />
      ) : (
        <Circle className="size-3 shrink-0 opacity-40" />
      )}
      <span>{text}</span>
    </div>
  );
}
