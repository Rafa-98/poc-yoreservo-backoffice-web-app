"use client";

import { useTranslations } from "next-intl";
import { User, Key, Laptop } from "lucide-react";
import type { ProfileTab } from "../model/types";

interface ProfileTabNavProps {
  activeTab: ProfileTab;
  onSelectTab: (tab: ProfileTab) => void;
  sessionsCount: number;
}

export function ProfileTabNav({
  activeTab,
  onSelectTab,
  sessionsCount,
}: ProfileTabNavProps) {
  const t = useTranslations("profile");

  return (
    <div className="flex items-center gap-2 border-b border-border pb-px mb-6 overflow-x-auto">
      <button
        type="button"
        onClick={() => onSelectTab("general")}
        className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
          activeTab === "general"
            ? "border-accent text-foreground font-bold"
            : "border-transparent text-muted-foreground hover:text-foreground"
        }`}
      >
        <User className="size-4" />
        <span>{t("tabs.general")}</span>
      </button>

      <button
        type="button"
        onClick={() => onSelectTab("security")}
        className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
          activeTab === "security"
            ? "border-accent text-foreground font-bold"
            : "border-transparent text-muted-foreground hover:text-foreground"
        }`}
      >
        <Key className="size-4" />
        <span>{t("tabs.security")}</span>
      </button>

      <button
        type="button"
        onClick={() => onSelectTab("sessions")}
        className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
          activeTab === "sessions"
            ? "border-accent text-foreground font-bold"
            : "border-transparent text-muted-foreground hover:text-foreground"
        }`}
      >
        <Laptop className="size-4" />
        <span>{t("tabs.sessions")}</span>
        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-accent/20 text-accent-foreground border border-accent/40">
          {sessionsCount}
        </span>
      </button>
    </div>
  );
}
