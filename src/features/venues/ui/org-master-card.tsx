"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { DEFAULT_BCV_EUR_RATE, DEFAULT_BCV_USD_RATE } from "@/shared/lib";
import type { OrganizationData, PaymentCollectionMode } from "../model/types";

interface OrgMasterCardProps {
  organization: OrganizationData;
  bcvRate?: number;
  bcvEurRate?: number;
  onOpenEditModal: () => void;
  onQuickSwitchMode?: (mode: PaymentCollectionMode) => void;
  userRole?: string;
}

export function OrgMasterCard({
  organization,
  bcvRate = DEFAULT_BCV_USD_RATE,
  bcvEurRate = DEFAULT_BCV_EUR_RATE,
  onOpenEditModal,
  onQuickSwitchMode,
  userRole,
}: OrgMasterCardProps) {
  const t = useTranslations("venues.org");

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

  const commissionPct = Math.round(
    (organization.manualCommissionRate ?? organization.commissionRate ?? 0.05) * 100
  );

  return (
    <section className="px-5 pt-5">
      <div className="rounded-2xl border border-border-medium bg-surface px-5 py-4.5 shadow-card">
        <div className="mb-3.5 flex flex-wrap items-start justify-between gap-3.5">
          <div>
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <span className="text-lg">🏢</span>
              <span className="text-[11px] font-bold tracking-wider text-link uppercase">
                {t("badge")}
              </span>
              <span className="badge badge-available">
                {t("active")}
              </span>
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
                {t("modeOption1Desc")}
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
                {t("modeOption2Desc")}
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
              {commissionPct}% • {t("commission")}
            </div>
            <div className="text-xs text-muted-foreground">
              {currentMode === "ALLY_DIRECT"
                ? t("weeklyInvoiceTerms", {
                    minFee: (organization.minimumMonthlyFee ?? 20).toFixed(2),
                  })
                : t("netPayout")}
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
