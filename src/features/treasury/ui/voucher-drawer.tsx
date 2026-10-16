"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { BackofficeRole } from "@/shared/config";
import { DEFAULT_BCV_USD_RATE, useTimeFormat } from "@/shared/lib";
import type { PaymentItem } from "../model/types";
import { canUserReconcilePayment } from "./payments-table";

interface VoucherDrawerProps {
  payment: PaymentItem | null;
  userRole?: BackofficeRole;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (paymentId: string) => Promise<void>;
  onOpenReject: (payment: PaymentItem) => void;
  isProcessing?: boolean;
}

export function VoucherDrawer({
  payment,
  userRole = "PLATFORM_ADMIN",
  isOpen,
  onClose,
  onApprove,
  onOpenReject,
  isProcessing = false,
}: VoucherDrawerProps) {
  const t = useTranslations("treasury.inbox.voucher");
  const { formatTime } = useTimeFormat();
  const [isZoomed, setIsZoomed] = useState(false);

  if (!isOpen || !payment) return null;

  const isDirectMode = payment.collectionMode === "ALLY_DIRECT";
  const canReconcile = canUserReconcilePayment(payment, userRole);

  const bankName =
    payment.originBank === "0134"
      ? "BANESCO BANCO UNIVERSAL"
      : payment.originBank === "0105"
      ? "BANCO MERCANTIL"
      : payment.originBank === "0102"
      ? "BANCO DE VENEZUELA"
      : payment.originBank === "0172"
      ? "BANCAMIGA BANCO UNIVERSAL"
      : payment.originBank || "BANCO UNIVERSAL";

  const bankAccentColor =
    payment.originBank === "0134"
      ? "#005696"
      : payment.originBank === "0105"
      ? "#EA7600"
      : payment.originBank === "0102"
      ? "#B91C1C"
      : payment.originBank === "0172"
      ? "#008852"
      : "var(--brand-lime)";

  const effectiveRate = payment.exchangeRate || DEFAULT_BCV_USD_RATE;

  const amountBs = payment.amountVes
    ? payment.amountVes.toLocaleString("es-VE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : (payment.amount * effectiveRate).toLocaleString("es-VE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

  const amountUsd = payment.amountReference
    ? payment.amountReference.toFixed(2)
    : payment.amount.toFixed(2);

  const rateValue = effectiveRate.toFixed(2);

  const formattedPaymentDate = formatTime(
    payment.paymentDate ||
      (payment.createdAt ? payment.createdAt.slice(0, 10) : "—"),
  );

  const payerDocumentDisplay = payment.payerIdDocument
    ? payment.payerDocumentType
      ? `${payment.payerDocumentType}-${payment.payerIdDocument}`
      : payment.payerIdDocument
    : "—";

  return (
    <>
      {/* BACKDROP */}
      <div
        className="drawer-backdrop fixed inset-0 z-50 bg-black/50 backdrop-blur-xs"
        onClick={onClose}
      />

      {/* DRAWER PANEL */}
      <aside
        id="voucher-drawer-panel"
        className="drawer-panel fixed top-0 right-0 bottom-0 z-50 flex w-full max-w-[520px] flex-col border-l border-border bg-surface shadow-2xl"
      >
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-border px-6 py-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-link">
                {t("title")}
              </span>
              <span
                className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold ${
                  isDirectMode
                    ? "border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    : "border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                }`}
              >
                {isDirectMode ? t("modeDirectBadge") : t("modeCustodyBadge")}
              </span>
            </div>
            <h3 className="mt-0.5 text-lg font-bold text-foreground">
              {t("refTitle", { ref: payment.referenceNumber ?? "S/N" })}
            </h3>
          </div>
          <button
            type="button"
            className="btn-icon cursor-pointer rounded-lg p-1.5 text-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* DUPLICATE REFERENCE WARNING ALERT */}
          {payment.isDuplicateReference && (
            <div className="mb-4 rounded-xl border border-amber-500/40 bg-amber-500/15 px-4 py-3 text-xs leading-relaxed text-amber-800 dark:text-amber-300">
              <div className="font-bold">⚠️ {t("duplicateRefAlertTitle")}</div>
              <div className="mt-0.5">{t("duplicateRefAlertDesc")}</div>
            </div>
          )}

          {/* COMPARISON BANNER */}
          <div className="mb-5 rounded-xl border border-accent/30 bg-accent/10 px-3.5 py-3">
            <div className="text-xs leading-relaxed text-foreground">
              🔍 <strong>{t("directViewer")}</strong> {t("directViewerDesc")}
            </div>
          </div>

          {/* ATTACHED RECEIPT IMAGE (IF PRESENT) */}
          {payment.receiptUrl && (
            <div className="mb-5 rounded-2xl border border-border bg-muted/40 p-3">
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="font-bold text-foreground">
                  {t("receiptImageLabel")}
                </span>
                <button
                  type="button"
                  onClick={() => setIsZoomed((z) => !z)}
                  className="cursor-pointer text-[11px] font-semibold text-link underline"
                >
                  {isZoomed ? t("zoomOut") : t("zoomIn")}
                </button>
              </div>
              <div
                className={`overflow-hidden rounded-xl border border-border bg-black/80 transition-all ${
                  isZoomed ? "max-h-none" : "max-h-64"
                }`}
              >
                <img
                  src={payment.receiptUrl}
                  alt={t("refTitle", { ref: payment.referenceNumber ?? "S/N" })}
                  onClick={() => setIsZoomed((z) => !z)}
                  className={`mx-auto block w-full cursor-zoom-in object-contain transition-transform ${
                    isZoomed ? "scale-110 cursor-zoom-out" : "max-h-64"
                  }`}
                />
              </div>
            </div>
          )}

          {/* TRANSACTION VERIFICATION DETAILS */}
          <div className="mb-5 rounded-2xl border border-border bg-forest-950 p-4.5">
            <div
              className="rounded-xl bg-white p-5 font-mono text-xs leading-normal text-forest-900 shadow-lg"
              style={{ borderTop: `5px solid ${bankAccentColor}` }}
            >
              <div className="mb-3 flex items-center justify-between border-b border-dashed border-border-medium pb-2">
                <strong
                  className="text-[13.5px]"
                  style={{ color: bankAccentColor }}
                >
                  {bankName}
                </strong>
                <span className="text-[10px] text-muted-foreground">
                  {payment.paymentMethod}
                </span>
              </div>

              <div className="my-3.5 text-center">
                <div className="text-[11px] uppercase text-muted-foreground">
                  {t("transferredAmount")}
                </div>
                <div className="text-2xl font-bold text-forest-900">
                  Bs. {amountBs}
                </div>
                <div className="text-[11px] font-semibold text-status-available-fg">
                  {t("rateEquivalent", { usd: amountUsd, rate: rateValue })}
                </div>
              </div>

              <div className="flex flex-col gap-1.5 border-t border-dashed border-border-medium pt-2.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("refCode")}</span>
                  <strong>{payment.referenceNumber || "—"}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("payer")}</span>
                  <strong>
                    {payment.reservation?.client?.name}{" "}
                    {payment.reservation?.client?.lastName}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("idDoc")}</span>
                  <strong>{payerDocumentDisplay}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {t("originBank")}
                  </span>
                  <strong>{payment.originBank || "—"}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("phone")}</span>
                  <strong>{payment.phoneNumber || "—"}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("dateTime")}</span>
                  <strong>{formattedPaymentDate}</strong>
                </div>
              </div>

              <div className="mt-3.5 border-t border-border pt-2 text-center text-[9.5px] text-muted-foreground">
                {t("suicheNotice")}
              </div>
            </div>
          </div>

          {/* ASSOCIATED BOOKING */}
          <div className="mb-5 rounded-[14px] border border-border bg-muted px-4 py-3.5">
            <div className="mb-1 text-[11px] font-bold uppercase text-muted-foreground">
              {t("linkedBooking")}
            </div>
            <div className="text-[15px] font-bold text-foreground">
              #{payment.reservation?.shortCode} —{" "}
              {payment.reservation?.space?.spaceNumber} (
              {formatTime(payment.reservation?.startTime)} - {formatTime(payment.reservation?.endTime)})
            </div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              {payment.reservation?.space?.venue?.name}
            </div>
          </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="flex flex-col gap-2.5 border-t border-border bg-surface px-6 py-4">
          {payment.status === "PENDING" && canReconcile && (
            <div className="flex gap-3">
              <button
                id="drawer-reject-btn"
                type="button"
                className="btn btn-destructive flex-1 rounded-[10px] px-4 py-2.5 text-[13px]"
                onClick={() => onOpenReject(payment)}
                disabled={isProcessing}
              >
                ✕ {t("reject")}
              </button>
              <button
                id="drawer-approve-btn"
                type="button"
                className="btn btn-primary flex-[1.5] rounded-[10px] px-4 py-2.5 text-[13px]"
                onClick={() => onApprove(payment.id)}
                disabled={isProcessing}
              >
                ✓ {t("reconcileConfirm")}
              </button>
            </div>
          )}

          {payment.status === "PENDING" && !canReconcile && (
            <>
              <div className="rounded-lg border border-border bg-muted/60 px-3 py-2 text-center text-xs text-muted-foreground">
                {isDirectMode
                  ? t("readOnlyDirectNotice")
                  : t("readOnlyCustodyNotice")}
              </div>
              <button
                type="button"
                className="btn btn-outline w-full rounded-[10px] px-4 py-2.5 text-[13px]"
                onClick={onClose}
              >
                {t("closeAudit")}
              </button>
            </>
          )}

          {payment.status !== "PENDING" && (
            <button
              type="button"
              className="btn btn-outline w-full rounded-[10px] px-4 py-2.5 text-[13px]"
              onClick={onClose}
            >
              {t("closeAudit")}
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
