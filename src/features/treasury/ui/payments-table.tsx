"use client";

import { useTranslations } from "next-intl";
import { DEFAULT_BCV_USD_RATE } from "@/shared/lib";
import type { PaymentItem } from "../model/types";

interface PaymentsTableProps {
  payments: PaymentItem[];
  onOpenVoucher: (payment: PaymentItem) => void;
  onApprove: (paymentId: string) => Promise<void>;
  onOpenReject: (payment: PaymentItem) => void;
  onViewReason: (payment: PaymentItem) => void;
  isProcessingId?: string | null;
}

export function PaymentsTable({
  payments,
  onOpenVoucher,
  onApprove,
  onOpenReject,
  onViewReason,
  isProcessingId,
}: PaymentsTableProps) {
  const t = useTranslations("treasury.inbox.table");

  if (payments.length === 0) {
    return (
      <div className="rounded-[20px] border border-border bg-surface px-6 py-12 text-center text-sm text-muted-foreground">
        <span className="mb-2 block text-[32px]">📭</span>
        {t("empty")}
      </div>
    );
  }

  const getBankLabel = (bankCode: string | null) => {
    switch (bankCode) {
      case "0134":
        return "0134 — Banesco";
      case "0105":
        return "0105 — Mercantil";
      case "0102":
        return "0102 — BDV";
      case "0172":
        return "0172 — Bancamiga";
      default:
        return bankCode ?? t("otherBank");
    }
  };

  return (
    <div className="table-responsive w-full overflow-x-auto rounded-[20px] border border-border bg-surface shadow-xs">
      <table className="data-table w-full border-collapse text-left text-[13.5px]">
        <thead>
          <tr className="border-b border-border bg-background">
            <th className="whitespace-nowrap px-4.5 py-3.5 text-[11.5px] font-bold uppercase tracking-wider text-muted-foreground">
              {t("ref")}
            </th>
            <th className="px-4.5 py-3.5 text-[11.5px] font-bold uppercase tracking-wider text-muted-foreground">
              {t("client")}
            </th>
            <th className="px-4.5 py-3.5 text-[11.5px] font-bold uppercase tracking-wider text-muted-foreground">
              {t("bank")}
            </th>
            <th className="px-4.5 py-3.5 text-[11.5px] font-bold uppercase tracking-wider text-muted-foreground">
              {t("amount")}
            </th>
            <th className="px-4.5 py-3.5 text-[11.5px] font-bold uppercase tracking-wider text-muted-foreground">
              {t("age")}
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
          {payments.map((p) => {
            const isPending = p.status === "PENDING";
            const isVerified = p.status === "VERIFIED";
            const isRejected = p.status === "REJECTED" || p.status === "FAILED";

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

            const amountUsd = p.amountReference
              ? p.amountReference.toFixed(2)
              : p.amount.toFixed(2);

            const isCurrentProcessing = isProcessingId === p.id;

            return (
              <tr
                key={p.id}
                id={`row-pm-${p.referenceNumber ?? p.id}`}
                className={`border-b border-border transition-colors hover:bg-surface-hover ${
                  isVerified || isRejected ? "row-verified" : ""
                } ${isVerified ? "opacity-85" : ""}`}
              >
                {/* 1. REF & THUMBNAIL */}
                <td className="px-4.5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div
                      className="receipt-thumb flex h-11 w-11 cursor-pointer items-center justify-center rounded-[10px] border border-border bg-muted text-xl transition-transform hover:scale-105"
                      onClick={() => onOpenVoucher(p)}
                      title={t("inspectTitle")}
                    >
                      🧾
                    </div>
                    <div>
                      <div
                        className={`font-display text-sm font-bold ${
                          isRejected ? "text-status-cancelled-fg" : "text-link"
                        }`}
                      >
                        #{p.referenceNumber ?? t("noRef")}
                      </div>
                      <span
                        className="cursor-pointer text-[11px] text-link underline"
                        onClick={() => onOpenVoucher(p)}
                      >
                        👁️ {t("inspect")}
                      </span>
                    </div>
                  </div>
                </td>

                {/* 2. CLIENT & BOOKING */}
                <td className="px-4.5 py-3.5">
                  <div className="font-bold text-foreground">
                    {p.reservation?.client?.name} {p.reservation?.client?.lastName}
                  </div>
                  <div className="text-[11.5px] text-muted-foreground">
                    {t("bookingLabel")} <strong>#{p.reservation?.shortCode}</strong> •{" "}
                    {p.reservation?.space?.spaceNumber}
                  </div>
                </td>

                {/* 3. ORIGIN BANK & PHONE */}
                <td className="px-4.5 py-3.5">
                  <div className="font-semibold text-foreground">
                    {getBankLabel(p.originBank)}
                  </div>
                  <div className="text-[11.5px] text-muted-foreground">
                    {p.phoneNumber || "—"}
                  </div>
                </td>

                {/* 4. AMOUNT IN BS & USD */}
                <td className="px-4.5 py-3.5">
                  <div className="text-[15px] font-bold text-foreground">
                    Bs. {amountBs}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    ${amountUsd} USD @ {effectiveRate.toFixed(2)}
                  </div>
                </td>

                {/* 5. AGE / TIMESTAMP */}
                <td className="px-4.5 py-3.5">
                  {isPending ? (
                    <span className="badge badge-hold rounded-md bg-status-hold-bg px-2 py-0.5 text-[11px] font-semibold text-status-hold-fg">
                      {p.paymentDate || t("pendingRecent")}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {p.paymentDate || "—"}
                    </span>
                  )}
                </td>

                {/* 6. STATUS BADGE */}
                <td className="px-4.5 py-3.5">
                  {isPending && (
                    <span className="badge badge-hold rounded-md bg-status-hold-bg px-2 py-1 text-[11.5px] font-bold text-status-hold-fg">
                      ⏳ {t("statusPending")}
                    </span>
                  )}
                  {isVerified && (
                    <span className="badge badge-available rounded-md bg-status-available-bg px-2 py-1 text-[11.5px] font-bold text-status-available-fg">
                      ✅ {t("statusVerified")}
                    </span>
                  )}
                  {isRejected && (
                    <span className="badge badge-cancelled rounded-md bg-status-cancelled-bg px-2 py-1 text-[11.5px] font-bold text-status-cancelled-fg">
                      ❌ {t("statusRejected")}
                    </span>
                  )}
                </td>

                {/* 7. AUDIT ACTIONS */}
                <td className="px-4.5 py-3.5 text-right">
                  {isPending && (
                    <div className="inline-flex gap-2">
                      <button
                        id={`btn-validate-${p.referenceNumber ?? p.id}`}
                        type="button"
                        className="btn btn-primary rounded-lg px-3 py-1.5 text-xs"
                        onClick={() => onApprove(p.id)}
                        disabled={isCurrentProcessing}
                        title={t("validateTitle")}
                      >
                        ✓ {t("validate")}
                      </button>
                      <button
                        id={`btn-reject-${p.referenceNumber ?? p.id}`}
                        type="button"
                        className="btn btn-destructive rounded-lg px-3 py-1.5 text-xs"
                        onClick={() => onOpenReject(p)}
                        disabled={isCurrentProcessing}
                        title={t("rejectTitle")}
                      >
                        ✕ {t("reject")}
                      </button>
                    </div>
                  )}

                  {isVerified && (
                    <button
                      type="button"
                      className="btn btn-outline rounded-lg px-3 py-1.5 text-xs"
                      onClick={() => onOpenVoucher(p)}
                    >
                      👁️ {t("audit")}
                    </button>
                  )}

                  {isRejected && (
                    <button
                      type="button"
                      className="btn btn-outline rounded-lg px-3 py-1.5 text-xs"
                      onClick={() => onViewReason(p)}
                    >
                      ⚠️ {t("viewReason")}
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
