"use client";

import React from "react";
import { useTranslations } from "next-intl";
import type { UsersKpi } from "../model/types";

interface UsersKpiStripProps {
  kpi: UsersKpi;
}

export function UsersKpiStrip({ kpi }: UsersKpiStripProps) {
  const t = useTranslations("users.kpis");

  const cards = [
    {
      title: t("totalStaff"),
      count: kpi.totalStaff,
      desc: t("totalDesc"),
      countColor: "text-foreground",
    },
    {
      title: t("frontdesk"),
      count: kpi.frontdeskValidators,
      desc: t("frontdeskDesc"),
      countColor: "text-blue-500",
    },
    {
      title: t("pending"),
      count: kpi.pendingInvitations,
      desc: t("pendingDesc"),
      countColor: "text-amber-500",
    },
    {
      title: t("sessions"),
      count: kpi.activeSessions,
      desc: t("sessionsDesc"),
      countColor: "text-emerald-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((c, i) => (
        <div
          key={i}
          className="rounded-2xl border border-border bg-surface p-5 shadow-sm transition-all hover:border-border-strong"
        >
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {c.title}
          </div>
          <div className={`mt-2 font-display text-3xl font-extrabold ${c.countColor}`}>
            {c.count}
          </div>
          <div className="mt-1.5 text-xs text-muted-foreground">
            {c.desc}
          </div>
        </div>
      ))}
    </div>
  );
}
