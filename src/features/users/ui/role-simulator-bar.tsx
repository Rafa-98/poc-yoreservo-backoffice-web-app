"use client";

import React from "react";
import { useTranslations } from "next-intl";
import type { UserRole } from "../model/types";

interface RoleSimulatorBarProps {
  currentSimulatedRole: UserRole | "ALL";
  onSelectRole: (role: UserRole | "ALL") => void;
}

export function RoleSimulatorBar({
  currentSimulatedRole,
  onSelectRole,
}: RoleSimulatorBarProps) {
  const t = useTranslations("users.simulator");

  const roles: Array<{ id: UserRole | "ALL"; icon: string; label: string }> = [
    { id: "ALL", icon: "🌐", label: t("allRoles") },
    { id: "ADMIN", icon: "👑", label: t("admin") },
    { id: "ALLY", icon: "🏢", label: t("ally") },
    { id: "ACCOUNTING", icon: "💳", label: t("accounting") },
    { id: "VALIDATOR", icon: "🎟️", label: t("validator") },
  ];

  return (
    <section
      className="w-full border-b border-border bg-surface px-5 py-3 transition-colors"
      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted-foreground)" }}>
          {t("label")}
        </span>
        <span style={{ fontSize: "12px", color: "var(--muted-foreground)" }}>
          {t("desc")}
        </span>
      </div>

      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {roles.map((r) => {
          const isActive = currentSimulatedRole === r.id;
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => onSelectRole(r.id)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all cursor-pointer select-none ${
                isActive
                  ? "bg-accent/20 border border-accent text-foreground shadow-sm"
                  : "bg-muted border border-border text-muted-foreground hover:border-border-strong hover:text-foreground"
              }`}
            >
              <span>{r.icon}</span>
              <span>{r.label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
