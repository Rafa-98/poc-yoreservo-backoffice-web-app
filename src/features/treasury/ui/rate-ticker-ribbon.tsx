"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { SecondaryCurrency } from "../model/types";

interface RateTickerRibbonProps {
  lastSync: string;
  secondaryCurrencies: SecondaryCurrency[];
  onForceSync: () => Promise<void>;
}

export function RateTickerRibbon({
  lastSync,
  secondaryCurrencies,
  onForceSync,
}: RateTickerRibbonProps) {
  const t = useTranslations("treasury.rate");
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncMessage(null);
    try {
      await onForceSync();
      setSyncMessage(t("syncSuccess"));
      setTimeout(() => setSyncMessage(null), 4000);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-subtle)",
        borderRadius: 16,
        padding: "14px 18px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 14,
        marginBottom: 24,
      }}
    >
      {/* SECONDARY CURRENCIES */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", fontSize: 12.5 }}>
        <span style={{ fontWeight: 700, color: "var(--text-main)", display: "flex", alignItems: "center", gap: 6 }}>
          <span>🏛️</span> {t("otherCurrencies")}
        </span>

        {secondaryCurrencies.map((c) => (
          <span
            key={c.currency}
            style={{
              background: "var(--bg-muted)",
              padding: "4px 8px",
              borderRadius: 6,
              fontFamily: "monospace",
              color: "var(--text-main)",
              fontSize: 12,
            }}
          >
            {c.symbol} {c.currency}: {c.rate}
          </span>
        ))}
      </div>

      {/* SYNC ACTIONS */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {syncMessage && (
          <span style={{ fontSize: 11.5, color: "#059669", fontWeight: 600 }}>
            ✓ {syncMessage}
          </span>
        )}
        <div style={{ fontSize: 11.5, color: "var(--text-muted)", textAlign: "right" }}>
          <span>{t("lastSync")}</span>
        </div>
        <button
          id="btn-force-sync"
          type="button"
          className="btn btn-primary"
          onClick={handleSync}
          disabled={isSyncing}
          style={{ fontSize: 12.5, padding: "8px 14px", borderRadius: 10, display: "inline-flex", alignItems: "center", gap: 6 }}
        >
          <span style={{ display: "inline-block", transform: isSyncing ? "rotate(180deg)" : "none", transition: "transform 0.5s ease" }}>
            🔄
          </span>
          <span>{isSyncing ? t("syncing") : t("syncNow")}</span>
        </button>
      </div>
    </div>
  );
}
