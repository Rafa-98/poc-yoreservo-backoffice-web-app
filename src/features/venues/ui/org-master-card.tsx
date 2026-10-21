"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { DEFAULT_BCV_EUR_RATE, DEFAULT_BCV_USD_RATE } from "@/shared/lib";
import type { OrganizationData, PaymentCollectionMode } from "../model/types";

interface OrgMasterCardProps {
  organization: OrganizationData;
  bcvRate?: number;
  bcvEurRate?: number;
  onOpenEditModal: () => void;
  onQuickSwitchMode?: (mode: PaymentCollectionMode) => void;
  onToggleBookingPause?: (nextPaused: boolean) => void;
  onToggleStatus?: (nextStatus: "ACTIVE" | "INACTIVE") => void;
  userRole?: string;
}

export function OrgMasterCard({
  organization,
  bcvRate = DEFAULT_BCV_USD_RATE,
  bcvEurRate = DEFAULT_BCV_EUR_RATE,
  onOpenEditModal,
  onQuickSwitchMode,
  onToggleBookingPause,
  onToggleStatus,
  userRole,
}: OrgMasterCardProps) {
  const t = useTranslations("venues.org");
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);

  const isEur = organization.referenceCurrencyCode === "EUR";
  const currencyLabel = isEur ? t("currencyEur") : t("currencyUsd");
  const currencyRateLabel = isEur
    ? t("rateEur", { rate: bcvEurRate.toFixed(2) })
    : t("rateUsd", { rate: bcvRate.toFixed(2) });

  const displayName =
    organization.tradeName || organization.legalName || t("notConfigured");
  const displayLegalName = organization.legalName || "—";
  const displayRif = organization.rif || organization.taxId || "—";
  const displayBank = organization.payoutBank || organization.bankName || t("notConfigured");
  const displayAccountType =
    organization.payoutAccountType || t("accountTypeChecking");
  const displayLast4 = organization.payoutAccountNumber?.slice(-4) || "0000";

  const currentMode: PaymentCollectionMode =
    organization.paymentCollectionMode === "ALLY_DIRECT"
      ? "ALLY_DIRECT"
      : "PLATFORM_CUSTODY";

  const canEdit =
    !userRole ||
    userRole === "PLATFORM_ADMIN" ||
    userRole === "ALLY_ADMIN";
  const isPlatformAdmin = userRole === "PLATFORM_ADMIN";
  const isActiveStatus = (organization.status || "ACTIVE") === "ACTIVE";

  const commissionPct =
    organization.commissionPct ??
    Math.round(
      (organization.manualCommissionRate ?? organization.commissionRate ?? 0.05) *
        100
    );
  const netPayoutPct = 100 - commissionPct;
  const minMonthlyFee = Number(organization.minimumMonthlyFee ?? 0).toFixed(2);

  return (
    <section className="px-5 pt-5">
      <div className="rounded-2xl border border-border-medium bg-surface px-5 py-4.5 shadow-card">
        {/* Operational Status Warning Banners */}
        {!isActiveStatus && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-status-cancelled-border bg-status-cancelled-bg px-4 py-3 text-xs font-bold text-status-cancelled-fg">
            <span>
              🚫 ESTA ORGANIZACIÓN SE ENCUENTRA DESACTIVADA — Las reservas en línea están suspendidas en todas sus sedes
            </span>
            {isPlatformAdmin && onToggleStatus && (
              <button
                type="button"
                onClick={() => onToggleStatus("ACTIVE")}
                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-emerald-500 cursor-pointer"
              >
                ▶ Reactivar Organización
              </button>
            )}
          </div>
        )}

        {isActiveStatus && organization.isBookingPaused && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/40 bg-amber-500/15 px-4 py-3 text-xs font-bold text-amber-600 dark:text-amber-300">
            <span>
              ⏸️ RESERVAS EN LÍNEA PAUSADAS TEMPORALMENTE — Esta organización tiene la recepción de nuevas reservas en pausa administrativa
            </span>
            {isPlatformAdmin && onToggleBookingPause && (
              <button
                type="button"
                onClick={() => onToggleBookingPause(false)}
                className="rounded-lg bg-accent px-3 py-1.5 text-xs font-bold text-accent-foreground shadow-2xs hover:brightness-105 cursor-pointer"
              >
                ▶ Reanudar Reservas
              </button>
            )}
          </div>
        )}

        {/* Inline Deactivation Confirmation Banner */}
        {confirmDeactivate && isPlatformAdmin && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3.5 text-xs">
            <div className="text-foreground">
              <strong className="font-bold text-rose-500">
                ⚠️ ¿Confirmar desactivación de {displayName}?
              </strong>{" "}
              Al desactivar la organización, sus sedes dejarán de recibir reservas en la plataforma hasta ser reactivada.
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setConfirmDeactivate(false)}
                className="btn btn-outline px-3 py-1.5 text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmDeactivate(false);
                  onToggleStatus?.("INACTIVE");
                }}
                className="btn btn-destructive px-3 py-1.5 text-xs"
                id="btn-confirm-deactivate-org"
              >
                Confirmar Desactivación
              </button>
            </div>
          </div>
        )}

        <div className="mb-3.5 flex flex-wrap items-start justify-between gap-3.5">
          <div>
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <span className="text-lg">🏢</span>
              <span className="text-[11px] font-bold tracking-wider text-link uppercase">
                {t("badge")}
              </span>
              {isActiveStatus ? (
                <span className="badge badge-available">
                  {t("active")}
                </span>
              ) : (
                <span className="badge badge-cancelled">
                  INACTIVA
                </span>
              )}
              {organization.isBookingPaused && (
                <span className="rounded-full border border-status-cancelled-border bg-status-cancelled-bg px-2.5 py-0.5 text-[11px] font-bold text-status-cancelled-fg">
                  ⚠️ {t("bookingPausedBadge")}
                </span>
              )}
            </div>
            <h3
              className="m-0 text-xl font-bold text-foreground"
              id="card-org-name"
            >
              {displayName}
            </h3>
            <div className="mt-0.5 text-[13px] text-muted-foreground">
              <strong className="text-foreground">
                {t("legalName").replace(" *", "")}:
              </strong>{" "}
              {displayLegalName} •{" "}
              <strong className="text-foreground">
                {t("rif").replace(" *", "")}:
              </strong>{" "}
              {displayRif}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {isPlatformAdmin && onToggleBookingPause && (
              <button
                type="button"
                className="btn btn-outline text-[12px]"
                onClick={() => onToggleBookingPause(!organization.isBookingPaused)}
                id="btn-toggle-org-pause"
              >
                {organization.isBookingPaused
                  ? "▶️ Reanudar Reservas"
                  : "⏸️ Pausar Reservas"}
              </button>
            )}
            {isPlatformAdmin && onToggleStatus && (
              isActiveStatus ? (
                <button
                  type="button"
                  className="btn btn-destructive text-[12px]"
                  onClick={() => setConfirmDeactivate(true)}
                  id="btn-deactivate-org"
                >
                  🚫 Desactivar Organización
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary text-[12px]"
                  onClick={() => onToggleStatus("ACTIVE")}
                  id="btn-activate-org"
                >
                  ✅ Reactivar Organización
                </button>
              )
            )}
            {canEdit && (
              <button
                type="button"
                className="btn btn-outline text-[12.5px]"
                onClick={onOpenEditModal}
                id="btn-edit-org"
              >
                ✏️ <span>{t("btnEdit")}</span>
              </button>
            )}
          </div>
        </div>


        {/* PROMINENT PAYMENT COLLECTION MODE SECTION */}
        <div className="mb-4 rounded-xl border border-accent/35 bg-accent/5 p-4">
          <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-xs font-extrabold tracking-wider text-foreground uppercase">
                💳 {t("collectionModeSectionTitle")}
              </div>
              <div className="text-xs text-muted-foreground">
                {t("collectionModeSectionDesc")}
              </div>
            </div>
            <span
              id="card-org-collection-mode-badge"
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${
                currentMode === "PLATFORM_CUSTODY"
                  ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                  : "border-blue-500/40 bg-blue-500/15 text-blue-600 dark:text-blue-400"
              }`}
            >
              {currentMode === "PLATFORM_CUSTODY"
                ? `🏦 ${t("modePlatformCustodyBadge")}`
                : `📲 ${t("modeAllyDirectBadge")}`}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {/* Option 1: PLATFORM_CUSTODY */}
            <div
              onClick={() => {
                if (canEdit && currentMode !== "PLATFORM_CUSTODY") {
                  if (onQuickSwitchMode) {
                    onQuickSwitchMode("PLATFORM_CUSTODY");
                  } else {
                    onOpenEditModal();
                  }
                }
              }}
              className={`rounded-xl border p-3.5 transition-all ${
                currentMode === "PLATFORM_CUSTODY"
                  ? "border-accent bg-surface shadow-xs ring-1 ring-accent"
                  : canEdit
                  ? "cursor-pointer border-border bg-surface/60 opacity-80 hover:border-border-medium hover:opacity-100"
                  : "border-border bg-surface/50 opacity-70"
              }`}
              id="card-mode-platform-custody"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs font-bold text-foreground">
                  {t("modeOption1Title")}
                </div>
                {currentMode === "PLATFORM_CUSTODY" ? (
                  <span className="rounded bg-accent px-2 py-0.5 text-[10px] font-extrabold text-accent-foreground uppercase">
                    {t("modeActiveLabel")}
                  </span>
                ) : (
                  canEdit && (
                    <span className="text-[11px] font-semibold text-link underline">
                      {t("btnActivateMode")}
                    </span>
                  )
                )}
              </div>
              <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted-foreground">
                {t("modeOption1Desc", { netPct: netPayoutPct })}
              </p>
            </div>

            {/* Option 2: ALLY_DIRECT */}
            <div
              onClick={() => {
                if (canEdit && currentMode !== "ALLY_DIRECT") {
                  if (onQuickSwitchMode) {
                    onQuickSwitchMode("ALLY_DIRECT");
                  } else {
                    onOpenEditModal();
                  }
                }
              }}
              className={`rounded-xl border p-3.5 transition-all ${
                currentMode === "ALLY_DIRECT"
                  ? "border-accent bg-surface shadow-xs ring-1 ring-accent"
                  : canEdit
                  ? "cursor-pointer border-border bg-surface/60 opacity-80 hover:border-border-medium hover:opacity-100"
                  : "border-border bg-surface/50 opacity-70"
              }`}
              id="card-mode-ally-direct"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs font-bold text-foreground">
                  {t("modeOption2Title")}
                </div>
                {currentMode === "ALLY_DIRECT" ? (
                  <span className="rounded bg-accent px-2 py-0.5 text-[10px] font-extrabold text-accent-foreground uppercase">
                    {t("modeActiveLabel")}
                  </span>
                ) : (
                  canEdit && (
                    <span className="text-[11px] font-semibold text-link underline">
                      {t("btnActivateMode")}
                    </span>
                  )
                )}
              </div>
              <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted-foreground">
                {t("modeOption2Desc", { commissionPct })}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3 rounded-xl border border-border bg-muted p-3.5">
          <div>
            <div className="text-[11.5px] font-semibold text-muted-foreground uppercase">
              {t("bcvRef")}
            </div>
            <div
              className="mt-1 text-[13px] font-bold text-status-confirmed-fg"
              id="card-org-currency"
            >
              {currencyLabel}
            </div>
            <div
              className="text-xs text-muted-foreground"
              id="card-org-rate"
            >
              {currencyRateLabel}
            </div>
          </div>

          <div>
            <div className="text-[11.5px] font-semibold text-muted-foreground uppercase">
              {t("payoutBank")}
            </div>
            <div
              className="mt-1 text-[13px] font-bold text-foreground"
              id="card-org-bank"
            >
              {displayBank}
            </div>
            <div className="text-xs text-muted-foreground">
              {t("accountSummary", {
                type: displayAccountType,
                last4: displayLast4,
                rif: displayRif,
              })}
            </div>
          </div>

          <div>
            <div className="text-[11.5px] font-semibold text-muted-foreground uppercase">
              {t("commercialTerms")}
            </div>
            <div className="mt-1 text-[13px] font-bold text-link">
              {t("commission", { pct: commissionPct })}
            </div>
            <div className="text-xs text-muted-foreground">
              {currentMode === "ALLY_DIRECT"
                ? t("weeklyInvoiceTerms", {
                    minFee: minMonthlyFee,
                  })
                : t("netPayout", { netPct: netPayoutPct })}
            </div>
          </div>

          <div>
            <div className="text-[11.5px] font-semibold text-muted-foreground uppercase">
              {t("managedVenues")}
            </div>
            <div className="mt-1 text-[13px] font-bold text-foreground">
              {t("managedCount", {
                count: organization.venuesCount,
              })}
            </div>
            <div className="text-xs text-muted-foreground">
              {t("totalCourts", { count: organization.spacesCount })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
