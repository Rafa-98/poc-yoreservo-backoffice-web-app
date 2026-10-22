"use client";

import { Calendar } from "lucide-react";
import { useTranslations } from "next-intl";

export type PaymentDatePreset =
  | "TODAY"
  | "YESTERDAY"
  | "LAST_7_DAYS"
  | "THIS_MONTH"
  | "ALL"
  | "CUSTOM";

export type PaymentCustodyTab = "ALLY_DIRECT" | "PLATFORM_CUSTODY";

export type PaymentMethodTab =
  | "PAGO_MOVIL"
  | "CASH"
  | "ZELLE"
  | "PIPOL_PAY";

export interface PaymentMethodTabCounts {
  total: number;
  pending: number;
}

interface PaymentsFilterBarProps {
  custodyTab: PaymentCustodyTab;
  onCustodyTabChange: (tab: PaymentCustodyTab) => void;
  custodyCounts: {
    allyDirectTotal: number;
    allyDirectPending: number;
    platformCustodyTotal: number;
    platformCustodyPending: number;
  };
  paymentMethodTab: PaymentMethodTab;
  onPaymentMethodTabChange: (method: PaymentMethodTab) => void;
  methodCounts: Record<PaymentMethodTab, PaymentMethodTabCounts>;
  datePreset: PaymentDatePreset;
  onDatePresetChange: (preset: PaymentDatePreset) => void;
  customFromDate: string;
  onCustomFromDateChange: (date: string) => void;
  customToDate: string;
  onCustomToDateChange: (date: string) => void;
  statusFilter: string;
  onStatusChange: (status: string) => void;
  bankFilter: string;
  onBankChange: (bank: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  counts: {
    all: number;
    pending: number;
    verified: number;
    rejected: number;
  };
}

export function PaymentsFilterBar({
  custodyTab,
  onCustodyTabChange,
  custodyCounts,
  paymentMethodTab,
  onPaymentMethodTabChange,
  methodCounts,
  datePreset,
  onDatePresetChange,
  customFromDate,
  onCustomFromDateChange,
  customToDate,
  onCustomToDateChange,
  statusFilter,
  onStatusChange,
  bankFilter,
  onBankChange,
  searchQuery,
  onSearchChange,
  counts,
}: PaymentsFilterBarProps) {
  const t = useTranslations("treasury.inbox.filters");

  const datePresets: Array<{ key: PaymentDatePreset; label: string }> = [
    { key: "TODAY", label: t("periodToday") },
    { key: "YESTERDAY", label: t("periodYesterday") },
    { key: "LAST_7_DAYS", label: t("periodLast7Days") },
    { key: "THIS_MONTH", label: t("periodThisMonth") },
    { key: "ALL", label: t("periodAll") },
    { key: "CUSTOM", label: t("periodCustom") },
  ];

  const paymentMethodTabs: Array<{ key: PaymentMethodTab; label: string }> = [
    { key: "PAGO_MOVIL", label: t("methodPagoMovil") },
    { key: "CASH", label: t("methodCash") },
    { key: "ZELLE", label: t("methodZelle") },
    { key: "PIPOL_PAY", label: t("methodPipolPay") },
  ];

  return (
    <section className="space-y-3.5 px-5 pb-4">
      {/* ROW 1: SEGMENTED CUSTODY ACCOUNT TABS & DATE RANGE SELECTOR */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-3 shadow-2xs">
        {/* Segmented Custody Tabs */}
        <div
          role="tablist"
          aria-label="Destination account selector"
          className="inline-flex flex-wrap items-center gap-1.5 rounded-xl border border-border bg-surface-muted p-1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={custodyTab === "ALLY_DIRECT"}
            onClick={() => onCustodyTabChange("ALLY_DIRECT")}
            className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
              custodyTab === "ALLY_DIRECT"
                ? "bg-surface text-foreground shadow-xs border border-border/80"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>{t("tabAllyDirect")}</span>
            <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10.5px] font-bold text-foreground">
              {custodyCounts.allyDirectTotal}
            </span>
            {custodyCounts.allyDirectPending > 0 && (
              <span className="rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                {t("pendingBadge", { count: custodyCounts.allyDirectPending })}
              </span>
            )}
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={custodyTab === "PLATFORM_CUSTODY"}
            onClick={() => onCustodyTabChange("PLATFORM_CUSTODY")}
            className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
              custodyTab === "PLATFORM_CUSTODY"
                ? "bg-surface text-foreground shadow-xs border border-border/80"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>{t("tabPlatformCustody")}</span>
            <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10.5px] font-bold text-foreground">
              {custodyCounts.platformCustodyTotal}
            </span>
            {custodyCounts.platformCustodyPending > 0 && (
              <span className="rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                {t("pendingBadge", { count: custodyCounts.platformCustodyPending })}
              </span>
            )}
          </button>
        </div>

        {/* Date Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 text-xs font-bold text-muted-foreground mr-1">
            <Calendar className="size-3.5" />
            <span>{t("periodLabel")}</span>
          </span>
          {datePresets.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => onDatePresetChange(p.key)}
              className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                datePreset === p.key
                  ? "border-accent bg-accent text-accent-foreground font-bold shadow-2xs"
                  : "border-border bg-surface-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* OPTIONAL CUSTOM DATE RANGE BAR */}
      {datePreset === "CUSTOM" && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3 shadow-2xs">
          <div className="flex items-center gap-2">
            <label
              htmlFor="payments-from-date"
              className="text-xs font-bold text-muted-foreground"
            >
              {t("fromDate")}:
            </label>
            <input
              id="payments-from-date"
              type="date"
              value={customFromDate}
              onChange={(e) => onCustomFromDateChange(e.target.value)}
              className="input-field rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground"
            />
          </div>
          <div className="flex items-center gap-2">
            <label
              htmlFor="payments-to-date"
              className="text-xs font-bold text-muted-foreground"
            >
              {t("toDate")}:
            </label>
            <input
              id="payments-to-date"
              type="date"
              value={customToDate}
              onChange={(e) => onCustomToDateChange(e.target.value)}
              className="input-field rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground"
            />
          </div>
        </div>
      )}

      {/* ROW 2: DEDICATED PAYMENT METHOD TABS (Pago Móvil, Efectivo en Sede, Zelle, Pipol Pay) */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-2.5 shadow-2xs">
        <div
          role="tablist"
          aria-label="Payment method selector"
          className="flex flex-wrap items-center gap-1.5"
        >
          {paymentMethodTabs.map((m) => {
            const isActive = paymentMethodTab === m.key;
            const mCount = methodCounts[m.key] ?? { total: 0, pending: 0 };

            return (
              <button
                key={m.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => onPaymentMethodTabChange(m.key)}
                className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? "border-accent bg-accent/15 text-foreground shadow-2xs"
                    : "border-transparent bg-surface-muted text-muted-foreground hover:border-border hover:text-foreground"
                }`}
              >
                <span>{m.label}</span>
                <span className="rounded-md bg-surface px-1.5 py-0.5 text-[10.5px] font-bold text-foreground border border-border/60">
                  {mCount.total}
                </span>
                {mCount.pending > 0 && (
                  <span className="rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                    {t("pendingBadge", { count: mCount.pending })}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* STATUS CHIPS + BANK SELECTOR (for Pago Móvil) + SEARCH */}
        <div className="flex flex-wrap items-center gap-2">
          {/* STATUS CHIPS */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              className={`filter-chip-btn cursor-pointer rounded-[10px] border border-border px-3 py-1.5 text-xs font-semibold transition-all ${
                statusFilter === "ALL"
                  ? "active bg-foreground text-background"
                  : "bg-surface text-muted-foreground hover:bg-surface-hover"
              }`}
              onClick={() => onStatusChange("ALL")}
            >
              {t("all")} ({counts.all})
            </button>

            <button
              type="button"
              className={`filter-chip-btn inline-flex cursor-pointer items-center gap-1 rounded-[10px] border border-border px-3 py-1.5 text-xs font-semibold transition-all ${
                statusFilter === "PENDING"
                  ? "active bg-foreground text-background"
                  : "bg-surface text-muted-foreground hover:bg-surface-hover"
              }`}
              onClick={() => onStatusChange("PENDING")}
            >
              <span>⏳</span> {t("pending")} ({counts.pending})
            </button>

            <button
              type="button"
              className={`filter-chip-btn inline-flex cursor-pointer items-center gap-1 rounded-[10px] border border-border px-3 py-1.5 text-xs font-semibold transition-all ${
                statusFilter === "VERIFIED"
                  ? "active bg-foreground text-background"
                  : "bg-surface text-muted-foreground hover:bg-surface-hover"
              }`}
              onClick={() => onStatusChange("VERIFIED")}
            >
              <span>✅</span> {t("verified")} ({counts.verified})
            </button>

            <button
              type="button"
              className={`filter-chip-btn inline-flex cursor-pointer items-center gap-1 rounded-[10px] border border-border px-3 py-1.5 text-xs font-semibold transition-all ${
                statusFilter === "REJECTED"
                  ? "active bg-foreground text-background"
                  : "bg-surface text-muted-foreground hover:bg-surface-hover"
              }`}
              onClick={() => onStatusChange("REJECTED")}
            >
              <span>❌</span> {t("rejected")} ({counts.rejected})
            </button>
          </div>

          {/* BANK SELECTOR (Only relevant when viewing Pago Móvil) */}
          {paymentMethodTab === "PAGO_MOVIL" && (
            <select
              id="bank-filter-select"
              className="input-field w-auto cursor-pointer rounded-[10px] border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground"
              value={bankFilter}
              onChange={(e) => onBankChange(e.target.value)}
            >
              <option value="ALL">{t("allBanks")}</option>
              <option value="0134">{t("bankBanesco")}</option>
              <option value="0105">{t("bankMercantil")}</option>
              <option value="0102">{t("bankBdv")}</option>
              <option value="0172">{t("bankBancamiga")}</option>
            </select>
          )}

          {/* SEARCH INPUT */}
          <div className="relative w-[230px]">
            <input
              id="payments-search-input"
              type="text"
              className="input-field w-full rounded-[10px] border border-border bg-surface px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground"
              placeholder={t("searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
