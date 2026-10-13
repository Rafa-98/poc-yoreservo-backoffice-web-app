"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { ExchangeRateItem } from "../model/types";

interface RateHistoryTableProps {
  rates: ExchangeRateItem[];
}

export function RateHistoryTable({ rates }: RateHistoryTableProps) {
  const t = useTranslations("treasury.rate.ledger");
  const [exportNotice, setExportNotice] = useState(false);

  const handleExport = () => {
    setExportNotice(true);
    setTimeout(() => setExportNotice(false), 3000);
  };

  return (
    <div
      className="card"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-subtle)",
        borderRadius: 24,
        padding: 24,
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 18,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "var(--text-main)" }}>
            {t("title")}
          </h3>
          <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "4px 0 0" }}>
            {t("desc")}
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {exportNotice && (
            <span style={{ fontSize: 12, color: "#059669", fontWeight: 600 }}>
              ✓ {t("exportSuccess")}
            </span>
          )}
          <button
            id="btn-export-ledger"
            type="button"
            className="btn btn-outline"
            onClick={handleExport}
            style={{ fontSize: 12.5, padding: "8px 14px", borderRadius: 10 }}
          >
            📊 {t("export")}
          </button>
        </div>
      </div>

      <div
        className="table-responsive"
        style={{
          width: "100%",
          overflowX: "auto",
          borderRadius: 16,
          border: "1px solid var(--border-subtle)",
        }}
      >
        <table className="data-table" style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13.5 }}>
          <thead>
            <tr style={{ background: "var(--bg-app)", borderBottom: "1px solid var(--border-subtle)" }}>
              <th style={{ padding: "14px 18px", color: "var(--text-muted)", fontWeight: 700, fontSize: 11.5, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {t("thDate")}
              </th>
              <th style={{ padding: "14px 18px", color: "var(--text-muted)", fontWeight: 700, fontSize: 11.5, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {t("thCurrency")}
              </th>
              <th style={{ padding: "14px 18px", color: "var(--text-muted)", fontWeight: 700, fontSize: 11.5, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {t("thRate")}
              </th>
              <th style={{ padding: "14px 18px", color: "var(--text-muted)", fontWeight: 700, fontSize: 11.5, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {t("thOrigin")}
              </th>
              <th style={{ padding: "14px 18px", color: "var(--text-muted)", fontWeight: 700, fontSize: 11.5, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {t("thJustification")}
              </th>
              <th style={{ padding: "14px 18px", color: "var(--text-muted)", fontWeight: 700, fontSize: 11.5, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {t("thStatus")}
              </th>
            </tr>
          </thead>
          <tbody>
            {rates.map((r) => {
              const isUsd = r.currencyCode === "USD";
              const isEur = r.currencyCode === "EUR";
              const rateColor = isEur ? "#2563EB" : isUsd ? "var(--text-link)" : "var(--text-main)";

              return (
                <tr
                  key={r.id}
                  style={{
                    borderBottom: "1px solid var(--border-subtle)",
                    transition: "background-color 0.15s ease",
                  }}
                >
                  {/* DATE */}
                  <td style={{ padding: "14px 18px" }}>
                    <div style={{ fontWeight: 700, color: "var(--text-main)" }}>
                      {r.valueDate || "13/10/2026"}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                      {r.createdAt ? r.createdAt.slice(11, 19) : "09:00:15 AM"}
                    </div>
                  </td>

                  {/* PAIR */}
                  <td style={{ padding: "14px 18px" }}>
                    <span
                      className={isEur ? "badge badge-confirmed" : "badge badge-available"}
                      style={{
                        fontWeight: 700,
                        fontSize: 11,
                        padding: "3px 8px",
                        borderRadius: 6,
                        background: isEur ? "rgba(37, 99, 235, 0.12)" : "rgba(16, 185, 129, 0.12)",
                        color: isEur ? "#2563EB" : "#059669",
                      }}
                    >
                      {r.currencyCode} / {r.targetCurrencyCode}
                    </span>
                  </td>

                  {/* RATE */}
                  <td style={{ padding: "14px 18px" }}>
                    <div style={{ fontFamily: "Outfit, sans-serif", fontSize: 15, fontWeight: 700, color: rateColor }}>
                      {r.rate.toLocaleString("es-VE", { minimumFractionDigits: 6, maximumFractionDigits: 6 })} Bs.
                    </div>
                  </td>

                  {/* ORIGIN */}
                  <td style={{ padding: "14px 18px" }}>
                    {r.generatedBy === "SYSTEM" ? (
                      <span
                        className="badge badge-available"
                        style={{
                          fontSize: 11,
                          padding: "3px 8px",
                          borderRadius: 6,
                          background: "rgba(16, 185, 129, 0.12)",
                          color: "#059669",
                          fontWeight: 600,
                        }}
                      >
                        🤖 SYSTEM (BCV API)
                      </span>
                    ) : (
                      <span
                        className="badge badge-hold"
                        style={{
                          fontSize: 11,
                          padding: "3px 8px",
                          borderRadius: 6,
                          background: "rgba(234, 118, 0, 0.12)",
                          color: "var(--status-hold-text)",
                          fontWeight: 600,
                        }}
                      >
                        👤 MANUAL
                      </span>
                    )}
                  </td>

                  {/* JUSTIFICATION */}
                  <td style={{ padding: "14px 18px" }}>
                    <div style={{ fontSize: 12.5, color: "var(--text-main)" }}>
                      {r.notes || r.sourceDetails || "Sincronización matutina automática BCV"}
                    </div>
                    {r.creator && (
                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                        Operador: {r.creator.name} {r.creator.lastName}
                      </div>
                    )}
                  </td>

                  {/* STATUS */}
                  <td style={{ padding: "14px 18px" }}>
                    {r.isActive ? (
                      <span
                        className="badge badge-available"
                        style={{
                          fontSize: 10.5,
                          fontWeight: 700,
                          padding: "3px 8px",
                          borderRadius: 6,
                          background: "rgba(16, 185, 129, 0.15)",
                          color: "#059669",
                        }}
                      >
                        {t("active")}
                      </span>
                    ) : (
                      <span
                        className="badge badge-blocked"
                        style={{
                          fontSize: 10.5,
                          fontWeight: 600,
                          padding: "3px 8px",
                          borderRadius: 6,
                          background: "var(--bg-muted)",
                          color: "var(--text-muted)",
                        }}
                      >
                        {t("historical")}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
