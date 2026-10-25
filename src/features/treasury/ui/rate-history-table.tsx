"use client";

import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useTimeFormat } from "@/shared/lib/time-format";
import { getExchangeRatesAction } from "../actions/treasury-actions";
import type {
  ExchangeRateHistoryPagination,
  ExchangeRateItem,
} from "../model/types";

function formatHumanDate(dateStr: string | null | undefined, locale: string): string {
  if (!dateStr) return "—";
  const cleanIso = dateStr.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(cleanIso)) return dateStr;
  const parsed = new Date(`${cleanIso}T12:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return dateStr;
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "es-VE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(parsed);
}

function extractCaracasHhMm(isoDateTime: string | null | undefined): string {
  if (!isoDateTime) return "";
  const parsed = new Date(isoDateTime);
  if (Number.isNaN(parsed.getTime())) {
    return isoDateTime.length >= 16 ? isoDateTime.slice(11, 16) : "";
  }
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/Caracas",
  }).format(parsed);
}

function extractCaracasIsoDate(isoDateTime: string): string {
  const parsed = new Date(isoDateTime);
  if (Number.isNaN(parsed.getTime())) return isoDateTime.slice(0, 10);
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "America/Caracas",
  }).format(parsed);
}

interface RateHistoryTableProps {
  rates: ExchangeRateItem[];
  activeCurrency?: "USD" | "EUR";
  onCurrencyChange?: (currency: "USD" | "EUR") => void;
  pagination?: ExchangeRateHistoryPagination;
  onPageChange?: (page: number) => void;
  isLoading?: boolean;
}

export function RateHistoryTable({
  rates,
  activeCurrency = "USD",
  onCurrencyChange,
  pagination,
  onPageChange,
  isLoading = false,
}: RateHistoryTableProps) {
  const t = useTranslations("treasury.rate.ledger");
  const locale = useLocale();
  const { formatTime } = useTimeFormat();

  const formatJustificationText = (r: ExchangeRateItem): string => {
    const raw = r.notes || r.sourceDetails;
    if (!raw) return t("defaultNotes");

    const autoSyncMatch = raw.match(/^Automated daily sync at\s+(.+)$/i);
    if (autoSyncMatch) {
      const isoStamp = autoSyncMatch[1].trim();
      const datePart = formatHumanDate(extractCaracasIsoDate(isoStamp), locale);
      const hhmm = extractCaracasHhMm(isoStamp);
      const timePart = hhmm ? formatTime(hhmm) : "";
      return t("autoDailySyncAt", { date: datePart, time: timePart });
    }

    // Replace any embedded raw ISO timestamp (e.g. 2026-10-21T12:00:00.350Z) with human-readable date & time
    const cleanedIso = raw.replace(
      /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z/g,
      (isoStamp) => {
        const dPart = formatHumanDate(extractCaracasIsoDate(isoStamp), locale);
        const hhmm = extractCaracasHhMm(isoStamp);
        const tPart = hhmm ? formatTime(hhmm) : "";
        return tPart ? `${dPart}, ${tPart}` : dPart;
      },
    );

    // Replace "(Fecha Valor DD/MM/YYYY)" or "(Fecha Valor YYYY-MM-DD)" with human date
    return cleanedIso.replace(
      /(\d{2})\/(\d{2})\/(\d{4})/g,
      (_m, dd: string, mm: string, yyyy: string) =>
        formatHumanDate(`${yyyy}-${mm}-${dd}`, locale),
    );
  };

  const [exportNotice, setExportNotice] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportCurrency, setExportCurrency] = useState<"USD" | "EUR">(activeCurrency);
  const [exportFromDate, setExportFromDate] = useState("2026-10-01");
  const [exportToDate, setExportToDate] = useState(
    () => rates[0]?.valueDate || new Date().toISOString().slice(0, 10),
  );
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const openExportModal = () => {
    setExportCurrency(activeCurrency);
    const dates = rates
      .map((r) => r.valueDate)
      .filter((d): d is string => Boolean(d))
      .sort();
    if (dates.length > 0) {
      setExportToDate(dates[dates.length - 1]);
      setExportFromDate("2026-10-01");
    }
    setExportError(null);
    setIsExportModalOpen(true);
  };

  const handleConfirmExport = async () => {
    setExportError(null);
    if (!exportFromDate || !exportToDate) {
      return;
    }
    if (exportFromDate > exportToDate) {
      setExportError(t("exportInvalidRange"));
      return;
    }

    setIsExporting(true);
    try {
      const res = await getExchangeRatesAction({
        currencyCode: exportCurrency,
        fromDate: exportFromDate,
        toDate: exportToDate,
        page: 1,
        limit: 1000,
      });

      const exportItems = res.ok ? res.data.history : [];
      if (exportItems.length === 0) {
        setExportError(t("exportEmptyRange"));
        return;
      }

      const headers = [
        "effectiveDate",
        "currency",
        "rate",
        "variationPct",
        "source",
        "createdBy",
        "notes",
      ];
      const rows = exportItems.map((r) => {
        const effectiveDate =
          r.valueDate || (r.createdAt ? r.createdAt.slice(0, 10) : "");
        const currency = `${r.currencyCode}/${r.targetCurrencyCode}`;
        const rateVal = r.rate.toFixed(6);
        const variation = r.variationPct || "0.00%";
        const source = r.generatedBy;
        const creatorName = r.creator
          ? `${r.creator.name} ${r.creator.lastName}`.trim()
          : r.sourceDetails || "SYSTEM";
        const safeCreatedBy = `"${creatorName.replace(/"/g, '""')}"`;
        const notesText = formatJustificationText(r);
        const safeNotes = `"${notesText.replace(/"/g, '""')}"`;

        return [
          effectiveDate,
          currency,
          rateVal,
          variation,
          source,
          safeCreatedBy,
          safeNotes,
        ].join(",");
      });

      const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `YoReservo_Tasas_BCV_${exportCurrency}_${exportFromDate}_a_${exportToDate}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setIsExportModalOpen(false);
      setExportNotice(true);
      setTimeout(() => setExportNotice(false), 3500);
    } finally {
      setIsExporting(false);
    }
  };

  const page = pagination?.page ?? 1;
  const limit = pagination?.limit ?? 5;
  const total = pagination?.total ?? rates.length;
  const totalPages = pagination?.totalPages ?? 1;
  const fromIdx = total === 0 ? 0 : (page - 1) * limit + 1;
  const toIdx = Math.min(total, (page - 1) * limit + rates.length);

  return (
    <div className="card rounded-3xl border border-border bg-surface p-6 shadow-xs">
      {/* Header Row */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="m-0 text-lg font-bold text-foreground">
            {t("title")}
          </h3>
          <p className="mt-1 mb-0 text-[13px] text-muted-foreground">
            {t("desc")}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {exportNotice && (
            <span className="text-xs font-semibold text-status-available-fg">
              ✓ {t("exportSuccess")}
            </span>
          )}
          <button
            id="btn-export-ledger"
            type="button"
            className="btn btn-outline rounded-[10px] px-3.5 py-2 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
            onClick={openExportModal}
          >
            <span>📊</span>
            <span>{t("export")}</span>
          </button>
        </div>
      </div>

      {/* Segmented Currency Switcher Tabs */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label="Currency selector"
          className="inline-flex items-center gap-1.5 rounded-2xl border border-border bg-surface-muted p-1.5"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeCurrency === "USD"}
            onClick={() => onCurrencyChange?.("USD")}
            disabled={isLoading}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
              activeCurrency === "USD"
                ? "bg-surface text-foreground shadow-xs border border-border/80"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>{t("tabUsd")}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeCurrency === "EUR"}
            onClick={() => onCurrencyChange?.("EUR")}
            disabled={isLoading}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
              activeCurrency === "EUR"
                ? "bg-surface text-foreground shadow-xs border border-border/80"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>{t("tabEur")}</span>
          </button>
        </div>

        {isLoading && (
          <div className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin text-link" />
            <span>{t("loadingPage")}</span>
          </div>
        )}
      </div>

      {/* Single-Currency Historical Table */}
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
                {t("thVariation")}
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
          <tbody className={isLoading ? "opacity-60 transition-opacity" : ""}>
            {rates.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-6 py-10 text-center text-sm text-muted-foreground"
                >
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

                const varStr = r.variationPct;
                const isPositiveVar = Boolean(varStr && varStr.startsWith("+") && varStr !== "+0.00%");
                const isNegativeVar = Boolean(varStr && varStr.startsWith("-"));

                return (
                  <tr
                    key={r.id}
                    className="border-b border-border transition-colors hover:bg-surface-hover"
                  >
                    {/* DATE */}
                    <td className="px-4.5 py-3.5">
                      <div className="font-bold text-foreground">
                        {formatHumanDate(r.valueDate, locale)}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {r.createdAt
                          ? formatTime(extractCaracasHhMm(r.createdAt))
                          : "—"}
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
                      <div
                        className={`font-display text-[15px] font-bold ${rateTextClass}`}
                      >
                        {r.rate.toLocaleString("es-VE", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        Bs.
                      </div>
                    </td>

                    {/* VARIATION */}
                    <td className="px-4.5 py-3.5">
                      {varStr ? (
                        <span
                          className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold ${
                            isPositiveVar
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                              : isNegativeVar
                                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                                : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {isPositiveVar && <TrendingUp className="size-3" />}
                          {isNegativeVar && <TrendingDown className="size-3" />}
                          <span>{varStr}</span>
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {t("noVariation")}
                        </span>
                      )}
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
                        {formatJustificationText(r)}
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

      {/* Server-Side Pagination Controls (5 per page) */}
      <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <div className="text-xs text-muted-foreground">
          {t("paginationInfo", {
            from: fromIdx,
            to: toIdx,
            total,
            currency: activeCurrency,
          })}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={page <= 1 || isLoading}
            onClick={() => onPageChange?.(page - 1)}
            className="inline-flex items-center gap-1 rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-bold text-foreground shadow-2xs transition-all hover:bg-surface-muted disabled:opacity-45 disabled:pointer-events-none cursor-pointer"
          >
            <ChevronLeft className="size-3.5" />
            <span>{t("prevPage")}</span>
          </button>

          <div className="flex items-center gap-1 px-1">
            {Array.from({ length: totalPages }, (_, idx) => idx + 1).map(
              (pageNum) => (
                <button
                  key={pageNum}
                  type="button"
                  disabled={isLoading}
                  onClick={() => onPageChange?.(pageNum)}
                  className={`inline-flex size-8 items-center justify-center rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    pageNum === page
                      ? "bg-accent text-accent-foreground shadow-xs"
                      : "border border-border bg-surface text-muted-foreground hover:bg-surface-muted hover:text-foreground"
                  }`}
                >
                  {pageNum}
                </button>
              ),
            )}
          </div>

          <button
            type="button"
            disabled={page >= totalPages || isLoading}
            onClick={() => onPageChange?.(page + 1)}
            className="inline-flex items-center gap-1 rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-bold text-foreground shadow-2xs transition-all hover:bg-surface-muted disabled:opacity-45 disabled:pointer-events-none cursor-pointer"
          >
            <span>{t("nextPage")}</span>
            <ChevronRight className="size-3.5" />
          </button>
        </div>
      </div>

      {/* CSV Export Modal (Currency + FromDate + ToDate) */}
      {isExportModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
          aria-labelledby="export-rate-modal-title"
        >
          <div className="w-full max-w-md rounded-3xl border border-border bg-surface p-6 shadow-modal animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between gap-3 pb-4 border-b border-border">
              <div>
                <h4
                  id="export-rate-modal-title"
                  className="text-base font-bold text-foreground"
                >
                  {t("exportModalTitle")}
                </h4>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  {t("exportModalDesc")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface-muted hover:text-foreground cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {/* Currency Selector */}
              <div>
                <label className="mb-1.5 block text-xs font-bold text-foreground">
                  {t("exportCurrencyLabel")}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setExportCurrency("USD")}
                    className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                      exportCurrency === "USD"
                        ? "border-accent bg-accent/15 text-foreground shadow-2xs"
                        : "border-border bg-surface-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span>{t("tabUsd")}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setExportCurrency("EUR")}
                    className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                      exportCurrency === "EUR"
                        ? "border-accent bg-accent/15 text-foreground shadow-2xs"
                        : "border-border bg-surface-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span>{t("tabEur")}</span>
                  </button>
                </div>
              </div>

              {/* Date Range Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="export-from-date"
                    className="mb-1.5 block text-xs font-bold text-foreground"
                  >
                    {t("exportFromDateLabel")}
                  </label>
                  <input
                    id="export-from-date"
                    type="date"
                    value={exportFromDate}
                    onChange={(e) => setExportFromDate(e.target.value)}
                    className="form-control w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium text-foreground"
                  />
                </div>
                <div>
                  <label
                    htmlFor="export-to-date"
                    className="mb-1.5 block text-xs font-bold text-foreground"
                  >
                    {t("exportToDateLabel")}
                  </label>
                  <input
                    id="export-to-date"
                    type="date"
                    value={exportToDate}
                    onChange={(e) => setExportToDate(e.target.value)}
                    className="form-control w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium text-foreground"
                  />
                </div>
              </div>

              {exportError && (
                <div className="rounded-xl border border-status-cancelled-fg/30 bg-status-cancelled-bg/30 px-3.5 py-2.5 text-xs font-medium text-status-cancelled-fg">
                  {exportError}
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5 pt-4 border-t border-border">
              <button
                type="button"
                disabled={isExporting}
                onClick={() => setIsExportModalOpen(false)}
                className="btn btn-outline rounded-xl px-4 py-2 text-xs font-semibold cursor-pointer"
              >
                {t("exportCancel")}
              </button>
              <button
                type="button"
                disabled={isExporting || !exportFromDate || !exportToDate}
                onClick={handleConfirmExport}
                className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-xs font-bold text-accent-foreground shadow-xs hover:brightness-105 disabled:opacity-50 cursor-pointer"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>{t("exporting")}</span>
                  </>
                ) : (
                  <>
                    <Download className="size-3.5" />
                    <span>{t("exportConfirm")}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
