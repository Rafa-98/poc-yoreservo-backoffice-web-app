"use client";

import React, { useState, useEffect } from "react";
import { useLocale } from "next-intl";
import { Button } from "@/shared/ui/button";
import { SearchableSelect } from "@/features/users/ui/searchable-select";
import type {
  OrganizationData,
  PaymentMethodConfigItem,
  PaymentMethodType,
} from "../model/types";
import { updatePaymentMethodConfigsAction } from "../actions/venues-actions";

interface PaymentMethodsConfigCardProps {
  scope: "PLATFORM" | "ORGANIZATION";
  organization?: OrganizationData;
  organizationId?: string;
  organizationName?: string;
  initialMethods?: PaymentMethodConfigItem[];
  userRole?: string;
  canEdit?: boolean;
  onUpdated?: (methods: PaymentMethodConfigItem[]) => void;
  onSaved?: (methods: PaymentMethodConfigItem[]) => void;
  onToast?: (message: string, isError?: boolean) => void;
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

function getMethodMeta(
  method: PaymentMethodType,
  isEn: boolean
): {
  icon: string;
  label: string;
  shortDesc: string;
} {
  switch (method) {
    case "PAGO_MOVIL":
      return {
        icon: "📲",
        label: isEn
          ? "Interbank Pago Móvil (Bs.)"
          : "Pago Móvil Interbancario (Bs.)",
        shortDesc: isEn
          ? "Instant transfer in Bolívares at the official daily BCV exchange rate."
          : "Transferencia inmediata en Bolívares al tipo de cambio oficial BCV del día.",
      };
    case "CASH":
      return {
        icon: "💵",
        label: isEn ? "Cash at Venue / Box Office" : "Efectivo en Sede / Taquilla",
        shortDesc: isEn
          ? "In-person cash payment directly at the sports venue reception (Direct Collection only)."
          : "Pago presencial en efectivo directamente en la recepción de la sede deportiva (Exclusivo Cobro Directo).",
      };
    case "ZELLE":
      return {
        icon: "🟣",
        label: "Zelle (USD)",
        shortDesc: isEn
          ? "Electronic transfer in US Dollars (USD) with reference verification."
          : "Transferencia electrónica en Dólares Estadounidenses (USD) con validación de referencia.",
      };
    case "PIPOL_PAY":
      return {
        icon: "⚡",
        label: "Pipol Pay / Facebank (USD)",
        shortDesc: isEn
          ? "Electronic payment in USD via Pipol Pay wallet."
          : "Pago electrónico en USD mediante billetera Pipol Pay.",
      };
    case "CARD":
      return {
        icon: "💳",
        label: isEn
          ? "International Card (Credit / Debit)"
          : "Tarjeta Internacional (Crédito / Débito)",
        shortDesc: isEn
          ? "Automatic online processing with Visa / Mastercard cards (YoReservo Custody only)."
          : "Procesamiento automático en línea con tarjetas Visa / Mastercard (Exclusivo Custodia YoReservo).",
      };
  }
}

function buildDefaultMethods(
  scope: "PLATFORM" | "ORGANIZATION",
  existing?: PaymentMethodConfigItem[]
): PaymentMethodConfigItem[] {
  const allowedMethods: PaymentMethodType[] =
    scope === "PLATFORM"
      ? ["PAGO_MOVIL", "ZELLE", "PIPOL_PAY", "CARD"]
      : ["PAGO_MOVIL", "CASH", "ZELLE", "PIPOL_PAY"];

  const byMethod = new Map<PaymentMethodType, PaymentMethodConfigItem>();
  for (const item of existing ?? []) {
    byMethod.set(item.method, item);
  }

  return allowedMethods.map((method) => {
    const found = byMethod.get(method);
    if (found) {
      return {
        ...found,
        bankCode: found.bankCode ?? "",
        bankName: found.bankName ?? "",
        phone: found.phone ?? "",
        documentId: found.documentId ?? "",
        email: found.email ?? "",
        beneficiaryName: found.beneficiaryName ?? "",
        instructions: found.instructions ?? "",
      };
    }

    return {
      method,
      isEnabled: method === "PAGO_MOVIL",
      bankCode: "",
      bankName: "",
      phone: "",
      documentId: "",
      email: "",
      beneficiaryName: "",
      instructions: "",
    };
  });
}

export function PaymentMethodsConfigCard({
  scope,
  organization,
  organizationId: propOrganizationId,
  organizationName: propOrganizationName,
  initialMethods,
  userRole,
  canEdit: propCanEdit,
  onUpdated,
  onSaved,
  onToast,
}: PaymentMethodsConfigCardProps) {
  const locale = useLocale();
  const isEn = locale.toLowerCase().startsWith("en");
  const organizationId = propOrganizationId ?? organization?.id;
  const organizationName = propOrganizationName ?? organization?.tradeName;
  const canEdit =
    propCanEdit !== undefined
      ? propCanEdit
      : userRole
        ? scope === "PLATFORM"
          ? userRole === "PLATFORM_ADMIN" || userRole === "PLATFORM_ACCOUNTING"
          : userRole === "PLATFORM_ADMIN" || userRole === "ALLY_ADMIN"
        : true;

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

  const [methods, setMethods] = useState<PaymentMethodConfigItem[]>(() =>
    buildDefaultMethods(scope, initialMethods)
  );
  const [editingMethod, setEditingMethod] = useState<PaymentMethodType | null>(
    null
  );
  const [draftItem, setDraftItem] = useState<PaymentMethodConfigItem | null>(
    null
  );

  // Separated phone state inside modal (for PAGO_MOVIL / PIPOL_PAY)
  const [phoneCountry, setPhoneCountry] = useState("+58");
  const [phoneOperator, setPhoneOperator] = useState("0414");
  const [phoneSubscriber, setPhoneSubscriber] = useState("");

  // Separated RIF/CI state inside modal (for PAGO_MOVIL)
  const [docPrefix, setDocPrefix] = useState("J");
  const [docNumber, setDocNumber] = useState("");

  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    setMethods(buildDefaultMethods(scope, initialMethods));
  }, [scope, organizationId, initialMethods]);

  const openEditModal = (item: PaymentMethodConfigItem) => {
    setModalError(null);
    setDraftItem({
      ...item,
      bankName: item.bankName || organization?.payoutPagoMovilBank || organization?.payoutBank || "0134 - Banesco",
      beneficiaryName: item.beneficiaryName || organization?.payoutPagoMovilHolder || organization?.payoutAccountHolder || organization?.legalName || "",
    });
    const parsedPhone = parseSeparatedPhone(
      item.phone || organization?.payoutPhoneNumber || organization?.contactPhone
    );
    setPhoneCountry(parsedPhone.countryCode);
    setPhoneOperator(parsedPhone.operator);
    setPhoneSubscriber(parsedPhone.subscriber);

    const parsedDoc = parseDocId(
      item.documentId || organization?.payoutPagoMovilIdDocument || organization?.payoutIdDocument || organization?.rif
    );
    setDocPrefix(parsedDoc.prefix);
    setDocNumber(parsedDoc.number);

    setEditingMethod(item.method);
  };

  const closeEditModal = () => {
    if (saving) return;
    setEditingMethod(null);
    setDraftItem(null);
    setModalError(null);
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftItem || !editingMethod) return;
    setModalError(null);

    const nextItem: PaymentMethodConfigItem = { ...draftItem };

    if (editingMethod === "PAGO_MOVIL") {
      const formattedPhone = formatSeparatedPhone(
        phoneCountry,
        phoneOperator,
        phoneSubscriber
      );
      const formattedDoc = docNumber.trim()
        ? `${docPrefix}-${docNumber.trim().replace(/^[JVEGP]-?/i, "")}`
        : "";
      nextItem.phone = formattedPhone;
      nextItem.documentId = formattedDoc;

      if (nextItem.isEnabled) {
        if (!nextItem.bankName?.trim()) {
          setModalError(
            isEn
              ? "You must select the receiving bank for Pago Móvil."
              : "Debes seleccionar el banco receptor para Pago Móvil."
          );
          return;
        }
        if (
          !phoneSubscriber.replace(/\D/g, "") ||
          phoneSubscriber.replace(/\D/g, "").length < 7
        ) {
          setModalError(
            isEn
              ? "Enter a valid phone number (minimum 7 digits)."
              : "Ingresa un número de teléfono válido (mínimo 7 dígitos)."
          );
          return;
        }
        if (!docNumber.trim()) {
          setModalError(
            isEn
              ? "Enter the Tax ID (RIF) or ID associated with Pago Móvil."
              : "Ingresa el RIF o Cédula asociado al Pago Móvil."
          );
          return;
        }
      }
    } else if (editingMethod === "ZELLE") {
      if (nextItem.isEnabled && !nextItem.email?.trim()) {
        setModalError(
          isEn
            ? "Enter the email address for the Zelle account."
            : "Ingresa el correo electrónico de la cuenta Zelle."
        );
        return;
      }
    } else if (editingMethod === "PIPOL_PAY") {
      const formattedPhone = formatSeparatedPhone(
        phoneCountry,
        phoneOperator,
        phoneSubscriber
      );
      nextItem.phone = formattedPhone;
      if (nextItem.isEnabled && !nextItem.email?.trim() && !formattedPhone) {
        setModalError(
          isEn
            ? "Enter the email or phone number associated with Pipol Pay."
            : "Ingresa el correo o teléfono asociado a Pipol Pay."
        );
        return;
      }
    }

    const updatedMethods = methods.map((m) =>
      m.method === editingMethod ? nextItem : m
    );

    const enabledCount = updatedMethods.filter((m) => m.isEnabled).length;
    if (enabledCount === 0) {
      setModalError(
        isEn
          ? "You must keep at least one payment method active to receive bookings."
          : "Debes mantener al menos un método de pago activo para recibir reservas."
      );
      return;
    }

    setSaving(true);
    try {
      const res = await updatePaymentMethodConfigsAction({
        scope,
        organizationId: scope === "ORGANIZATION" ? organizationId : undefined,
        methods: updatedMethods,
      });

      if (!res.ok) {
        setModalError(
          res.error.code ||
            (isEn
              ? "Error saving payment method"
              : "Error al guardar el método de pago")
        );
        return;
      }

      const refreshed = buildDefaultMethods(scope, res.data);
      setMethods(refreshed);
      onUpdated?.(refreshed);
      onSaved?.(refreshed);
      setEditingMethod(null);
      setDraftItem(null);
      const metaLabel = getMethodMeta(editingMethod, isEn).label;
      const msg = isEn
        ? `${metaLabel} configuration updated successfully.`
        : `Configuración de ${metaLabel} actualizada correctamente.`;
      setSuccessMsg(msg);
      onToast?.(msg, false);
      setTimeout(() => setSuccessMsg(null), 4000);
    } finally {
      setSaving(false);
    }
  };

  const isPlatform = scope === "PLATFORM";
  const activeMeta = editingMethod ? getMethodMeta(editingMethod, isEn) : null;

  return (
    <section className="px-5 pt-6">
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-card border-t-4 border-t-accent">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 mb-6 border-b border-border">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-xl">{isPlatform ? "🛡️" : "💳"}</span>
              <h3 className="m-0 text-lg font-extrabold text-foreground">
                {isPlatform
                  ? isEn
                    ? "Payment Methods Accepted by YoReservo (Platform Custody)"
                    : "Métodos de Pago Aceptados por YoReservo (Custodia Plataforma)"
                  : isEn
                    ? `Accepted Payment Methods — ${organizationName || "Ally Direct Collection"}`
                    : `Métodos de Pago Aceptados — ${organizationName || "Cobro Directo del Aliado"}`}
              </h3>
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${
                  isPlatform
                    ? "border-accent/40 bg-accent/15 text-link"
                    : "border-emerald-500/40 bg-emerald-500/15 text-emerald-500"
                }`}
              >
                {isPlatform
                  ? isEn
                    ? "YoReservo Custody"
                    : "Custodia YoReservo"
                  : isEn
                    ? "Direct Collection"
                    : "Cobro Directo"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 mb-0">
              {isPlatform
                ? isEn
                  ? "Define which payment methods players see when booking at venues under YoReservo Custody. Click «Edit» on each method to enable, disable, or modify its coordinates."
                  : "Define qué métodos de pago ven los jugadores cuando reservan en complejos con Custodia YoReservo. Haz clic en «Editar» en cada método para habilitarlo, deshabilitarlo o modificar sus coordenadas."
                : isEn
                  ? "Click «Edit» on any method to enable, disable, or modify its collection coordinates."
                  : "Haz clic en «Editar» sobre cualquier método para habilitarlo, deshabilitarlo o modificar sus coordenadas de cobro."}
            </p>
          </div>
        </div>

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
            <span>✅ {successMsg}</span>
            <button
              type="button"
              onClick={() => setSuccessMsg(null)}
              className="text-emerald-600 dark:text-emerald-400 hover:underline ml-3 cursor-pointer bg-transparent border-none font-bold"
            >
              ✕
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {methods.map((item) => {
            const meta = getMethodMeta(item.method, isEn);
            return (
              <div
                key={item.method}
                className={`rounded-xl border p-4 transition-all flex flex-col justify-between ${
                  item.isEnabled
                    ? "border-accent/40 bg-accent/5"
                    : "border-border bg-muted/30 opacity-85"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <span className="text-2xl leading-none mt-0.5">
                        {meta.icon}
                      </span>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-extrabold text-foreground">
                            {meta.label}
                          </span>
                          <span
                            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                              item.isEnabled
                                ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-500"
                                : "border-border bg-surface text-muted-foreground"
                            }`}
                          >
                            {item.isEnabled
                              ? isEn
                                ? "● Active"
                                : "● Activo"
                              : isEn
                                ? "○ Inactive"
                                : "○ Inactivo"}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1 mb-0 leading-relaxed">
                          {meta.shortDesc}
                        </p>
                      </div>
                    </div>

                    {canEdit && (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => openEditModal(item)}
                      >
                        {isEn ? "✏️ Edit" : "✏️ Editar"}
                      </Button>
                    )}
                  </div>

                  {/* Read-only summary of configured coordinates */}
                  <div className="mt-4 pt-3 border-t border-border/70">
                    {item.method === "PAGO_MOVIL" && (
                      <div className="grid grid-cols-2 gap-2.5 text-xs">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                            {isEn ? "Receiving Bank" : "Banco Receptor"}
                          </span>
                          <span className="font-semibold text-foreground">
                            {item.bankName ||
                              (isEn ? "Not configured" : "Sin configurar")}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                            {isEn ? "Pago Móvil Phone" : "Teléfono Pago Móvil"}
                          </span>
                          <span className="font-mono font-bold text-foreground">
                            {item.phone ||
                              (isEn ? "Not configured" : "Sin configurar")}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                            {isEn ? "Tax ID / Document" : "RIF / Cédula"}
                          </span>
                          <span className="font-mono font-semibold text-foreground">
                            {item.documentId ||
                              (isEn ? "Not configured" : "Sin configurar")}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                            {isEn
                              ? "Holder / Beneficiary"
                              : "Titular / Beneficiario"}
                          </span>
                          <span className="font-semibold text-foreground truncate block">
                            {item.beneficiaryName ||
                              (isEn ? "Not configured" : "Sin configurar")}
                          </span>
                        </div>
                      </div>
                    )}

                    {item.method === "ZELLE" && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                            {isEn ? "Zelle Email" : "Correo Zelle"}
                          </span>
                          <span className="font-mono font-semibold text-foreground">
                            {item.email ||
                              (isEn ? "Not configured" : "Sin configurar")}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                            {isEn ? "Account Holder" : "Titular de la Cuenta"}
                          </span>
                          <span className="font-semibold text-foreground">
                            {item.beneficiaryName ||
                              (isEn ? "Not configured" : "Sin configurar")}
                          </span>
                        </div>
                        {item.instructions && (
                          <div className="sm:col-span-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                              {isEn
                                ? "Instructions / Memo"
                                : "Instrucciones / Memo"}
                            </span>
                            <span className="text-muted-foreground">
                              {item.instructions}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {item.method === "PIPOL_PAY" && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                            {isEn
                              ? "Pipol Pay Email / User"
                              : "Correo / Usuario Pipol Pay"}
                          </span>
                          <span className="font-mono font-semibold text-foreground">
                            {item.email ||
                              (isEn ? "Not configured" : "Sin configurar")}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                            {isEn ? "Associated Phone" : "Teléfono Asociado"}
                          </span>
                          <span className="font-mono font-semibold text-foreground">
                            {item.phone ||
                              (isEn ? "Not configured" : "Sin configurar")}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                            {isEn ? "Beneficiary" : "Beneficiario"}
                          </span>
                          <span className="font-semibold text-foreground">
                            {item.beneficiaryName ||
                              (isEn ? "Not configured" : "Sin configurar")}
                          </span>
                        </div>
                      </div>
                    )}

                    {item.method === "CASH" && (
                      <div className="text-xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                          {isEn
                            ? "Player Instructions at Venue"
                            : "Instrucciones para el Jugador en Sede"}
                        </span>
                        <span className="text-foreground">
                          {item.instructions ||
                            (isEn
                              ? "In-person payment at the box office before the booking starts."
                              : "Pago presencial en taquilla antes del inicio de la reserva.")}
                        </span>
                      </div>
                    )}

                    {item.method === "CARD" && (
                      <div className="text-xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                          {isEn ? "Payment Gateway" : "Pasarela Procesadora"}
                        </span>
                        <span className="font-semibold text-foreground">
                          {isEn
                            ? "YoReservo International Gateway (Visa / Mastercard)"
                            : "Pasarela Internacional YoReservo (Visa / Mastercard)"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal de Edición Individual por Método de Pago */}
      {editingMethod !== null && draftItem !== null && activeMeta && (
        <div
          className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
          onClick={closeEditModal}
        >
          <div
            className="modal-card flex max-h-[90vh] w-full max-w-[640px] flex-col overflow-hidden rounded-2xl border border-border-medium bg-surface shadow-card animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">{activeMeta.icon}</span>
                <div>
                  <h3 className="m-0 text-base font-extrabold text-foreground">
                    {isEn
                      ? `Configure ${activeMeta.label}`
                      : `Configurar ${activeMeta.label}`}
                  </h3>
                  <p className="m-0 text-xs text-muted-foreground">
                    {isPlatform
                      ? isEn
                        ? "YoReservo Custody"
                        : "Custodia YoReservo"
                      : organizationName ||
                        (isEn
                          ? "Ally Direct Collection"
                          : "Cobro Directo del Aliado")}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeEditModal}
                className="cursor-pointer border-none bg-transparent text-lg text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form
              onSubmit={handleSaveModal}
              className="flex-1 overflow-y-auto px-6 py-5 space-y-4"
            >
              {modalError && (
                <div className="rounded-xl border border-status-cancelled-border bg-status-cancelled-bg p-3 text-xs font-bold text-status-cancelled-fg">
                  ⚠️ {modalError}
                </div>
              )}

              {/* Switch de Habilitación */}
              <div
                className={`flex items-center justify-between gap-4 p-4 rounded-xl border transition-colors ${
                  draftItem.isEnabled
                    ? "border-emerald-500/40 bg-emerald-500/10"
                    : "border-border bg-muted/30"
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-foreground">
                      {isEn
                        ? "Payment Method Status"
                        : "Estado del Método de Pago"}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                        draftItem.isEnabled
                          ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-500"
                          : "border-border bg-surface text-muted-foreground"
                      }`}
                    >
                      {draftItem.isEnabled
                        ? isEn
                          ? "● Enabled"
                          : "● Habilitado"
                        : isEn
                          ? "○ Disabled"
                          : "○ Deshabilitado"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 mb-0">
                    {draftItem.isEnabled
                      ? isEn
                        ? "Players will be able to choose this payment method when booking."
                        : "Los jugadores podrán elegir este método de pago al realizar su reserva."
                      : isEn
                        ? "This method will not appear in the booking checkout."
                        : "Este método no aparecerá disponible en el checkout de reservas."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setDraftItem((prev) =>
                      prev ? { ...prev, isEnabled: !prev.isEnabled } : prev
                    )
                  }
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    draftItem.isEnabled ? "bg-emerald-500" : "bg-muted"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      draftItem.isEnabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Campos específicos según el método */}
              {draftItem.method === "PAGO_MOVIL" && (
                <div className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-foreground">
                      {isEn ? "Receiving Bank *" : "Banco Receptor *"}
                    </label>
                    <SearchableSelect
                      value={draftItem.bankName ?? ""}
                      onChange={(bankLabel: string) => {
                        const code = bankLabel.split(" - ")[0]?.trim() ?? "";
                        setDraftItem((prev) =>
                          prev
                            ? {
                                ...prev,
                                bankName: bankLabel,
                                bankCode: code,
                              }
                            : prev
                        );
                      }}
                      options={VENEZUELAN_BANKS}
                      placeholder={
                        isEn
                          ? "Search receiving bank..."
                          : "Buscar banco receptor..."
                      }
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-foreground">
                      {isEn
                        ? "Pago Móvil Phone (Code + Carrier + Number) *"
                        : "Teléfono Pago Móvil (Código + Operadora + Número) *"}
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                      <div className="sm:col-span-4">
                        <SearchableSelect
                          value={phoneCountry}
                          onChange={(val: string) => setPhoneCountry(val)}
                          options={COUNTRY_CODE_OPTIONS}
                        />
                      </div>
                      {phoneCountry === "+58" && (
                        <div className="sm:col-span-4">
                          <SearchableSelect
                            value={phoneOperator}
                            onChange={(val: string) => setPhoneOperator(val)}
                            options={operatorOptions}
                          />
                        </div>
                      )}
                      <div
                        className={
                          phoneCountry === "+58"
                            ? "sm:col-span-4"
                            : "sm:col-span-8"
                        }
                      >
                        <input
                          type="tel"
                          className="input-field form-input font-mono"
                          value={phoneSubscriber}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setPhoneSubscriber(
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
                        {isEn ? "Doc. Type *" : "Tipo Doc. *"}
                      </label>
                      <SearchableSelect
                        value={docPrefix}
                        onChange={(val: string) => setDocPrefix(val)}
                        options={docPrefixOptions}
                      />
                    </div>
                    <div className="sm:col-span-8">
                      <label className="mb-1.5 block text-xs font-bold text-foreground">
                        {isEn
                          ? "Tax ID / Document Number *"
                          : "Número de RIF / Cédula *"}
                      </label>
                      <input
                        type="text"
                        className="input-field form-input font-mono"
                        value={docNumber}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setDocNumber(
                            e.target.value.replace(/[^0-9-]/g, "").slice(0, 14)
                          )
                        }
                        placeholder="40128990-1"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-foreground">
                      {isEn
                        ? "Holder / Beneficiary"
                        : "Titular / Beneficiario"}
                    </label>
                    <input
                      type="text"
                      className="input-field form-input"
                      value={draftItem.beneficiaryName ?? ""}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setDraftItem((prev) =>
                          prev
                            ? { ...prev, beneficiaryName: e.target.value }
                            : prev
                        )
                      }
                      placeholder={
                        isEn
                          ? "Beneficiary Legal Name or Full Name"
                          : "Razón Social o Nombre del Beneficiario"
                      }
                    />
                  </div>
                </div>
              )}

              {draftItem.method === "ZELLE" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1.5 block text-xs font-bold text-foreground">
                        {isEn
                          ? "Zelle Email *"
                          : "Correo Electrónico Zelle *"}
                      </label>
                      <input
                        type="email"
                        className="input-field form-input"
                        value={draftItem.email ?? ""}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setDraftItem((prev) =>
                            prev ? { ...prev, email: e.target.value } : prev
                          )
                        }
                        placeholder={
                          isEn ? "payments@complex.com" : "pagos@complejo.com"
                        }
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-bold text-foreground">
                        {isEn
                          ? "Account Holder Name *"
                          : "Nombre del Titular (Account Holder) *"}
                      </label>
                      <input
                        type="text"
                        className="input-field form-input"
                        value={draftItem.beneficiaryName ?? ""}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setDraftItem((prev) =>
                            prev
                              ? { ...prev, beneficiaryName: e.target.value }
                              : prev
                          )
                        }
                        placeholder="Inversiones Deportivas LLC"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-foreground">
                      {isEn
                        ? "Instructions / Required Memo (Optional)"
                        : "Instrucciones / Memo Requerido (Opcional)"}
                    </label>
                    <input
                      type="text"
                      className="input-field form-input"
                      value={draftItem.instructions ?? ""}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setDraftItem((prev) =>
                          prev
                            ? { ...prev, instructions: e.target.value }
                            : prev
                        )
                      }
                      placeholder={
                        isEn
                          ? "E.g.: Include booking code in the memo without extra words."
                          : "Ej: Colocar código de reserva en el memo sin palabras adicionales."
                      }
                    />
                  </div>
                </div>
              )}

              {draftItem.method === "PIPOL_PAY" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1.5 block text-xs font-bold text-foreground">
                        {isEn
                          ? "Pipol Pay Email / User *"
                          : "Correo / Usuario Pipol Pay *"}
                      </label>
                      <input
                        type="text"
                        className="input-field form-input"
                        value={draftItem.email ?? ""}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setDraftItem((prev) =>
                            prev ? { ...prev, email: e.target.value } : prev
                          )
                        }
                        placeholder={
                          isEn ? "payments@complex.com" : "pagos@complejo.com"
                        }
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-bold text-foreground">
                        {isEn
                          ? "Holder / Beneficiary"
                          : "Titular / Beneficiario"}
                      </label>
                      <input
                        type="text"
                        className="input-field form-input"
                        value={draftItem.beneficiaryName ?? ""}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setDraftItem((prev) =>
                            prev
                              ? { ...prev, beneficiaryName: e.target.value }
                              : prev
                          )
                        }
                        placeholder={
                          isEn ? "Beneficiary name" : "Nombre del beneficiario"
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-foreground">
                      {isEn ? "Associated Phone" : "Teléfono Asociado"}
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                      <div className="sm:col-span-4">
                        <SearchableSelect
                          value={phoneCountry}
                          onChange={(val: string) => setPhoneCountry(val)}
                          options={COUNTRY_CODE_OPTIONS}
                        />
                      </div>
                      {phoneCountry === "+58" && (
                        <div className="sm:col-span-4">
                          <SearchableSelect
                            value={phoneOperator}
                            onChange={(val: string) => setPhoneOperator(val)}
                            options={operatorOptions}
                          />
                        </div>
                      )}
                      <div
                        className={
                          phoneCountry === "+58"
                            ? "sm:col-span-4"
                            : "sm:col-span-8"
                        }
                      >
                        <input
                          type="tel"
                          className="input-field form-input font-mono"
                          value={phoneSubscriber}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setPhoneSubscriber(
                              e.target.value.replace(/\D/g, "").slice(0, 10)
                            )
                          }
                          placeholder="1234567"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-foreground">
                      {isEn
                        ? "Instructions (Optional)"
                        : "Instrucciones (Opcional)"}
                    </label>
                    <input
                      type="text"
                      className="input-field form-input"
                      value={draftItem.instructions ?? ""}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setDraftItem((prev) =>
                          prev
                            ? { ...prev, instructions: e.target.value }
                            : prev
                        )
                      }
                      placeholder={
                        isEn
                          ? "Instructions for Pipol Pay payment"
                          : "Instrucciones para el pago por Pipol Pay"
                      }
                    />
                  </div>
                </div>
              )}

              {draftItem.method === "CASH" && (
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-foreground">
                    {isEn
                      ? "Player Instructions at Box Office"
                      : "Instrucciones para el Jugador en Taquilla"}
                  </label>
                  <input
                    type="text"
                    className="input-field form-input"
                    value={draftItem.instructions ?? ""}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setDraftItem((prev) =>
                        prev ? { ...prev, instructions: e.target.value } : prev
                      )
                    }
                    placeholder={
                      isEn
                        ? "E.g.: Pay in cash at the venue reception 15 minutes before the slot."
                        : "Ej: Cancelar en efectivo en la recepción de la sede 15 minutos antes del turno."
                    }
                  />
                </div>
              )}

              {draftItem.method === "CARD" && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-muted/40 border border-border text-xs text-muted-foreground leading-relaxed">
                    {isEn
                      ? "✅ The international card gateway processes online payments automatically under YoReservo custody and confirms bookings immediately."
                      : "✅ La pasarela de tarjetas internacionales procesa pagos en línea automáticamente en custodia de YoReservo y confirma la reserva al instante."}
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-foreground">
                      {isEn
                        ? "Checkout Info Note (Optional)"
                        : "Nota informativa en Checkout (Opcional)"}
                    </label>
                    <input
                      type="text"
                      className="input-field form-input"
                      value={draftItem.instructions ?? ""}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setDraftItem((prev) =>
                          prev
                            ? { ...prev, instructions: e.target.value }
                            : prev
                        )
                      }
                      placeholder={
                        isEn
                          ? "E.g.: We accept international Visa and Mastercard cards."
                          : "Ej: Aceptamos tarjetas internacionales Visa y Mastercard."
                      }
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={closeEditModal}
                  disabled={saving}
                >
                  {isEn ? "Cancel" : "Cancelar"}
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={saving}
                  disabled={saving}
                >
                  {isEn ? "Save Changes ✓" : "Guardar Cambios ✓"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
