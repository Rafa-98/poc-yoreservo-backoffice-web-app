"use client";

import { useTranslations } from "next-intl";

interface PaymentsFilterBarProps {
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
  statusFilter,
  onStatusChange,
  bankFilter,
  onBankChange,
  searchQuery,
  onSearchChange,
  counts,
}: PaymentsFilterBarProps) {
  const t = useTranslations("treasury.inbox.filters");

  return (
    <section className="flex flex-wrap items-center justify-between gap-3.5 px-5 pb-4">
      {/* STATUS CHIPS */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className={`filter-chip-btn cursor-pointer rounded-[10px] border border-border px-3.5 py-1.5 text-xs font-semibold transition-all ${
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
          className={`filter-chip-btn inline-flex cursor-pointer items-center gap-1.5 rounded-[10px] border border-border px-3.5 py-1.5 text-xs font-semibold transition-all ${
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
          className={`filter-chip-btn inline-flex cursor-pointer items-center gap-1.5 rounded-[10px] border border-border px-3.5 py-1.5 text-xs font-semibold transition-all ${
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
          className={`filter-chip-btn inline-flex cursor-pointer items-center gap-1.5 rounded-[10px] border border-border px-3.5 py-1.5 text-xs font-semibold transition-all ${
            statusFilter === "REJECTED"
              ? "active bg-foreground text-background"
              : "bg-surface text-muted-foreground hover:bg-surface-hover"
          }`}
          onClick={() => onStatusChange("REJECTED")}
        >
          <span>❌</span> {t("rejected")} ({counts.rejected})
        </button>
      </div>

      {/* SEARCH & BANK SELECTOR */}
      <div className="flex flex-wrap items-center gap-2.5">
        <select
          id="bank-filter-select"
          className="input-field w-auto cursor-pointer rounded-[10px] border border-border bg-surface px-3 py-2 text-[13px] text-foreground"
          value={bankFilter}
          onChange={(e) => onBankChange(e.target.value)}
        >
          <option value="ALL">{t("allBanks")}</option>
          <option value="0134">{t("bankBanesco")}</option>
          <option value="0105">{t("bankMercantil")}</option>
          <option value="0102">{t("bankBdv")}</option>
          <option value="0172">{t("bankBancamiga")}</option>
        </select>

        <div className="relative w-[260px]">
          <input
            id="payments-search-input"
            type="text"
            className="input-field w-full rounded-[10px] border border-border bg-surface px-3.5 py-2 text-[13px] text-foreground placeholder:text-muted-foreground"
            placeholder={t("searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>
    </section>
  );
}
