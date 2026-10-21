"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Camera, Loader2, ShieldCheck, MapPin, Calendar, Lock } from "lucide-react";
import { uploadBackofficeFileAction } from "@/shared/api/upload-action";
import type { UserProfileData } from "../model/types";

interface ProfileUserCardProps {
  profile: UserProfileData;
  onAvatarChange?: () => void;
  onAvatarUploaded?: (url: string) => Promise<void> | void;
}

export function ProfileUserCard({
  profile,
  onAvatarChange,
  onAvatarUploaded,
}: ProfileUserCardProps) {
  const t = useTranslations("profile");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("category", "AVATAR");
      const res = await uploadBackofficeFileAction(fd);
      if (res.ok && res.data.url) {
        await onAvatarUploaded?.(res.data.url);
      } else {
        onAvatarChange?.();
      }
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

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

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />

        <button
          type="button"
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
          title={t("sidebar.changePhoto")}
          className="absolute -bottom-1 -right-1 size-8 rounded-full bg-forest-900 text-white border-2 border-surface flex items-center justify-center text-xs hover:bg-accent hover:text-accent-foreground hover:scale-110 active:scale-95 transition-all shadow-xs cursor-pointer disabled:opacity-50"
        >
          {isUploading ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Camera className="size-3.5" />
          )}
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
              {(typeof profile.managedVenue === "string"
                ? profile.managedVenue
                : profile.managedVenue?.name) ||
                (typeof profile.organization === "string"
                  ? profile.organization
                  : profile.organization?.tradeName) ||
                (profile.role?.startsWith("PLATFORM_")
                  ? "Todas las Sedes (Global)"
                  : "Sin asignar")}
            </span>
          </div>
        </div>

        <div>
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
            {t("sidebar.memberSince")}
          </span>
          <div className="font-semibold text-foreground mt-0.5 flex items-center gap-1.5">
            <Calendar className="size-3.5 text-blue-500 shrink-0" />
            <span>
              {profile.createdAt
                ? new Intl.DateTimeFormat(
                    profile.preferredLanguage === "en" ? "en-US" : "es-VE",
                    { day: "numeric", month: "long", year: "numeric" }
                  ).format(new Date(profile.createdAt))
                : "—"}
            </span>
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
