"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/shared/ui/button";
import type {
  CreateOrganizationInput,
  OrganizationData,
  PaymentCollectionMode,
} from "../model/types";
import { createOrganizationAction } from "../actions/venues-actions";

interface CreateOrganizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (created: OrganizationData) => void;
}

export function CreateOrganizationModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateOrganizationModalProps) {
  const t = useTranslations("venues.org");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Section 1: Corporate & Fiscal Identity
  const [tradeName, setTradeName] = useState("");
  const [legalName, setLegalName] = useState("");
  const [rif, setRif] = useState("J-");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("+58 412 ");
  const [fiscalAddress, setFiscalAddress] = useState("");

  // Section 2: Commercial Terms & BCV Currency
  const [referenceCurrencyCode, setReferenceCurrencyCode] = useState("USD");
  const [commissionPctInput, setCommissionPctInput] = useState(5);
  const [minimumMonthlyFee, setMinimumMonthlyFee] = useState(20);

  // Section 3: Payment Collection Mode & Banking Settlement
  const [paymentCollectionMode, setPaymentCollectionMode] =
    useState<PaymentCollectionMode>("PLATFORM_CUSTODY");
  const [payoutBank, setPayoutBank] = useState("0134 - Banesco");
  const [payoutAccountType, setPayoutAccountType] = useState("Corriente");
  const [payoutAccountNumber, setPayoutAccountNumber] = useState("");
  const [payoutAccountHolder, setPayoutAccountHolder] = useState("");
  const [payoutIdDocument, setPayoutIdDocument] = useState("");
  const [payoutPhoneNumber, setPayoutPhoneNumber] = useState("");

  if (!isOpen) return null;

  function resetForm() {
    setTradeName("");
    setLegalName("");
    setRif("J-");
    setContactEmail("");
    setContactPhone("+58 412 ");
    setFiscalAddress("");
    setReferenceCurrencyCode("USD");
    setCommissionPctInput(5);
    setMinimumMonthlyFee(20);
    setPaymentCollectionMode("PLATFORM_CUSTODY");
    setPayoutBank("0134 - Banesco");
    setPayoutAccountType("Corriente");
    setPayoutAccountNumber("");
    setPayoutAccountHolder("");
    setPayoutIdDocument("");
    setPayoutPhoneNumber("");
    setErrorMsg(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (!tradeName.trim() || !legalName.trim() || !rif.trim()) {
      setErrorMsg("Completa los datos corporativos y fiscales obligatorios.");
      return;
    }

    const effectivePhone = payoutPhoneNumber.trim() || contactPhone.trim();
    if (
      paymentCollectionMode === "ALLY_DIRECT" &&
      (!payoutBank.trim() || !effectivePhone)
    ) {
      setErrorMsg(t("errorDirectModeBankPhone"));
      return;
    }

    setLoading(true);
    const rateDecimal = Math.max(0, Math.min(1, Number(commissionPctInput) / 100));

    const payload: CreateOrganizationInput = {
      tradeName: tradeName.trim(),
      legalName: legalName.trim(),
      rif: rif.trim().toUpperCase(),
      contactEmail: contactEmail.trim(),
      contactPhone: contactPhone.trim(),
      fiscalAddress: fiscalAddress.trim() || undefined,
      referenceCurrencyCode,
      commissionRate: rateDecimal,
      manualCommissionRate: rateDecimal,
      minimumMonthlyFee: Number(minimumMonthlyFee) || 0,
      paymentCollectionMode,
      payoutBank: payoutBank.trim() || undefined,
      payoutAccountType: payoutAccountType || "Corriente",
      payoutAccountNumber: payoutAccountNumber.trim() || undefined,
      payoutAccountHolder:
        payoutAccountHolder.trim() || legalName.trim() || tradeName.trim(),
      payoutIdDocument: payoutIdDocument.trim() || rif.trim().toUpperCase(),
      payoutPhoneNumber: effectivePhone || undefined,
    };

    const res = await createOrganizationAction(payload);
    setLoading(false);

    if (res.ok && res.data) {
      resetForm();
      onSuccess(res.data);
      onClose();
    } else if (!res.ok) {
      setErrorMsg(res.error.code || "Error al crear la organización aliada");
    }
  }

  return (
    <div
      className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
      id="org-create-modal-backdrop"
      onClick={onClose}
    >
      <div
        className="modal-card flex max-h-[92vh] w-full max-w-[740px] flex-col overflow-hidden rounded-2xl border border-border-medium bg-surface shadow-card animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4.5">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🏛️</span>
            <div>
              <h3 className="m-0 text-[17px] font-bold text-foreground">
                Registrar Nueva Organización Aliada
              </h3>
              <p className="m-0 text-xs text-muted-foreground">
                Alta corporativa, condiciones comerciales BCV y coordenadas de liquidación
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn-icon cursor-pointer border-none bg-transparent text-lg text-muted-foreground hover:text-foreground"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {errorMsg && (
            <div className="rounded-lg border border-status-cancelled-border bg-status-cancelled-bg px-3.5 py-2.5 text-[13px] font-semibold text-status-cancelled-fg">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* SECTION 1: Corporate & Fiscal Identity */}
          <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3.5">
            <div className="text-xs font-extrabold tracking-wider text-link uppercase">
              1. Identidad Corporativa & Fiscal
            </div>

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <div className="form-group">
                <label className="form-label mb-1 block text-xs font-semibold text-foreground">
                  {t("tradeName")}
                </label>
                <input
                  type="text"
                  id="create-org-trade-name"
                  className="input-field form-input"
                  placeholder="ej. Pádel & Fútbol Club Caracas"
                  required
                  value={tradeName}
                  onChange={(e) => setTradeName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label mb-1 block text-xs font-semibold text-foreground">
                  {t("legalName")}
                </label>
                <input
                  type="text"
                  id="create-org-legal-name"
                  className="input-field form-input"
                  placeholder="ej. Inversiones Deportivas Caracas C.A."
                  required
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
              <div className="form-group">
                <label className="form-label mb-1 block text-xs font-semibold text-foreground">
                  {t("rif")}
                </label>
                <input
                  type="text"
                  id="create-org-rif"
                  className="input-field form-input font-mono"
                  placeholder="J-40123456-7"
                  required
                  value={rif}
                  onChange={(e) => setRif(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label mb-1 block text-xs font-semibold text-foreground">
                  {t("contactEmail")}
                </label>
                <input
                  type="email"
                  id="create-org-email"
                  className="input-field form-input"
                  placeholder="finanzas@clubaliado.com"
                  required
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label mb-1 block text-xs font-semibold text-foreground">
                  {t("contactPhone")}
                </label>
                <input
                  type="tel"
                  id="create-org-phone"
                  className="input-field form-input"
                  placeholder="+58 412 5551234"
                  required
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label mb-1 block text-xs font-semibold text-foreground">
                {t("fiscalAddress")}
              </label>
              <input
                type="text"
                id="create-org-address"
                className="input-field form-input"
                placeholder="Av. Principal de Las Mercedes, Caracas, Miranda"
                required
                value={fiscalAddress}
                onChange={(e) => setFiscalAddress(e.target.value)}
              />
            </div>
          </div>

          {/* SECTION 2: Commercial Terms & BCV Currency */}
          <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3.5">
            <div className="text-xs font-extrabold tracking-wider text-link uppercase">
              2. Condiciones Comerciales & Moneda BCV
            </div>

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
              <div className="form-group">
                <label className="form-label mb-1 block text-xs font-semibold text-foreground">
                  {t("referenceCurrency")}
                </label>
                <select
                  id="create-org-currency"
                  className="input-field form-select"
                  value={referenceCurrencyCode}
                  onChange={(e) => setReferenceCurrencyCode(e.target.value)}
                >
                  <option value="USD">{t("currencyUsd")}</option>
                  <option value="EUR">{t("currencyEur")}</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label mb-1 block text-xs font-semibold text-foreground">
                  Comisión Plataforma (%)
                </label>
                <input
                  type="number"
                  id="create-org-commission"
                  step="0.5"
                  min="0"
                  max="100"
                  className="input-field form-input"
                  value={commissionPctInput}
                  onChange={(e) => setCommissionPctInput(Number(e.target.value))}
                />
              </div>

              <div className="form-group">
                <label className="form-label mb-1 block text-xs font-semibold text-foreground">
                  {t("minimumMonthlyFeeLabel")}
                </label>
                <input
                  type="number"
                  id="create-org-min-fee"
                  step="1"
                  min="0"
                  className="input-field form-input"
                  value={minimumMonthlyFee}
                  onChange={(e) => setMinimumMonthlyFee(Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: Payment Collection Mode & Banking Settlement */}
          <div className="rounded-xl border border-accent/40 bg-accent/5 p-4 space-y-3.5">
            <div className="text-xs font-extrabold tracking-wider text-foreground uppercase">
              3. Modalidad de Cobro & Liquidación Bancaria
            </div>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <label
                className={`flex cursor-pointer flex-col rounded-xl border p-3 transition-all ${
                  paymentCollectionMode === "PLATFORM_CUSTODY"
                    ? "border-accent bg-surface ring-1 ring-accent"
                    : "border-border bg-surface/60 hover:border-border-medium"
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="createPaymentCollectionMode"
                    value="PLATFORM_CUSTODY"
                    checked={paymentCollectionMode === "PLATFORM_CUSTODY"}
                    onChange={() => setPaymentCollectionMode("PLATFORM_CUSTODY")}
                    className="accent-accent"
                  />
                  <span className="text-xs font-bold text-foreground">
                    {t("modeOption1Title")}
                  </span>
                </div>
                <span className="mt-1 pl-5 text-[11px] leading-snug text-muted-foreground">
                  {t("modeOption1Desc", {
                    netPct: Math.max(0, 100 - commissionPctInput),
                  })}
                </span>
              </label>

              <label
                className={`flex cursor-pointer flex-col rounded-xl border p-3 transition-all ${
                  paymentCollectionMode === "ALLY_DIRECT"
                    ? "border-accent bg-surface ring-1 ring-accent"
                    : "border-border bg-surface/60 hover:border-border-medium"
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="createPaymentCollectionMode"
                    value="ALLY_DIRECT"
                    checked={paymentCollectionMode === "ALLY_DIRECT"}
                    onChange={() => setPaymentCollectionMode("ALLY_DIRECT")}
                    className="accent-accent"
                  />
                  <span className="text-xs font-bold text-foreground">
                    {t("modeOption2Title")}
                  </span>
                </div>
                <span className="mt-1 pl-5 text-[11px] leading-snug text-muted-foreground">
                  {t("modeOption2Desc", { commissionPct: commissionPctInput })}
                </span>
              </label>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 pt-2">
              <div className="form-group">
                <label className="form-label mb-1 block text-[11px] font-medium text-muted-foreground">
                  {t("bankName")}
                </label>
                <select
                  id="create-org-bank"
                  className="input-field form-select"
                  value={payoutBank}
                  onChange={(e) => setPayoutBank(e.target.value)}
                >
                  <option value="0102 - Banco de Venezuela">0102 - Banco de Venezuela</option>
                  <option value="0134 - Banesco">0134 - Banesco</option>
                  <option value="0105 - Banco Mercantil">0105 - Banco Mercantil</option>
                  <option value="0108 - Banco Provincial">0108 - Banco Provincial</option>
                  <option value="0172 - Bancamiga">0172 - Bancamiga</option>
                  <option value="0114 - Bancaribe">0114 - Bancaribe</option>
                  <option value="0116 - Banco Occidental de Descuento (BOD)">0116 - B.O.D.</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label mb-1 block text-[11px] font-medium text-muted-foreground">
                  {t("accountType")}
                </label>
                <select
                  id="create-org-account-type"
                  className="input-field form-select"
                  value={payoutAccountType}
                  onChange={(e) => setPayoutAccountType(e.target.value)}
                >
                  <option value="Corriente">{t("accountTypeChecking")}</option>
                  <option value="Ahorro">{t("accountTypeSavings")}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="form-group">
                <label className="form-label mb-1 block text-[11px] font-medium text-muted-foreground">
                  {t("accountNumber")}
                </label>
                <input
                  type="text"
                  id="create-org-account-number"
                  className="input-field form-input font-mono"
                  maxLength={20}
                  placeholder="01340000000000000001"
                  value={payoutAccountNumber}
                  onChange={(e) => setPayoutAccountNumber(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label mb-1 block text-[11px] font-medium text-muted-foreground">
                  {t("accountHolder")}
                </label>
                <input
                  type="text"
                  id="create-org-account-holder"
                  className="input-field form-input"
                  placeholder={t("accountHolderPlaceholder")}
                  value={payoutAccountHolder}
                  onChange={(e) => setPayoutAccountHolder(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="form-group">
                <label className="form-label mb-1 block text-[11px] font-medium text-muted-foreground">
                  RIF / Documento Pago Móvil
                </label>
                <input
                  type="text"
                  id="create-org-payout-doc"
                  className="input-field form-input font-mono"
                  placeholder="J-40123456-7"
                  value={payoutIdDocument}
                  onChange={(e) => setPayoutIdDocument(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label mb-1 block text-[11px] font-medium text-muted-foreground">
                  Teléfono Pago Móvil
                </label>
                <input
                  type="tel"
                  id="create-org-payout-phone"
                  className="input-field form-input"
                  placeholder="0414-1234567"
                  value={payoutPhoneNumber}
                  onChange={(e) => setPayoutPhoneNumber(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onClose}
              disabled={loading}
              id="btn-cancel-create-org"
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={loading}
              id="btn-submit-create-org"
            >
              Crear Organización Aliada ✓
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export { CreateOrganizationModal as OrgCreateModal };
