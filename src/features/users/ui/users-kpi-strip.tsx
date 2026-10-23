"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Building2, MapPin, ShieldCheck, UserCheck, Users, Clock } from "lucide-react";
import type { UsersKpi } from "../model/types";

interface UsersKpiStripProps {
  kpi: UsersKpi;
  selectedScope: string;
  selectedVenueName?: string;
  totalVenuesCount: number;
  orgWideStaffCount: number;
  venueAssignedStaffCount: number;
}

export function UsersKpiStrip({
  kpi,
  selectedScope,
  selectedVenueName,
  totalVenuesCount,
  orgWideStaffCount,
  venueAssignedStaffCount,
}: UsersKpiStripProps) {
  const t = useTranslations("users.kpis");

  const isSpecificVenue =
    selectedScope !== "all" && selectedScope !== "org-all";
  const isOnlyOrgWide = selectedScope === "org-all";

  const scopeBannerText = isSpecificVenue
    ? t("scopeVenue", { venue: selectedVenueName || "" })
    : isOnlyOrgWide
      ? t("scopeOnlyOrgWide")
      : t("scopeAllOrg", { count: totalVenuesCount });

  const cards = [
    {
      title: t("totalStaff"),
      count: kpi.totalStaff,
      desc: isSpecificVenue
        ? t("totalDescVenue", { venue: selectedVenueName || "" })
        : isOnlyOrgWide
          ? t("totalDescOrgOnly")
          : t("totalDescAll", {
              orgCount: orgWideStaffCount,
              venueCount: venueAssignedStaffCount,
            }),
      countColor: "text-foreground",
      icon: <Users className="size-4 text-foreground" />,
      iconBg: "bg-accent/20 border-accent/30",
    },
    {
      title: t("frontdesk"),
      count: kpi.frontdeskValidators,
      desc: isSpecificVenue
        ? t("frontdeskDescVenue", { venue: selectedVenueName || "" })
        : t("frontdeskDescAll"),
      countColor: "text-blue-600 dark:text-blue-400",
      icon: <UserCheck className="size-4 text-blue-600 dark:text-blue-400" />,
      iconBg: "bg-blue-500/15 border-blue-500/30",
    },
    {
      title: t("pending"),
      count: kpi.pendingInvitations,
      desc: t("pendingDesc"),
      countColor: "text-amber-600 dark:text-amber-400",
      icon: <Clock className="size-4 text-amber-600 dark:text-amber-400" />,
      iconBg: "bg-amber-500/15 border-amber-500/30",
    },
    {
      title: t("sessions"),
      count: kpi.activeSessions,
      desc: t("sessionsDesc"),
      countColor: "text-emerald-600 dark:text-emerald-400",
      icon: <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400" />,
      iconBg: "bg-emerald-500/15 border-emerald-500/30",
    },
  ];

  return (
    <div className="space-y-3">
      {/* EXPLICIT SCOPE INDICATOR */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-surface/80 px-4 py-2.5 text-xs">
        <div className="flex items-center gap-2">
          <span className="flex size-6 items-center justify-center rounded-lg bg-accent/20 text-foreground border border-accent/30">
            {isSpecificVenue ? (
              <MapPin className="size-3.5" />
            ) : (
              <Building2 className="size-3.5" />
            )}
          </span>
          <span className="text-muted-foreground font-medium">
            {t("scopeBannerLabel")}
          </span>
          <span className="font-bold text-foreground">
            {scopeBannerText}
          </span>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, i) => (
          <div
            key={i}
            className="rounded-2xl border border-border bg-surface p-5 shadow-sm transition-all hover:border-border-strong"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {c.title}
              </div>
              <div
                className={`flex size-8 shrink-0 items-center justify-center rounded-xl border ${c.iconBg}`}
              >
                {c.icon}
              </div>
            </div>
            <div
              className={`mt-2 font-display text-3xl font-extrabold ${c.countColor}`}
            >
              {c.count}
            </div>
            <div className="mt-1.5 text-xs text-muted-foreground font-medium">
              {c.desc}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
