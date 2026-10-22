"use client";

import React, { useEffect, useState } from "react";
import type {
  OrganizationData,
  PaymentCollectionMode,
  PaymentMethodConfigItem,
  PaymentMethodType,
} from "../model/types";
import { updatePaymentMethodConfigsAction } from "../actions/venues-actions";

interface PaymentMethodsConfigCardProps {
  scope: "PLATFORM" | "ORGANIZATION";
  organization?: OrganizationData;
  initialMethods?: PaymentMethodConfigItem[];
  userRole?: string;
  onSaved?: (methods: PaymentMethodConfigItem[]) => void;
  onToast?: (message: string, isError?: boolean) => void;
}

const VENEZUELAN_BANKS = [
  "0102 - Banco de Venezuela",
  "0134 - Banesco",
  "0105 - Banco Mercantil",
  "0108 - BBVA Provincial",
  "0172 - Bancamiga",
  "0191 - BNC Banco Nacional de Crédito",
  "0114 - Bancaribe",
  "0174 - Banplus",
  "0115 - Banco Exterior",
  "0163 - Banco del Tesoro",
];

function buildDefaultMethods(
  scope: "PLATFORM" | "ORGANIZATION",
  org?: OrganizationData,
  existing?: PaymentMethodConfigItem[]
): PaymentMethodConfigItem[] {
  const byMethod = new Map<PaymentMethodType, PaymentMethodConfigItem>();
  for (const item of existing ?? []) {
    byMethod.set(item.method, item);
  }

  if (scope === "PLATFORM") {
    const order: PaymentMethodType[] = [
      "PAGO_MOVIL",
      "ZELLE",
      "PIPOL_PAY",
      "CARD",
    ];
    return order.map((m) => {
      const found = byMethod.get(m);
      if (found) return { ...found };
      if (m === "PAGO_MOVIL") {
        return {
          method: "PAGO_MOVIL",
          isEnabled: true,
          bankCode: "0134",
          bankName: "0134 - Banesco",
          phone: "0412 123 4567",
          documentId: "J-50123456-7",
          beneficiaryName: "YoReservo C.A.",
        };
      }
      if (m === "ZELLE") {
        return {
          method: "ZELLE",
          isEnabled: false,
          email: "pagos@yoreservo.com",
          beneficiaryName: "YoReservo Platform LLC",
          instructions: "Indica el código de tu reserva en el memo de Zelle.",
        };
      }
      if (m === "PIPOL_PAY") {
        return {
          method: "PIPOL_PAY",
          isEnabled: false,
          email: "pagos@yoreservo.com",
          phone: "0412 123 4567",
          beneficiaryName: "YoReservo C.A.",
          instructions:
            "Transfiere el monto en USD por Pipol Pay e ingresa el número de referencia.",
        };
      }
      return {
        method: "CARD",
        isEnabled: false,
        beneficiaryName: "YoReservo Gateway Internacional",
      };
    });
  }

  const order: PaymentMethodType[] = [
    "PAGO_MOVIL",
    "CASH",
    "ZELLE",
    "PIPOL_PAY",
  ];
  const defaultBank = org?.payoutBank || "0102 - Banco de Venezuela";
  const defaultPhone =
    org?.pagoMovilPhone || org?.contactPhone || "0412 123 4567";
  const defaultDoc = org?.payoutIdDocument || org?.rif || "J-40123456-7";
  const defaultHolder =
    org?.payoutAccountHolder ||
    org?.legalName ||
    org?.tradeName ||
    "Organización Aliada";

  return order.map((m) => {
    const found = byMethod.get(m);
    if (found) return { ...found };
    if (m === "PAGO_MOVIL") {
      return {
        method: "PAGO_MOVIL",
        isEnabled: true,
        bankCode: defaultBank.split(" - ")[0] || "0102",
        bankName: defaultBank,
        phone: defaultPhone,
        documentId: defaultDoc,
        beneficiaryName: defaultHolder,
      };
    }
    if (m === "CASH") {
      return {
        method: "CASH",
        isEnabled: true,
        beneficiaryName: org?.tradeName || defaultHolder,
        instructions:
          "Presenta tu pase QR confirmado en la taquilla principal al llegar a la sede para abonar en efectivo.",
      };
    }
    if (m === "ZELLE") {
      return {
        method: "ZELLE",
        isEnabled: false,
        email: org?.contactEmail || "pagos@aliado.com",
        beneficiaryName: defaultHolder,
        instructions: "Indica el código de reserva en el concepto de Zelle.",
      };
    }
    return {
      method: "PIPOL_PAY",
      isEnabled: false,
      email: org?.contactEmail || "pagos@aliado.com",
      phone: defaultPhone,
      beneficiaryName: defaultHolder,
    };
  });
}

const METHOD_META: Record<
  PaymentMethodType,
  {
    icon: string;
    title: string;
    subtitle: string;
    currencyTag: string;
  }
> = {
  PAGO_MOVIL: {
    icon: "📲",
    title: "Pago Móvil Interbancario",
    subtitle: "Cobro en Bolívares (VES) a tasa oficial BCV del día",
    currencyTag: "VES · Tasa BCV",
  },
  CASH: {
    icon: "💵",
    title: "Efectivo en Sede (Taquilla)",
    subtitle:
      "Confirma la reserva con QR al instante y deja el cobro pendiente en cola para validar en taquilla",
    currencyTag: "USD / EUR / Bs en Taquilla",
  },
  ZELLE: {
    icon: "💜",
    title: "Zelle",
    subtitle: "Transferencia directa en dólares estadounidenses (USD)",
    currencyTag: "USD",
  },
  PIPOL_PAY: {
    icon: "⚡",
    title: "Pipol Pay",
    subtitle: "Billetera y pagos electrónicos en divisas (USD)",
    currencyTag: "USD",
  },
  CARD: {
    icon: "💳",
    title: "Tarjeta Internacional (Crédito / Débito)",
    subtitle:
      "Pasarela bancaria automatizada. Si se deshabilita, se oculta automáticamente en el checkout y en Mi Cuenta",
    currencyTag: "Pasarela Automática",
  },
};

export function PaymentMethodsConfigCard({
  scope,
  organization,
  initialMethods,
  userRole,
  onSaved,
  onToast,
}: PaymentMethodsConfigCardProps) {
  const [methods, setMethods] = useState<PaymentMethodConfigItem[]>(() =>
    buildDefaultMethods(scope, organization, initialMethods)
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setMethods(buildDefaultMethods(scope, organization, initialMethods));
  }, [scope, organization?.id, initialMethods]);

  const isPlatformScope = scope === "PLATFORM";
  const canEdit = isPlatformScope
    ? userRole === "PLATFORM_ADMIN"
    : userRole === "PLATFORM_ADMIN" || userRole === "ALLY_ADMIN";

  const orgCollectionMode: PaymentCollectionMode =
    organization?.paymentCollectionMode === "ALLY_DIRECT"
      ? "ALLY_DIRECT"
      : "PLATFORM_CUSTODY";

  function updateItem(
    method: PaymentMethodType,
    patch: Partial<PaymentMethodConfigItem>
  ) {
    setMethods((prev) =>
      prev.map((m) => (m.method === method ? { ...m, ...patch } : m))
    );
  }

  async function handleSave() {
    const enabledCount = methods.filter((m) => m.isEnabled).length;
    if (enabledCount === 0) {
      onToast?.("Debes mantener al menos un método de pago habilitado.", true);
      return;
    }

    setSaving(true);
    const res = await updatePaymentMethodConfigsAction({
      scope,
      organizationId: isPlatformScope ? undefined : organization?.id,
      methods,
    });
    setSaving(false);

    if (res.ok) {
      setMethods(buildDefaultMethods(scope, organization, res.data));
      onSaved?.(res.data);
      onToast?.(
        isPlatformScope
          ? "✓ Métodos de pago de YoReservo (Custodia Plataforma) actualizados"
          : `✓ Métodos de pago de ${organization?.tradeName || "la organización"} actualizados`,
        false
      );
    } else {
      onToast?.(res.error.code || "Error al guardar métodos de pago", true);
    }
  }

  const enabledList = methods.filter((m) => m.isEnabled);

  return (
    <section className="px-5 pt-5">
      <div className="rounded-2xl border border-border-medium bg-surface p-5 shadow-card">
        {/* Header */}
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-extrabold tracking-wider text-link uppercase">
                {isPlatformScope
                  ? "🏦 Tesorería YoReservo · Custodia Plataforma"
                  : "📲 Configuración de Cobro Directo del Aliado"}
              </span>
              {isPlatformScope ? (
                <span className="rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold text-emerald-500">
                  APLICA A RESERVAS EN CUSTODIA YORESERVO
                </span>
              ) : orgCollectionMode === "ALLY_DIRECT" ? (
                <span className="rounded-full border border-blue-500/40 bg-blue-500/15 px-2.5 py-0.5 text-[10px] font-bold text-blue-500">
                  ACTIVO EN CHECKOUT DEL CLIENTE
                </span>
              ) : (
                <span className="rounded-full border border-amber-500/40 bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-bold text-amber-500">
                  EN ESPERA (ACTUALMENTE EN CUSTODIA YORESERVO)
                </span>
              )}
            </div>
            <h3 className="mt-1 text-base font-bold text-foreground">
              {isPlatformScope
                ? "Métodos de Pago Aceptados por YoReservo"
                : `Métodos de Pago Aceptados por ${organization?.tradeName || "el Aliado"}`}
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {isPlatformScope
                ? "Activa o desactiva en tiempo real las opciones de pago que ven los clientes cuando reservan en sedes bajo Custodia YoReservo. YoReservo no acepta pagos en efectivo."
                : "Configura y habilita los métodos de pago (Pago Móvil, Efectivo en Sede, Zelle, Pipol Pay) que verán los atletas cuando tu organización opere en modalidad Cobro Directo."}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-xl border border-border bg-muted px-3 py-1.5 text-xs font-bold text-foreground">
              {enabledList.length} habilitado{enabledList.length === 1 ? "" : "s"}
            </span>
            {canEdit ? (
              <button
                type="button"
                id={`btn-save-payment-methods-${scope.toLowerCase()}`}
                onClick={handleSave}
                disabled={saving}
                className="btn btn-primary rounded-xl px-4 py-2 text-xs font-bold shadow-xs cursor-pointer"
              >
                {saving ? "Guardando..." : "💾 Guardar Métodos de Pago"}
              </button>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-muted/60 px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                🔒 Solo lectura
              </span>
            )}
          </div>
        </div>

        {/* Contextual Notice */}
        {!isPlatformScope && orgCollectionMode === "PLATFORM_CUSTODY" && (
          <div className="mb-4 rounded-xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-xs text-foreground">
            💡 <strong>Nota operativa:</strong> Actualmente{" "}
            <strong>{organization?.tradeName}</strong> tiene activa la modalidad{" "}
            <strong>Custodia YoReservo</strong>, por lo que el cliente ve los
            métodos de pago de YoReservo en el checkout. Al cambiar a{" "}
            <strong>Cobro Directo del Aliado</strong>, el checkout mostrará
            automáticamente los métodos habilitados aquí (incluyendo{" "}
            <strong>Efectivo en Sede</strong> si lo activas).
          </div>
        )}

        {isPlatformScope && (
          <div className="mb-4 rounded-xl border border-border bg-muted/40 px-4 py-2.5 text-xs text-muted-foreground">
            🚫 <strong>Política de Efectivo:</strong> YoReservo no recauda dinero
            en efectivo. La opción <strong>Efectivo en Sede (Cash)</strong> solo
            está disponible para aliados que gestionan sus propios cobros (
            <strong>Cobro Directo</strong>).
          </div>
        )}

        {/* Methods Grid */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {methods.map((item) => {
            const meta = METHOD_META[item.method];
            const isEnabled = item.isEnabled;

            return (
              <div
                key={item.method}
                id={`pm-config-card-${scope.toLowerCase()}-${item.method.toLowerCase()}`}
                className={`flex flex-col justify-between rounded-xl border p-4 transition-all ${
                  isEnabled
                    ? "border-accent/60 bg-surface shadow-xs ring-1 ring-accent/30"
                    : "border-border bg-muted/30 opacity-80"
                }`}
              >
                <div>
                  {/* Card Top Bar */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-muted text-lg">
                        {meta.icon}
                      </span>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-bold text-foreground">
                            {meta.title}
                          </span>
                          <span className="rounded-md border border-border bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                            {meta.currencyTag}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[11.5px] leading-snug text-muted-foreground">
                          {meta.subtitle}
                        </p>
                      </div>
                    </div>

                    {/* Toggle Switch */}
                    <label
                      className={`relative inline-flex items-center gap-2 select-none ${
                        canEdit ? "cursor-pointer" : "cursor-not-allowed opacity-60"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isEnabled}
                        disabled={!canEdit}
                        onChange={(e) => {
                          if (!canEdit) return;
                          updateItem(item.method, {
                            isEnabled: e.target.checked,
                          });
                        }}
                        className="peer sr-only"
                        id={`toggle-${scope.toLowerCase()}-${item.method.toLowerCase()}`}
                      />
                      <div className="peer relative h-6 w-11 rounded-full bg-border after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-emerald-500 peer-checked:after:translate-x-full peer-disabled:cursor-not-allowed" />
                      <span
                        className={`text-[11px] font-extrabold uppercase ${
                          isEnabled
                            ? "text-emerald-500"
                            : "text-muted-foreground"
                        }`}
                      >
                        {isEnabled ? "Activo" : "Inactivo"}
                      </span>
                    </label>
                  </div>

                  {/* Coordinate Fields by Method */}
                  {item.method === "PAGO_MOVIL" && (
                    <div className="mt-3.5 grid grid-cols-1 gap-2.5 border-t border-border/70 pt-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-[11px] font-semibold text-muted-foreground">
                          Banco Receptor
                        </label>
                        <select
                          disabled={!canEdit}
                          value={item.bankName || "0134 - Banesco"}
                          onChange={(e) => {
                            const val = e.target.value;
                            const code = val.split(" - ")[0] || "0134";
                            updateItem("PAGO_MOVIL", {
                              bankName: val,
                              bankCode: code,
                            });
                          }}
                          className="input-field form-select w-full text-xs"
                        >
                          {VENEZUELAN_BANKS.map((b) => (
                            <option key={b} value={b}>
                              {b}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] font-semibold text-muted-foreground">
                          Teléfono Pago Móvil
                        </label>
                        <input
                          type="text"
                          disabled={!canEdit}
                          placeholder="0412 123 4567"
                          value={item.phone || ""}
                          onChange={(e) =>
                            updateItem("PAGO_MOVIL", { phone: e.target.value })
                          }
                          className="input-field form-input w-full text-xs"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] font-semibold text-muted-foreground">
                          RIF / Cédula Asociada
                        </label>
                        <input
                          type="text"
                          disabled={!canEdit}
                          placeholder="J-40123456-7"
                          value={item.documentId || ""}
                          onChange={(e) =>
                            updateItem("PAGO_MOVIL", {
                              documentId: e.target.value,
                            })
                          }
                          className="input-field form-input w-full text-xs"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] font-semibold text-muted-foreground">
                          Titular / Beneficiario
                        </label>
                        <input
                          type="text"
                          disabled={!canEdit}
                          placeholder="Nombre o Razón Social"
                          value={item.beneficiaryName || ""}
                          onChange={(e) =>
                            updateItem("PAGO_MOVIL", {
                              beneficiaryName: e.target.value,
                            })
                          }
                          className="input-field form-input w-full text-xs"
                        />
                      </div>
                    </div>
                  )}

                  {item.method === "ZELLE" && (
                    <div className="mt-3.5 grid grid-cols-1 gap-2.5 border-t border-border/70 pt-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-[11px] font-semibold text-muted-foreground">
                          Correo o Teléfono Zelle
                        </label>
                        <input
                          type="text"
                          disabled={!canEdit}
                          placeholder="pagos@empresa.com"
                          value={item.email || ""}
                          onChange={(e) =>
                            updateItem("ZELLE", { email: e.target.value })
                          }
                          className="input-field form-input w-full text-xs"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] font-semibold text-muted-foreground">
                          Nombre del Titular Zelle
                        </label>
                        <input
                          type="text"
                          disabled={!canEdit}
                          placeholder="Titular de la cuenta en EE.UU."
                          value={item.beneficiaryName || ""}
                          onChange={(e) =>
                            updateItem("ZELLE", {
                              beneficiaryName: e.target.value,
                            })
                          }
                          className="input-field form-input w-full text-xs"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="mb-1 block text-[11px] font-semibold text-muted-foreground">
                          Instrucciones / Nota de Zelle (Memo)
                        </label>
                        <input
                          type="text"
                          disabled={!canEdit}
                          placeholder="Ej: Colocar únicamente el código de reserva en el memo."
                          value={item.instructions || ""}
                          onChange={(e) =>
                            updateItem("ZELLE", {
                              instructions: e.target.value,
                            })
                          }
                          className="input-field form-input w-full text-xs"
                        />
                      </div>
                    </div>
                  )}

                  {item.method === "PIPOL_PAY" && (
                    <div className="mt-3.5 grid grid-cols-1 gap-2.5 border-t border-border/70 pt-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-[11px] font-semibold text-muted-foreground">
                          Correo / Usuario Pipol Pay
                        </label>
                        <input
                          type="text"
                          disabled={!canEdit}
                          placeholder="pagos@empresa.com"
                          value={item.email || ""}
                          onChange={(e) =>
                            updateItem("PIPOL_PAY", { email: e.target.value })
                          }
                          className="input-field form-input w-full text-xs"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] font-semibold text-muted-foreground">
                          Beneficiario Pipol Pay
                        </label>
                        <input
                          type="text"
                          disabled={!canEdit}
                          placeholder="Nombre del Comercio / Titular"
                          value={item.beneficiaryName || ""}
                          onChange={(e) =>
                            updateItem("PIPOL_PAY", {
                              beneficiaryName: e.target.value,
                            })
                          }
                          className="input-field form-input w-full text-xs"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="mb-1 block text-[11px] font-semibold text-muted-foreground">
                          Instrucciones para el Cliente
                        </label>
                        <input
                          type="text"
                          disabled={!canEdit}
                          placeholder="Ej: Enviar monto exacto en USD y adjuntar número de operación."
                          value={item.instructions || ""}
                          onChange={(e) =>
                            updateItem("PIPOL_PAY", {
                              instructions: e.target.value,
                            })
                          }
                          className="input-field form-input w-full text-xs"
                        />
                      </div>
                    </div>
                  )}

                  {item.method === "CASH" && (
                    <div className="mt-3.5 grid grid-cols-1 gap-2.5 border-t border-border/70 pt-3">
                      <div>
                        <label className="mb-1 block text-[11px] font-semibold text-muted-foreground">
                          Punto de Recaudación / Taquilla
                        </label>
                        <input
                          type="text"
                          disabled={!canEdit}
                          placeholder="Taquilla Principal de la Sede"
                          value={item.beneficiaryName || ""}
                          onChange={(e) =>
                            updateItem("CASH", {
                              beneficiaryName: e.target.value,
                            })
                          }
                          className="input-field form-input w-full text-xs"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] font-semibold text-muted-foreground">
                          Instrucciones para el Atleta (Mostradas junto al QR)
                        </label>
                        <input
                          type="text"
                          disabled={!canEdit}
                          placeholder="Presenta tu pase QR confirmado en la taquilla al llegar a la sede para abonar en efectivo."
                          value={item.instructions || ""}
                          onChange={(e) =>
                            updateItem("CASH", {
                              instructions: e.target.value,
                            })
                          }
                          className="input-field form-input w-full text-xs"
                        />
                      </div>
                    </div>
                  )}

                  {item.method === "CARD" && (
                    <div className="mt-3.5 rounded-lg border border-border/70 bg-muted/50 px-3 py-2.5 text-[11.5px] text-muted-foreground">
                      {isEnabled
                        ? "✅ Los clientes verán la pestaña 'Pagar con Tarjeta' en el checkout y la sección 'Tarjetas Guardadas' en Mi Cuenta."
                        : "🔒 Actualmente deshabilitado: La aplicación cliente oculta automáticamente la opción de pago con tarjeta y la gestión de tarjetas guardadas."}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

