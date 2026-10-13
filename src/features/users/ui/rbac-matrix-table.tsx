"use client";

import React from "react";
import { useTranslations } from "next-intl";

export function RbacMatrixTable() {
  const t = useTranslations("users.matrix");

  const matrixRows = [
    {
      title: t("c1Title"),
      desc: t("c1Desc"),
      admin: { label: t("allowed"), type: "allowed" },
      ally: { label: t("scopedClub"), type: "scoped" },
      accounting: { label: t("readOnly"), type: "allowed" },
      validator: { label: t("scopedVenue"), type: "scoped" },
      client: { label: t("noAccess"), type: "denied" },
    },
    {
      title: t("c2Title"),
      desc: t("c2Desc"),
      admin: { label: t("permitted"), type: "allowed" },
      ally: { label: t("permitted"), type: "allowed" },
      accounting: { label: t("denied"), type: "denied" },
      validator: { label: t("permitted"), type: "allowed" },
      client: { label: t("denied"), type: "denied" },
    },
    {
      title: t("c3Title"),
      desc: t("c3Desc"),
      admin: { label: t("permitted"), type: "allowed" },
      ally: { label: t("permitted"), type: "allowed" },
      accounting: { label: t("auditOnly"), type: "allowed" },
      validator: { label: t("permitted"), type: "allowed" },
      client: { label: t("denied"), type: "denied" },
    },
    {
      title: t("c4Title"),
      desc: t("c4Desc"),
      admin: { label: t("allowed"), type: "allowed" },
      ally: { label: t("permitted"), type: "allowed" },
      accounting: { label: t("exclusive"), type: "allowed" },
      validator: { label: t("denied"), type: "denied" },
      client: { label: t("denied"), type: "denied" },
    },
    {
      title: t("c5Title"),
      desc: t("c5Desc"),
      admin: { label: t("allowed"), type: "allowed" },
      ally: { label: t("denied"), type: "denied" },
      accounting: { label: t("superviseOnly"), type: "allowed" },
      validator: { label: t("denied"), type: "denied" },
      client: { label: t("denied"), type: "denied" },
    },
    {
      title: t("c6Title"),
      desc: t("c6Desc"),
      admin: { label: t("allowed"), type: "allowed" },
      ally: { label: t("scopedClub"), type: "scoped" },
      accounting: { label: t("denied"), type: "denied" },
      validator: { label: t("denied"), type: "denied" },
      client: { label: t("denied"), type: "denied" },
    },
    {
      title: t("c7Title"),
      desc: t("c7Desc"),
      admin: { label: t("allowed"), type: "allowed" },
      ally: { label: t("scopedClub"), type: "scoped" },
      accounting: { label: t("denied"), type: "denied" },
      validator: { label: t("denied"), type: "denied" },
      client: { label: t("denied"), type: "denied" },
    },
    {
      title: t("c8Title"),
      desc: t("c8Desc"),
      admin: { label: t("allowed"), type: "allowed" },
      ally: { label: t("scopedValidators"), type: "scoped" },
      accounting: { label: t("denied"), type: "denied" },
      validator: { label: t("denied"), type: "denied" },
      client: { label: t("denied"), type: "denied" },
    },
    {
      title: t("c9Title"),
      desc: t("c9Desc"),
      admin: { label: t("exclusive"), type: "allowed" },
      ally: { label: t("denied"), type: "denied" },
      accounting: { label: t("denied"), type: "denied" },
      validator: { label: t("denied"), type: "denied" },
      client: { label: t("denied"), type: "denied" },
    },
  ];

  function renderCheckBadge(item: { label: string; type: string }) {
    if (item.type === "allowed") {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
          {item.label}
        </span>
      );
    }
    if (item.type === "scoped") {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-bold bg-amber-500/15 text-amber-500 border border-amber-500/30">
          {item.label}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-bold bg-rose-500/15 text-rose-500 border border-rose-500/30">
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
              <th className="px-4 py-3.5 text-center">👑 ADMIN</th>
              <th className="px-4 py-3.5 text-center">🏢 ALLY</th>
              <th className="px-4 py-3.5 text-center">💳 ACCOUNTING</th>
              <th className="px-4 py-3.5 text-center">🎟️ VALIDATOR</th>
              <th className="px-4 py-3.5 text-center">📱 CLIENT</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {matrixRows.map((row, idx) => (
              <tr key={idx} className="transition-colors hover:bg-muted/40">
                <td className="px-5 py-3.5">
                  <div className="font-bold text-foreground">{row.title}</div>
                  <div className="text-xs text-muted-foreground">{row.desc}</div>
                </td>
                <td className="px-4 py-3.5 text-center">{renderCheckBadge(row.admin)}</td>
                <td className="px-4 py-3.5 text-center">{renderCheckBadge(row.ally)}</td>
                <td className="px-4 py-3.5 text-center">{renderCheckBadge(row.accounting)}</td>
                <td className="px-4 py-3.5 text-center">{renderCheckBadge(row.validator)}</td>
                <td className="px-4 py-3.5 text-center">{renderCheckBadge(row.client)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
