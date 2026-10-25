"use client";

import { Suspense, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AuthShellLayout } from "@/features/auth/ui/auth-shell-layout";
import { SetPasswordForm } from "@/features/auth/ui/set-password-form";
import type { InvitationDetails } from "@/features/auth/actions/set-password-action";
import { ShieldAlert } from "lucide-react";

interface SetPasswordPageProps {
  initialInvitation?: InvitationDetails | null;
}

export function SetPasswordPage({ initialInvitation = null }: SetPasswordPageProps) {
  const t = useTranslations("auth");
  const locale = useLocale();
  const isEn = locale === "en";
  const [invitation, setInvitation] = useState<InvitationDetails | null>(
    initialInvitation
  );

  const assignedRole = invitation?.role || "—";
  const assignedVenue =
    invitation?.venueName ||
    invitation?.organizationName ||
    (invitation?.role?.startsWith("PLATFORM_")
      ? isEn
        ? "YoReservo (Central Platform)"
        : "YoReservo (Plataforma Central)"
      : "—");

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
                {t("inviteRoleTitle", { role: assignedRole })}
              </div>
              <div className="text-xs font-medium text-accent">
                {t("inviteVenueTitle", { venue: assignedVenue })}
              </div>
              {invitation?.email && (
                <div className="text-[11px] text-white/70 mt-0.5">
                  {invitation.email}
                </div>
              )}
            </div>
          </div>
        </div>
      }
    >
      <Suspense fallback={<div className="h-96 w-full animate-pulse rounded-2xl bg-surface" />}>
        <SetPasswordForm
          initialInvitation={initialInvitation}
          onInvitationLoaded={setInvitation}
        />
      </Suspense>
    </AuthShellLayout>
  );
}
