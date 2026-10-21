"use client";

import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/shared/ui/button";
import { uploadBackofficeFileAction } from "@/shared/api/upload-action";
import type { SettlementBatchItem, SettlementPayoutMethod } from "../model/types";
import {
  disburseSettlementAction,
  reportInvoicePaymentAction,
} from "../actions/treasury-actions";

export interface SettlementPayoutSubmitPayload {
  batchId: string;
  payoutMethod: SettlementPayoutMethod;
  referenceNumber: string;
  destinationBank: string;
  originAccount?: string;
  disbursementDate: string;
  receiptUrl?: string;
  notes?: string;
}

interface SettlementPayoutModalProps {
  isOpen: boolean;
  batch: SettlementBatchItem | null;
  bcvRate: number;
  onClose: () => void;
  onDisburse?: (
    input: SettlementPayoutSubmitPayload,
  ) => Promise<{ ok: boolean; error?: string }>;
  onReportInvoice?: (
    input: SettlementPayoutSubmitPayload,
  ) => Promise<{ ok: boolean; error?: string }>;
  onSuccess?: (input: { referenceNumber: string; disbursementDate: string }) => void;
}

export function SettlementPayoutModal({
  isOpen,
  batch,
  bcvRate,
  onClose,
  onDisburse,
  onReportInvoice,
  onSuccess,
}: SettlementPayoutModalProps) {
  const t = useTranslations("settlements");
  const tOverrides = useTranslations("treasury.settlementsOverrides");

  const [payoutMethod, setPayoutMethod] = useState<SettlementPayoutMethod>("PAGO_MOVIL");
  const [originAccount, setOriginAccount] = useState("BANESCO_0134");
  const [transferRef, setTransferRef] = useState("");
  const [payoutDate, setPayoutDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (batch) {
      setTransferRef(batch.payoutReferenceNumber || "");
      setPayoutMethod(batch.payoutMethod || (batch.direction === "ALLY_TO_PLATFORM" ? "PAGO_MOVIL" : "BANK_TRANSFER"));
      setNotes(batch.notes || "");
      setFileName(null);
      setReceiptUrl(batch.payoutReceiptUrl || null);
      setErrorMsg(null);
    }
  }, [batch]);

  if (!isOpen || !batch) return null;

  const isAllyToPlatform = batch.direction === "ALLY_TO_PLATFORM";
  const isInvoiceVerify = isAllyToPlatform && batch.status === "PAYMENT_UNDER_REVIEW";
  const isInvoiceReport = isAllyToPlatform && !isInvoiceVerify;
  const netBs = batch.netPayoutAmount * bcvRate;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!batch) return;
    if (!transferRef.trim()) {
      setErrorMsg(t("errMissingRef"));
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const payload: SettlementPayoutSubmitPayload = {
      batchId: batch.id,
      payoutMethod: isAllyToPlatform ? payoutMethod : "BANK_TRANSFER",
      referenceNumber: transferRef.trim(),
      destinationBank: isAllyToPlatform
        ? originAccount
        : batch.organization?.payoutBank || "Banesco Banco Universal",
      originAccount,
      disbursementDate: payoutDate,
      receiptUrl: receiptUrl || undefined,
      notes: notes.trim() || undefined,
    };

    if (isInvoiceReport) {
      if (onReportInvoice) {
        const res = await onReportInvoice(payload);
        setLoading(false);
        if (res.ok) {
          onSuccess?.({
            referenceNumber: payload.referenceNumber,
            disbursementDate: payload.disbursementDate,
          });
          onClose();
        } else {
          setErrorMsg(res.error || t("payoutError"));
        }
        return;
      }

      const res = await reportInvoicePaymentAction(batch.id, {
        payoutMethod: payload.payoutMethod,
        payoutReferenceNumber: payload.referenceNumber,
        payoutDestinationBank: payload.destinationBank,
        originAccount: payload.originAccount,
        payoutDate: payload.disbursementDate,
        payoutReceiptUrl: payload.receiptUrl,
        notes: payload.notes,
      });

      setLoading(false);
      if (res.ok) {
        onSuccess?.({
          referenceNumber: payload.referenceNumber,
          disbursementDate: payload.disbursementDate,
        });
        onClose();
      } else {
        setErrorMsg(res.error.code || t("payoutError"));
      }
      return;
    }

    if (onDisburse) {
      const res = await onDisburse(payload);
      setLoading(false);
      if (res.ok) {
        onSuccess?.({
          referenceNumber: payload.referenceNumber,
          disbursementDate: payload.disbursementDate,
        });
        onClose();
      } else {
        setErrorMsg(res.error || t("payoutError"));
      }
      return;
    }

    const res = await disburseSettlementAction(batch.id, {
      payoutMethod: payload.payoutMethod,
      payoutReferenceNumber: payload.referenceNumber,
      payoutDestinationBank: payload.destinationBank,
      originAccount: payload.originAccount,
      payoutDate: payload.disbursementDate,
      payoutReceiptUrl: payload.receiptUrl,
      notes: payload.notes,
    });

    setLoading(false);

    if (res.ok) {
      onSuccess?.({
        referenceNumber: payload.referenceNumber,
        disbursementDate: payload.disbursementDate,
      });
      onClose();
    } else {
      setErrorMsg(res.error.code || t("payoutError"));
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setUploadingFile(true);
    setErrorMsg(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("category", "SETTLEMENT_RECEIPT");
      const res = await uploadBackofficeFileAction(fd);
      if (res.ok && res.data) {
        setReceiptUrl(res.data.url);
      } else if (!res.ok) {
        setErrorMsg(res.error.code || t("payoutError"));
        setFileName(null);
      }
    } finally {
      setUploadingFile(false);
    }
  }

  return (
    <div
      className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      id="payout-modal-backdrop"
    >
      <div
        className="modal-card w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-border p-6 bg-surface">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{isAllyToPlatform ? "💳" : "💸"}</span>
            <div>
              <h3 className="font-display text-lg font-bold text-foreground">
                {isInvoiceReport
                  ? t("modalReportInvoiceTitle")
                  : isInvoiceVerify
                  ? t("modalVerifyInvoiceTitle")
                  : t("modalPayoutTitle")}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5" id="modal-payout-subtitle">
                {t("modalPayoutSubtitle")} #{batch.batchCode}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-all cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            {errorMsg && (
              <div className="rounded-xl border border-status-cancelled-border bg-status-cancelled-bg p-3 text-xs font-semibold text-status-cancelled-fg">
                {errorMsg}
              </div>
            )}

            {/* Payout Overview Card */}
            <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-bold text-foreground text-sm" id="modal-ally-name">
                    {batch.organization?.tradeName}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5" id="modal-ally-rif">
                    {batch.organization?.rif} •{" "}
                    {batch.periodDisplay || `${batch.periodStartDate} - ${batch.periodEndDate}`}
                  </div>
                </div>
                <span className="rounded-full bg-status-hold-bg border border-status-hold-border px-2.5 py-0.5 text-[11px] font-bold text-status-hold-fg">
                  {isInvoiceVerify ? t("statusUnderReview") : t("statusPending")}
                </span>
              </div>

              <div className="border-t border-dashed border-border pt-3 flex items-end justify-between">
                <div>
                  <div className="text-[11px] font-bold uppercase text-muted-foreground">
                    {isAllyToPlatform ? t("lblInvoiceAmountToPay") : t("lblNetToTransfer")}
                  </div>
                  <div className="font-display text-2xl font-black text-status-available-fg mt-0.5" id="modal-net-usd">
                    ${batch.netPayoutAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-muted-foreground">
                    {t("lblBcvRate")} {bcvRate.toFixed(2)} Bs/$
                  </div>
                  <div className="text-sm font-bold text-foreground mt-0.5" id="modal-net-bs">
                    Bs. {netBs.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            </div>

            {/* Destination Bank Account (Confirmation) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                {isAllyToPlatform ? t("lblYoReservoDestAccount") : t("lblDestAccount")}
              </label>
              {isAllyToPlatform ? (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-foreground space-y-1" id="modal-dest-details">
                  <div className="font-bold flex items-center gap-1.5">
                    <span>🏦</span>
                    <span>Banesco Banco Universal (0134) — YoReservo C.A.</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {t("yoreservoBankCoords")}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-border bg-surface p-3.5 text-xs text-foreground space-y-1" id="modal-dest-details">
                  <div className="font-bold flex items-center gap-1.5">
                    <span>🏦</span>
                    <span>{batch.organization?.payoutBank || "—"}</span>
                    {batch.organization?.payoutAccountNumber && (
                      <span className="text-muted-foreground font-mono">
                        ({batch.organization.payoutAccountNumber})
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {t("lblDestAccountHolder")}{" "}
                    {batch.organization?.payoutAccountHolder || batch.organization?.legalName} • RIF:{" "}
                    {batch.organization?.rif}
                  </div>
                </div>
              )}
            </div>

            {isAllyToPlatform && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                  {t("lblPaymentMethod")}
                </label>
                <select
                  value={payoutMethod}
                  onChange={(e) => setPayoutMethod(e.target.value as SettlementPayoutMethod)}
                  className="form-select text-xs"
                  disabled={isInvoiceVerify}
                >
                  <option value="PAGO_MOVIL">Pago Móvil</option>
                  <option value="BANK_TRANSFER">Transferencia Bancaria</option>
                </select>
              </div>
            )}

            {/* Originating Account */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                {isAllyToPlatform ? t("lblAllyOriginBank") : t("lblOriginAccount")}
              </label>
              <select
                value={originAccount}
                onChange={(e) => setOriginAccount(e.target.value)}
                className="form-select text-xs"
                id="modal-origin-account"
              >
                <option value="BANESCO_0134">{tOverrides("originAccBanesco")}</option>
                <option value="MERCANTIL_0105">{tOverrides("originAccMercantil")}</option>
                <option value="ZELLE_CORP">{tOverrides("originAccZelle")}</option>
              </select>
            </div>

            {/* Reference Number & Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                  {t("lblTransferRef")}
                </label>
                <input
                  type="text"
                  required
                  value={transferRef}
                  onChange={(e) => setTransferRef(e.target.value)}
                  placeholder={t("placeholderTransferRef")}
                  className="form-input font-mono font-bold text-xs"
                  id="modal-transfer-ref"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                  {t("lblPayoutDate")}
                </label>
                <input
                  type="date"
                  required
                  value={payoutDate}
                  onChange={(e) => setPayoutDate(e.target.value)}
                  className="form-input text-xs"
                  id="modal-payout-date"
                />
              </div>
            </div>

            {/* Upload Voucher */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                {t("lblUploadVoucher")}
              </label>
              <label className="block border-2 border-dashed border-border hover:border-accent/60 rounded-xl p-4 text-center bg-muted/30 hover:bg-muted/50 transition-all cursor-pointer">
                {uploadingFile ? (
                  <Loader2 className="mx-auto size-6 animate-spin text-accent" />
                ) : (
                  <span className="text-2xl">📄</span>
                )}
                <div className="text-xs font-bold text-foreground mt-1">
                  {uploadingFile
                    ? t("btnProcessing")
                    : fileName
                    ? `✓ ${t("lblSelectedFile")} ${fileName}`
                    : receiptUrl
                    ? `✓ ${t("lblSelectedFile")} ${receiptUrl.split("/").pop()}`
                    : t("uploadVoucherCta")}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  {t("uploadVoucherFormats")}
                </div>
                <input
                  type="file"
                  accept="image/png,image/jpeg,application/pdf"
                  className="hidden"
                  disabled={uploadingFile || loading}
                  onChange={handleFileChange}
                  id="modal-file-upload"
                />
              </label>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                {t("lblNotes")}
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t("placeholderNotes")}
                rows={2}
                className="form-textarea text-xs"
                id="modal-notes"
              />
            </div>
          </div>

          {/* FOOTER */}
          <div className="border-t border-border bg-muted/40 p-5 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onClose}
              disabled={loading || uploadingFile}
            >
              {t("btnCancel")}
            </Button>

            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={loading || uploadingFile}
              disabled={loading || uploadingFile}
              id="btn-confirm-payout"
            >
              {!(loading || uploadingFile) && <span>✓</span>}
              <span>
                {loading || uploadingFile
                  ? t("btnProcessing")
                  : isInvoiceReport
                  ? t("btnReportInvoiceSubmit")
                  : isInvoiceVerify
                  ? t("btnVerifyInvoiceSubmit")
                  : t("btnConfirmPayout")}
              </span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
