"use client";

import Link from "next/link";
import { RefreshCw, Calendar, ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { ROUTES } from "@/shared/config";
import { useTimeFormat } from "@/shared/lib/time-format";
import type { ActivityStreamItem, RolePerspective } from "../model/types";

interface DashboardActivityStreamProps {
  perspective: RolePerspective;
  adminFeed: ActivityStreamItem[];
  allyFeed: ActivityStreamItem[];
  bcvRate?: number;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  canAccessAgenda?: boolean;
}

export function DashboardActivityStream({
  perspective,
  adminFeed,
  allyFeed,
  bcvRate,
  onRefresh,
  isRefreshing = false,
  canAccessAgenda = true,
}: DashboardActivityStreamProps) {
  const t = useTranslations("dashboard");
  const { formatTime } = useTimeFormat();

  const feed = (perspective === "ADMIN" ? adminFeed : allyFeed).slice(0, 5);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Left: Activity Stream (2 cols on desktop) */}
      <div className="lg:col-span-2 rounded-2xl border border-border bg-surface p-5 shadow-xs">
        <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-border/50">
          <h3 className="text-sm sm:text-base font-bold text-foreground">
            {perspective === "ADMIN"
              ? t("stream.titleAdmin")
              : t("stream.titleAlly")}
          </h3>
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border border-border bg-surface-muted hover:bg-surface text-xs font-bold text-foreground shadow-2xs transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
            >
              <RefreshCw
                className={`size-3.5 text-link ${isRefreshing ? "animate-spin" : ""}`}
              />
              <span>
                {isRefreshing ? t("stream.refreshing") : t("stream.refresh")}
              </span>
            </button>
          )}
        </div>

        {feed.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            {t("stream.emptyStream")}
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {feed.map((item) => (
              <div
                key={item.id}
                className="py-3 flex items-start gap-3 first:pt-0 last:pb-0"
              >
                <div
                  style={{ backgroundColor: item.bg }}
                  className="size-8 sm:size-9 rounded-xl flex items-center justify-center text-sm shrink-0 shadow-2xs"
                >
                  <span>{item.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs sm:text-sm font-bold text-foreground truncate">
                      {item.title}
                    </h4>
                    <span className="text-[11px] text-muted-foreground shrink-0">
                      {formatTime(item.time)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    {formatTime(item.desc)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right: Platform System Status & Treasury (1 col) */}
      <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs flex flex-col justify-between">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-foreground pb-3 mb-3 border-b border-border/50">
            {t("systemStatus.title")}
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">
                {t("systemStatus.bcvSync")}
              </span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {bcvRate && bcvRate > 0
                  ? `🟢 ${bcvRate.toFixed(2)} Bs`
                  : t("systemStatus.bcvValue")}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">
                {t("systemStatus.gateway")}
              </span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {t("systemStatus.gatewayValue")}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">
                {t("systemStatus.conflicts")}
              </span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {t("systemStatus.conflictsValue")}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">
                {t("systemStatus.notifications")}
              </span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {t("systemStatus.notificationsValue")}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Access Link to Agenda */}
        {canAccessAgenda && (
          <div className="pt-4 mt-4 border-t border-border/50">
            <Link
              href={ROUTES.agenda}
              className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl border border-border bg-surface-muted text-foreground text-xs font-bold shadow-2xs hover:bg-surface hover:border-border/80 active:scale-98 transition-all"
            >
              <Calendar className="size-4 text-link" />
              <span>{t("actions.goToAgenda")}</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
