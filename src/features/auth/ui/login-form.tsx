"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Lock, Mail, ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { ROUTES, REDIRECT_QUERY_KEY } from "@/shared/config";
import { sanitizeRedirectPath } from "@/shared/lib";
import { Button } from "@/shared/ui/button";
import { Alert } from "@/shared/ui/alert";
import { loginAction } from "../actions/login-action";

interface DemoRolePreset {
  id: string;
  labelKey?: string;
  customLabel?: string;
  sublabel?: string;
  email: string;
  pass: string;
}

const PERSONAL_PRESETS: readonly DemoRolePreset[] = [
  {
    id: "personal_yoreservo",
    customLabel: "👑 YoReservo Staff",
    sublabel: "mendez_98_@hotmail.com",
    email: "mendez_98_@hotmail.com",
    pass: "Battlefield3",
  },
  {
    id: "personal_ally",
    customLabel: "⚽ Aliado San Agustín",
    sublabel: "mendezsnow98@gmail.com",
    email: "mendezsnow98@gmail.com",
    pass: "Battlefield3",
  },
];

const DEMO_PRESETS: readonly DemoRolePreset[] = [
  {
    id: "ally_admin",
    labelKey: "roleAlly",
    email: "aliado@sanagustin.com",
    pass: "AliadoPass123",
  },
  {
    id: "ally_accounting",
    labelKey: "roleAllyAccounting",
    email: "finanzas@sanagustin.com",
    pass: "FinanceAlly123",
  },
  {
    id: "ally_validator",
    labelKey: "roleValidator",
    email: "recepcion@sanagustin.com",
    pass: "StaffPass123",
  },
  {
    id: "platform_admin",
    labelKey: "roleAdmin",
    email: "admin@yoreservo.com",
    pass: "AdminPass123",
  },
  {
    id: "platform_accounting",
    labelKey: "roleAccounting",
    email: "tesoreria@yoreservo.com",
    pass: "FinancePass123",
  },
];

export function LoginForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("mendez_98_@hotmail.com");
  const [password, setPassword] = useState("Battlefield3");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState("personal_yoreservo");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRoleSelect = (preset: DemoRolePreset) => {
    setSelectedRole(preset.id);
    setEmail(preset.email);
    setPassword(preset.pass);
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    const result = await loginAction({
      email,
      password,
      remember,
    });

    if (!result.ok) {
      setIsLoading(false);
      if (result.error.code === "INVALID_CREDENTIALS") {
        setErrorMessage(t("errorInvalidCredentials"));
      } else if (result.error.code === "FORBIDDEN_ROLE") {
        setErrorMessage(t("errorRoleForbidden"));
      } else {
        setErrorMessage(t("errorInvalidCredentials"));
      }
      return;
    }

    // Success! Redirect to target route
    const nextRoute = sanitizeRedirectPath(
      searchParams.get(REDIRECT_QUERY_KEY),
      result.data.redirectTo ?? ROUTES.dashboard,
    );
    router.push(nextRoute);
    router.refresh();
  };

  return (
    <div className="w-full rounded-2xl border border-border bg-surface p-6 sm:p-8 shadow-card">
      <div className="mb-6">
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
          {t("loginTitle")}
        </h2>
        <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground">
          {t("loginSubtitle")}
        </p>
      </div>

      {errorMessage && (
        <div className="mb-5">
          <Alert variant="error">{errorMessage}</Alert>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email field */}
        <div className="space-y-1.5">
          <label
            htmlFor="email"
            className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          >
            {t("labelEmail")}
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted-foreground">
              <Mail className="size-4" />
            </div>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("placeholderEmail")}
              className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm text-foreground transition-colors placeholder:text-muted-foreground/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
        </div>

        {/* Password field */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="password"
              className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              {t("labelPassword")}
            </label>
            <Link
              href={ROUTES.recoverPassword}
              className="text-xs font-medium text-link hover:underline"
            >
              {t("linkForgot")}
            </Link>
          </div>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted-foreground">
              <Lock className="size-4" />
            </div>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-10 text-sm text-foreground transition-colors placeholder:text-muted-foreground/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
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

        {/* Remember me */}
        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="size-4 rounded border-border accent-accent"
            />
            <span className="text-xs text-muted-foreground font-medium">
              {t("labelRemember")}
            </span>
          </label>
        </div>

        {/* Submit button */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          isLoading={isLoading}
          className="mt-2"
        >
          <span>{isLoading ? t("btnLoggingIn") : t("btnLogin")}</span>
          {!isLoading && <ArrowRight className="size-4" />}
        </Button>

        {/* Quick-Login Testing Accounts */}
        <div className="mt-6 border-t border-dashed border-border pt-4 space-y-3">
          <div>
            <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-foreground">
              ⚡ Cuentas Personales (Acceso Rápido):
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PERSONAL_PRESETS.map((preset) => {
                const isActive = selectedRole === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    id={`preset-${preset.id}`}
                    onClick={() => handleRoleSelect(preset)}
                    className={`rounded-xl border px-3 py-2 text-left transition-all cursor-pointer ${
                      isActive
                        ? "border-accent bg-accent/15 text-foreground shadow-sm ring-1 ring-accent/40"
                        : "border-border bg-background text-muted-foreground hover:border-border-medium hover:text-foreground"
                    }`}
                  >
                    <div className="text-xs font-bold text-foreground">
                      {preset.customLabel}
                    </div>
                    <div className="text-[10px] font-mono text-muted-foreground truncate">
                      {preset.sublabel}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              {t("roleSimTitle")}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_PRESETS.map((preset) => {
                const isActive = selectedRole === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    id={`preset-${preset.id}`}
                    onClick={() => handleRoleSelect(preset)}
                    className={`rounded-lg border px-2.5 py-1.5 text-left text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? "border-accent bg-accent/15 text-foreground shadow-sm"
                        : "border-border bg-background text-muted-foreground hover:border-border-medium hover:text-foreground"
                    }`}
                  >
                    <div>{t(preset.labelKey as any)}</div>
                    <div className="text-[10px] font-mono font-normal text-muted-foreground truncate">
                      {preset.email}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
