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

import type { BackofficeRole } from "@/shared/config";

interface ExchangeRatePageProps {
  initialData: ExchangeRateData;
  operatorName?: string;
  userRole?: BackofficeRole;
}

export function ExchangeRatePage({
  initialData,
  operatorName = "YoReservo Tesorería",
  userRole = "PLATFORM_ADMIN",
}: ExchangeRatePageProps) {
  const [activeUsd, setActiveUsd] = useState<ExchangeRateItem | null>(initialData.activeUsd);
  const [activeEur, setActiveEur] = useState<ExchangeRateItem | null>(initialData.activeEur);
  const [history, setHistory] = useState<ExchangeRateItem[]>(initialData.history);
  const [activeCurrencyTab, setActiveCurrencyTab] = useState<"USD" | "EUR">("USD");
  const [pagination, setPagination] = useState(
    initialData.historyPagination ?? {
      total: initialData.history.length,
      page: 1,
      limit: 5,
      totalPages: 1,
    },
  );
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [lastSync, setLastSync] = useState(initialData.lastSync);
  const [secondaryCurrencies, setSecondaryCurrencies] = useState(initialData.secondaryCurrencies);
  const [isProcessing, setIsProcessing] = useState(false);

  const canManageRates =
    userRole === "PLATFORM_ADMIN" || userRole === "PLATFORM_ACCOUNTING";

  const fetchHistoryPage = async (currency: "USD" | "EUR", page: number) => {
    setIsLoadingHistory(true);
    try {
      const res = await getExchangeRatesAction({
        currencyCode: currency,
        page,
        limit: 5,
      });
      if (res.ok) {
        setActiveUsd(res.data.activeUsd);
        setActiveEur(res.data.activeEur);
        setHistory(res.data.history);
        if (res.data.historyPagination) {
          setPagination(res.data.historyPagination);
        }
        setSecondaryCurrencies(res.data.secondaryCurrencies);
      }
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleCurrencyTabChange = async (currency: "USD" | "EUR") => {
    if (currency === activeCurrencyTab) return;
    setActiveCurrencyTab(currency);
    await fetchHistoryPage(currency, 1);
  };

  const handlePageChange = async (nextPage: number) => {
    if (nextPage < 1 || nextPage > pagination.totalPages || nextPage === pagination.page) {
      return;
    }
    await fetchHistoryPage(activeCurrencyTab, nextPage);
  };

  const handleForceSync = async () => {
    await syncBcvExchangeRatesAction();
    const res = await getExchangeRatesAction({
      currencyCode: activeCurrencyTab,
      page: 1,
      limit: 5,
    });
    if (res.ok) {
      setActiveUsd(res.data.activeUsd);
      setActiveEur(res.data.activeEur);
      setHistory(res.data.history);
      if (res.data.historyPagination) {
        setPagination(res.data.historyPagination);
      }
      setSecondaryCurrencies(res.data.secondaryCurrencies);
      setLastSync(new Date().toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" }));
    }
  };

  const handleSaveOverride = async (input: ManualRateOverrideInput) => {
    setIsProcessing(true);
    try {
      const res = await overrideExchangeRateAction(input);
      if (res.ok) {
        setActiveCurrencyTab(input.currencyCode);
        const refreshed = await getExchangeRatesAction({
          currencyCode: input.currencyCode,
          page: 1,
          limit: 5,
        });
        if (refreshed.ok) {
          setActiveUsd(refreshed.data.activeUsd);
          setActiveEur(refreshed.data.activeEur);
          setHistory(refreshed.data.history);
          if (refreshed.data.historyPagination) {
            setPagination(refreshed.data.historyPagination);
          }
          setSecondaryCurrencies(refreshed.data.secondaryCurrencies);
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
        canSync={canManageRates}
      />

      {/* MANUAL OVERRIDE CARD */}
      {canManageRates && (
        <RateOverrideCard
          onSaveOverride={handleSaveOverride}
          operatorName={operatorName}
          isProcessing={isProcessing}
          activeUsdRate={activeUsd?.rate}
          activeEurRate={activeEur?.rate}
        />
      )}

      {/* RATE HISTORY LEDGER TABLE */}
      <RateHistoryTable
        rates={history}
        activeCurrency={activeCurrencyTab}
        onCurrencyChange={handleCurrencyTabChange}
        pagination={pagination}
        onPageChange={handlePageChange}
        isLoading={isLoadingHistory}
      />
    </div>
  );
}
