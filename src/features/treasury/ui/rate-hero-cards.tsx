"use client";

import { useTranslations } from "next-intl";
import { DEFAULT_BCV_EUR_RATE, DEFAULT_BCV_USD_RATE, useTimeFormat } from "@/shared/lib";
import type { ExchangeRateItem } from "../model/types";

interface RateHeroCardsProps {
  activeUsd: ExchangeRateItem | null;
  activeEur: ExchangeRateItem | null;
}

export function RateHeroCards({ activeUsd, activeEur }: RateHeroCardsProps) {
  const t = useTranslations("treasury.rate");
  const { formatTime } = useTimeFormat();

  const usdRate = activeUsd ? activeUsd.rate : DEFAULT_BCV_USD_RATE;
  const eurRate = activeEur ? activeEur.rate : DEFAULT_BCV_EUR_RATE;

  const todayIso = new Date().toISOString().slice(0, 10);
  const usdValueDate = formatTime(activeUsd?.valueDate || todayIso);
  const eurValueDate = formatTime(activeEur?.valueDate || todayIso);

  return (
    <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* 1. BCV USD CARD */}
      <div className="rate-hero-card flex flex-col gap-3 rounded-3xl border border-border border-l-[5px] border-l-accent bg-surface p-6 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-status-available-fg shadow-[0_0_10px_var(--status-available-fg)]" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-status-available-fg">
              {t("usdActive")}
            </span>
          </div>
          <span className="badge badge-available rounded-md bg-status-available-bg px-2 py-0.5 text-[11px] font-bold text-status-available-fg">
            USD / VES
          </span>
        </div>

        <div className="my-1.5 flex items-baseline gap-2.5">
          <span
            id="current-bcv-usd"
            className="font-display text-[42px] font-extrabold leading-none text-foreground"
          >
            {usdRate.toFixed(2)}
          </span>
          <span className="text-base font-bold text-muted-foreground">
            Bs. / USD
          </span>
        </div>

        <div className="text-xs text-muted-foreground">
          <strong className="text-foreground">
            {usdRate.toLocaleString("es-VE", {
              minimumFractionDigits: 6,
              maximumFractionDigits: 6,
            })}{" "}
            Bs.
          </strong>{" "}
          • <span>{t("valDate")}</span> {usdValueDate}
        </div>

        <div className="mt-1 text-xs text-muted-foreground">
          {t("usdDesc")}
        </div>
      </div>

      {/* 2. BCV EUR CARD */}
      <div className="rate-hero-card flex flex-col gap-3 rounded-3xl border border-border border-l-[5px] border-l-status-confirmed-fg bg-surface p-6 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-status-confirmed-fg shadow-[0_0_10px_var(--status-confirmed-fg)]" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-status-confirmed-fg">
              {t("eurActive")}
            </span>
          </div>
          <span className="badge badge-confirmed rounded-md bg-status-confirmed-bg px-2 py-0.5 text-[11px] font-bold text-status-confirmed-fg">
            EUR / VES
          </span>
        </div>

        <div className="my-1.5 flex items-baseline gap-2.5">
          <span
            id="current-bcv-eur"
            className="font-display text-[42px] font-extrabold leading-none text-foreground"
          >
            {eurRate.toFixed(2)}
          </span>
          <span className="text-base font-bold text-muted-foreground">
            Bs. / EUR
          </span>
        </div>

        <div className="text-xs text-muted-foreground">
          <strong className="text-foreground">
            {eurRate.toLocaleString("es-VE", {
              minimumFractionDigits: 6,
              maximumFractionDigits: 6,
            })}{" "}
            Bs.
          </strong>{" "}
          • <span>{t("valDate")}</span> {eurValueDate}
        </div>

        <div className="mt-1 text-xs text-muted-foreground">
          {t("eurDesc")}
        </div>
      </div>
    </div>
  );
}
