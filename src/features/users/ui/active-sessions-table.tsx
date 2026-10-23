"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { useTimeFormat } from "@/shared/lib/time-format";
import { Button } from "@/shared/ui/button";
import type { ActiveSessionItem } from "../model/types";

interface ActiveSessionsTableProps {
  sessions: ActiveSessionItem[];
  onRevokeSession: (sessionId: string) => Promise<void>;
  onRevokeAllSessions: () => Promise<void>;
}

export function ActiveSessionsTable({
  sessions,
  onRevokeSession,
  onRevokeAllSessions,
}: ActiveSessionsTableProps) {
  const t = useTranslations("users.sessions");
  const tRoles = useTranslations("users.roles");
  const { formatTime } = useTimeFormat();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);

  function renderFriendlyRole(role: string) {
    if (role === "PLATFORM_ADMIN") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-500 border border-amber-500/30">
          <span>👑</span>
          <span>{tRoles("PLATFORM_ADMIN")}</span>
        </span>
      );
    }
    if (role === "PLATFORM_ACCOUNTING") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">
          <span>💳</span>
          <span>{tRoles("PLATFORM_ACCOUNTING")}</span>
        </span>
      );
    }
    if (role === "ALLY_ADMIN") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
          <span>🏢</span>
          <span>{tRoles("ALLY_ADMIN")}</span>
        </span>
      );
    }
    if (role === "ALLY_ACCOUNTING") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
          <span>📊</span>
          <span>{tRoles("ALLY_ACCOUNTING")}</span>
        </span>
      );
    }
    if (role === "ALLY_VALIDATOR") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
          <span>🎟️</span>
          <span>{tRoles("ALLY_VALIDATOR")}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted text-foreground border border-border">
        {role}
      </span>
    );
  }

  async function handleRevoke(sessionId: string) {
    setLoadingId(sessionId);
    try {
      await onRevokeSession(sessionId);
    } finally {
      setLoadingId(null);
    }
  }

  async function handleRevokeAll() {
    if (confirm(t("confirmRevokeAll"))) {
      setRevokingAll(true);
      try {
        await onRevokeAllSessions();
      } finally {
        setRevokingAll(false);
      }
    }
  }

  return (
    <div className="space-y-4">
      {/* BANNER WITH REVOKE ALL ACTION */}
      <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-display text-base font-bold text-foreground">
            {t("title")}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("desc")}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleRevokeAll}
            isLoading={revokingAll}
            disabled={revokingAll || loadingId !== null || sessions.length === 0}
            id="btn-revoke-all-sessions"
          >
            ⚠️ {t("btnRevokeAll")}
          </Button>
        </div>
      </div>

      {/* SESSIONS TABLE */}
      <div className="overflow-x-auto rounded-2xl border border-border bg-surface shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border">
            <tr>
              <th className="px-5 py-3.5">{t("thUser")}</th>
              <th className="px-4 py-3.5">{t("thRole")}</th>
              <th className="px-5 py-3.5">{t("thDevice")}</th>
              <th className="px-4 py-3.5">{t("thIp")}</th>
              <th className="px-4 py-3.5">{t("thStarted")}</th>
              <th className="px-4 py-3.5">{t("thExpires")}</th>
              <th className="px-5 py-3.5 text-right">{t("thAction")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sessions.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-muted-foreground">
                  {t("empty")}
                </td>
              </tr>
            ) : (
              sessions.map((s) => (
                <tr key={s.id} className="transition-colors hover:bg-muted/40">
                  <td className="px-5 py-3.5">
                    <div className="font-bold text-foreground">{s.userName}</div>
                    <div className="text-xs text-muted-foreground">{s.userEmail}</div>
                  </td>
                  <td className="px-4 py-3.5">
                    {renderFriendlyRole(s.role)}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-foreground">
                    <div className="font-medium">{s.userAgent}</div>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-muted-foreground">
                    <code>{s.deviceIp}</code>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-muted-foreground">
                    {formatTime(
                      `${new Date(s.createdAt).toLocaleDateString()} ${new Date(s.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })}`,
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-xs text-muted-foreground">
                    {new Date(s.expiresAt).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRevoke(s.id)}
                      isLoading={loadingId === s.id}
                      disabled={loadingId !== null || revokingAll}
                      className="h-8 px-2.5 text-xs"
                      id={`btn-revoke-session-${s.id}`}
                    >
                      {t("btnRevoke")}
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
