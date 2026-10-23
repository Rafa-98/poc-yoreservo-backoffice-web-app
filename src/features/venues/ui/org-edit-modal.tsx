"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/shared/ui/button";
import { SearchableSelect } from "@/features/users/ui/searchable-select";
import type {
  OrganizationData,
  PaymentCollectionMode,
  UpdateOrganizationInput,
} from "../model/types";
import { updateOrganizationAction } from "../actions/venues-actions";

interface OrgEditModalProps {
  open?: boolean;
  isOpen?: boolean;
  onClose: () => void;
  org?: OrganizationData;
  organization?: OrganizationData;
  isPlatformAdmin?: boolean;
  userRole?: string;
  onSuccess: (updated: OrganizationData) => void;
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
  { value: "0104 - Banco Venezolano de Crédito", label: "0104 - Venezolano de Crédito", icon: "🏦" },
  { value: "0163 - Banco del Tesoro", label: "0163 - Banco del Tesoro", icon: "🏦" },
  { value: "0175 - Banco Bicentenario", label: "0175 - Banco Bicentenario", icon: "🏦" },
  { value: "0177 - Banfanb", label: "0177 - BANFANB", icon: "🏦" },
  { value: "0168 - Bancrecer", label: "0168 - Bancrecer", icon: "🏦" },
  { value: "0169 - Mi Banco", label: "0169 - Mi Banco", icon: "🏦" },
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

function parseSeparatedPhone(raw?: string | null): {
  countryCode: string;
  operator: string;
  subscriber: string;
} {
  const clean = (raw || "").trim();
  if (!clean) {
    return { countryCode: "+58", operator: "0414", subscriber: "" };
  }

  let countryCode = "+58";
  let rest = clean;

  for (const c of COUNTRY_CODE_OPTIONS) {
    if (rest.startsWith(c.value)) {
      countryCode = c.value;
      rest = rest.slice(c.value.length).trim();
      break;
    }
  }

  const digits = rest.replace(/\D/g, "");
  if (countryCode === "+58") {
    const normalized = digits.startsWith("0") ? digits : `0${digits}`;
    const opCandidate = normalized.slice(0, 4);
    const knownOp = OPERATOR_OPTIONS.find(
      (o) => o.value !== "OTRO" && o.value === opCandidate
    );
    if (knownOp) {
      return {
        countryCode,
        operator: knownOp.value,
        subscriber: normalized.slice(4, 11),
      };
    }
  }

  return {
    countryCode,
    operator: countryCode === "+58" ? "0414" : "OTRO",
    subscriber: digits.slice(0, 12),
  };
}

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

function parseDocId(raw?: string | null): { prefix: string; number: string } {
  const clean = (raw || "").trim();
  if (!clean) return { prefix: "J", number: "" };
  const match = /^([JVEGP])-?(.*)$/i.exec(clean);
  if (match) {
    return {
      prefix: match[1].toUpperCase(),
      number: match[2].trim(),
    };
  }
  return { prefix: "J", number: clean };
}

export function OrgEditModal({
  open: propOpen,
  isOpen,
  onClose,
  org: propOrg,
  organization,
  isPlatformAdmin: propIsPlatformAdmin,
  userRole,
  onSuccess,
}: OrgEditModalProps) {
  const open = propOpen ?? isOpen ?? false;
  const org = (propOrg ?? organization)!;
  const isPlatformAdmin =
    propIsPlatformAdmin !== undefined
      ? propIsPlatformAdmin
      : userRole === "PLATFORM_ADMIN";
  const t = useTranslations("venues.org");

  const [tradeName, setTradeName] = useState(org?.tradeName || "");
  const [contactEmail, setContactEmail] = useState(org?.contactEmail || "");

  // Separated Contact Phone
  const [contactCountry, setContactCountry] = useState("+58");
  const [contactOperator, setContactOperator] = useState("0414");
  const [contactSubscriber, setContactSubscriber] = useState("");

  const [fiscalAddress, setFiscalAddress] = useState(org?.fiscalAddress || "");
  const [referenceCurrencyCode, setReferenceCurrencyCode] = useState(
    org?.referenceCurrencyCode || "USD"
  );
  const [paymentCollectionMode, setPaymentCollectionMode] =
    useState<PaymentCollectionMode>(
      org?.paymentCollectionMode || "PLATFORM_CUSTODY"
    );

  // Preferred Corporate Settlement Method (BANK_TRANSFER vs PAGO_MOVIL)
  const [preferredPayoutMethod, setPreferredPayoutMethod] = useState<
    "BANK_TRANSFER" | "PAGO_MOVIL"
  >(org?.preferredPayoutMethod || "BANK_TRANSFER");
  const [activeSettlementTab, setActiveSettlementTab] = useState<
    "BANK_TRANSFER" | "PAGO_MOVIL"
  >(org?.preferredPayoutMethod || "BANK_TRANSFER");

  // Bank Transfer Settlement Fields
  const [payoutBank, setPayoutBank] = useState(
    org?.payoutBank || "0134 - Banesco"
  );
  const [payoutAccountType, setPayoutAccountType] = useState(
    org?.payoutAccountType || "Corriente"
  );
  const [payoutAccountNumber, setPayoutAccountNumber] = useState(
    org?.payoutAccountNumber || ""
  );
  const [payoutAccountHolder, setPayoutAccountHolder] = useState(
    org?.payoutAccountHolder || org?.legalName || ""
  );
  const [bankDocPrefix, setBankDocPrefix] = useState("J");
  const [bankDocNumber, setBankDocNumber] = useState("");

  // Pago Móvil Settlement Fields
  const [payoutPagoMovilBank, setPayoutPagoMovilBank] = useState(
    org?.payoutPagoMovilBank || org?.payoutBank || "0134 - Banesco"
  );
  const [pmCountry, setPmCountry] = useState("+58");
  const [pmOperator, setPmOperator] = useState("0414");
  const [pmSubscriber, setPmSubscriber] = useState("");
  const [pmDocPrefix, setPmDocPrefix] = useState("J");
  const [pmDocNumber, setPmDocNumber] = useState("");
  const [payoutPagoMovilHolder, setPayoutPagoMovilHolder] = useState(
    org?.payoutPagoMovilHolder ||
      org?.payoutAccountHolder ||
      org?.legalName ||
      ""
  );

  // Platform Admin commercial overrides
  const initialCommPct =
    org?.commissionPct ??
    ((org?.commissionRate ?? 0.05) > 1
      ? org.commissionRate
      : Math.round((org?.commissionRate ?? 0.05) * 1000) / 10);
  const [commissionPctInput, setCommissionPctInput] =
    useState<number>(initialCommPct);
  const [minimumMonthlyFeeInput, setMinimumMonthlyFeeInput] = useState<number>(
    org?.minimumMonthlyFee ?? 0
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && org) {
      setTradeName(org.tradeName);
      setContactEmail(org.contactEmail);

      const parsedContact = parseSeparatedPhone(org.contactPhone);
      setContactCountry(parsedContact.countryCode);
      setContactOperator(parsedContact.operator);
      setContactSubscriber(parsedContact.subscriber);

      setFiscalAddress(org.fiscalAddress);
      setReferenceCurrencyCode(org.referenceCurrencyCode || "USD");
      setPaymentCollectionMode(org.paymentCollectionMode || "PLATFORM_CUSTODY");

      const prefMethod =
        org.preferredPayoutMethod === "PAGO_MOVIL"
          ? "PAGO_MOVIL"
          : "BANK_TRANSFER";
      setPreferredPayoutMethod(prefMethod);
      setActiveSettlementTab(prefMethod);

      setPayoutBank(org.payoutBank || "0134 - Banesco");
      setPayoutAccountType(org.payoutAccountType || "Corriente");
      setPayoutAccountNumber(org.payoutAccountNumber || "");
      setPayoutAccountHolder(org.payoutAccountHolder || org.legalName || "");

      const parsedBankDoc = parseDocId(org.payoutIdDocument || org.rif);
      setBankDocPrefix(parsedBankDoc.prefix);
      setBankDocNumber(parsedBankDoc.number);

      setPayoutPagoMovilBank(
        org.payoutPagoMovilBank || org.payoutBank || "0134 - Banesco"
      );
      const parsedPmPhone = parseSeparatedPhone(
        org.payoutPhoneNumber || org.pagoMovilPhone || org.contactPhone
      );
      setPmCountry(parsedPmPhone.countryCode);
      setPmOperator(parsedPmPhone.operator);
      setPmSubscriber(parsedPmPhone.subscriber);

      const parsedPmDoc = parseDocId(
        org.payoutPagoMovilIdDocument || org.payoutIdDocument || org.rif
      );
      setPmDocPrefix(parsedPmDoc.prefix);
      setPmDocNumber(parsedPmDoc.number);
      setPayoutPagoMovilHolder(
        org.payoutPagoMovilHolder ||
          org.payoutAccountHolder ||
          org.legalName ||
          ""
      );

      setCommissionPctInput(
        org.commissionPct ??
          (org.commissionRate > 1
            ? org.commissionRate
            : Math.round((org.commissionRate ?? 0.05) * 1000) / 10)
      );
      setMinimumMonthlyFeeInput(org.minimumMonthlyFee ?? 0);
      setError(null);
    }
  }, [open, org]);

  if (!open || !org) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!tradeName.trim()) {
      setError("El nombre comercial es obligatorio.");
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
      setError(
        "Ingresa un número de teléfono de contacto válido (mínimo 7 dígitos)."
      );
      return;
    }

    const formattedBankDoc = bankDocNumber.trim()
      ? `${bankDocPrefix}-${bankDocNumber.trim().replace(/^[JVEGP]-?/i, "")}`
      : org.rif;

    const formattedPmPhone = formatSeparatedPhone(
      pmCountry,
      pmOperator,
      pmSubscriber
    );
    const formattedPmDoc = pmDocNumber.trim()
      ? `${pmDocPrefix}-${pmDocNumber.trim().replace(/^[JVEGP]-?/i, "")}`
      : org.rif;

    if (preferredPayoutMethod === "BANK_TRANSFER") {
      if (!payoutBank.trim()) {
        setError(
          "Selecciona el banco para la cuenta de transferencia bancaria."
        );
        setActiveSettlementTab("BANK_TRANSFER");
        return;
      }
      const cleanAcc = payoutAccountNumber.replace(/\D/g, "");
      if (cleanAcc.length !== 20) {
        setError(
          `El número de cuenta bancaria debe tener exactamente 20 dígitos (actualmente tiene ${cleanAcc.length}).`
        );
        setActiveSettlementTab("BANK_TRANSFER");
        return;
      }
      if (!payoutAccountHolder.trim()) {
        setError(
          "Ingresa el nombre o razón social del titular de la cuenta bancaria."
        );
        setActiveSettlementTab("BANK_TRANSFER");
        return;
      }
    } else {
      if (!payoutPagoMovilBank.trim()) {
        setError(
          "Selecciona el banco receptor para liquidaciones por Pago Móvil."
        );
        setActiveSettlementTab("PAGO_MOVIL");
        return;
      }
      if (
        !pmSubscriber.replace(/\D/g, "") ||
        pmSubscriber.replace(/\D/g, "").length < 7
      ) {
        setError(
          "Ingresa un teléfono válido para recibir liquidaciones por Pago Móvil."
        );
        setActiveSettlementTab("PAGO_MOVIL");
        return;
      }
      if (!pmDocNumber.trim()) {
        setError(
          "Ingresa el RIF o Cédula asociado al Pago Móvil de liquidación."
        );
        setActiveSettlementTab("PAGO_MOVIL");
        return;
      }
    }

    setLoading(true);
    try {
      const payload: UpdateOrganizationInput = {
        organizationId: org.id,
        tradeName: tradeName.trim(),
        contactEmail: contactEmail.trim(),
        contactPhone: formattedContactPhone,
        fiscalAddress: fiscalAddress.trim(),
        referenceCurrencyCode,
        paymentCollectionMode,
        preferredPayoutMethod,
        payoutBank,
        payoutAccountType,
        payoutAccountNumber: payoutAccountNumber.replace(/\D/g, ""),
        payoutAccountHolder: payoutAccountHolder.trim(),
        payoutIdDocument: formattedBankDoc,
        payoutPagoMovilBank,
        payoutPhoneNumber: formattedPmPhone || formattedContactPhone,
        payoutPagoMovilIdDocument: formattedPmDoc,
        payoutPagoMovilHolder:
          payoutPagoMovilHolder.trim() || payoutAccountHolder.trim(),
        ...(isPlatformAdmin
          ? {
              commissionRate: Math.max(0, Number(commissionPctInput)),
              manualCommissionRate: Math.max(0, Number(commissionPctInput)),
              minimumMonthlyFee: Math.max(0, Number(minimumMonthlyFeeInput)),
            }
          : {}),
      };

      const res = await updateOrganizationAction(payload, org.id);
      if (!res.ok) {
        setError(res.error.code || "Error al actualizar la organización");
        return;
      }
      onSuccess(res.data);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const activeCommPct = Math.round(Number(commissionPctInput || 5) * 10) / 10;
  const activeNetPct = Math.round((100 - activeCommPct) * 10) / 10;

  return (
    <div
      className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
      id="org-edit-modal-backdrop"
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
              <h3 className="m-0 text-[17px] font-extrabold text-foreground">
                {t("modalTitle")}
              </h3>
              <p className="m-0 text-xs text-muted-foreground">
                Actualiza los datos de contacto y coordenadas corporativas de liquidación
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
          onSubmit={handleSave}
          className="flex-1 overflow-y-auto px-6 py-5 space-y-5"
        >
          {error && (
            <div className="rounded-xl border border-status-cancelled-border bg-status-cancelled-bg px-3.5 py-2.5 text-xs font-bold text-status-cancelled-fg">
              ⚠️ {error}
            </div>
          )}

          {/* SECCIÓN 1: Identidad Corporativa y Fiscal */}
          <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="text-xs font-extrabold tracking-wider text-link uppercase">
                1. Identidad Fiscal y Contacto Corporativo
              </div>
              <span className="inline-flex items-center rounded-full border border-border bg-surface px-2.5 py-0.5 text-[10px] font-bold text-muted-foreground">
                🔒 RIF y Razón Social no modificables
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-bold text-foreground">
                  {t("tradeName")} *
                </label>
                <input
                  type="text"
                  className="input-field form-input"
                  value={tradeName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setTradeName(e.target.value)
                  }
                  placeholder="Ej: San Agustín Sport Complex"
                  required
                />
              </div>

              <div>
                <label className="mb-1 flex items-center justify-between text-xs font-bold text-muted-foreground">
                  <span>{t("legalName")}</span>
                  <span className="text-[10px] font-semibold">
                    🔒 Bloqueado
                  </span>
                </label>
                <input
                  type="text"
                  className="input-field form-input opacity-65 cursor-not-allowed bg-muted"
                  value={org.legalName}
                  disabled
                  readOnly
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <div>
                <label className="mb-1 flex items-center justify-between text-xs font-bold text-muted-foreground">
                  <span>{t("rif")}</span>
                  <span className="text-[10px] font-semibold">
                    🔒 Bloqueado
                  </span>
                </label>
                <input
                  type="text"
                  className="input-field form-input font-mono opacity-65 cursor-not-allowed bg-muted"
                  value={org.rif}
                  disabled
                  readOnly
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-foreground">
                  {t("contactEmail")} *
                </label>
                <input
                  type="email"
                  className="input-field form-input"
                  value={contactEmail}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setContactEmail(e.target.value)
                  }
                  placeholder="finanzas@empresa.com"
                  required
                />
              </div>
            </div>

            {/* Teléfono de Contacto Separado (Código de País + Operadora + Número) */}
            <div>
              <label className="mb-1.5 block text-xs font-bold text-foreground">
                {t("contactPhone")} (Código de País + Operadora + Número) *
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
                      options={OPERATOR_OPTIONS}
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-bold text-foreground">
                  {t("fiscalAddress")}
                </label>
                <input
                  type="text"
                  className="input-field form-input"
                  value={fiscalAddress}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFiscalAddress(e.target.value)
                  }
                  placeholder="Av. Principal, Municipio, Estado"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-foreground">
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
            </div>
          </div>

          {/* SECCIÓN 2: Modalidad de Cobro */}
          <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="text-xs font-extrabold tracking-wider text-link uppercase">
                2. Modalidad de Cobro y Recaudación
              </div>
              {!isPlatformAdmin && (
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-500 border border-amber-500/30">
                  🔒 Gestionado por YoReservo
                </span>
              )}
            </div>

            {!isPlatformAdmin && (
              <p className="text-xs text-muted-foreground m-0">
                La modalidad de recaudación forma parte del acuerdo comercial
                con YoReservo. Para solicitar un cambio de modalidad, contacta a
                Administración de Plataforma.
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                disabled={!isPlatformAdmin}
                onClick={() =>
                  isPlatformAdmin &&
                  setPaymentCollectionMode("PLATFORM_CUSTODY")
                }
                className={`text-left p-3.5 rounded-xl border transition-all ${
                  paymentCollectionMode === "PLATFORM_CUSTODY"
                    ? "border-accent bg-accent/10 ring-1 ring-accent"
                    : "border-border bg-surface hover:border-border-medium"
                } ${
                  !isPlatformAdmin
                    ? "opacity-75 cursor-not-allowed"
                    : "cursor-pointer"
                }`}
              >
                <div className="text-xs font-extrabold text-foreground mb-1">
                  🛡️ {t("modeOption1Title")}
                </div>
                <p className="text-[11px] text-muted-foreground m-0 leading-relaxed">
                  {t("modeOption1Desc", {
                    netPct: activeNetPct,
                  })}
                </p>
              </button>

              <button
                type="button"
                disabled={!isPlatformAdmin}
                onClick={() =>
                  isPlatformAdmin && setPaymentCollectionMode("ALLY_DIRECT")
                }
                className={`text-left p-3.5 rounded-xl border transition-all ${
                  paymentCollectionMode === "ALLY_DIRECT"
                    ? "border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500"
                    : "border-border bg-surface hover:border-border-medium"
                } ${
                  !isPlatformAdmin
                    ? "opacity-75 cursor-not-allowed"
                    : "cursor-pointer"
                }`}
              >
                <div className="text-xs font-extrabold text-foreground mb-1">
                  ⚡ {t("modeOption2Title")}
                </div>
                <p className="text-[11px] text-muted-foreground m-0 leading-relaxed">
                  {t("modeOption2Desc", {
                    commissionPct: activeCommPct,
                  })}
                </p>
              </button>
            </div>

            {isPlatformAdmin && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 border-t border-border">
                <div>
                  <label className="mb-1 block text-xs font-bold text-foreground">
                    Comisión Plataforma (%)
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
                  <label className="mb-1 block text-xs font-bold text-foreground">
                    {t("minimumMonthlyFeeLabel")} ({referenceCurrencyCode})
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    className="input-field form-input"
                    value={minimumMonthlyFeeInput}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setMinimumMonthlyFeeInput(Number(e.target.value))
                    }
                  />
                </div>
              </div>
            )}
          </div>

          {/* SECCIÓN 3: Cuenta Corporativa de Liquidación (Transferencia Bancaria y Pago Móvil) */}
          <div className="rounded-xl border border-accent/40 bg-accent/5 p-4 space-y-4">
            <div>
              <div className="text-xs font-extrabold tracking-wider text-foreground uppercase">
                3. 🏦 Cuenta Corporativa de Liquidación (Transferencia Bancaria o Pago Móvil)
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5 mb-0">
                YoReservo puede abonar las liquidaciones a tu organización vía{" "}
                <strong>Transferencia Bancaria</strong> o{" "}
                <strong>Pago Móvil Corporativo</strong>. Selecciona tu vía
                preferida y configura ambas coordenadas.
              </p>
            </div>

            {/* Selector de Método Preferido de Liquidación */}
            <div className="rounded-xl border border-border bg-surface p-3.5">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground block mb-2">
                Vía Preferida para Recibir Pagos de Liquidación de YoReservo
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setPreferredPayoutMethod("BANK_TRANSFER");
                    setActiveSettlementTab("BANK_TRANSFER");
                  }}
                  className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    preferredPayoutMethod === "BANK_TRANSFER"
                      ? "border-accent bg-accent/10 text-foreground ring-1 ring-accent"
                      : "border-border bg-muted/20 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">🏦</span>
                    <div>
                      <div className="text-xs font-extrabold text-foreground">
                        Transferencia Bancaria
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        Cuenta nacional de 20 dígitos
                      </div>
                    </div>
                  </div>
                  {preferredPayoutMethod === "BANK_TRANSFER" && (
                    <span className="rounded-full bg-emerald-500/15 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-bold text-emerald-500">
                      Preferido ✓
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPreferredPayoutMethod("PAGO_MOVIL");
                    setActiveSettlementTab("PAGO_MOVIL");
                  }}
                  className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    preferredPayoutMethod === "PAGO_MOVIL"
                      ? "border-accent bg-accent/10 text-foreground ring-1 ring-accent"
                      : "border-border bg-muted/20 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">📲</span>
                    <div>
                      <div className="text-xs font-extrabold text-foreground">
                        Pago Móvil Corporativo
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        Abono inmediato a teléfono afiliado
                      </div>
                    </div>
                  </div>
                  {preferredPayoutMethod === "PAGO_MOVIL" && (
                    <span className="rounded-full bg-emerald-500/15 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-bold text-emerald-500">
                      Preferido ✓
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Pestañas para editar coordenadas de Transferencia Bancaria y Pago Móvil */}
            <div className="flex items-center gap-2 border-b border-border pb-2">
              <button
                type="button"
                onClick={() => setActiveSettlementTab("BANK_TRANSFER")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer border ${
                  activeSettlementTab === "BANK_TRANSFER"
                    ? "border-accent bg-accent text-accent-foreground"
                    : "border-transparent bg-transparent text-muted-foreground hover:bg-muted"
                }`}
              >
                🏦 Coordenadas Transferencia Bancaria
              </button>
              <button
                type="button"
                onClick={() => setActiveSettlementTab("PAGO_MOVIL")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer border ${
                  activeSettlementTab === "PAGO_MOVIL"
                    ? "border-accent bg-accent text-accent-foreground"
                    : "border-transparent bg-transparent text-muted-foreground hover:bg-muted"
                }`}
              >
                📲 Coordenadas Pago Móvil
              </button>
            </div>

            {activeSettlementTab === "BANK_TRANSFER" ? (
              <div className="space-y-3.5 rounded-xl border border-border bg-surface p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-foreground">
                      {t("bankName")} *
                    </label>
                    <SearchableSelect
                      value={payoutBank}
                      onChange={(val: string) => setPayoutBank(val)}
                      options={VENEZUELAN_BANKS}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-foreground">
                      {t("accountType")} *
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
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-foreground">
                      {t("accountNumber")} *
                    </label>
                    <span className="text-[11px] font-mono text-muted-foreground">
                      {payoutAccountNumber.replace(/\D/g, "").length}/20 dígitos
                    </span>
                  </div>
                  <input
                    type="text"
                    className="input-field form-input font-mono"
                    maxLength={20}
                    value={payoutAccountNumber}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setPayoutAccountNumber(
                        e.target.value.replace(/\D/g, "").slice(0, 20)
                      )
                    }
                    placeholder="01340000000000000000"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-4">
                    <label className="mb-1.5 block text-xs font-bold text-foreground">
                      Tipo Doc. Titular *
                    </label>
                    <SearchableSelect
                      value={bankDocPrefix}
                      onChange={(val: string) => setBankDocPrefix(val)}
                      options={DOC_PREFIX_OPTIONS}
                    />
                  </div>
                  <div className="sm:col-span-8">
                    <label className="mb-1.5 block text-xs font-bold text-foreground">
                      RIF / Cédula del Titular *
                    </label>
                    <input
                      type="text"
                      className="input-field form-input font-mono"
                      value={bankDocNumber}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setBankDocNumber(
                          e.target.value.replace(/[^0-9-]/g, "").slice(0, 14)
                        )
                      }
                      placeholder="40128990-1"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-foreground">
                    {t("accountHolder")} *
                  </label>
                  <input
                    type="text"
                    className="input-field form-input"
                    value={payoutAccountHolder}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setPayoutAccountHolder(e.target.value)
                    }
                    placeholder={t("accountHolderPlaceholder")}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3.5 rounded-xl border border-border bg-surface p-4">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-foreground">
                    Banco Receptor Pago Móvil *
                  </label>
                  <SearchableSelect
                    value={payoutPagoMovilBank}
                    onChange={(val: string) => setPayoutPagoMovilBank(val)}
                    options={VENEZUELAN_BANKS}
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-foreground">
                    Teléfono Afiliado a Pago Móvil (Código + Operadora + Número) *
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
                          options={OPERATOR_OPTIONS}
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
                    <label className="mb-1.5 block text-xs font-bold text-foreground">
                      Tipo Doc. *
                    </label>
                    <SearchableSelect
                      value={pmDocPrefix}
                      onChange={(val: string) => setPmDocPrefix(val)}
                      options={DOC_PREFIX_OPTIONS}
                    />
                  </div>
                  <div className="sm:col-span-8">
                    <label className="mb-1.5 block text-xs font-bold text-foreground">
                      RIF / Cédula Afiliado *
                    </label>
                    <input
                      type="text"
                      className="input-field form-input font-mono"
                      value={pmDocNumber}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setPmDocNumber(
                          e.target.value.replace(/[^0-9-]/g, "").slice(0, 14)
                        )
                      }
                      placeholder="40128990-1"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-foreground">
                    Beneficiario / Titular del Pago Móvil *
                  </label>
                  <input
                    type="text"
                    className="input-field form-input"
                    value={payoutPagoMovilHolder}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setPayoutPagoMovilHolder(e.target.value)
                    }
                    placeholder="Nombre o Razón Social del Beneficiario"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t border-border">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onClose}
              disabled={loading}
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={loading}
              disabled={loading}
            >
              {t("save")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
