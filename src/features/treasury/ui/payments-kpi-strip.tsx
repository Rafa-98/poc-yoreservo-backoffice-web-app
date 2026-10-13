"use client";

import { useTranslations } from "next-intl";
import type { TreasuryKpis } from "../model/types";

interface PaymentsKpiStripProps {
  kpis: TreasuryKpis;
}

export function PaymentsKpiStrip({ kpis }: PaymentsKpiStripProps) {
  const t = useTranslations("treasury.inbox.kpi");

  return (
    <section className="agenda-kpi-strip" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, padding: "0 20px 20px" }}>
      {/* 1. Pending */}
      <div className="kpi-card-mini" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: 16, padding: "16px 18px" }}>
        <span className="kpi-label" style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)" }}>
          {t("pendingTitle")}
        </span>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 4 }}>
          <span style={{ fontSize: 22, fontWeight: 800, color: "var(--status-hold-text)" }}>
            {t("pendingCount", { count: kpis.pendingCount })}
          </span>
          <span style={{ fontSize: 11.5, color: "var(--text-muted)" }}>
            {t("pendingAmount", {
              bs: kpis.pendingAmountBs.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
              usd: kpis.pendingAmountUsd.toFixed(2),
            })}
          </span>
        </div>
      </div>

      {/* 2. Verified Today */}
      <div className="kpi-card-mini" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: 16, padding: "16px 18px" }}>
        <span className="kpi-label" style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)" }}>
          {t("verifiedToday")}
        </span>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 4 }}>
          <span style={{ fontSize: 22, fontWeight: 800, color: "#059669" }}>
            {t("verifiedCount", { count: kpis.verifiedTodayCount })}
          </span>
          <span className="badge badge-available" style={{ fontSize: 10, padding: "2px 8px", borderRadius: 6, fontWeight: 700, background: "rgba(16, 185, 129, 0.15)", color: "#059669" }}>
            {t("verifiedBadge")}
          </span>
        </div>
      </div>

      {/* 3. Rejected */}
      <div className="kpi-card-mini" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: 16, padding: "16px 18px" }}>
        <span className="kpi-label" style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)" }}>
          {t("rejected")}
        </span>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 4 }}>
          <span style={{ fontSize: 22, fontWeight: 800, color: "var(--status-cancelled-text)" }}>
            {t("rejectedCount", { count: kpis.rejectedCount })}
          </span>
          <span style={{ fontSize: 11.5, color: "var(--text-muted)" }}>
            {t("rejectedSub")}
          </span>
        </div>
      </div>

      {/* 4. Speed */}
      <div className="kpi-card-mini" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: 16, padding: "16px 18px" }}>
        <span className="kpi-label" style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)" }}>
          {t("speed")}
        </span>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 4 }}>
          <span style={{ fontSize: 22, fontWeight: 800, color: "var(--text-link)" }}>
            {t("speedValue")}
          </span>
          <span style={{ fontSize: 11.5, color: "var(--text-muted)" }}>
            {t("speedTarget")}
          </span>
        </div>
      </div>
    </section>
  );
}
