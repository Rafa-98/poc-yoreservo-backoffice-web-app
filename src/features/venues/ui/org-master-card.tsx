"use client";

import React, { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/shared/ui/button";
import type { OrganizationData, PaymentCollectionMode } from "../model/types";

interface OrgMasterCardProps {
  org?: OrganizationData;
  organization?: OrganizationData;
  bcvRate?: number;
  bcvEurRate?: number;
  canEdit?: boolean;
  isPlatformAdmin?: boolean;
  userRole?: string;
  onEditClick?: () => void;
  onOpenEditModal?: () => void;
  onQuickSwitchMode?: (mode: PaymentCollectionMode) => void;
  onToggleBookingPause?: (nextPaused: boolean) => void;
  onToggleOrgStatus?: (nextStatus: "ACTIVE" | "INACTIVE") => void;
  onToggleStatus?: (nextStatus: "ACTIVE" | "INACTIVE") => void;
  isUpdatingStatus?: boolean;
}

export function OrgMasterCard({
  org: propOrg,
  organization,
  canEdit: propCanEdit,
  isPlatformAdmin: propIsPlatformAdmin,
  userRole,
  onEditClick,
  onOpenEditModal,
  onToggleBookingPause,
  onToggleOrgStatus,
  onToggleStatus,
  isUpdatingStatus = false,
}: OrgMasterCardProps) {
  const org = (propOrg ?? organization)!;
  const isPlatformAdmin =
    propIsPlatformAdmin !== undefined
      ? propIsPlatformAdmin
      : userRole === "PLATFORM_ADMIN";
  const canEdit =
    propCanEdit !== undefined
      ? propCanEdit
      : userRole
        ? userRole === "PLATFORM_ADMIN" || userRole === "ALLY_ADMIN"
        : true;
  const handleEditClick = onEditClick ?? onOpenEditModal ?? (() => {});
  const handleToggleStatus = onToggleOrgStatus ?? onToggleStatus;
  const locale = useLocale();
  const isEn = locale.toLowerCase().startsWith("en");
  const t = useTranslations("venues.org");

  const [confirmDeactivateOpen, setConfirmDeactivateOpen] = useState(false);

  const initials = org.tradeName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("");

  const commissionPct = Math.round(
    org.commissionPct ??
      (org.commissionRate > 1 ? org.commissionRate : org.commissionRate * 100)
  );
  const netPct = 100 - commissionPct;
  const isAllyDirect = org.paymentCollectionMode === "ALLY_DIRECT";
  const isInactive = org.status === "INACTIVE";
  const prefersPagoMovil = org.preferredPayoutMethod === "PAGO_MOVIL";

  const handleConfirmStatusChange = () => {
    setConfirmDeactivateOpen(false);
    handleToggleStatus?.(isInactive ? "ACTIVE" : "INACTIVE");
  };

  return (
    <section className="px-5 pt-4">
      <div
        className={`rounded-2xl border border-border bg-surface p-6 shadow-card border-t-4 ${
          isInactive
            ? "border-t-rose-500 opacity-95"
            : "border-t-accent"
        }`}
      >
        {/* Inactive Organization Alert Banner */}
        {isInactive && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="text-lg">🚫</span>
              <div>
                <div className="text-xs font-extrabold text-rose-500 uppercase tracking-wider">
                  {isEn ? "Organization Deactivated" : "Organización Desactivada"}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 mb-0">
                  {isEn
                    ? "This organization is inactive and its venues have bookings suspended."
                    : "Esta organización se encuentra inactiva y sus sedes tienen las reservas suspendidas."}
                </p>
              </div>
            </div>
            {isPlatformAdmin && handleToggleStatus && (
              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled={isUpdatingStatus}
                onClick={() => setConfirmDeactivateOpen(true)}
              >
                {isEn
                  ? "✅ Reactivate Organization"
                  : "✅ Reactivar Organización"}
              </Button>
            )}
          </div>
        )}

        {/* Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-border">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-accent/15 text-link font-extrabold text-xl flex items-center justify-center shrink-0">
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="m-0 text-xl font-extrabold text-foreground">
                  {org.tradeName}
                </h2>
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${
                    isInactive
                      ? "border-rose-500/40 bg-rose-500/15 text-rose-500"
                      : "border-emerald-500/40 bg-emerald-500/15 text-emerald-500"
                  }`}
                >
                  {isInactive
                    ? isEn
                      ? "● Inactive"
                      : "● Inactiva"
                    : isEn
                      ? "● Verified Tax ID"
                      : "● RIF Verificado"}
                </span>
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${
                    isAllyDirect
                      ? "border-blue-500/40 bg-blue-500/15 text-blue-500"
                      : "border-accent/40 bg-accent/15 text-link"
                  }`}
                >
                  {isAllyDirect
                    ? isEn
                      ? "📲 Ally Direct Collection"
                      : "📲 Cobro Directo del Aliado"
                    : isEn
                      ? "🏦 YoReservo Custody"
                      : "🏦 Custodia YoReservo"}
                </span>
                {org.isBookingPaused && !isInactive && (
                  <span className="inline-flex items-center rounded-full border border-amber-500/40 bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-bold text-amber-500">
                    {t("bookingPausedBadge")}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1 mb-0">
                {org.legalName} ·{" "}
                <strong className="font-mono text-foreground">
                  {org.rif}
                </strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Pause / Resume Bookings & Deactivate Organization: Strictly Platform Admin Only */}
            {isPlatformAdmin && onToggleBookingPause && !isInactive && (
              <Button
                type="button"
                variant={org.isBookingPaused ? "primary" : "secondary"}
                size="sm"
                disabled={isUpdatingStatus}
                onClick={() => onToggleBookingPause(!org.isBookingPaused)}
              >
                {org.isBookingPaused
                  ? isEn
                    ? "▶ Resume Bookings"
                    : "▶ Reanudar Reservas"
                  : isEn
                    ? "⏸ Pause Bookings"
                    : "⏸ Pausar Reservas"}
              </Button>
            )}

            {isPlatformAdmin && handleToggleStatus && (
              <Button
                type="button"
                variant={isInactive ? "primary" : "destructive"}
                size="sm"
                disabled={isUpdatingStatus}
                onClick={() => setConfirmDeactivateOpen(true)}
              >
                {isInactive
                  ? isEn
                    ? "✅ Reactivate Organization"
                    : "✅ Reactivar Organización"
                  : isEn
                    ? "🚫 Deactivate Organization"
                    : "🚫 Desactivar Organización"}
              </Button>
            )}

            {canEdit && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleEditClick}
              >
                {isEn ? "✏️ Edit Organization" : "✏️ Editar Organización"}
              </Button>
            )}
          </div>
        </div>

        {/* 2-Column Data Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Fiscal & Commercial Data */}
          <div className="p-5 rounded-xl bg-muted/30 border border-border">
            <h3 className="m-0 text-xs font-extrabold uppercase tracking-wider text-link mb-4">
              {isEn
                ? "🏛️ Tax & Commercial Details"
                : "🏛️ Datos Fiscales y Comerciales"}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="text-[11px] text-muted-foreground">
                  {t("legalName")}
                </div>
                <div className="text-sm font-bold text-foreground mt-0.5">
                  {org.legalName}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-muted-foreground">
                  {t("rif")}
                </div>
                <div className="text-sm font-mono font-bold text-foreground mt-0.5">
                  {org.rif}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-muted-foreground">
                  {t("contactEmail")}
                </div>
                <div className="text-sm font-semibold text-foreground mt-0.5">
                  {org.contactEmail}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-muted-foreground">
                  {t("contactPhone")}
                </div>
                <div className="text-sm font-mono font-semibold text-foreground mt-0.5">
                  {org.contactPhone}
                </div>
              </div>
              <div className="sm:col-span-2">
                <div className="text-[11px] text-muted-foreground">
                  {t("fiscalAddress")}
                </div>
                <div className="text-sm text-foreground mt-0.5">
                  {org.fiscalAddress}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-muted-foreground">
                  {t("referenceCurrency")}
                </div>
                <div className="mt-1">
                  <span className="inline-flex items-center rounded-full border border-accent/40 bg-accent/15 px-2.5 py-0.5 text-[11px] font-bold text-link">
                    💱 {org.referenceCurrencyCode} —{" "}
                    {org.referenceCurrencyCode === "EUR"
                      ? t("currencyEur")
                      : t("currencyUsd")}
                  </span>
                </div>
              </div>
              <div>
                <div className="text-[11px] text-muted-foreground">
                  {isEn ? "Commission Scheme" : "Esquema de Comisión"}
                </div>
                <div className="text-sm font-extrabold text-emerald-500 mt-0.5">
                  {isEn
                    ? `${netPct}% Ally / ${commissionPct}% Platform`
                    : `${netPct}% Aliado / ${commissionPct}% Plataforma`}
                </div>
              </div>
              {org.minimumMonthlyFee > 0 && (
                <div>
                  <div className="text-[11px] text-muted-foreground">
                    {t("minimumMonthlyFeeLabel")}
                  </div>
                  <div className="text-sm font-bold text-foreground mt-0.5">
                    {org.referenceCurrencyCode}{" "}
                    {org.minimumMonthlyFee.toFixed(2)}{" "}
                    {isEn ? "/ month" : "/ mes"}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Corporate Settlement Coordinates (Bank Transfer & Pago Móvil) */}
          <div className="p-5 rounded-xl bg-muted/30 border border-border flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 flex-wrap mb-4">
                <h3 className="m-0 text-xs font-extrabold uppercase tracking-wider text-link">
                  {isEn
                    ? "🏦 Corporate Settlement Account"
                    : "🏦 Cuenta Corporativa de Liquidación"}
                </h3>
                <span className="inline-flex items-center rounded-full border border-accent/40 bg-accent/15 px-2.5 py-0.5 text-[11px] font-bold text-link">
                  {prefersPagoMovil
                    ? isEn
                      ? "📲 Preferred Method: Pago Móvil"
                      : "📲 Vía Preferida: Pago Móvil"
                    : isEn
                      ? "🏦 Preferred Method: Bank Transfer"
                      : "🏦 Vía Preferida: Transferencia Bancaria"}
                </span>
              </div>

              <div className="space-y-3.5">
                {/* Coordenadas de Transferencia Bancaria */}
                <div
                  className={`p-3.5 rounded-xl border ${
                    !prefersPagoMovil
                      ? "border-accent/40 bg-accent/5"
                      : "border-border bg-surface/60"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-extrabold text-foreground flex items-center gap-1.5">
                      <span>🏦</span>{" "}
                      {isEn
                        ? "Corporate Bank Transfer"
                        : "Transferencia Bancaria Corporativa"}
                    </span>
                    {!prefersPagoMovil && (
                      <span className="inline-flex items-center rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-500">
                        {isEn ? "● Primary" : "● Principal"}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                        {t("payoutBank")}
                      </span>
                      <span className="font-bold text-foreground">
                        {org.payoutBank ||
                          (isEn ? "Not configured" : "Sin configurar")}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                        {t("accountType")} / {t("rif")}
                      </span>
                      <span className="font-semibold text-foreground">
                        {org.payoutAccountType === "Ahorro"
                          ? isEn
                            ? "Savings"
                            : "Ahorro"
                          : isEn
                            ? "Checking"
                            : "Corriente"}{" "}
                        ·{" "}
                        <strong className="font-mono">
                          {org.payoutIdDocument || org.rif}
                        </strong>
                      </span>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                        {t("accountNumber")}
                      </span>
                      <span className="font-mono font-bold text-foreground tracking-wider">
                        {org.payoutAccountNumber ||
                          (isEn ? "Not configured" : "Sin configurar")}
                      </span>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                        {t("accountHolder")}
                      </span>
                      <span className="font-semibold text-foreground">
                        {org.payoutAccountHolder || org.legalName}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Coordenadas de Pago Móvil de Liquidación */}
                <div
                  className={`p-3.5 rounded-xl border ${
                    prefersPagoMovil
                      ? "border-accent/40 bg-accent/5"
                      : "border-border bg-surface/60"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-extrabold text-foreground flex items-center gap-1.5">
                      <span>📲</span>{" "}
                      {isEn
                        ? "Corporate Settlement Pago Móvil"
                        : "Pago Móvil Corporativo de Liquidación"}
                    </span>
                    {prefersPagoMovil && (
                      <span className="inline-flex items-center rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-500">
                        {isEn ? "● Primary" : "● Principal"}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                        {isEn ? "Pago Móvil Bank" : "Banco Pago Móvil"}
                      </span>
                      <span className="font-bold text-foreground">
                        {org.payoutPagoMovilBank ||
                          org.payoutBank ||
                          (isEn ? "Not configured" : "Sin configurar")}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                        {isEn ? "Affiliated Phone" : "Teléfono Afiliado"}
                      </span>
                      <span className="font-mono font-bold text-foreground">
                        {org.payoutPhoneNumber ||
                          org.pagoMovilPhone ||
                          org.contactPhone ||
                          (isEn ? "Not configured" : "Sin configurar")}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                        {isEn ? "Tax ID / Document" : "RIF / Cédula"}
                      </span>
                      <span className="font-mono font-semibold text-foreground">
                        {org.payoutPagoMovilIdDocument ||
                          org.payoutIdDocument ||
                          org.rif}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                        {isEn ? "Beneficiary" : "Beneficiario"}
                      </span>
                      <span className="font-semibold text-foreground truncate block">
                        {org.payoutPagoMovilHolder ||
                          org.payoutAccountHolder ||
                          org.legalName}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-600 dark:text-emerald-400">
              {isAllyDirect
                ? isEn
                  ? `⚡ Direct Collection active: the complex collects 100% directly from the player and settles the platform commission (${commissionPct}%).`
                  : `⚡ Cobro Directo activo: el complejo recauda el 100% directamente del jugador y liquida la comisión de plataforma (${commissionPct}%).`
                : isEn
                  ? `🛡️ YoReservo Custody active: YoReservo collects payments and transfers the net settlement (${netPct}%) to the preferred method configured above.`
                  : `🛡️ Custodia YoReservo activa: YoReservo recauda los pagos y transfiere el neto de liquidación (${netPct}%) a la vía preferida configurada arriba.`}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Confirmación para Desactivar / Reactivar Organización (Exclusivo Platform Admin) */}
      {isPlatformAdmin && confirmDeactivateOpen && (
        <div
          className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
          onClick={() => setConfirmDeactivateOpen(false)}
        >
          <div
            className="modal-card w-full max-w-md overflow-hidden rounded-2xl border border-border-medium bg-surface p-6 shadow-card animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="m-0 text-base font-extrabold text-foreground">
              {isInactive
                ? isEn
                  ? "✅ Reactivate Ally Organization"
                  : "✅ Reactivar Organización Aliada"
                : isEn
                  ? "🚫 Deactivate Complete Organization"
                  : "🚫 Desactivar Organización Completa"}
            </h3>
            <div className="mt-3 flex flex-col gap-3 text-sm text-foreground">
              <p className="m-0">
                {isInactive ? (
                  isEn ? (
                    <>
                      Are you sure you want to reactivate the organization{" "}
                      <strong>{org.tradeName}</strong> ({org.rif})? Its venues
                      will become operational again and able to receive bookings.
                    </>
                  ) : (
                    <>
                      ¿Estás seguro de que deseas reactivar la organización{" "}
                      <strong>{org.tradeName}</strong> ({org.rif})? Sus sedes
                      volverán a estar operativas y podrán recibir reservas.
                    </>
                  )
                ) : isEn ? (
                  <>
                    Are you sure you want to completely deactivate the
                    organization <strong>{org.tradeName}</strong> ({org.rif})?
                  </>
                ) : (
                  <>
                    ¿Estás seguro de que deseas desactivar por completo la
                    organización <strong>{org.tradeName}</strong> ({org.rif})?
                  </>
                )}
              </p>
              {!isInactive && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-500 space-y-1">
                  <div className="font-extrabold">
                    {isEn
                      ? "⚠️ Immediate effects of deactivation:"
                      : "⚠️ Efectos inmediatos de la desactivación:"}
                  </div>
                  <ul className="list-disc pl-4 space-y-0.5 m-0">
                    <li>
                      {isEn
                        ? "New bookings will be automatically suspended across all its venues and courts."
                        : "Se suspenderán automáticamente las nuevas reservas en todas sus sedes y canchas."}
                    </li>
                    <li>
                      {isEn
                        ? "The Ally Admin will not be able to reactivate the organization on their own (only a YoReservo Super Admin can do so)."
                        : "El Administrador Aliado no podrá reactivar la organización por su cuenta (solo un Super Admin de YoReservo puede hacerlo)."}
                    </li>
                  </ul>
                </div>
              )}
            </div>
            <div className="mt-5 flex items-center justify-end gap-3 border-t border-border pt-4">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setConfirmDeactivateOpen(false)}
                disabled={isUpdatingStatus}
              >
                {isEn ? "Cancel" : "Cancelar"}
              </Button>
              <Button
                type="button"
                variant={isInactive ? "primary" : "destructive"}
                size="sm"
                onClick={handleConfirmStatusChange}
                disabled={isUpdatingStatus}
              >
                {isUpdatingStatus
                  ? isEn
                    ? "Processing..."
                    : "Procesando..."
                  : isInactive
                    ? isEn
                      ? "Confirm Reactivation ✓"
                      : "Confirmar Reactivación ✓"
                    : isEn
                      ? "Yes, Deactivate Organization"
                      : "Sí, Desactivar Organización"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
