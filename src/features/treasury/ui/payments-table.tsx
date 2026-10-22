"use client";

import { ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { BackofficeRole } from "@/shared/config";
import { DEFAULT_BCV_USD_RATE, useTimeFormat } from "@/shared/lib";
import type { PaymentItem } from "../model/types";
import type { PaymentMethodTab } from "./payments-filter-bar";

interface PaymentsTableProps {
  payments: PaymentItem[];
  paymentMethodTab?: PaymentMethodTab;
  userRole?: BackofficeRole;
  onOpenVoucher: (payment: PaymentItem) => void;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
}

export function canUserReconcilePayment(
  payment: PaymentItem,
  userRole: BackofficeRole = "PLATFORM_ADMIN",
): boolean {
  const mode = payment.collectionMode ?? "PLATFORM_CUSTODY";
  if (mode === "PLATFORM_CUSTODY") {
    return userRole === "PLATFORM_ADMIN" || userRole === "PLATFORM_ACCOUNTING";
  }
  return (
    userRole === "ALLY_ADMIN" ||
    userRole === "ALLY_ACCOUNTING" ||
    userRole === "PLATFORM_ADMIN"
  );
}

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

export function PaymentsTable({
  payments,
  paymentMethodTab = "PAGO_MOVIL",
  onOpenVoucher,
  page = 1,
  pageSize = 5,
  onPageChange,
}: PaymentsTableProps) {
  const t = useTranslations("treasury.inbox.table");
  const locale = useLocale();
  const { formatTime } = useTimeFormat();

  if (payments.length === 0) {
    return (
      <div className="rounded-[20px] border border-border bg-surface px-6 py-12 text-center text-sm text-muted-foreground">
        <span className="mb-2 block text-[32px]">📭</span>
        {t("empty")}
      </div>
    );
  }

  const total = payments.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const startIdx = (safePage - 1) * pageSize;
  const pagedPayments = payments.slice(startIdx, startIdx + pageSize);
  const fromCount = startIdx + 1;
  const toCount = Math.min(total, startIdx + pagedPayments.length);

  const getBankShortName = (bankCode: string | null) => {
    switch (bankCode) {
      case "0134":
        return "0134 — Banesco";
      case "0105":
        return "0105 — Mercantil";
      case "0102":
        return "0102 — Banco de Venezuela";
      case "0172":
        return "0172 — Bancamiga";
      default:
        return bankCode || t("otherBank");
    }
  };

  const getSecondColumnHeader = () => {
    switch (paymentMethodTab) {
      case "PAGO_MOVIL":
        return t("refAndBank");
      case "CASH":
        return t("cashRef");
      case "ZELLE":
      case "PIPOL_PAY":
        return t("digitalRef");
      default:
        return t("methodRef");
    }
  };

  const getRowChannelDetail = (p: PaymentItem) => {
    if (p.paymentMethod === "CASH") {
      return p.reservation?.space?.venue?.name || t("cashSubtitle");
    }
    if (p.paymentMethod === "ZELLE") {
      return p.phoneNumber || p.originBank || "Zelle (USD)";
    }
    if (p.paymentMethod === "PIPOL_PAY") {
      return p.phoneNumber || p.originBank || "Pipol Pay (USD)";
    }
    const bankLabel = getBankShortName(p.originBank);
    return p.phoneNumber ? `${bankLabel} • ${p.phoneNumber}` : bankLabel;
  };

  return (
    <div className="rounded-[20px] border border-border bg-surface p-4 shadow-xs">
      <div className="table-responsive w-full overflow-x-auto rounded-2xl border border-border">
        <table className="data-table w-full border-collapse text-left text-[13.5px]">
          <thead>
            <tr className="border-b border-border bg-background">
              <th className="whitespace-nowrap px-4.5 py-3.5 text-[11.5px] font-bold uppercase tracking-wider text-muted-foreground">
                {t("date")}
              </th>
              <th className="whitespace-nowrap px-4.5 py-3.5 text-[11.5px] font-bold uppercase tracking-wider text-muted-foreground">
                {getSecondColumnHeader()}
              </th>
              <th className="px-4.5 py-3.5 text-[11.5px] font-bold uppercase tracking-wider text-muted-foreground">
                {t("client")}
              </th>
              <th className="px-4.5 py-3.5 text-[11.5px] font-bold uppercase tracking-wider text-muted-foreground">
                {t("amount")}
              </th>
              <th className="px-4.5 py-3.5 text-[11.5px] font-bold uppercase tracking-wider text-muted-foreground">
                {t("status")}
              </th>
              <th className="px-4.5 py-3.5 text-right text-[11.5px] font-bold uppercase tracking-wider text-muted-foreground">
                {t("actions")}
              </th>
            </tr>
          </thead>
          <tbody>
            {pagedPayments.map((p) => {
              const isPending = p.status === "PENDING";
              const isVerified = p.status === "VERIFIED";
              const isRejected =
                p.status === "REJECTED" || p.status === "FAILED";

              const effectiveRate = p.exchangeRate || DEFAULT_BCV_USD_RATE;
              const amountBs = p.amountVes
                ? p.amountVes.toLocaleString("es-VE", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })
                : (p.amount * effectiveRate).toLocaleString("es-VE", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  });

              const refAmount = (p.amountReference ?? p.amount).toFixed(2);
              const refCurrency =
                p.currencyCode || p.reservation?.currencyCode || "USD";
              const refSymbol = refCurrency === "EUR" ? "€" : "$";

              const dateDisplay = formatHumanDate(
                p.paymentDate || (p.createdAt ? p.createdAt.slice(0, 10) : ""),
                locale,
              );
              const timeDisplay = p.createdAt
                ? formatTime(extractCaracasHhMm(p.createdAt))
                : "";

              return (
                <tr
                  key={p.id}
                  id={`row-pm-${p.referenceNumber ?? p.id}`}
                  className="border-b border-border transition-colors hover:bg-surface-hover"
                >
                  {/* 1. DATE & TIME */}
                  <td className="whitespace-nowrap px-4.5 py-3.5">
                    <div className="font-bold text-foreground">
                      {dateDisplay}
                    </div>
                    {timeDisplay && (
                      <div className="text-[11px] text-muted-foreground">
                        {timeDisplay}
                      </div>
                    )}
                  </td>

                  {/* 2. REFERENCE & ORIGIN DETAILS */}
                  <td className="px-4.5 py-3.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`font-display text-sm font-bold ${
                          isRejected ? "text-status-cancelled-fg" : "text-link"
                        }`}
                      >
                        #{p.referenceNumber ?? t("noRef")}
                      </span>
                      {p.isDuplicateReference && (
                        <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/40 bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                          ⚠️ {t("duplicateRefBadge")}
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 text-[11.5px] font-medium text-muted-foreground">
                      {getRowChannelDetail(p)}
                    </div>
                  </td>

                  {/* 3. CLIENT & BOOKING */}
                  <td className="px-4.5 py-3.5">
                    <div className="font-bold text-foreground">
                      {p.reservation?.client?.name}{" "}
                      {p.reservation?.client?.lastName}
                    </div>
                    <div className="mt-0.5 flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
                      <span>{t("bookingLabel")}</span>
                      <span className="rounded bg-muted px-1.5 py-0.2 font-mono text-[11px] font-bold text-foreground">
                        #{p.reservation?.shortCode}
                      </span>
                    </div>
                  </td>

                  {/* 4. TRANSFERRED AMOUNT */}
                  <td className="px-4.5 py-3.5">
                    <div className="text-[15px] font-bold text-foreground">
                      Bs. {amountBs}
                    </div>
                    <div className="text-[11px] font-medium text-muted-foreground">
                      {refSymbol}
                      {refAmount} {refCurrency}
                    </div>
                  </td>

                  {/* 5. STATUS BADGE */}
                  <td className="px-4.5 py-3.5">
                    {isPending && (
                      <span className="badge badge-hold rounded-md bg-status-hold-bg px-2.5 py-1 text-[11.5px] font-bold text-status-hold-fg">
                        ⏳ {t("statusPending")}
                      </span>
                    )}
                    {isVerified && (
                      <span className="badge badge-available rounded-md bg-status-available-bg px-2.5 py-1 text-[11.5px] font-bold text-status-available-fg">
                        ✅ {t("statusVerified")}
                      </span>
                    )}
                    {isRejected && (
                      <span className="badge badge-cancelled rounded-md bg-status-cancelled-bg px-2.5 py-1 text-[11.5px] font-bold text-status-cancelled-fg">
                        ❌ {t("statusRejected")}
                      </span>
                    )}
                  </td>

                  {/* 6. SINGLE ACTION: VIEW DETAILS */}
                  <td className="px-4.5 py-3.5 text-right">
                    <button
                      type="button"
                      className="btn btn-outline inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold cursor-pointer"
                      onClick={() => onOpenVoucher(p)}
                    >
                      <Eye className="size-3.5 text-primary" />
                      <span>{t("viewDetails")}</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer (5 per page) */}
      <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 px-1">
        <div className="text-xs text-muted-foreground">
          {t("paginationInfo", {
            from: fromCount,
            to: toCount,
            total,
          })}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={() => onPageChange?.(safePage - 1)}
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
                  onClick={() => onPageChange?.(pageNum)}
                  className={`inline-flex size-8 items-center justify-center rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    pageNum === safePage
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
            disabled={safePage >= totalPages}
            onClick={() => onPageChange?.(safePage + 1)}
            className="inline-flex items-center gap-1 rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-bold text-foreground shadow-2xs transition-all hover:bg-surface-muted disabled:opacity-45 disabled:pointer-events-none cursor-pointer"
          >
            <span>{t("nextPage")}</span>
            <ChevronRight className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
