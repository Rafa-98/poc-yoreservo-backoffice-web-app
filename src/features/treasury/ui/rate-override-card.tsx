"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { DEFAULT_BCV_USD_RATE } from "@/shared/lib";
import type { ManualRateOverrideInput } from "../model/types";

interface RateOverrideCardProps {
  onSaveOverride: (input: ManualRateOverrideInput) => Promise<void>;
  operatorName?: string;
  isProcessing?: boolean;
}

export function RateOverrideCard({
  onSaveOverride,
  operatorName = "YoReservo Tesorería",
  isProcessing = false,
}: RateOverrideCardProps) {
  const t = useTranslations("treasury.rate.override");

  const [currencyCode, setCurrencyCode] = useState<"USD" | "EUR">("USD");
  const [rate, setRate] = useState<string>(() => DEFAULT_BCV_USD_RATE.toFixed(2));
  const [valueDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [justification, setJustification] = useState(() => t("defaultJustification"));
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numRate = parseFloat(rate);
    if (!numRate || numRate <= 0) return;

    setStatusMessage(null);
    try {
      await onSaveOverride({
        currencyCode,
        rate: numRate,
        valueDate,
        notes: justification,
        sourceDetails: `Manual Admin Override by ${operatorName}`,
      });
      setStatusMessage(t("success"));
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="card mb-6 rounded-[20px] border border-border border-t-4 border-t-status-hold-fg bg-surface p-6 shadow-xs">
      <div className="mb-4.5">
        <div className="text-[11px] font-bold uppercase tracking-wider text-status-hold-fg">
          {t("badge")}
        </div>
        <h3 className="mt-0.5 text-lg font-bold text-foreground">
          {t("title")}
        </h3>
        <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
          {t("desc")}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mb-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* CURRENCY TARGET */}
          <div className="form-group">
            <label
              className="form-label mb-1.5 block text-xs font-bold text-foreground"
              htmlFor="manual-currency-select"
            >
              {t("currencyTarget")}
            </label>
            <select
              id="manual-currency-select"
              className="input-field w-full cursor-pointer rounded-[10px] border border-border bg-muted px-3 py-2 text-[13px] text-foreground"
              required
              value={currencyCode}
              onChange={(e) => setCurrencyCode(e.target.value as "USD" | "EUR")}
            >
              <option value="USD">{t("dollarBcv")}</option>
              <option value="EUR">{t("euroBcv")}</option>
            </select>
          </div>

          {/* NEW RATE */}
          <div className="form-group">
            <label
              className="form-label mb-1.5 block text-xs font-bold text-foreground"
              htmlFor="manual-rate-input"
            >
              {t("newRate")}
            </label>
            <input
              id="manual-rate-input"
              type="number"
              step="0.000001"
              required
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              className="input-field w-full rounded-[10px] border border-border bg-muted px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground"
              placeholder={t("ratePlaceholder")}
            />
          </div>

          {/* OPERATOR */}
          <div className="form-group">
            <label
              className="form-label mb-1.5 block text-xs font-bold text-foreground"
              htmlFor="manual-operator-input"
            >
              {t("operator")}
            </label>
            <input
              id="manual-operator-input"
              type="text"
              readOnly
              value={operatorName}
              className="input-field w-full rounded-[10px] border border-border bg-muted px-3 py-2 text-[13px] text-muted-foreground"
            />
          </div>
        </div>

        {/* JUSTIFICATION */}
        <div className="form-group mb-4.5">
          <label
            className="form-label mb-1.5 block text-xs font-bold text-foreground"
            htmlFor="manual-justification-input"
          >
            {t("justification")}
          </label>
          <textarea
            id="manual-justification-input"
            rows={2}
            required
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            className="input-field w-full resize-y rounded-[10px] border border-border bg-muted px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground"
            placeholder={t("justificationPlaceholder")}
          />
        </div>

        {/* ACTIONS */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {statusMessage ? (
            <span className="text-xs font-bold text-status-available-fg">
              ✓ {statusMessage}
            </span>
          ) : (
            <div />
          )}

          <button
            id="btn-save-manual-rate"
            type="submit"
            className="btn btn-outline inline-flex items-center gap-2 rounded-[10px] border-status-hold-border px-4.5 py-2.5 text-[13px] font-bold text-status-hold-fg"
            disabled={isProcessing}
          >
            <span>💾</span>
            <span>{isProcessing ? t("saving") : t("save")}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
