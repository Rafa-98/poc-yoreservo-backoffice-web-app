"use client";

import * as React from "react";
import { useLocale } from "next-intl";
import { Plus, Trash2, Phone, Mail } from "lucide-react";
import { Button } from "@/shared/ui";
import type { PlatformConfigData } from "../model/types";
import { updatePlatformConfigAction } from "../actions/venues-actions";

const VE_PHONE_PREFIXES = [
  { value: "0412", label: "0412" },
  { value: "0422", label: "0422" },
  { value: "0414", label: "0414" },
  { value: "0424", label: "0424" },
  { value: "0416", label: "0416" },
  { value: "0426", label: "0426" },
  { value: "0212", label: "0212" },
];

interface PhoneEntry {
  prefix: string;
  subscriber: string;
}

function parseWhatsappPhone(raw?: string | null): PhoneEntry {
  const digits = (raw ?? "").replace(/\D/g, "");
  let national = digits;
  if (national.startsWith("58") && national.length >= 12) {
    national = "0" + national.slice(2);
  } else if (
    national.length === 10 &&
    /^(412|422|414|424|416|426|212)/.test(national)
  ) {
    national = "0" + national;
  }
  const matched = VE_PHONE_PREFIXES.find((p) => national.startsWith(p.value));
  if (matched) {
    return {
      prefix: matched.value,
      subscriber: national.slice(
        matched.value.length,
        matched.value.length + 7
      ),
    };
  }
  return {
    prefix: "0412",
    subscriber: national.slice(-7),
  };
}

function buildInitialPhones(config?: PlatformConfigData): PhoneEntry[] {
  const rawList =
    config?.supportPhones && config.supportPhones.length > 0
      ? config.supportPhones
      : [config?.supportWhatsapp || "+58 412 5503235"];
  return rawList.map((raw) => parseWhatsappPhone(raw));
}

function buildInitialEmails(config?: PlatformConfigData): string[] {
  const rawList =
    config?.supportEmails && config.supportEmails.length > 0
      ? config.supportEmails
      : [config?.supportEmail || "soporte@yoreservo.com"];
  return rawList;
}

export interface PlatformSupportConfigCardProps {
  initialConfig?: PlatformConfigData;
  onSaved?: (config: PlatformConfigData) => void;
  onToast?: (message: string, variant?: "success" | "warning") => void;
}

export function PlatformSupportConfigCard({
  initialConfig,
  onSaved,
  onToast,
}: PlatformSupportConfigCardProps) {
  const locale = useLocale();
  const isEn = locale.toLowerCase().startsWith("en");
  const [phoneEntries, setPhoneEntries] = React.useState<PhoneEntry[]>(() =>
    buildInitialPhones(initialConfig)
  );
  const [emailEntries, setEmailEntries] = React.useState<string[]>(() =>
    buildInitialEmails(initialConfig)
  );
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    setPhoneEntries(buildInitialPhones(initialConfig));
    setEmailEntries(buildInitialEmails(initialConfig));
  }, [
    initialConfig?.supportWhatsapp,
    initialConfig?.supportEmail,
    initialConfig?.supportPhones,
    initialConfig?.supportEmails,
  ]);

  function handleAddPhone() {
    setPhoneEntries((prev) => [...prev, { prefix: "0412", subscriber: "" }]);
  }

  function handleRemovePhone(idx: number) {
    setPhoneEntries((prev) =>
      prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx)
    );
  }

  function handlePhonePrefixChange(idx: number, prefix: string) {
    setPhoneEntries((prev) =>
      prev.map((entry, i) => (i === idx ? { ...entry, prefix } : entry))
    );
  }

  function handlePhoneSubscriberChange(idx: number, raw: string) {
    const subscriber = raw.replace(/\D/g, "").slice(0, 7);
    setPhoneEntries((prev) =>
      prev.map((entry, i) => (i === idx ? { ...entry, subscriber } : entry))
    );
  }

  function handleAddEmail() {
    setEmailEntries((prev) => [...prev, ""]);
  }

  function handleRemoveEmail(idx: number) {
    setEmailEntries((prev) =>
      prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx)
    );
  }

  function handleEmailChange(idx: number, val: string) {
    setEmailEntries((prev) => prev.map((e, i) => (i === idx ? val : e)));
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const formattedPhones: string[] = [];
    for (let i = 0; i < phoneEntries.length; i++) {
      const entry = phoneEntries[i];
      const cleanSub = entry.subscriber.replace(/\D/g, "");
      if (!cleanSub && i > 0) continue;
      if (cleanSub.length < 7) {
        onToast?.(
          isEn
            ? `⚠️ Phone #${i + 1} must have all 7 digits after the carrier code.`
            : `⚠️ El número #${i + 1} debe tener los 7 dígitos posteriores a la operadora.`,
          "warning"
        );
        return;
      }
      formattedPhones.push(`+58 ${entry.prefix.slice(1)} ${cleanSub}`);
    }

    if (formattedPhones.length === 0) {
      onToast?.(
        isEn
          ? "⚠️ You must configure at least one support WhatsApp number."
          : "⚠️ Debes configurar al menos un número de WhatsApp de soporte.",
        "warning"
      );
      return;
    }

    const validEmails: string[] = [];
    for (let i = 0; i < emailEntries.length; i++) {
      const clean = emailEntries[i].trim().toLowerCase();
      if (!clean && i > 0) continue;
      if (!clean || !clean.includes("@")) {
        onToast?.(
          isEn
            ? `⚠️ Email #${i + 1} is not valid.`
            : `⚠️ El correo electrónico #${i + 1} no es válido.`,
          "warning"
        );
        return;
      }
      validEmails.push(clean);
    }

    if (validEmails.length === 0) {
      onToast?.(
        isEn
          ? "⚠️ You must configure at least one support email address."
          : "⚠️ Debes configurar al menos un correo electrónico de soporte.",
        "warning"
      );
      return;
    }

    setIsSaving(true);
    try {
      const payload: PlatformConfigData = {
        supportWhatsapp: formattedPhones[0],
        supportEmail: validEmails[0],
        supportPhones: formattedPhones,
        supportEmails: validEmails,
      };
      const res = await updatePlatformConfigAction(payload);
      if (!res.ok) {
        onToast?.(
          isEn
            ? `⚠️ Error saving support: ${res.error.code || "Error"}`
            : `⚠️ Error al guardar soporte: ${res.error.code || "Error"}`,
          "warning"
        );
        return;
      }
      onSaved?.(res.data);
      onToast?.(
        isEn
          ? "✅ Official Support & Customer Service Channels updated in real time."
          : "✅ Canales Oficiales de Atención y Soporte actualizados en tiempo real.",
        "success"
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="px-5 pt-6">
      <div className="rounded-2xl border border-border bg-surface p-5 shadow-card">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-border pb-3.5">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-500">
              {isEn
                ? "💬 YoReservo Global Settings (Athletes)"
                : "💬 Configuración Global YoReservo (Atletas)"}
            </span>
            <h3 className="mt-1.5 text-base font-bold text-foreground">
              {isEn
                ? "Official Customer Service & Direct Support Channels"
                : "Canales Oficiales de Atención y Soporte Directo"}
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {isEn ? (
                <>
                  These phone numbers and emails are displayed in real time to
                  all athletes at{" "}
                  <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                    /account/support
                  </code>{" "}
                  for contact via WhatsApp and Email.
                </>
              ) : (
                <>
                  Estos teléfonos y correos se muestran en tiempo real a todos
                  los atletas en{" "}
                  <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                    /account/support
                  </code>{" "}
                  para contacto vía WhatsApp y Correo Electrónico.
                </>
              )}
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Multiple WhatsApp / Contact Phones */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  <Phone className="size-3.5 text-emerald-500" />
                  <span>
                    {isEn
                      ? `Official Support Phones / WhatsApp (${phoneEntries.length})`
                      : `Teléfonos / WhatsApp de Soporte Oficial (${phoneEntries.length})`}
                  </span>
                </label>
                <button
                  type="button"
                  onClick={handleAddPhone}
                  className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-border-medium bg-surface px-2.5 py-1 text-[11px] font-bold text-foreground transition-colors hover:border-accent hover:bg-accent/15"
                >
                  <Plus className="size-3" />
                  <span>{isEn ? "Add phone" : "Agregar teléfono"}</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {phoneEntries.map((entry, idx) => {
                  const formatted = `+58 ${entry.prefix.slice(1)} ${entry.subscriber.trim() || "-------"}`;
                  const waDigits = `58${entry.prefix.slice(1)}${entry.subscriber.replace(/\D/g, "")}`;
                  return (
                    <div
                      key={`support-phone-${idx}`}
                      className="rounded-xl border border-border/80 bg-muted/25 p-2.5"
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex h-10 w-[68px] shrink-0 items-center justify-center rounded-lg border border-border bg-muted/60 px-2 text-xs font-bold text-muted-foreground select-none">
                          🇻🇪 +58
                        </div>
                        <select
                          value={entry.prefix}
                          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                            handlePhonePrefixChange(idx, e.target.value)
                          }
                          aria-label={
                            isEn
                              ? `WhatsApp Carrier ${idx + 1}`
                              : `Operadora WhatsApp ${idx + 1}`
                          }
                          className="h-10 w-[92px] shrink-0 rounded-lg border border-border bg-surface px-2.5 text-xs font-semibold text-foreground focus:border-accent focus:outline-none"
                        >
                          {VE_PHONE_PREFIXES.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={entry.subscriber}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            handlePhoneSubscriberChange(idx, e.target.value)
                          }
                          placeholder="5503235"
                          inputMode="numeric"
                          maxLength={7}
                          className="h-10 min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 font-mono text-xs font-semibold text-foreground focus:border-accent focus:outline-none"
                        />
                        {phoneEntries.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemovePhone(idx)}
                            className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-border bg-surface text-muted-foreground transition-colors hover:border-status-cancelled-border hover:bg-status-cancelled-bg hover:text-status-cancelled-fg"
                            title={
                              isEn ? "Remove phone" : "Eliminar teléfono"
                            }
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        )}
                      </div>
                      <p className="mt-1.5 text-[11px] text-muted-foreground">
                        {idx === 0
                          ? isEn
                            ? "Primary • "
                            : "Principal • "
                          : isEn
                            ? `Additional #${idx + 1} • `
                            : `Adicional #${idx + 1} • `}
                        {isEn ? "Active link:" : "Enlace activo:"}{" "}
                        <span className="font-mono font-semibold text-foreground">
                          https://wa.me/{waDigits}
                        </span>{" "}
                        ({formatted})
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Multiple Support Emails */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  <Mail className="size-3.5 text-link" />
                  <span>
                    {isEn
                      ? `Official Support Emails (${emailEntries.length})`
                      : `Correos Electrónicos de Soporte Oficial (${emailEntries.length})`}
                  </span>
                </label>
                <button
                  type="button"
                  onClick={handleAddEmail}
                  className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-border-medium bg-surface px-2.5 py-1 text-[11px] font-bold text-foreground transition-colors hover:border-accent hover:bg-accent/15"
                >
                  <Plus className="size-3" />
                  <span>{isEn ? "Add email" : "Agregar correo"}</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {emailEntries.map((emailVal, idx) => (
                  <div
                    key={`support-email-${idx}`}
                    className="rounded-xl border border-border/80 bg-muted/25 p-2.5"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="email"
                        value={emailVal}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          handleEmailChange(idx, e.target.value)
                        }
                        placeholder={
                          idx === 0
                            ? "soporte@yoreservo.com"
                            : "atencion@yoreservo.com"
                        }
                        className="h-10 min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 text-xs font-semibold text-foreground focus:border-accent focus:outline-none"
                      />
                      {emailEntries.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveEmail(idx)}
                          className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-border bg-surface text-muted-foreground transition-colors hover:border-status-cancelled-border hover:bg-status-cancelled-bg hover:text-status-cancelled-fg"
                          title={isEn ? "Remove email" : "Eliminar correo"}
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      )}
                    </div>
                    <p className="mt-1.5 text-[11px] text-muted-foreground">
                      {idx === 0
                        ? isEn
                          ? "Primary • "
                          : "Principal • "
                        : isEn
                          ? `Additional #${idx + 1} • `
                          : `Adicional #${idx + 1} • `}
                      {isEn ? "Active link:" : "Enlace activo:"}{" "}
                      <span className="font-mono font-semibold text-foreground">
                        mailto:{emailVal.trim() || "soporte@yoreservo.com"}
                      </span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end border-t border-border pt-3">
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSaving}
              disabled={isSaving}
            >
              {isEn
                ? "💾 Save Support Channels"
                : "💾 Guardar Canales de Soporte"}
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}

