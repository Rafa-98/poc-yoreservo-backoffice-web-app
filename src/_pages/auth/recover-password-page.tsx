import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { AuthShellLayout } from "@/features/auth/ui/auth-shell-layout";
import { RecoverPasswordForm } from "@/features/auth/ui/recover-password-form";

export function RecoverPasswordPage() {
  const t = useTranslations("auth");

  return (
    <AuthShellLayout
      bgImageSrc="/padel-court.jpg"
      badgeText={t("recoverBadge")}
      subtitle={t("recoverBrandSubtitle")}
      heading={t("recoverBrandHeading")}
      description={t("recoverBrandDescription")}
      bannerCard={
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
          <div className="mb-1 text-sm font-semibold text-white">
            {t("securityTipTitle")}
          </div>
          <p className="text-xs leading-relaxed text-[#A2ADA0]">
            {t("securityTipDesc")}
          </p>
        </div>
      }
    >
      <Suspense fallback={<div className="h-96 w-full animate-pulse rounded-2xl bg-surface" />}>
        <RecoverPasswordForm />
      </Suspense>
    </AuthShellLayout>
  );
}
