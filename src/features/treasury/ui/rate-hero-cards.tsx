"use client";

import { useTranslations } from "next-intl";
import type { ExchangeRateItem } from "../model/types";

interface RateHeroCardsProps {
  activeUsd: ExchangeRateItem | null;
  activeEur: ExchangeRateItem | null;
}

export function RateHeroCards({ activeUsd, activeEur }: RateHeroCardsProps) {
  const t = useTranslations("treasury.rate");

  const usdRate = activeUsd ? activeUsd.rate : 876.7976;
  const eurRate = activeEur ? activeEur.rate : 982.004544;

  const usdValueDate = activeUsd?.valueDate || "13/10/2026";
  const eurValueDate = activeEur?.valueDate || "13/10/2026";

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
        gap: 16,
        marginBottom: 16,
      }}
    >
      {/* 1. BCV USD CARD */}
      <div
        className="rate-hero-card"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
          borderLeft: "5px solid var(--brand-lime)",
          borderRadius: 24,
          padding: 24,
          boxShadow: "var(--shadow-sm)",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                backgroundColor: "#059669",
                boxShadow: "0 0 10px #059669",
                display: "inline-block",
              }}
            />
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "#059669",
              }}
            >
              {t("usdActive")}
            </span>
          </div>
          <span
            className="badge badge-available"
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: "3px 8px",
              borderRadius: 6,
              background: "rgba(16, 185, 129, 0.12)",
              color: "#059669",
            }}
          >
            USD / VES
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "baseline", gap: 10, margin: "6px 0" }}>
          <span
            id="current-bcv-usd"
            style={{
              fontFamily: "Outfit, sans-serif",
              fontSize: 42,
              fontWeight: 800,
              color: "var(--text-main)",
              lineHeight: 1,
            }}
          >
            {usdRate.toFixed(2)}
          </span>
          <span style={{ fontSize: 16, fontWeight: 700, color: "var(--text-muted)" }}>
            Bs. / USD
          </span>
        </div>

        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
          <strong style={{ color: "var(--text-main)" }}>
            {usdRate.toLocaleString("es-VE", { minimumFractionDigits: 6, maximumFractionDigits: 6 })} Bs.
          </strong>{" "}
          • <span>{t("valDate")}</span> {usdValueDate}
        </div>

        <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
          {t("usdDesc")}
        </div>
      </div>

      {/* 2. BCV EUR CARD */}
      <div
        className="rate-hero-card"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
          borderLeft: "5px solid #2563EB",
          borderRadius: 24,
          padding: 24,
          boxShadow: "var(--shadow-sm)",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                backgroundColor: "#2563EB",
                boxShadow: "0 0 10px #2563EB",
                display: "inline-block",
              }}
            />
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "#2563EB",
              }}
            >
              {t("eurActive")}
            </span>
          </div>
          <span
            className="badge badge-confirmed"
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: "3px 8px",
              borderRadius: 6,
              background: "rgba(37, 99, 235, 0.12)",
              color: "#2563EB",
            }}
          >
            EUR / VES
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "baseline", gap: 10, margin: "6px 0" }}>
          <span
            id="current-bcv-eur"
            style={{
              fontFamily: "Outfit, sans-serif",
              fontSize: 42,
              fontWeight: 800,
              color: "var(--text-main)",
              lineHeight: 1,
            }}
          >
            {eurRate.toFixed(2)}
          </span>
          <span style={{ fontSize: 16, fontWeight: 700, color: "var(--text-muted)" }}>
            Bs. / EUR
          </span>
        </div>

        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
          <strong style={{ color: "var(--text-main)" }}>
            {eurRate.toLocaleString("es-VE", { minimumFractionDigits: 6, maximumFractionDigits: 6 })} Bs.
          </strong>{" "}
          • <span>{t("valDate")}</span> {eurValueDate}
        </div>

        <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
          {t("eurDesc")}
        </div>
      </div>
    </div>
  );
}
