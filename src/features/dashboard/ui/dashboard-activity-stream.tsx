"use client";

import Link from "next/link";
import { Radio, Calendar, ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { ROUTES } from "@/shared/config";
import type { ActivityStreamItem, RolePerspective } from "../model/types";

interface DashboardActivityStreamProps {
  perspective: RolePerspective;
  adminFeed: ActivityStreamItem[];
  allyFeed: ActivityStreamItem[];
}

export function DashboardActivityStream({
  perspective,
  adminFeed,
  allyFeed,
}: DashboardActivityStreamProps) {
  const t = useTranslations("dashboard");

  const feed = perspective === "ADMIN" ? adminFeed : allyFeed;

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
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
            <Radio className="size-3 animate-pulse" />
            <span>{t("stream.websocketActive")}</span>
          </span>
        </div>

        <div className="divide-y divide-border/40">
          {feed.map((item) => (
            <div key={item.id} className="py-3 flex items-start gap-3 first:pt-0 last:pb-0">
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
                    {item.time}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
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
                {t("systemStatus.bcvValue")}
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
        <div className="pt-4 mt-4 border-t border-border/50">
          <Link
            href={ROUTES.agenda}
            className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl border border-border bg-surface-muted text-foreground text-xs font-bold shadow-2xs hover:bg-surface hover:border-border/80 active:scale-98 transition-all"
          >
            <Calendar className="size-4 text-accent-foreground" />
            <span>{t("actions.goToAgenda")}</span>
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
