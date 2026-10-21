"use client";

import * as React from "react";
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
];

function parseWhatsappPhone(raw?: string | null): {
  prefix: string;
  subscriber: string;
} {
  const digits = (raw ?? "").replace(/\D/g, "");
  let national = digits;
  if (national.startsWith("58") && national.length >= 12) {
    national = "0" + national.slice(2);
  } else if (
    national.length === 10 &&
    /^(412|422|414|424|416|426)/.test(national)
  ) {
    national = "0" + national;
  }
  const matched = VE_PHONE_PREFIXES.find((p) => national.startsWith(p.value));
  if (matched) {
    return {
      prefix: matched.value,
      subscriber: national.slice(matched.value.length, matched.value.length + 7),
    };
  }
  return {
    prefix: "0412",
    subscriber: national.slice(-7),
  };
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
  const initialParsed = React.useMemo(
    () => parseWhatsappPhone(initialConfig?.supportWhatsapp ?? "+58 412 5503235"),
    [initialConfig?.supportWhatsapp]
  );

  const [phonePrefix, setPhonePrefix] = React.useState(initialParsed.prefix);
  const [phoneSubscriber, setPhoneSubscriber] = React.useState(
    initialParsed.subscriber
  );
  const [supportEmail, setSupportEmail] = React.useState(
    initialConfig?.supportEmail ?? "soporte@yoreservo.com"
  );
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    const parsed = parseWhatsappPhone(
      initialConfig?.supportWhatsapp ?? "+58 412 5503235"
    );
    setPhonePrefix(parsed.prefix);
    setPhoneSubscriber(parsed.subscriber);
    setSupportEmail(initialConfig?.supportEmail ?? "soporte@yoreservo.com");
  }, [initialConfig?.supportWhatsapp, initialConfig?.supportEmail]);

  const formattedWhatsapp = `+58 ${phonePrefix.slice(1)} ${phoneSubscriber.trim()}`;
  const waDigits = `58${phonePrefix.slice(1)}${phoneSubscriber.replace(/\D/g, "")}`;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanSubscriber = phoneSubscriber.replace(/\D/g, "");
    if (cleanSubscriber.length < 7) {
      onToast?.(
        "⚠️ El número de WhatsApp debe tener los 7 dígitos posteriores a la operadora.",
        "warning"
      );
      return;
    }
    const cleanEmail = supportEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      onToast?.("⚠️ Ingresa un correo electrónico de soporte válido.", "warning");
      return;
    }

    setIsSaving(true);
    try {
      const payload: PlatformConfigData = {
        supportWhatsapp: `+58 ${phonePrefix.slice(1)} ${cleanSubscriber}`,
        supportEmail: cleanEmail,
      };
      const res = await updatePlatformConfigAction(payload);
      if (!res.ok) {
        onToast?.(
          `⚠️ Error al guardar soporte: ${res.error.code || "Error"}`,
          "warning"
        );
        return;
      }
      onSaved?.(res.data);
      onToast?.(
        "✅ Canales de Soporte de YoReservo actualizados en tiempo real.",
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
              💬 Configuración Global YoReservo (Atletas)
            </span>
            <h3 className="mt-1.5 text-base font-bold text-foreground">
              Canales Oficiales de Atención y Soporte Directo
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Estos datos se muestran en tiempo real a todos los atletas en{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                /account/support
              </code>{" "}
              para contacto vía WhatsApp y Correo Electrónico.
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                WhatsApp de Soporte Oficial
              </label>
              <div className="grid grid-cols-[68px_98px_1fr] gap-2">
                <div className="flex h-10 items-center justify-center rounded-lg border border-border bg-muted/60 px-2.5 text-xs font-bold text-muted-foreground select-none">
                  🇻🇪 +58
                </div>
                <select
                  value={phonePrefix}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setPhonePrefix(e.target.value)
                  }
                  aria-label="Operadora WhatsApp"
                  className="h-10 rounded-lg border border-border bg-surface px-2.5 text-xs font-semibold text-foreground focus:border-accent focus:outline-none"
                >
                  {VE_PHONE_PREFIXES.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={phoneSubscriber}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setPhoneSubscriber(
                      e.target.value.replace(/\D/g, "").slice(0, 7)
                    )
                  }
                  placeholder="5503235"
                  inputMode="numeric"
                  maxLength={7}
                  className="h-10 rounded-lg border border-border bg-surface px-3 font-mono text-xs text-foreground focus:border-accent focus:outline-none"
                />
              </div>
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                Enlace activo:{" "}
                <span className="font-mono font-semibold text-foreground">
                  https://wa.me/{waDigits}
                </span>{" "}
                ({formattedWhatsapp})
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Correo Electrónico de Soporte Oficial
              </label>
              <input
                type="email"
                value={supportEmail}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setSupportEmail(e.target.value)
                }
                placeholder="soporte@yoreservo.com"
                className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-xs text-foreground focus:border-accent focus:outline-none"
              />
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                Enlace activo:{" "}
                <span className="font-mono font-semibold text-foreground">
                  mailto:{supportEmail.trim() || "soporte@yoreservo.com"}
                </span>
              </p>
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
              💾 Guardar Canales de Soporte
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}

