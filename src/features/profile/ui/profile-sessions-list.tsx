"use client";

import { useTranslations } from "next-intl";
import { Laptop, Smartphone, Ban, ShieldCheck } from "lucide-react";
import { useTimeFormat } from "@/shared/lib/time-format";
import type { ProfileSessionItem } from "../model/types";

interface ProfileSessionsListProps {
  sessions: ProfileSessionItem[];
  onRequestRevokeAll: () => void;
  onRevokeSession: (sessionId: string) => Promise<void>;
  isRevoking?: boolean;
}

export function ProfileSessionsList({
  sessions,
  onRequestRevokeAll,
  onRevokeSession,
  isRevoking = false,
}: ProfileSessionsListProps) {
  const t = useTranslations("profile");
  const { formatTime } = useTimeFormat();

  const otherSessionsCount = sessions.filter((s) => !s.isCurrent).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/50">
        <div>
          <h4 className="text-sm sm:text-base font-bold text-foreground">
            {t("sessions.title")}
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t("sessions.desc")}
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {otherSessionsCount > 0 && (
            <button
              type="button"
              onClick={onRequestRevokeAll}
              disabled={isRevoking}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-bold hover:bg-red-500/20 active:scale-95 transition-all shadow-2xs cursor-pointer"
            >
              <Ban className="size-3.5" />
              <span>{t("sessions.revokeAll")}</span>
            </button>
          )}
        </div>
      </div>

      {/* Sessions List */}
      <div className="space-y-3">
        {sessions.map((session) => (
          <div
            key={session.id}
            className={`rounded-2xl border p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all ${
              session.isCurrent
                ? "border-emerald-500/40 bg-emerald-500/5 dark:bg-emerald-500/10 shadow-xs"
                : "border-border bg-surface shadow-2xs hover:border-border/80"
            }`}
          >
            <div className="flex items-start gap-3.5">
              <div
                className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${
                  session.isCurrent
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                    : "bg-surface-muted text-muted-foreground"
                }`}
              >
                {session.deviceType === "mobile" ? (
                  <Smartphone className="size-5" />
                ) : (
                  <Laptop className="size-5" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <strong className="text-xs sm:text-sm font-bold text-foreground">
                    {session.deviceLabel || session.userAgent}
                  </strong>
                  {session.isCurrent && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                      <ShieldCheck className="size-3" />
                      <span>{t("sessions.thisDevice")}</span>
                    </span>
                  )}
                </div>

                <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5 flex-wrap">
                  <span>{session.location || "Caracas, Venezuela"}</span>
                  <span>•</span>
                  <span>IP: {session.deviceIp}</span>
                  <span>•</span>
                  {session.isCurrent ? (
                    <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      {t("sessions.activeNow")}
                    </strong>
                  ) : (
                    <span>
                      {formatTime(session.lastActiveText) || t("sessions.recent")}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Action */}
            <div className="self-end sm:self-center">
              {session.isCurrent ? (
                <span className="text-xs font-semibold text-muted-foreground">
                  {t("sessions.thisDevice")}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => onRevokeSession(session.id)}
                  disabled={isRevoking}
                  className="px-3 py-1.5 rounded-lg border border-border bg-surface-muted text-foreground text-xs font-semibold hover:bg-surface hover:text-red-500 active:scale-95 transition-all shadow-2xs cursor-pointer"
                >
                  {t("sessions.revoke")}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
