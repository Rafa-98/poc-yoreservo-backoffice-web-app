"use client";

import React from "react";
import { useTranslations } from "next-intl";

interface RbacMatrixTableProps {
  currentUserRole?: string;
}

export function RbacMatrixTable({ currentUserRole }: RbacMatrixTableProps) {
  const t = useTranslations("users.matrix");

  // Hide Platform roles completely for ALLY_ADMIN and any other ally role
  const showPlatformRoles =
    currentUserRole === "PLATFORM_ADMIN" ||
    currentUserRole === "PLATFORM_ACCOUNTING";

  const allMatrixRows = [
    {
      id: "c1",
      platformOnly: false,
      title: t("c1Title"),
      desc: t("c1Desc"),
      admin: { label: t("allowed"), type: "allowed" },
      ally: { label: t("scopedClub"), type: "scoped" },
      platformAccounting: { label: t("readOnly"), type: "allowed" },
      allyAccounting: { label: t("scopedClub"), type: "scoped" },
      validator: { label: t("scopedVenue"), type: "scoped" },
    },
    {
      id: "c2",
      platformOnly: false,
      title: t("c2Title"),
      desc: t("c2Desc"),
      admin: { label: t("permitted"), type: "allowed" },
      ally: { label: t("permitted"), type: "allowed" },
      platformAccounting: { label: t("denied"), type: "denied" },
      allyAccounting: { label: t("denied"), type: "denied" },
      validator: { label: t("denied"), type: "denied" },
    },
    {
      id: "c3",
      platformOnly: false,
      title: t("c3Title"),
      desc: t("c3Desc"),
      admin: { label: t("permitted"), type: "allowed" },
      ally: { label: t("permitted"), type: "allowed" },
      platformAccounting: { label: t("auditOnly"), type: "allowed" },
      allyAccounting: { label: t("auditOnly"), type: "scoped" },
      validator: { label: t("permitted"), type: "allowed" },
    },
    {
      id: "c4",
      platformOnly: false,
      title: t("c4Title"),
      desc: t("c4Desc"),
      admin: { label: t("allowed"), type: "allowed" },
      ally: { label: t("permitted"), type: "allowed" },
      platformAccounting: { label: t("exclusive"), type: "allowed" },
      allyAccounting: { label: t("scopedClub"), type: "scoped" },
      validator: { label: t("denied"), type: "denied" },
    },
    {
      id: "c5",
      platformOnly: true,
      title: t("c5Title"),
      desc: t("c5Desc"),
      admin: { label: t("allowed"), type: "allowed" },
      ally: { label: t("denied"), type: "denied" },
      platformAccounting: { label: t("superviseOnly"), type: "allowed" },
      allyAccounting: { label: t("denied"), type: "denied" },
      validator: { label: t("denied"), type: "denied" },
    },
    {
      id: "c6",
      platformOnly: false,
      title: t("c6Title"),
      desc: t("c6Desc"),
      admin: { label: t("allowed"), type: "allowed" },
      ally: { label: t("scopedClub"), type: "scoped" },
      platformAccounting: { label: t("denied"), type: "denied" },
      allyAccounting: { label: t("denied"), type: "denied" },
      validator: { label: t("denied"), type: "denied" },
    },
    {
      id: "c7",
      platformOnly: false,
      title: t("c7Title"),
      desc: t("c7Desc"),
      admin: { label: t("allowed"), type: "allowed" },
      ally: { label: t("scopedClub"), type: "scoped" },
      platformAccounting: { label: t("denied"), type: "denied" },
      allyAccounting: { label: t("denied"), type: "denied" },
      validator: { label: t("denied"), type: "denied" },
    },
    {
      id: "c8",
      platformOnly: false,
      title: t("c8Title"),
      desc: t("c8Desc"),
      admin: { label: t("allowed"), type: "allowed" },
      ally: { label: t("scopedValidators"), type: "scoped" },
      platformAccounting: { label: t("denied"), type: "denied" },
      allyAccounting: { label: t("denied"), type: "denied" },
      validator: { label: t("denied"), type: "denied" },
    },
    {
      id: "c9",
      platformOnly: true,
      title: t("c9Title"),
      desc: t("c9Desc"),
      admin: { label: t("exclusive"), type: "allowed" },
      ally: { label: t("denied"), type: "denied" },
      platformAccounting: { label: t("denied"), type: "denied" },
      allyAccounting: { label: t("denied"), type: "denied" },
      validator: { label: t("denied"), type: "denied" },
    },
  ];

  const matrixRows = showPlatformRoles
    ? allMatrixRows
    : allMatrixRows.filter((r) => !r.platformOnly);

  function renderCheckBadge(item: { label: string; type: string }) {
    if (item.type === "allowed") {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
          {item.label}
        </span>
      );
    }
    if (item.type === "scoped") {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-amber-500/15 text-amber-500 border border-amber-500/30">
          {item.label}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-rose-500/15 text-rose-500 border border-rose-500/30">
        {item.label}
      </span>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <h3 className="font-display text-base font-bold text-foreground">
          {t("title")}
        </h3>
        <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
          {t("desc")}
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-surface shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border">
            <tr>
              <th className="px-5 py-3.5 min-w-[260px]">{t("thCapability")}</th>
              {showPlatformRoles && (
                <>
                  <th className="px-4 py-3.5 text-center">👑 {t("colPlatformAdmin")}</th>
                  <th className="px-4 py-3.5 text-center">💳 {t("colPlatformAccounting")}</th>
                </>
              )}
              <th className="px-4 py-3.5 text-center">🏢 {t("colAllyAdmin")}</th>
              <th className="px-4 py-3.5 text-center">📊 {t("colAllyAccounting")}</th>
              <th className="px-4 py-3.5 text-center">🎟️ {t("colAllyValidator")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {matrixRows.map((row) => (
              <tr key={row.id} className="transition-colors hover:bg-muted/40">
                <td className="px-5 py-3.5">
                  <div className="font-bold text-foreground">{row.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{row.desc}</div>
                </td>
                {showPlatformRoles && (
                  <>
                    <td className="px-4 py-3.5 text-center">{renderCheckBadge(row.admin)}</td>
                    <td className="px-4 py-3.5 text-center">{renderCheckBadge(row.platformAccounting)}</td>
                  </>
                )}
                <td className="px-4 py-3.5 text-center">{renderCheckBadge(row.ally)}</td>
                <td className="px-4 py-3.5 text-center">{renderCheckBadge(row.allyAccounting)}</td>
                <td className="px-4 py-3.5 text-center">{renderCheckBadge(row.validator)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
