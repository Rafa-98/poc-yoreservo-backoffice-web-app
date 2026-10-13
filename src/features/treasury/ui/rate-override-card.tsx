"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
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
  const [rate, setRate] = useState<string>("878.00");
  const [justification, setJustification] = useState(
    "Ajuste preventivo por cierre bancario y fecha valor extendida del BCV.",
  );
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
        valueDate: "2026-10-13",
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
    <div
      className="card"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-subtle)",
        borderTop: "4px solid var(--status-hold-text)",
        borderRadius: 20,
        padding: 24,
        boxShadow: "var(--shadow-sm)",
        marginBottom: 24,
      }}
    >
      <div style={{ marginBottom: 18 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "var(--status-hold-text)",
          }}
        >
          {t("badge")}
        </div>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginTop: 2, color: "var(--text-main)" }}>
          {t("title")}
        </h3>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4, lineHeight: 1.5 }}>
          {t("desc")}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
            marginBottom: 16,
          }}
        >
          {/* CURRENCY TARGET */}
          <div className="form-group">
            <label
              className="form-label"
              htmlFor="manual-currency-select"
              style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6, color: "var(--text-main)" }}
            >
              {t("currencyTarget")}
            </label>
            <select
              id="manual-currency-select"
              className="input-field"
              required
              value={currencyCode}
              onChange={(e) => setCurrencyCode(e.target.value as "USD" | "EUR")}
              style={{
                width: "100%",
                padding: "9px 12px",
                fontSize: 13,
                borderRadius: 10,
                background: "var(--bg-muted)",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-main)",
                cursor: "pointer",
              }}
            >
              <option value="USD">{t("dollarBcv")}</option>
              <option value="EUR">{t("euroBcv")}</option>
            </select>
          </div>

          {/* NEW RATE */}
          <div className="form-group">
            <label
              className="form-label"
              htmlFor="manual-rate-input"
              style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6, color: "var(--text-main)" }}
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
              className="input-field"
              placeholder="ej. 880.50"
              style={{
                width: "100%",
                padding: "9px 12px",
                fontSize: 13,
                borderRadius: 10,
                background: "var(--bg-muted)",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-main)",
              }}
            />
          </div>

          {/* OPERATOR */}
          <div className="form-group">
            <label
              className="form-label"
              htmlFor="manual-operator-input"
              style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6, color: "var(--text-main)" }}
            >
              {t("operator")}
            </label>
            <input
              id="manual-operator-input"
              type="text"
              readOnly
              value={operatorName}
              className="input-field"
              style={{
                width: "100%",
                padding: "9px 12px",
                fontSize: 13,
                borderRadius: 10,
                background: "var(--bg-muted)",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-muted)",
              }}
            />
          </div>
        </div>

        {/* JUSTIFICATION */}
        <div className="form-group" style={{ marginBottom: 18 }}>
          <label
            className="form-label"
            htmlFor="manual-justification-input"
            style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6, color: "var(--text-main)" }}
          >
            {t("justification")}
          </label>
          <textarea
            id="manual-justification-input"
            rows={2}
            required
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            className="input-field"
            placeholder={t("justificationPlaceholder")}
            style={{
              width: "100%",
              padding: "9px 12px",
              fontSize: 13,
              borderRadius: 10,
              background: "var(--bg-muted)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-main)",
              fontFamily: "inherit",
              resize: "vertical",
            }}
          />
        </div>

        {/* ACTIONS */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          {statusMessage ? (
            <span style={{ fontSize: 12, color: "#059669", fontWeight: 700 }}>
              ✓ {statusMessage}
            </span>
          ) : <div />}

          <button
            id="btn-save-manual-rate"
            type="submit"
            className="btn btn-outline"
            disabled={isProcessing}
            style={{
              borderColor: "var(--status-hold-border)",
              color: "var(--status-hold-text)",
              padding: "10px 18px",
              fontSize: 13,
              borderRadius: 10,
              fontWeight: 700,
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span>💾</span>
            <span>{isProcessing ? "Registrando..." : t("save")}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
