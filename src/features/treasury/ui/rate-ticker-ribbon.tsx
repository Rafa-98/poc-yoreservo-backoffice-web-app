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
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3.5 rounded-2xl border border-border bg-surface px-4.5 py-3.5">
      {/* SECONDARY CURRENCIES */}
      <div className="flex flex-wrap items-center gap-3 text-xs">
        <span className="flex items-center gap-1.5 font-bold text-foreground">
          <span>🏛️</span> {t("otherCurrencies")}
        </span>

        {secondaryCurrencies.map((c) => (
          <span
            key={c.currency}
            className="rounded-md bg-muted px-2 py-1 font-mono text-xs text-foreground"
          >
            {c.symbol} {c.currency}: {c.rate}
          </span>
        ))}
      </div>

      {/* SYNC ACTIONS */}
      <div className="flex items-center gap-3">
        {syncMessage && (
          <span className="text-[11.5px] font-semibold text-status-available-fg">
            ✓ {syncMessage}
          </span>
        )}
        <div className="text-right text-[11.5px] text-muted-foreground">
          <span>{t("lastSync", { time: lastSync })}</span>
        </div>
        <button
          id="btn-force-sync"
          type="button"
          className="btn btn-primary inline-flex items-center gap-1.5 rounded-[10px] px-3.5 py-2 text-xs"
          onClick={handleSync}
          disabled={isSyncing}
        >
          <span
            className={`inline-block transition-transform duration-500 ${
              isSyncing ? "rotate-180" : ""
            }`}
          >
            🔄
          </span>
          <span>{isSyncing ? t("syncing") : t("syncNow")}</span>
        </button>
      </div>
    </div>
  );
}
