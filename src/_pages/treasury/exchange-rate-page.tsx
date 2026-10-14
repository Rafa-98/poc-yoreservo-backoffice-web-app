"use client";

import { useState } from "react";
import {
  getExchangeRatesAction,
  overrideExchangeRateAction,
  syncBcvExchangeRatesAction,
} from "@/features/treasury/actions/treasury-actions";
import type {
  ExchangeRateData,
  ExchangeRateItem,
  ManualRateOverrideInput,
} from "@/features/treasury/model/types";
import { RateHeroCards } from "@/features/treasury/ui/rate-hero-cards";
import { RateTickerRibbon } from "@/features/treasury/ui/rate-ticker-ribbon";
import { RateOverrideCard } from "@/features/treasury/ui/rate-override-card";
import { RateHistoryTable } from "@/features/treasury/ui/rate-history-table";

interface ExchangeRatePageProps {
  initialData: ExchangeRateData;
  operatorName?: string;
}

export function ExchangeRatePage({
  initialData,
  operatorName = "YoReservo Tesorería",
}: ExchangeRatePageProps) {
  const [activeUsd, setActiveUsd] = useState<ExchangeRateItem | null>(initialData.activeUsd);
  const [activeEur, setActiveEur] = useState<ExchangeRateItem | null>(initialData.activeEur);
  const [history, setHistory] = useState<ExchangeRateItem[]>(initialData.history);
  const [lastSync, setLastSync] = useState(initialData.lastSync);
  const [secondaryCurrencies] = useState(initialData.secondaryCurrencies);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleForceSync = async () => {
    await syncBcvExchangeRatesAction();
    const res = await getExchangeRatesAction();
    if (res.ok) {
      setActiveUsd(res.data.activeUsd);
      setActiveEur(res.data.activeEur);
      setHistory(res.data.history);
      setLastSync(new Date().toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" }));
    }
  };

  const handleSaveOverride = async (input: ManualRateOverrideInput) => {
    setIsProcessing(true);
    try {
      const res = await overrideExchangeRateAction(input);
      if (res.ok) {
        const refreshed = await getExchangeRatesAction();
        if (refreshed.ok) {
          setActiveUsd(refreshed.data.activeUsd);
          setActiveEur(refreshed.data.activeEur);
          setHistory(refreshed.data.history);
        }
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="exchange-rate-container px-5 pb-10">
      {/* DUAL HERO CARDS */}
      <RateHeroCards activeUsd={activeUsd} activeEur={activeEur} />

      {/* TICKER & WORKER CONTROL RIBBON */}
      <RateTickerRibbon
        lastSync={lastSync}
        secondaryCurrencies={secondaryCurrencies}
        onForceSync={handleForceSync}
      />

      {/* MANUAL OVERRIDE CARD */}
      <RateOverrideCard
        onSaveOverride={handleSaveOverride}
        operatorName={operatorName}
        isProcessing={isProcessing}
      />

      {/* RATE HISTORY LEDGER TABLE */}
      <RateHistoryTable rates={history} />
    </div>
  );
}
