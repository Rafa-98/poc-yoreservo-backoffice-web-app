"use client";

import React, { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/shared/ui/button";
import { SearchableSelect } from "@/features/users/ui/searchable-select";
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

const VENEZUELAN_BANKS = [
  { value: "0102 - Banco de Venezuela", label: "0102 - Banco de Venezuela", icon: "🏦" },
  { value: "0134 - Banesco", label: "0134 - Banesco Banco Universal", icon: "🏦" },
  { value: "0105 - Banco Mercantil", label: "0105 - Banco Mercantil", icon: "🏦" },
  { value: "0108 - Banco Provincial", label: "0108 - BBVA Provincial", icon: "🏦" },
  { value: "0172 - Bancamiga", label: "0172 - Bancamiga Banco Universal", icon: "🏦" },
  { value: "0114 - Bancaribe", label: "0114 - Bancaribe", icon: "🏦" },
  { value: "0191 - BNC", label: "0191 - Banco Nacional de Crédito (BNC)", icon: "🏦" },
  { value: "0151 - BFC", label: "0151 - BFC Banco Fondo Común", icon: "🏦" },
  { value: "0174 - Banplus", label: "0174 - Banplus Banco Universal", icon: "🏦" },
  { value: "0115 - Banco Exterior", label: "0115 - Banco Exterior", icon: "🏦" },
  { value: "0138 - Banco Plaza", label: "0138 - Banco Plaza", icon: "🏦" },
];

const COUNTRY_CODE_OPTIONS = [
  { value: "+58", label: "+58 (Venezuela)", icon: "🇻🇪" },
  { value: "+1", label: "+1 (USA / Canadá)", icon: "🇺🇸" },
  { value: "+34", label: "+34 (España)", icon: "🇪🇸" },
  { value: "+57", label: "+57 (Colombia)", icon: "🇨🇴" },
  { value: "+507", label: "+507 (Panamá)", icon: "🇵🇦" },
  { value: "+56", label: "+56 (Chile)", icon: "🇨🇱" },
  { value: "+54", label: "+54 (Argentina)", icon: "🇦🇷" },
  { value: "+52", label: "+52 (México)", icon: "🇲🇽" },
];

const OPERATOR_OPTIONS = [
  { value: "0412", label: "0412 (Digitel)" },
  { value: "0422", label: "0422 (Digitel)" },
  { value: "0414", label: "0414 (Movistar)" },
  { value: "0424", label: "0424 (Movistar)" },
  { value: "0416", label: "0416 (Movilnet)" },
  { value: "0426", label: "0426 (Movilnet)" },
  { value: "0212", label: "0212 (Fijo / CCS)" },
  { value: "OTRO", label: "Otra operadora" },
];

const DOC_PREFIX_OPTIONS = [
  { value: "J", label: "J - Jurídico" },
  { value: "V", label: "V - Venezolano" },
  { value: "E", label: "E - Extranjero" },
  { value: "G", label: "G - Gubernamental" },
  { value: "P", label: "P - Pasaporte" },
];

function formatSeparatedPhone(
  countryCode: string,
  operator: string,
  subscriber: string
): string {
  const digits = subscriber.replace(/\D/g, "");
  if (!digits) return "";
  if (countryCode === "+58" && operator !== "OTRO") {
    return `${countryCode} ${operator}-${digits}`;
  }
  return `${countryCode} ${digits}`;
}

export function CreateOrganizationModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateOrganizationModalProps) {
  const locale = useLocale();
  const isEn = locale.toLowerCase().startsWith("en");
  const t = useTranslations("venues.org");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const operatorOptions = OPERATOR_OPTIONS.map((opt) =>
    opt.value === "0212"
      ? { ...opt, label: isEn ? "0212 (Landline / CCS)" : "0212 (Fijo / CCS)" }
      : opt.value === "OTRO"
        ? { ...opt, label: isEn ? "Other carrier" : "Otra operadora" }
        : opt,
  );

  const docPrefixOptions = [
    { value: "J", label: isEn ? "J - Corporate" : "J - Jurídico" },
    { value: "V", label: isEn ? "V - Venezuelan" : "V - Venezolano" },
    { value: "E", label: isEn ? "E - Foreigner" : "E - Extranjero" },
    { value: "G", label: isEn ? "G - Government" : "G - Gubernamental" },
    { value: "P", label: isEn ? "P - Passport" : "P - Pasaporte" },
  ];

  // Section 1: Corporate & Fiscal Identity
  const [tradeName, setTradeName] = useState("");
  const [legalName, setLegalName] = useState("");
  const [rifPrefix, setRifPrefix] = useState("J");
  const [rifNumber, setRifNumber] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactCountry, setContactCountry] = useState("+58");
  const [contactOperator, setContactOperator] = useState("0414");
  const [contactSubscriber, setContactSubscriber] = useState("");
  const [fiscalAddress, setFiscalAddress] = useState("");

  // Section 2: Commercial Terms & BCV Currency
  const [referenceCurrencyCode, setReferenceCurrencyCode] = useState("USD");
  const [commissionPctInput, setCommissionPctInput] = useState(5);
  const [minimumMonthlyFee, setMinimumMonthlyFee] = useState(20);

  // Section 3: Payment Collection Mode & Banking Settlement
  const [paymentCollectionMode, setPaymentCollectionMode] =
    useState<PaymentCollectionMode>("PLATFORM_CUSTODY");
  const [preferredPayoutMethod, setPreferredPayoutMethod] = useState<
    "BANK_TRANSFER" | "PAGO_MOVIL"
  >("BANK_TRANSFER");
  const [activeSettlementTab, setActiveSettlementTab] = useState<
    "BANK_TRANSFER" | "PAGO_MOVIL"
  >("BANK_TRANSFER");

  // Bank Transfer
  const [payoutBank, setPayoutBank] = useState("0134 - Banesco");
  const [payoutAccountType, setPayoutAccountType] = useState("Corriente");
  const [payoutAccountNumber, setPayoutAccountNumber] = useState("");
  const [payoutAccountHolder, setPayoutAccountHolder] = useState("");
  const [bankDocPrefix, setBankDocPrefix] = useState("J");
  const [bankDocNumber, setBankDocNumber] = useState("");

  // Pago Móvil
  const [payoutPagoMovilBank, setPayoutPagoMovilBank] =
    useState("0134 - Banesco");
  const [pmCountry, setPmCountry] = useState("+58");
  const [pmOperator, setPmOperator] = useState("0414");
  const [pmSubscriber, setPmSubscriber] = useState("");
  const [pmDocPrefix, setPmDocPrefix] = useState("J");
  const [pmDocNumber, setPmDocNumber] = useState("");
  const [payoutPagoMovilHolder, setPayoutPagoMovilHolder] = useState("");

  if (!isOpen) return null;

  function resetForm() {
    setTradeName("");
    setLegalName("");
    setRifPrefix("J");
    setRifNumber("");
    setContactEmail("");
    setContactCountry("+58");
    setContactOperator("0414");
    setContactSubscriber("");
    setFiscalAddress("");
    setReferenceCurrencyCode("USD");
    setCommissionPctInput(5);
    setMinimumMonthlyFee(20);
    setPaymentCollectionMode("PLATFORM_CUSTODY");
    setPreferredPayoutMethod("BANK_TRANSFER");
    setActiveSettlementTab("BANK_TRANSFER");
    setPayoutBank("0134 - Banesco");
    setPayoutAccountType("Corriente");
    setPayoutAccountNumber("");
    setPayoutAccountHolder("");
    setBankDocPrefix("J");
    setBankDocNumber("");
    setPayoutPagoMovilBank("0134 - Banesco");
    setPmCountry("+58");
    setPmOperator("0414");
    setPmSubscriber("");
    setPmDocPrefix("J");
    setPmDocNumber("");
    setPayoutPagoMovilHolder("");
    setErrorMsg(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    const formattedRif = rifNumber.trim()
      ? `${rifPrefix}-${rifNumber.trim().replace(/^[JVEGP]-?/i, "")}`
      : "";

    if (!tradeName.trim() || !legalName.trim() || !formattedRif) {
      setErrorMsg(
        isEn
          ? "Complete the trade name, legal business name, and Tax ID (RIF)."
          : "Completa el nombre comercial, razón social fiscal y RIF."
      );
      return;
    }

    const formattedContactPhone = formatSeparatedPhone(
      contactCountry,
      contactOperator,
      contactSubscriber
    );
    if (
      !contactSubscriber.replace(/\D/g, "") ||
      contactSubscriber.replace(/\D/g, "").length < 7
    ) {
      setErrorMsg(
        isEn
          ? "Enter a valid contact phone number (minimum 7 digits)."
          : "Ingresa un número de teléfono de contacto válido (mínimo 7 dígitos)."
      );
      return;
    }

    const formattedPmPhone =
      formatSeparatedPhone(pmCountry, pmOperator, pmSubscriber) ||
      formattedContactPhone;

    const formattedBankDoc = bankDocNumber.trim()
      ? `${bankDocPrefix}-${bankDocNumber.trim().replace(/^[JVEGP]-?/i, "")}`
      : formattedRif;
    const formattedPmDoc = pmDocNumber.trim()
      ? `${pmDocPrefix}-${pmDocNumber.trim().replace(/^[JVEGP]-?/i, "")}`
      : formattedRif;

    setLoading(true);
    const rateDecimal = Math.max(
      0,
      Math.min(1, Number(commissionPctInput) / 100)
    );

    const payload: CreateOrganizationInput = {
      tradeName: tradeName.trim(),
      legalName: legalName.trim(),
      rif: formattedRif.toUpperCase(),
      contactEmail: contactEmail.trim(),
      contactPhone: formattedContactPhone,
      fiscalAddress: fiscalAddress.trim() || undefined,
      referenceCurrencyCode,
      commissionRate: rateDecimal,
      manualCommissionRate: rateDecimal,
      minimumMonthlyFee: Number(minimumMonthlyFee) || 0,
      paymentCollectionMode,
      preferredPayoutMethod,
      payoutBank: payoutBank.trim() || undefined,
      payoutAccountType: payoutAccountType || "Corriente",
      payoutAccountNumber: payoutAccountNumber.replace(/\D/g, "") || undefined,
      payoutAccountHolder:
        payoutAccountHolder.trim() || legalName.trim() || tradeName.trim(),
      payoutIdDocument: formattedBankDoc,
      payoutPagoMovilBank:
        payoutPagoMovilBank.trim() || payoutBank.trim() || undefined,
      payoutPhoneNumber: formattedPmPhone || undefined,
      payoutPagoMovilIdDocument: formattedPmDoc,
      payoutPagoMovilHolder:
        payoutPagoMovilHolder.trim() ||
        payoutAccountHolder.trim() ||
        legalName.trim(),
    };

    const res = await createOrganizationAction(payload);
    setLoading(false);

    if (res.ok && res.data) {
      resetForm();
      onSuccess(res.data);
      onClose();
    } else if (!res.ok) {
      setErrorMsg(
        res.error.code ||
          (isEn
            ? "Error creating ally organization"
            : "Error al crear la organización aliada")
      );
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
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🏛️</span>
            <div>
              <h3 className="m-0 text-[17px] font-bold text-foreground">
                {isEn
                  ? "Register New Ally Organization"
                  : "Registrar Nueva Organización Aliada"}
              </h3>
              <p className="m-0 text-xs text-muted-foreground">
                {isEn
                  ? "Corporate registration, BCV commercial terms, and settlement coordinates"
                  : "Alta corporativa, condiciones comerciales BCV y coordenadas de liquidación"}
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
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-6 py-5 space-y-5"
        >
          {errorMsg && (
            <div className="rounded-lg border border-status-cancelled-border bg-status-cancelled-bg px-3.5 py-2.5 text-[13px] font-semibold text-status-cancelled-fg">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* SECTION 1: Corporate & Fiscal Identity */}
          <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3.5">
            <div className="text-xs font-extrabold tracking-wider text-link uppercase">
              {isEn
                ? "1. Corporate & Tax Identity"
                : "1. Identidad Corporativa & Fiscal"}
            </div>

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-foreground">
                  {t("tradeName")} *
                </label>
                <input
                  type="text"
                  className="input-field form-input"
                  placeholder={
                    isEn
                      ? "e.g. Padel & Soccer Club Caracas"
                      : "ej. Pádel & Fútbol Club Caracas"
                  }
                  required
                  value={tradeName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setTradeName(e.target.value)
                  }
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-foreground">
                  {t("legalName")} *
                </label>
                <input
                  type="text"
                  className="input-field form-input"
                  placeholder={
                    isEn
                      ? "e.g. Inversiones Deportivas Caracas C.A."
                      : "ej. Inversiones Deportivas Caracas C.A."
                  }
                  required
                  value={legalName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setLegalName(e.target.value)
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-3">
                <label className="mb-1 block text-xs font-semibold text-foreground">
                  {isEn ? "RIF Type *" : "Tipo RIF *"}
                </label>
                <SearchableSelect
                  value={rifPrefix}
                  onChange={(val: string) => setRifPrefix(val)}
                  options={docPrefixOptions}
                />
              </div>
              <div className="sm:col-span-4">
                <label className="mb-1 block text-xs font-semibold text-foreground">
                  {isEn ? "RIF Number *" : "Número RIF *"}
                </label>
                <input
                  type="text"
                  className="input-field form-input font-mono"
                  placeholder="40123456-7"
                  required
                  value={rifNumber}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setRifNumber(
                      e.target.value.replace(/[^0-9-]/g, "").slice(0, 14)
                    )
                  }
                />
              </div>
              <div className="sm:col-span-5">
                <label className="mb-1 block text-xs font-semibold text-foreground">
                  {t("contactEmail")} *
                </label>
                <input
                  type="email"
                  className="input-field form-input"
                  placeholder={
                    isEn ? "finance@allyclub.com" : "finanzas@clubaliado.com"
                  }
                  required
                  value={contactEmail}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setContactEmail(e.target.value)
                  }
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-foreground">
                {t("contactPhone")} (
                {isEn
                  ? "Country Code + Carrier + Number"
                  : "Código de País + Operadora + Número"}
                ) *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                <div className="sm:col-span-4">
                  <SearchableSelect
                    value={contactCountry}
                    onChange={(val: string) => setContactCountry(val)}
                    options={COUNTRY_CODE_OPTIONS}
                  />
                </div>
                {contactCountry === "+58" && (
                  <div className="sm:col-span-4">
                    <SearchableSelect
                      value={contactOperator}
                      onChange={(val: string) => setContactOperator(val)}
                      options={operatorOptions}
                    />
                  </div>
                )}
                <div
                  className={
                    contactCountry === "+58" ? "sm:col-span-4" : "sm:col-span-8"
                  }
                >
                  <input
                    type="tel"
                    className="input-field form-input font-mono"
                    value={contactSubscriber}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setContactSubscriber(
                        e.target.value.replace(/\D/g, "").slice(0, 10)
                      )
                    }
                    placeholder="1234567"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-foreground">
                {t("fiscalAddress")}
              </label>
              <input
                type="text"
                className="input-field form-input"
                placeholder={
                  isEn
                    ? "Main Ave of Las Mercedes, Caracas, Miranda"
                    : "Av. Principal de Las Mercedes, Caracas, Miranda"
                }
                required
                value={fiscalAddress}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFiscalAddress(e.target.value)
                }
              />
            </div>
          </div>

          {/* SECTION 2: Commercial Terms & BCV Currency */}
          <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3.5">
            <div className="text-xs font-extrabold tracking-wider text-link uppercase">
              {isEn
                ? "2. Commercial Terms & BCV Currency"
                : "2. Condiciones Comerciales & Moneda BCV"}
            </div>

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-foreground">
                  {t("referenceCurrency")}
                </label>
                <SearchableSelect
                  value={referenceCurrencyCode}
                  onChange={(val: string) => setReferenceCurrencyCode(val)}
                  options={[
                    { value: "USD", label: t("currencyUsd"), icon: "💵" },
                    { value: "EUR", label: t("currencyEur"), icon: "💶" },
                  ]}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-foreground">
                  {isEn
                    ? "Platform Commission (%)"
                    : "Comisión Plataforma (%)"}
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="100"
                  className="input-field form-input"
                  value={commissionPctInput}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCommissionPctInput(Number(e.target.value))
                  }
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-foreground">
                  {t("minimumMonthlyFeeLabel")}
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  className="input-field form-input"
                  value={minimumMonthlyFee}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setMinimumMonthlyFee(Number(e.target.value))
                  }
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: Payment Collection Mode & Banking Settlement */}
          <div className="rounded-xl border border-accent/40 bg-accent/5 p-4 space-y-3.5">
            <div className="text-xs font-extrabold tracking-wider text-foreground uppercase">
              {isEn
                ? "3. Collection Mode & Corporate Settlement Account"
                : "3. Modalidad de Cobro & Cuenta Corporativa de Liquidación"}
            </div>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setPaymentCollectionMode("PLATFORM_CUSTODY")}
                className={`text-left p-3 rounded-xl border transition-all cursor-pointer ${
                  paymentCollectionMode === "PLATFORM_CUSTODY"
                    ? "border-accent bg-surface ring-1 ring-accent"
                    : "border-border bg-surface/60 hover:border-border-medium"
                }`}
              >
                <div className="text-xs font-bold text-foreground mb-1">
                  🛡️ {t("modeOption1Title")}
                </div>
                <p className="text-[11px] leading-snug text-muted-foreground m-0">
                  {t("modeOption1Desc", {
                    netPct: Math.max(0, 100 - commissionPctInput),
                  })}
                </p>
              </button>

              <button
                type="button"
                onClick={() => setPaymentCollectionMode("ALLY_DIRECT")}
                className={`text-left p-3 rounded-xl border transition-all cursor-pointer ${
                  paymentCollectionMode === "ALLY_DIRECT"
                    ? "border-accent bg-surface ring-1 ring-accent"
                    : "border-border bg-surface/60 hover:border-border-medium"
                }`}
              >
                <div className="text-xs font-bold text-foreground mb-1">
                  ⚡ {t("modeOption2Title")}
                </div>
                <p className="text-[11px] leading-snug text-muted-foreground m-0">
                  {t("modeOption2Desc", { commissionPct: commissionPctInput })}
                </p>
              </button>
            </div>

            <div className="flex items-center gap-2 border-b border-border pb-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setPreferredPayoutMethod("BANK_TRANSFER");
                  setActiveSettlementTab("BANK_TRANSFER");
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer border ${
                  activeSettlementTab === "BANK_TRANSFER"
                    ? "border-accent bg-accent text-accent-foreground"
                    : "border-transparent bg-transparent text-muted-foreground hover:bg-muted"
                }`}
              >
                {isEn ? "🏦 Bank Transfer" : "🏦 Transferencia Bancaria"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setPreferredPayoutMethod("PAGO_MOVIL");
                  setActiveSettlementTab("PAGO_MOVIL");
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer border ${
                  activeSettlementTab === "PAGO_MOVIL"
                    ? "border-accent bg-accent text-accent-foreground"
                    : "border-transparent bg-transparent text-muted-foreground hover:bg-muted"
                }`}
              >
                {isEn
                  ? "📲 Corporate Pago Móvil"
                  : "📲 Pago Móvil Corporativo"}
              </button>
            </div>

            {activeSettlementTab === "BANK_TRANSFER" ? (
              <div className="space-y-3 rounded-xl border border-border bg-surface p-3.5">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-foreground">
                      {t("bankName")}
                    </label>
                    <SearchableSelect
                      value={payoutBank}
                      onChange={(val: string) => setPayoutBank(val)}
                      options={VENEZUELAN_BANKS}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-foreground">
                      {t("accountType")}
                    </label>
                    <SearchableSelect
                      value={payoutAccountType}
                      onChange={(val: string) => setPayoutAccountType(val)}
                      options={[
                        { value: "Corriente", label: t("accountTypeChecking") },
                        { value: "Ahorro", label: t("accountTypeSavings") },
                      ]}
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-foreground">
                    {t("accountNumber")}
                  </label>
                  <input
                    type="text"
                    className="input-field form-input font-mono"
                    maxLength={20}
                    placeholder="01340000000000000001"
                    value={payoutAccountNumber}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setPayoutAccountNumber(
                        e.target.value.replace(/\D/g, "").slice(0, 20)
                      )
                    }
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-4">
                    <label className="mb-1 block text-xs font-semibold text-foreground">
                      {isEn ? "Doc. Type" : "Tipo Doc."}
                    </label>
                    <SearchableSelect
                      value={bankDocPrefix}
                      onChange={(val: string) => setBankDocPrefix(val)}
                      options={docPrefixOptions}
                    />
                  </div>
                  <div className="sm:col-span-8">
                    <label className="mb-1 block text-xs font-semibold text-foreground">
                      {isEn
                        ? "Holder Tax ID / Document"
                        : "RIF / Cédula del Titular"}
                    </label>
                    <input
                      type="text"
                      className="input-field form-input font-mono"
                      placeholder="40123456-7"
                      value={bankDocNumber}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setBankDocNumber(
                          e.target.value.replace(/[^0-9-]/g, "").slice(0, 14)
                        )
                      }
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-foreground">
                    {t("accountHolder")}
                  </label>
                  <input
                    type="text"
                    className="input-field form-input"
                    placeholder={t("accountHolderPlaceholder")}
                    value={payoutAccountHolder}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setPayoutAccountHolder(e.target.value)
                    }
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3 rounded-xl border border-border bg-surface p-3.5">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-foreground">
                    {isEn
                      ? "Pago Móvil Receiving Bank"
                      : "Banco Receptor Pago Móvil"}
                  </label>
                  <SearchableSelect
                    value={payoutPagoMovilBank}
                    onChange={(val: string) => setPayoutPagoMovilBank(val)}
                    options={VENEZUELAN_BANKS}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-foreground">
                    {isEn
                      ? "Phone Affiliated to Pago Móvil"
                      : "Teléfono Afiliado a Pago Móvil"}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                    <div className="sm:col-span-4">
                      <SearchableSelect
                        value={pmCountry}
                        onChange={(val: string) => setPmCountry(val)}
                        options={COUNTRY_CODE_OPTIONS}
                      />
                    </div>
                    {pmCountry === "+58" && (
                      <div className="sm:col-span-4">
                        <SearchableSelect
                          value={pmOperator}
                          onChange={(val: string) => setPmOperator(val)}
                          options={operatorOptions}
                        />
                      </div>
                    )}
                    <div
                      className={
                        pmCountry === "+58" ? "sm:col-span-4" : "sm:col-span-8"
                      }
                    >
                      <input
                        type="tel"
                        className="input-field form-input font-mono"
                        value={pmSubscriber}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setPmSubscriber(
                            e.target.value.replace(/\D/g, "").slice(0, 10)
                          )
                        }
                        placeholder="1234567"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-4">
                    <label className="mb-1 block text-xs font-semibold text-foreground">
                      {isEn ? "Doc. Type" : "Tipo Doc."}
                    </label>
                    <SearchableSelect
                      value={pmDocPrefix}
                      onChange={(val: string) => setPmDocPrefix(val)}
                      options={docPrefixOptions}
                    />
                  </div>
                  <div className="sm:col-span-8">
                    <label className="mb-1 block text-xs font-semibold text-foreground">
                      {isEn
                        ? "Affiliated Tax ID / Document"
                        : "RIF / Cédula Afiliado"}
                    </label>
                    <input
                      type="text"
                      className="input-field form-input font-mono"
                      placeholder="40123456-7"
                      value={pmDocNumber}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setPmDocNumber(
                          e.target.value.replace(/[^0-9-]/g, "").slice(0, 14)
                        )
                      }
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-foreground">
                    {isEn
                      ? "Pago Móvil Beneficiary / Holder"
                      : "Beneficiario / Titular del Pago Móvil"}
                  </label>
                  <input
                    type="text"
                    className="input-field form-input"
                    placeholder={
                      isEn
                        ? "Beneficiary Legal Name or Full Name"
                        : "Razón Social o Nombre del Beneficiario"
                    }
                    value={payoutPagoMovilHolder}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setPayoutPagoMovilHolder(e.target.value)
                    }
                  />
                </div>
              </div>
            )}
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
              {isEn
                ? "Create Ally Organization ✓"
                : "Crear Organización Aliada ✓"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export { CreateOrganizationModal as OrgCreateModal };
