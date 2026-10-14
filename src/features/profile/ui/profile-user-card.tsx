"use client";

import { useTranslations } from "next-intl";
import { Camera, ShieldCheck, MapPin, Calendar, Lock } from "lucide-react";
import type { UserProfileData } from "../model/types";

interface ProfileUserCardProps {
  profile: UserProfileData;
  onAvatarChange?: () => void;
}

export function ProfileUserCard({
  profile,
  onAvatarChange,
}: ProfileUserCardProps) {
  const t = useTranslations("profile");

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs text-center">
      {/* Avatar Container */}
      <div className="relative size-24 mx-auto mb-4">
        {profile.imageUrl ? (
          <img
            src={profile.imageUrl}
            alt={profile.fullName}
            className="size-full rounded-full object-cover border-3 border-accent bg-surface-muted"
          />
        ) : (
          <div className="size-full rounded-full border-3 border-accent bg-gradient-to-br from-forest-800 to-forest-950 flex items-center justify-center text-white text-2xl font-bold">
            {profile.name?.[0]?.toUpperCase() || "U"}
            {profile.lastName?.[0]?.toUpperCase() || ""}
          </div>
        )}

        <button
          type="button"
          onClick={onAvatarChange}
          title={t("sidebar.changePhoto")}
          className="absolute -bottom-1 -right-1 size-8 rounded-full bg-forest-900 text-white border-2 border-surface flex items-center justify-center text-xs hover:bg-accent hover:text-accent-foreground hover:scale-110 active:scale-95 transition-all shadow-xs cursor-pointer"
        >
          <Camera className="size-3.5" />
        </button>
      </div>

      {/* Name & Email */}
      <h3 className="font-display text-lg font-bold text-foreground">
        {profile.fullName}
      </h3>
      <p className="text-xs text-muted-foreground mt-0.5 mb-4">
        {profile.email}
      </p>

      {/* Role Badge (Read-Only) */}
      <div className="mb-5">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-accent/20 text-accent-foreground border border-accent/40">
          <ShieldCheck className="size-3.5" />
          <span>{profile.role}</span>
        </span>
        <p className="text-[11px] text-muted-foreground mt-1.5">
          {t("sidebar.roleDisclaimer")}
        </p>
      </div>

      {/* Affiliation & Security Details Box */}
      <div className="rounded-xl border border-border bg-surface-muted p-4 text-left space-y-3 text-xs">
        <div>
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
            {t("sidebar.assignedVenue")}
          </span>
          <div className="font-semibold text-foreground mt-0.5 flex items-center gap-1.5">
            <MapPin className="size-3.5 text-emerald-500 shrink-0" />
            <span>
              {profile.managedVenue?.name ||
                profile.organization?.tradeName ||
                "Complejo Deportivo Ávila"}
            </span>
          </div>
        </div>

        <div>
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
            {t("sidebar.memberSince")}
          </span>
          <div className="font-semibold text-foreground mt-0.5 flex items-center gap-1.5">
            <Calendar className="size-3.5 text-blue-500 shrink-0" />
            <span>{t("sidebar.memberSinceDate")}</span>
          </div>
        </div>

        <div>
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
            {t("sidebar.securityStatus")}
          </span>
          <div className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1.5">
            <Lock className="size-3.5 shrink-0" />
            <span>{t("sidebar.securityBcryptActive")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
