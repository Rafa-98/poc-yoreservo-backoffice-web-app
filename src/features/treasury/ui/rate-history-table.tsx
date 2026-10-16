"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { TimeFormatToggle, useTimeFormat } from "@/shared/lib/time-format";
import type { ExchangeRateItem } from "../model/types";

interface RateHistoryTableProps {
  rates: ExchangeRateItem[];
}

export function RateHistoryTable({ rates }: RateHistoryTableProps) {
  const t = useTranslations("treasury.rate.ledger");
  const { formatTime } = useTimeFormat();
  const [exportNotice, setExportNotice] = useState(false);

  const handleExport = () => {
    const headers = ["effectiveDate", "currency", "rate", "source", "createdBy"];
    const rows = rates.map((r) => {
      const effectiveDate = r.valueDate || (r.createdAt ? r.createdAt.slice(0, 10) : "");
      const currency = `${r.currencyCode}/${r.targetCurrencyCode}`;
      const rateVal = r.rate.toFixed(6);
      const source = r.generatedBy;
      const creatorName = r.creator
        ? `${r.creator.name} ${r.creator.lastName}`.trim()
        : r.sourceDetails || "SYSTEM";
      const safeCreatedBy = `"${creatorName.replace(/"/g, '""')}"`;

      return [effectiveDate, currency, rateVal, source, safeCreatedBy].join(",");
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `YoReservo_Tasas_BCV_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setExportNotice(true);
    setTimeout(() => setExportNotice(false), 3000);
  };

  return (
    <div className="card rounded-3xl border border-border bg-surface p-6 shadow-xs">
      <div className="mb-4.5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="m-0 text-lg font-bold text-foreground">
            {t("title")}
          </h3>
          <p className="mt-1 mb-0 text-[13px] text-muted-foreground">
            {t("desc")}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <TimeFormatToggle size="xs" />
          {exportNotice && (
            <span className="text-xs font-semibold text-status-available-fg">
              ✓ {t("exportSuccess")}
            </span>
          )}
          <button
            id="btn-export-ledger"
            type="button"
            className="btn btn-outline rounded-[10px] px-3.5 py-2 text-xs"
            onClick={handleExport}
          >
            📊 {t("export")}
          </button>
        </div>
      </div>

      <div className="table-responsive w-full overflow-x-auto rounded-2xl border border-border">
        <table className="data-table w-full border-collapse text-left text-[13.5px]">
          <thead>
            <tr className="border-b border-border bg-background">
              <th className="px-4.5 py-3.5 text-[11.5px] font-bold uppercase tracking-wider text-muted-foreground">
                {t("thDate")}
              </th>
              <th className="px-4.5 py-3.5 text-[11.5px] font-bold uppercase tracking-wider text-muted-foreground">
                {t("thCurrency")}
              </th>
              <th className="px-4.5 py-3.5 text-[11.5px] font-bold uppercase tracking-wider text-muted-foreground">
                {t("thRate")}
              </th>
              <th className="px-4.5 py-3.5 text-[11.5px] font-bold uppercase tracking-wider text-muted-foreground">
                {t("thOrigin")}
              </th>
              <th className="px-4.5 py-3.5 text-[11.5px] font-bold uppercase tracking-wider text-muted-foreground">
                {t("thJustification")}
              </th>
              <th className="px-4.5 py-3.5 text-[11.5px] font-bold uppercase tracking-wider text-muted-foreground">
                {t("thStatus")}
              </th>
            </tr>
          </thead>
          <tbody>
            {rates.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-sm text-muted-foreground">
                  {t("empty")}
                </td>
              </tr>
            ) : (
              rates.map((r) => {
                const isUsd = r.currencyCode === "USD";
                const isEur = r.currencyCode === "EUR";
                const rateTextClass = isEur
                  ? "text-status-confirmed-fg"
                  : isUsd
                  ? "text-link"
                  : "text-foreground";

                return (
                  <tr
                    key={r.id}
                    className="border-b border-border transition-colors hover:bg-surface-hover"
                  >
                    {/* DATE */}
                    <td className="px-4.5 py-3.5">
                      <div className="font-bold text-foreground">
                        {r.valueDate || "—"}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {r.createdAt ? formatTime(r.createdAt.slice(11, 16)) : "—"}
                      </div>
                    </td>

                    {/* PAIR */}
                    <td className="px-4.5 py-3.5">
                      <span
                        className={`badge rounded-md px-2 py-0.5 text-[11px] font-bold ${
                          isEur
                            ? "badge-confirmed bg-status-confirmed-bg text-status-confirmed-fg"
                            : "badge-available bg-status-available-bg text-status-available-fg"
                        }`}
                      >
                        {r.currencyCode} / {r.targetCurrencyCode}
                      </span>
                    </td>

                    {/* RATE */}
                    <td className="px-4.5 py-3.5">
                      <div className={`font-display text-[15px] font-bold ${rateTextClass}`}>
                        {r.rate.toLocaleString("es-VE", {
                          minimumFractionDigits: 6,
                          maximumFractionDigits: 6,
                        })}{" "}
                        Bs.
                      </div>
                    </td>

                    {/* ORIGIN */}
                    <td className="px-4.5 py-3.5">
                      {r.generatedBy === "SYSTEM" ? (
                        <span className="badge badge-available rounded-md bg-status-available-bg px-2 py-0.5 text-[11px] font-semibold text-status-available-fg">
                          {t("originSystem")}
                        </span>
                      ) : (
                        <span className="badge badge-hold rounded-md bg-status-hold-bg px-2 py-0.5 text-[11px] font-semibold text-status-hold-fg">
                          {t("originManual")}
                        </span>
                      )}
                    </td>

                    {/* JUSTIFICATION */}
                    <td className="px-4.5 py-3.5">
                      <div className="text-xs text-foreground">
                        {r.notes || r.sourceDetails || t("defaultNotes")}
                      </div>
                      {r.creator && (
                        <div className="mt-0.5 text-[11px] text-muted-foreground">
                          {t("operatorLabel")} {r.creator.name} {r.creator.lastName}
                        </div>
                      )}
                    </td>

                    {/* STATUS */}
                    <td className="px-4.5 py-3.5">
                      {r.isActive ? (
                        <span className="badge badge-available rounded-md bg-status-available-bg px-2 py-0.5 text-[10.5px] font-bold text-status-available-fg">
                          {t("active")}
                        </span>
                      ) : (
                        <span className="badge badge-blocked rounded-md bg-muted px-2 py-0.5 text-[10.5px] font-semibold text-muted-foreground">
                          {t("historical")}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
