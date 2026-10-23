"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Building2,
  Check,
  CheckCircle2,
  ClipboardCopy,
  Copy,
  CreditCard,
  FileText,
  Hash,
  Loader2,
  Phone,
  ShieldCheck,
  Upload,
  X,
  Zap,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/shared/ui/button";
import { SearchableSelect } from "@/features/users/ui/searchable-select";
import { uploadBackofficeFileAction } from "@/shared/api/upload-action";
import type { SettlementBatchItem, SettlementPayoutMethod } from "../model/types";
import {
  disburseSettlementAction,
  reportInvoicePaymentAction,
} from "../actions/treasury-actions";

const VENEZUELAN_BANKS = [
  { value: "0102 - Banco de Venezuela", label: "0102 - Banco de Venezuela" },
  { value: "0134 - Banesco", label: "0134 - Banesco Banco Universal" },
  { value: "0105 - Banco Mercantil", label: "0105 - Banco Mercantil" },
  { value: "0108 - BBVA Provincial", label: "0108 - BBVA Provincial" },
  { value: "0191 - BNC", label: "0191 - Banco Nacional de Crédito (BNC)" },
  { value: "0172 - Bancamiga", label: "0172 - Bancamiga Banco Universal" },
  { value: "0114 - Bancaribe", label: "0114 - Bancaribe" },
  { value: "0115 - Banco Exterior", label: "0115 - Banco Exterior" },
  { value: "0163 - Banco del Tesoro", label: "0163 - Banco del Tesoro" },
  { value: "0175 - Banco Bicentenario", label: "0175 - Banco Bicentenario" },
  { value: "0174 - Banplus", label: "0174 - Banplus Banco Universal" },
  { value: "0151 - BFC", label: "0151 - BFC Banco Fondo Común" },
  { value: "0138 - Banco Plaza", label: "0138 - Banco Plaza" },
  { value: "0104 - Banco Venezolano de Crédito", label: "0104 - Banco Venezolano de Crédito" },
  { value: "0168 - Bancrecer", label: "0168 - Bancrecer" },
  { value: "0169 - Mi Banco", label: "0169 - Mi Banco" },
  { value: "0177 - Banfanb", label: "0177 - Banfanb" },
];

const PHONE_OPERATORS = [
  { value: "0412", label: "0412 (Digitel)" },
  { value: "0422", label: "0422 (Digitel)" },
  { value: "0414", label: "0414 (Movistar)" },
  { value: "0424", label: "0424 (Movistar)" },
  { value: "0416", label: "0416 (Movilnet)" },
  { value: "0426", label: "0426 (Movilnet)" },
];

function parseVenezuelanPhone(raw?: string | null): {
  operator: string;
  digits: string;
} {
  if (!raw) return { operator: "0412", digits: "" };
  const clean = raw.replace(/\D/g, "");
  if (clean.startsWith("58") && clean.length >= 12) {
    const op = `0${clean.slice(2, 5)}`;
    const matchedOp = PHONE_OPERATORS.some((o) => o.value === op) ? op : "0412";
    return { operator: matchedOp, digits: clean.slice(5, 12) };
  }
  if (clean.startsWith("04") && clean.length >= 11) {
    const op = clean.slice(0, 4);
    const matchedOp = PHONE_OPERATORS.some((o) => o.value === op) ? op : "0412";
    return { operator: matchedOp, digits: clean.slice(4, 11) };
  }
  if (clean.startsWith("4") && clean.length === 10) {
    const op = `0${clean.slice(0, 3)}`;
    const matchedOp = PHONE_OPERATORS.some((o) => o.value === op) ? op : "0412";
    return { operator: matchedOp, digits: clean.slice(3, 10) };
  }
  return { operator: "0412", digits: clean.slice(-7) };
}

function normalizeBankOption(rawBank?: string | null): string {
  if (!rawBank) return "";
  const trimmed = rawBank.trim();
  const exact = VENEZUELAN_BANKS.find(
    (b) =>
      b.value.toLowerCase() === trimmed.toLowerCase() ||
      b.label.toLowerCase() === trimmed.toLowerCase(),
  );
  if (exact) return exact.value;
  const codeMatch = trimmed.match(/\b(01\d{2})\b/);
  if (codeMatch) {
    const byCode = VENEZUELAN_BANKS.find((b) => b.value.startsWith(codeMatch[1]!));
    if (byCode) return byCode.value;
  }
  const byName = VENEZUELAN_BANKS.find((b) =>
    b.label.toLowerCase().includes(trimmed.toLowerCase()),
  );
  return byName ? byName.value : trimmed;
}

function CopyCardButton({
  value,
  copyLabel = "Copiar",
  copiedLabel = "Copiado",
}: {
  value: string;
  copyLabel?: string;
  copiedLabel?: string;
}) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  function handleCopy() {
    if (!value || value === "—") return;
    void navigator.clipboard?.writeText(value);
    setCopied(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={`${copied ? copiedLabel : copyLabel}: ${value}`}
      className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-bold text-foreground shadow-2xs transition hover:border-accent hover:bg-accent hover:text-accent-foreground cursor-pointer"
    >
      {copied ? (
        <>
          <Check aria-hidden="true" className="size-3.5 text-emerald-500" />
          <span className="text-emerald-500">{copiedLabel}</span>
        </>
      ) : (
        <>
          <Copy aria-hidden="true" className="size-3.5" />
          <span>{copyLabel}</span>
        </>
      )}
    </button>
  );
}

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
  bcvEurRate?: number;
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
  bcvEurRate,
  onClose,
  onDisburse,
  onReportInvoice,
  onSuccess,
}: SettlementPayoutModalProps) {
  const t = useTranslations("settlements");
  const tOverrides = useTranslations("treasury.settlementsOverrides");

  const [payoutMethod, setPayoutMethod] = useState<SettlementPayoutMethod>("PAGO_MOVIL");
  const [originAccount, setOriginAccount] = useState("BANESCO_0134");
  const [allyOriginBank, setAllyOriginBank] = useState("");
  const [phoneOperator, setPhoneOperator] = useState("0412");
  const [phoneDigits, setPhoneDigits] = useState("");
  const [autofilled, setAutofilled] = useState(false);

  const [transferRef, setTransferRef] = useState("");
  const [payoutDate, setPayoutDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [copiedAll, setCopiedAll] = useState(false);
  const allTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      if (allTimerRef.current) clearTimeout(allTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (batch) {
      setTransferRef(batch.payoutReferenceNumber || "");
      setPayoutMethod(
        batch.payoutMethod ||
          (batch.direction === "ALLY_TO_PLATFORM"
            ? "PAGO_MOVIL"
            : batch.organization?.preferredPayoutMethod || "BANK_TRANSFER"),
      );
      setAllyOriginBank(
        batch.payoutDestinationBank
          ? normalizeBankOption(batch.payoutDestinationBank.split(" (Tel:")[0])
          : "",
      );
      const parsedPhone = parseVenezuelanPhone(
        batch.organization?.payoutPhoneNumber || batch.organization?.contactPhone,
      );
      setPhoneOperator(parsedPhone.operator);
      setPhoneDigits("");
      setAutofilled(false);
      setNotes(batch.notes || "");
      setFileName(null);
      setReceiptUrl(batch.payoutReceiptUrl || null);
      setErrorMsg(null);
      setCopiedAll(false);
    }
  }, [batch]);

  if (!isOpen || !batch) return null;

  const isAllyToPlatform = batch.direction === "ALLY_TO_PLATFORM";
  const isInvoiceVerify = isAllyToPlatform && batch.status === "PAYMENT_UNDER_REVIEW";
  const isInvoiceReport = isAllyToPlatform && !isInvoiceVerify;
  const rawCurr =
    batch.currencyCode ||
    batch.organization?.referenceCurrencyCode ||
    "USD";
  const isEur = rawCurr === "EUR";
  const currCode = isEur ? "EUR" : "USD";
  const sym = isEur ? "€" : "$";
  const rateUsed =
    batch.payoutExchangeRate && batch.payoutExchangeRate > 0
      ? batch.payoutExchangeRate
      : isEur
        ? (bcvEurRate ?? bcvRate)
        : bcvRate;
  const netBs = batch.netPayoutAmount * rateUsed;
  const exactAmountBsText = netBs.toFixed(2);

  // Resolve real destination coordinates (from backend platformPaymentCoordinates for YoReservo, or Ally org profile for Platform->Ally)
  const platformCoords = batch.platformPaymentCoordinates;
  const destPagoMovil = isAllyToPlatform
    ? {
        bankCode: platformCoords?.pagoMovil?.bankCode || "0134",
        bankName: platformCoords?.pagoMovil?.bankName || "Banesco",
        bankFullName:
          platformCoords?.pagoMovil?.bankFullName ||
          "Banesco (0134) · Banco Universal",
        phone: platformCoords?.pagoMovil?.phone || "+58 412 123 4567",
        documentId: platformCoords?.pagoMovil?.documentId || "J-50123456-7",
        beneficiaryName:
          platformCoords?.pagoMovil?.beneficiaryName || "YoReservo C.A.",
      }
    : {
        bankCode:
          (
            batch.organization?.payoutPagoMovilBank ||
            batch.organization?.payoutBank ||
            "0134"
          )
            .split(" - ")[0]
            ?.trim() || "0134",
        bankName:
          (
            batch.organization?.payoutPagoMovilBank ||
            batch.organization?.payoutBank ||
            "Banesco"
          )
            .split(" - ")
            .slice(-1)[0]
            ?.trim() || "Banesco",
        bankFullName:
          batch.organization?.payoutPagoMovilBank ||
          batch.organization?.payoutBank ||
          "Banesco (0134)",
        phone:
          batch.organization?.payoutPhoneNumber ||
          batch.organization?.contactPhone ||
          "—",
        documentId:
          batch.organization?.payoutPagoMovilIdDocument ||
          batch.organization?.payoutIdDocument ||
          batch.organization?.rif ||
          "—",
        beneficiaryName:
          batch.organization?.payoutPagoMovilHolder ||
          batch.organization?.payoutAccountHolder ||
          batch.organization?.legalName ||
          batch.organization?.tradeName ||
          "Organización Aliada",
      };

  const destBankTransfer = isAllyToPlatform
    ? {
        bankCode: platformCoords?.bankTransfer?.bankCode || "0134",
        bankName: platformCoords?.bankTransfer?.bankName || "Banesco",
        bankFullName:
          platformCoords?.bankTransfer?.bankFullName ||
          "Banesco (0134) · Banco Universal",
        accountNumber:
          platformCoords?.bankTransfer?.accountNumber ||
          "01340001920001298491",
        accountTypeLabel:
          platformCoords?.bankTransfer?.accountType === "SAVINGS"
            ? "Cuenta de Ahorros"
            : "Cuenta Corriente",
        documentId: platformCoords?.bankTransfer?.documentId || "J-50123456-7",
        beneficiaryName:
          platformCoords?.bankTransfer?.beneficiaryName || "YoReservo C.A.",
      }
    : {
        bankCode:
          (batch.organization?.payoutBank || "0134")
            .split(" - ")[0]
            ?.trim() || "0134",
        bankName:
          (batch.organization?.payoutBank || "Banesco")
            .split(" - ")
            .slice(-1)[0]
            ?.trim() || "Banesco",
        bankFullName: batch.organization?.payoutBank || "Banesco (0134)",
        accountNumber: batch.organization?.payoutAccountNumber || "—",
        accountTypeLabel:
          batch.organization?.payoutAccountType === "SAVINGS"
            ? "Cuenta de Ahorros"
            : "Cuenta Corriente",
        documentId:
          batch.organization?.payoutIdDocument ||
          batch.organization?.rif ||
          "—",
        beneficiaryName:
          batch.organization?.payoutAccountHolder ||
          batch.organization?.legalName ||
          batch.organization?.tradeName ||
          "Organización Aliada",
      };

  // Saved Ally organization profile for 1-Tap Autofill when reporting invoice payment
  const savedAllyBank = normalizeBankOption(
    payoutMethod === "PAGO_MOVIL"
      ? batch.organization?.payoutPagoMovilBank || batch.organization?.payoutBank
      : batch.organization?.payoutBank || batch.organization?.payoutPagoMovilBank,
  );
  const savedAllyPhoneRaw =
    batch.organization?.payoutPhoneNumber || batch.organization?.contactPhone || "";
  const hasSavedAllyProfile = Boolean(savedAllyBank || savedAllyPhoneRaw);

  function handleAutofillOrganizationProfile() {
    if (savedAllyBank) {
      setAllyOriginBank(savedAllyBank);
    }
    if (savedAllyPhoneRaw) {
      const parsed = parseVenezuelanPhone(savedAllyPhoneRaw);
      setPhoneOperator(parsed.operator);
      setPhoneDigits(parsed.digits);
    }
    setAutofilled(true);
  }

  function handleCopyAllDestination() {
    const lines =
      payoutMethod === "PAGO_MOVIL"
        ? [
            `Banco: ${destPagoMovil.bankName} (${destPagoMovil.bankCode})`,
            `Teléfono Pago Móvil: ${destPagoMovil.phone.replace(/\s+/g, "")}`,
            `RIF: ${destPagoMovil.documentId}`,
            `Beneficiario: ${destPagoMovil.beneficiaryName}`,
            `Monto Exacto: Bs. ${exactAmountBsText}`,
          ]
        : [
            `Banco: ${destBankTransfer.bankName} (${destBankTransfer.bankCode})`,
            `Cuenta (${destBankTransfer.accountTypeLabel}): ${destBankTransfer.accountNumber.replace(/\s+/g, "")}`,
            `RIF: ${destBankTransfer.documentId}`,
            `Beneficiario: ${destBankTransfer.beneficiaryName}`,
            `Monto Exacto: Bs. ${exactAmountBsText}`,
          ];
    void navigator.clipboard?.writeText(lines.join("\n"));
    setCopiedAll(true);
    if (allTimerRef.current) clearTimeout(allTimerRef.current);
    allTimerRef.current = setTimeout(() => setCopiedAll(false), 2200);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!batch) return;

    if (isInvoiceReport) {
      if (!allyOriginBank.trim()) {
        setErrorMsg("Selecciona el banco desde donde realizaste el pago.");
        return;
      }
      if (payoutMethod === "PAGO_MOVIL" && phoneDigits.trim().length !== 7) {
        setErrorMsg(
          "Ingresa los 7 dígitos del número de teléfono desde donde realizaste el Pago Móvil.",
        );
        return;
      }
      if (transferRef.trim().length < 6) {
        setErrorMsg(
          "Ingresa el número de referencia bancaria (de 6 a 12 dígitos).",
        );
        return;
      }
    } else if (!transferRef.trim()) {
      setErrorMsg(t("errMissingRef"));
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const formattedOriginBankForInvoice =
      payoutMethod === "PAGO_MOVIL" && phoneDigits.trim()
        ? `${allyOriginBank} (Tel: +58 ${phoneOperator}-${phoneDigits.trim()})`
        : allyOriginBank || batch.payoutDestinationBank || "Banesco";

    const payload: SettlementPayoutSubmitPayload = {
      batchId: batch.id,
      payoutMethod,
      referenceNumber: transferRef.trim(),
      destinationBank: isAllyToPlatform
        ? isInvoiceVerify
          ? batch.payoutDestinationBank || formattedOriginBankForInvoice
          : formattedOriginBankForInvoice
        : payoutMethod === "PAGO_MOVIL"
          ? batch.organization?.payoutPagoMovilBank ||
            batch.organization?.payoutBank ||
            "Banesco Banco Universal"
          : batch.organization?.payoutBank || "Banesco Banco Universal",
      originAccount: isAllyToPlatform ? formattedOriginBankForInvoice : originAccount,
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

  function clearUploadedReceipt() {
    setFileName(null);
    setReceiptUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  const todayIso = new Date().toISOString().split("T")[0];

  return (
    <div
      className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      id="payout-modal-backdrop"
    >
      <div
        className="modal-card w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-surface">
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
                {t("modalPayoutSubtitle")} #{batch.batchCode} •{" "}
                {batch.organization?.tradeName} ({batch.organization?.rif})
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
          <div className="p-6 space-y-5 max-h-[78vh] overflow-y-auto">
            {errorMsg && (
              <div className="rounded-xl border border-status-cancelled-border bg-status-cancelled-bg p-3 text-xs font-semibold text-status-cancelled-fg">
                {errorMsg}
              </div>
            )}

            {/* 1. Payment Method Selector (Pills / Tabs style + Select) */}
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {t("lblPaymentMethod")}
                </label>
                {!isAllyToPlatform && batch.organization?.preferredPayoutMethod && (
                  <span className="text-[11px] font-bold text-emerald-500">
                    Preferido por Aliado:{" "}
                    {batch.organization.preferredPayoutMethod === "PAGO_MOVIL"
                      ? "📲 Pago Móvil"
                      : "🏦 Transferencia Bancaria"}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  disabled={isInvoiceVerify}
                  onClick={() => setPayoutMethod("PAGO_MOVIL")}
                  className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                    payoutMethod === "PAGO_MOVIL"
                      ? "border-accent bg-accent/15 text-foreground shadow-2xs"
                      : "border-border bg-surface text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  } ${isInvoiceVerify ? "opacity-60 cursor-not-allowed" : ""}`}
                >
                  <span>📲</span>
                  <span>Pago Móvil Interbancario</span>
                </button>

                <button
                  type="button"
                  disabled={isInvoiceVerify}
                  onClick={() => setPayoutMethod("BANK_TRANSFER")}
                  className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                    payoutMethod === "BANK_TRANSFER"
                      ? "border-accent bg-accent/15 text-foreground shadow-2xs"
                      : "border-border bg-surface text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  } ${isInvoiceVerify ? "opacity-60 cursor-not-allowed" : ""}`}
                >
                  <span>🏦</span>
                  <span>Transferencia Bancaria</span>
                </button>
              </div>
            </div>

            {/* 2. Organized 2x2 Destination Coordinates Grid (Client App Reference) */}
            <section
              aria-label={
                isAllyToPlatform ? t("lblYoReservoDestAccount") : t("lblDestAccount")
              }
              className="rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-2xs"
              id="modal-dest-details"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    <ShieldCheck aria-hidden="true" className="size-3.5" />
                    {isAllyToPlatform
                      ? "🛡️ Cuenta Oficial Verificada YoReservo"
                      : "🏢 Cuenta Corporativa del Aliado"}
                  </span>
                  <h4 className="mt-1 font-display text-base font-bold tracking-tight text-foreground">
                    {payoutMethod === "PAGO_MOVIL"
                      ? "Realizar Pago Móvil a:"
                      : "Realizar Transferencia Bancaria a:"}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Beneficiario:{" "}
                    <strong className="text-foreground">
                      {payoutMethod === "PAGO_MOVIL"
                        ? destPagoMovil.beneficiaryName
                        : destBankTransfer.beneficiaryName}
                    </strong>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCopyAllDestination}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-3.5 py-2 text-xs font-extrabold text-accent-foreground shadow-2xs transition hover:brightness-95 active:scale-95 cursor-pointer"
                >
                  {copiedAll ? (
                    <>
                      <Check aria-hidden="true" className="size-4" />
                      <span>¡Copiado todo!</span>
                    </>
                  ) : (
                    <>
                      <ClipboardCopy aria-hidden="true" className="size-4" />
                      <span>📋 Copiar Todos los Datos</span>
                    </>
                  )}
                </button>
              </div>

              {/* 2x2 Grid of Copyable Cards */}
              <div className="mt-3.5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {/* Card 1: Banco */}
                <div className="flex flex-col justify-between rounded-xl border border-border bg-muted/40 p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                      <Building2 aria-hidden="true" className="size-3.5 text-emerald-500" />
                      🏦 Banco
                    </span>
                    <CopyCardButton
                      value={
                        payoutMethod === "PAGO_MOVIL"
                          ? destPagoMovil.bankCode
                          : destBankTransfer.bankCode
                      }
                    />
                  </div>
                  <p className="mt-2 font-display text-base font-extrabold text-foreground">
                    {payoutMethod === "PAGO_MOVIL"
                      ? `${destPagoMovil.bankName} (${destPagoMovil.bankCode})`
                      : `${destBankTransfer.bankName} (${destBankTransfer.bankCode})`}
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {payoutMethod === "PAGO_MOVIL"
                      ? destPagoMovil.bankFullName
                      : destBankTransfer.bankFullName}
                  </p>
                </div>

                {/* Card 2: Teléfono (Pago Móvil) OR Número de Cuenta (Transferencia) */}
                {payoutMethod === "PAGO_MOVIL" ? (
                  <div className="flex flex-col justify-between rounded-xl border border-border bg-muted/40 p-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                        <Phone aria-hidden="true" className="size-3.5 text-emerald-500" />
                        📱 Número de teléfono
                      </span>
                      <CopyCardButton
                        value={destPagoMovil.phone.replace(/\s+/g, "")}
                      />
                    </div>
                    <p className="mt-2 select-all font-mono text-base font-extrabold tracking-wide text-foreground">
                      {destPagoMovil.phone}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Pago Móvil Interbancario
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col justify-between rounded-xl border border-border bg-muted/40 p-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                        <Hash aria-hidden="true" className="size-3.5 text-emerald-500" />
                        🔢 Número de cuenta
                      </span>
                      <CopyCardButton
                        value={destBankTransfer.accountNumber.replace(/\s+/g, "")}
                      />
                    </div>
                    <p className="mt-2 select-all break-all font-mono text-sm font-extrabold tracking-wide text-foreground">
                      {destBankTransfer.accountNumber}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {destBankTransfer.accountTypeLabel} (20 dígitos)
                    </p>
                  </div>
                )}

                {/* Card 3: RIF */}
                <div className="flex flex-col justify-between rounded-xl border border-border bg-muted/40 p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                      🪪 RIF / Documento
                    </span>
                    <CopyCardButton
                      value={
                        payoutMethod === "PAGO_MOVIL"
                          ? destPagoMovil.documentId
                          : destBankTransfer.documentId
                      }
                    />
                  </div>
                  <p className="mt-2 select-all font-mono text-base font-extrabold tracking-wide text-foreground">
                    {payoutMethod === "PAGO_MOVIL"
                      ? destPagoMovil.documentId
                      : destBankTransfer.documentId}
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {payoutMethod === "PAGO_MOVIL"
                      ? destPagoMovil.beneficiaryName
                      : destBankTransfer.beneficiaryName}
                  </p>
                </div>

                {/* Card 4: Monto Exacto a Transferir */}
                <div className="flex flex-col justify-between rounded-xl border border-emerald-500/35 bg-emerald-500/10 p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                      <CreditCard aria-hidden="true" className="size-3.5 text-emerald-500" />
                      💰 Monto a transferir
                    </span>
                    <CopyCardButton value={exactAmountBsText} />
                  </div>
                  <p
                    className="mt-2 select-all font-display text-lg font-extrabold tracking-tight text-foreground"
                    id="modal-net-bs"
                  >
                    Bs.{" "}
                    {netBs.toLocaleString("es-VE", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                  <p
                    className="text-[11px] font-semibold text-muted-foreground"
                    id="modal-net-usd"
                  >
                    ≈ {sym}
                    {batch.netPayoutAmount.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    {currCode} (BCV: {rateUsed.toFixed(2)} Bs.)
                  </p>
                </div>
              </div>
            </section>

            {/* 3. Payment Reporting Form (Matching Client App Reference) */}
            <section className="rounded-2xl border border-border bg-surface p-4 sm:p-5 space-y-4">
              <div>
                <h4 className="font-display text-base font-bold text-foreground">
                  {isInvoiceReport
                    ? payoutMethod === "PAGO_MOVIL"
                      ? "Datos de tu Pago Móvil realizado"
                      : "Datos de tu Transferencia Bancaria realizada"
                    : isInvoiceVerify
                      ? "Datos del Pago Reportado por el Aliado"
                      : "Registro del Desembolso Ejecutado"}
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isInvoiceReport
                    ? "Reporta los datos de tu pago de comisión a YoReservo para su conciliación."
                    : isInvoiceVerify
                      ? "Verifica los datos reportados por la organización aliada en el estado de cuenta bancario."
                      : "Registra la referencia y soporte del pago realizado al aliado."}
                </p>
              </div>

              {/* 1-Tap Autofill from Organization Profile (for Ally Invoice Report) */}
              {isInvoiceReport && hasSavedAllyProfile && (
                <div>
                  <button
                    type="button"
                    onClick={handleAutofillOrganizationProfile}
                    className="flex w-full items-center justify-between gap-2 rounded-xl border border-emerald-500/35 bg-emerald-500/10 px-4 py-2.5 text-left text-xs font-bold text-foreground transition hover:border-accent hover:bg-accent/20 cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <Zap aria-hidden="true" className="size-4 shrink-0 text-emerald-500" />
                      <span>
                        ⚡ Autocompletar con los datos de mi Organización (
                        {savedAllyBank || "Banco"}
                        {savedAllyPhoneRaw ? ` • ${savedAllyPhoneRaw}` : ""})
                      </span>
                    </span>
                    <span className="shrink-0 rounded-lg bg-surface px-2.5 py-1 text-[11px] font-extrabold text-emerald-500 shadow-2xs">
                      {autofilled ? "✓ Aplicado" : "1-Toque"}
                    </span>
                  </button>
                </div>
              )}

              {/* Originating Bank */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                  {isAllyToPlatform
                    ? "Banco desde donde transferiste *"
                    : t("lblOriginAccount")}
                </label>
                {isAllyToPlatform ? (
                  isInvoiceVerify ? (
                    <input
                      type="text"
                      readOnly
                      value={batch.payoutDestinationBank || "—"}
                      className="form-input text-xs bg-muted/50 font-semibold"
                    />
                  ) : (
                    <SearchableSelect
                      value={allyOriginBank}
                      onChange={setAllyOriginBank}
                      options={VENEZUELAN_BANKS}
                      placeholder="Elige tu banco"
                      searchPlaceholder="Escribe el nombre o código del banco..."
                    />
                  )
                ) : (
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
                )}
              </div>

              {/* Originating Phone (When Ally reports Pago Móvil, matching Client App Reference) */}
              {isInvoiceReport && payoutMethod === "PAGO_MOVIL" && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Teléfono desde donde realizaste el Pago Móvil *
                  </label>
                  <div className="grid grid-cols-12 gap-2.5">
                    <div className="col-span-3 sm:col-span-2">
                      <input
                        type="text"
                        readOnly
                        value="+58 🇻🇪"
                        className="form-input text-center font-mono text-xs bg-muted/50 text-muted-foreground cursor-not-allowed"
                        title="Código de país (Venezuela)"
                      />
                    </div>
                    <div className="col-span-4 sm:col-span-4">
                      <SearchableSelect
                        value={phoneOperator}
                        onChange={setPhoneOperator}
                        options={PHONE_OPERATORS}
                        placeholder="Operadora"
                        searchPlaceholder="Buscar operadora..."
                      />
                    </div>
                    <div className="col-span-5 sm:col-span-6">
                      <input
                        type="tel"
                        inputMode="numeric"
                        maxLength={7}
                        value={phoneDigits}
                        onChange={(e) =>
                          setPhoneDigits(e.target.value.replace(/\D/g, "").slice(0, 7))
                        }
                        placeholder="9938475"
                        className="form-input font-mono text-xs"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Date & Reference Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                    {isAllyToPlatform ? "Fecha del pago *" : t("lblPayoutDate")}
                  </label>
                  <input
                    type="date"
                    required
                    max={todayIso}
                    value={payoutDate}
                    onChange={(e) => setPayoutDate(e.target.value)}
                    className="form-input text-xs"
                    id="modal-payout-date"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                    {isAllyToPlatform
                      ? "Número de referencia (6 a 12 dígitos) *"
                      : t("lblTransferRef")}
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={12}
                    required
                    value={transferRef}
                    onChange={(e) =>
                      setTransferRef(
                        isInvoiceReport
                          ? e.target.value.replace(/\D/g, "").slice(0, 12)
                          : e.target.value,
                      )
                    }
                    placeholder="Ej. 0029384756"
                    className="form-input font-mono font-bold text-xs"
                    id="modal-transfer-ref"
                  />
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Ingresa de 6 a 12 dígitos del comprobante bancario.
                  </p>
                </div>
              </div>

              {/* Upload Voucher (Client App Style) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Comprobante de pago — Imagen o PDF (opcional)
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,application/pdf"
                  className="hidden"
                  disabled={uploadingFile || loading}
                  onChange={handleFileChange}
                  id="modal-file-upload"
                />

                {fileName || receiptUrl ? (
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3.5 py-2.5 text-xs">
                    <div className="flex min-w-0 items-center gap-2 text-foreground">
                      <CheckCircle2
                        aria-hidden="true"
                        className="size-4 shrink-0 text-emerald-500"
                      />
                      <FileText
                        aria-hidden="true"
                        className="size-4 shrink-0 text-muted-foreground"
                      />
                      <span className="truncate font-semibold">
                        {fileName || receiptUrl?.split("/").pop()}
                      </span>
                      {receiptUrl && (
                        <a
                          href={receiptUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-2 text-emerald-500 underline font-bold"
                        >
                          Ver archivo
                        </a>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={clearUploadedReceipt}
                      disabled={loading || uploadingFile}
                      className="grid size-6 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-border hover:text-foreground cursor-pointer"
                      title="Quitar comprobante"
                    >
                      <X aria-hidden="true" className="size-3.5" />
                    </button>
                  </div>
                ) : (
                  <label
                    htmlFor="modal-file-upload"
                    className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/30 px-4 py-3.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-accent hover:bg-muted/50 hover:text-foreground"
                  >
                    {uploadingFile ? (
                      <Loader2
                        aria-hidden="true"
                        className="size-4 shrink-0 animate-spin text-accent"
                      />
                    ) : (
                      <Upload
                        aria-hidden="true"
                        className="size-4 shrink-0 text-emerald-500"
                      />
                    )}
                    <span>
                      {uploadingFile
                        ? "Subiendo comprobante..."
                        : "Subir captura o PDF del comprobante (máx. 5 MB)"}
                    </span>
                  </label>
                )}
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

              {/* Bottom Confirmation Amount Box (Client App Reference) */}
              <div className="rounded-xl border border-border bg-muted/50 p-3.5">
                <p className="text-xs text-muted-foreground">
                  Monto a reportar en bolívares (calculado en {currCode} a tasa BCV Bs.{" "}
                  {rateUsed.toLocaleString("es-VE", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                  )
                </p>
                <p className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="font-display text-xl font-extrabold tracking-tight text-foreground">
                    Bs.{" "}
                    {netBs.toLocaleString("es-VE", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                  <span className="text-xs font-semibold text-muted-foreground">
                    ≈ {sym}
                    {batch.netPayoutAmount.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    {currCode}
                  </span>
                </p>
              </div>
            </section>
          </div>

          {/* FOOTER */}
          <div className="border-t border-border bg-muted/40 px-6 py-4 flex items-center justify-end gap-3">
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
