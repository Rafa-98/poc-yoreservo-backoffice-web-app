import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { AuthShellLayout } from "@/features/auth/ui/auth-shell-layout";
import { SetPasswordForm } from "@/features/auth/ui/set-password-form";
import { ShieldAlert } from "lucide-react";

export function SetPasswordPage() {
  const t = useTranslations("auth");

  return (
    <AuthShellLayout
      bgImageSrc="/san-agustin-del-paraiso.jpg"
      badgeText={t("setBadge")}
      subtitle={t("setBrandSubtitle")}
      heading={t("setBrandHeading")}
      description={t("setBrandDescription")}
      bannerCard={
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-accent/20 text-accent">
              <ShieldAlert className="size-6" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">
                {t("inviteRoleTitle")}
              </div>
              <div className="text-xs font-medium text-accent">
                {t("inviteVenueTitle")}
              </div>
            </div>
          </div>
        </div>
      }
    >
      <Suspense fallback={<div className="h-96 w-full animate-pulse rounded-2xl bg-surface" />}>
        <SetPasswordForm />
      </Suspense>
    </AuthShellLayout>
  );
}
