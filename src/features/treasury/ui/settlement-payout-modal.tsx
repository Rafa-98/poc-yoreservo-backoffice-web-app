"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/shared/ui/button";
import type { SettlementBatchItem, SettlementPayoutMethod } from "../model/types";
import { disburseSettlementAction } from "../actions/treasury-actions";

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
  onSuccess?: (input: { referenceNumber: string; disbursementDate: string }) => void;
}

export function SettlementPayoutModal({
  isOpen,
  batch,
  bcvRate,
  onClose,
  onDisburse,
  onSuccess,
}: SettlementPayoutModalProps) {
  const t = useTranslations("settlements");

  const [originAccount, setOriginAccount] = useState("BANESCO_0134");
  const [transferRef, setTransferRef] = useState("");
  const [payoutDate, setPayoutDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !batch) return null;

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
      payoutMethod: "BANK_TRANSFER",
      referenceNumber: transferRef.trim(),
      destinationBank: batch.organization?.payoutBank || "Banesco Banco Universal",
      originAccount,
      disbursementDate: payoutDate,
      receiptUrl: fileName ? `https://assets.yoreservo.com/receipts/${fileName}` : undefined,
      notes: notes.trim() || undefined,
    };

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

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      setFileName(e.target.files[0].name);
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
            <span className="text-2xl">💸</span>
            <div>
              <h3 className="font-display text-lg font-bold text-foreground">
                {t("modalPayoutTitle")}
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
                  {t("statusPending")}
                </span>
              </div>

              <div className="border-t border-dashed border-border pt-3 flex items-end justify-between">
                <div>
                  <div className="text-[11px] font-bold uppercase text-muted-foreground">
                    {t("lblNetToTransfer")}
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
                {t("lblDestAccount")}
              </label>
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
            </div>

            {/* Originating Account (YoReservo Treasury) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                {t("lblOriginAccount")}
              </label>
              <select
                value={originAccount}
                onChange={(e) => setOriginAccount(e.target.value)}
                className="form-select text-xs"
                id="modal-origin-account"
              >
                <option value="BANESCO_0134">{t("originAccBanesco")}</option>
                <option value="MERCANTIL_0105">{t("originAccMercantil")}</option>
                <option value="ZELLE_CORP">{t("originAccZelle")}</option>
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
                <span className="text-2xl">📄</span>
                <div className="text-xs font-bold text-foreground mt-1">
                  {fileName ? `${t("lblSelectedFile")} ${fileName}` : t("uploadVoucherCta")}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  {t("uploadVoucherFormats")}
                </div>
                <input
                  type="file"
                  accept="image/png,image/jpeg,application/pdf"
                  className="hidden"
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
              disabled={loading}
            >
              {t("btnCancel")}
            </Button>

            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={loading}
              id="btn-confirm-payout"
            >
              <span>✓</span>
              <span>{loading ? t("btnProcessing") : t("btnConfirmPayout")}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
