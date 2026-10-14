"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle, CheckCircle2, Info, LogOut } from "lucide-react";
import { logoutAction } from "@/features/auth/actions/logout-action";
import type {
  ChangePasswordInput,
  ProfileTab,
  UpdateProfileInput,
  UserProfileData,
} from "@/features/profile/model/types";
import { ProfileUserCard } from "@/features/profile/ui/profile-user-card";
import { ProfileTabNav } from "@/features/profile/ui/profile-tab-nav";
import { ProfileDetailsForm } from "@/features/profile/ui/profile-details-form";
import { ProfilePasswordForm } from "@/features/profile/ui/profile-password-form";
import { ProfileSessionsList } from "@/features/profile/ui/profile-sessions-list";
import { ProfileRevokeModal } from "@/features/profile/ui/profile-revoke-modal";
import {
  changePasswordAction,
  revokeOtherSessionsAction,
  revokeSessionAction,
  updateProfileAction,
} from "@/features/profile/actions/profile-actions";

interface ProfilePageProps {
  initialData: UserProfileData;
}

export function ProfilePage({ initialData }: ProfilePageProps) {
  const t = useTranslations("profile");

  const [profile, setProfile] = useState<UserProfileData>(initialData);
  const [activeTab, setActiveTab] = useState<ProfileTab>("general");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRevokeModalOpen, setIsRevokeModalOpen] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "info" | "error";
  } | null>(null);

  const showToast = (
    message: string,
    type: "success" | "info" | "error" = "success",
  ) => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const handleUpdateProfile = async (input: UpdateProfileInput) => {
    setIsSubmitting(true);
    try {
      const res = await updateProfileAction(input);
      if (!res.ok || !res.data) {
        showToast(t("toast.actionError"), "error");
        return;
      }
      setProfile(res.data);
      showToast(t("toast.profileSaved"), "success");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangePassword = async (
    input: ChangePasswordInput,
  ): Promise<boolean> => {
    setIsSubmitting(true);
    try {
      const res = await changePasswordAction(input);
      if (res.ok) {
        showToast(t("toast.passwordUpdated"), "success");
        return true;
      } else {
        showToast(t("toast.passwordError"), "error");
        return false;
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevokeAllSessions = async () => {
    setIsSubmitting(true);
    try {
      const res = await revokeOtherSessionsAction();
      if (!res.ok) {
        showToast(t("toast.actionError"), "error");
        return;
      }
      setProfile((prev) => ({
        ...prev,
        sessions: prev.sessions.filter((s) => s.isCurrent),
      }));
      setIsRevokeModalOpen(false);
      showToast(t("toast.allSessionsRevoked"), "success");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevokeSingleSession = async (sessionId: string) => {
    setIsSubmitting(true);
    try {
      const res = await revokeSessionAction(sessionId);
      if (!res.ok) {
        showToast(t("toast.actionError"), "error");
        return;
      }
      setProfile((prev) => ({
        ...prev,
        sessions: prev.sessions.filter((s) => s.id !== sessionId),
      }));
      showToast(t("toast.sessionRevoked"), "success");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto w-full">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-foreground">
              {t("title")}
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              {t("activeAccount")}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-3xl leading-relaxed">
            {t("subtitle")}
          </p>
        </div>

        {/* Sign Out Action Button */}
        <form action={logoutAction} className="self-start sm:self-auto">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-surface text-foreground text-xs sm:text-sm font-semibold hover:bg-surface-muted hover:text-red-500 active:scale-98 transition-all shadow-2xs cursor-pointer"
          >
            <LogOut className="size-4" />
            <span>{t("signOut")}</span>
          </button>
        </form>
      </div>

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: User Identifier & RBAC Badges (4 cols) */}
        <div className="lg:col-span-4">
          <ProfileUserCard
            profile={profile}
            onAvatarChange={() =>
              showToast(t("sidebar.changePhoto"), "info")
            }
          />
        </div>

        {/* Right Column: Multi-Tab Settings (8 cols) */}
        <div className="lg:col-span-8 rounded-2xl border border-border bg-surface p-6 sm:p-7 shadow-xs">
          <ProfileTabNav
            activeTab={activeTab}
            onSelectTab={setActiveTab}
            sessionsCount={profile.sessions.length}
          />

          {activeTab === "general" && (
            <ProfileDetailsForm
              profile={profile}
              onSubmit={handleUpdateProfile}
              isSubmitting={isSubmitting}
            />
          )}

          {activeTab === "security" && (
            <ProfilePasswordForm
              onSubmit={handleChangePassword}
              isSubmitting={isSubmitting}
            />
          )}

          {activeTab === "sessions" && (
            <ProfileSessionsList
              sessions={profile.sessions}
              onRequestRevokeAll={() => setIsRevokeModalOpen(true)}
              onRevokeSession={handleRevokeSingleSession}
              isRevoking={isSubmitting}
            />
          )}
        </div>
      </div>

      {/* Revoke All Sessions Confirmation Modal */}
      <ProfileRevokeModal
        isOpen={isRevokeModalOpen}
        onClose={() => setIsRevokeModalOpen(false)}
        onConfirm={handleRevokeAllSessions}
        isSubmitting={isSubmitting}
      />

      {/* Toast Notification */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl bg-forest-950 text-white dark:bg-forest-900 border border-accent/40 shadow-xl animate-in fade-in slide-in-from-bottom-5 duration-200"
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="size-5 text-accent-foreground shrink-0" />
          ) : toast.type === "error" ? (
            <AlertCircle className="size-5 text-red-400 shrink-0" />
          ) : (
            <Info className="size-5 text-blue-400 shrink-0" />
          )}
          <span className="text-xs sm:text-sm font-medium">{toast.message}</span>
        </div>
      )}
    </div>
  );
}
