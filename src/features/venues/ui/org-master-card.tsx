"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { DEFAULT_BCV_EUR_RATE, DEFAULT_BCV_USD_RATE } from "@/shared/lib";
import type { OrganizationData } from "../model/types";

interface OrgMasterCardProps {
  organization: OrganizationData;
  bcvRate?: number;
  bcvEurRate?: number;
  onOpenEditModal: () => void;
}

export function OrgMasterCard({
  organization,
  bcvRate = DEFAULT_BCV_USD_RATE,
  bcvEurRate = DEFAULT_BCV_EUR_RATE,
  onOpenEditModal,
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
  const displayBank = organization.payoutBank || t("notConfigured");
  const displayAccountType =
    organization.payoutAccountType || t("accountTypeChecking");
  const displayLast4 = organization.payoutAccountNumber?.slice(-4) || "0000";

  return (
    <section className="px-5 pt-5">
      <div className="rounded-2xl border border-border-medium bg-surface px-5 py-4.5 shadow-card">
        <div className="mb-3.5 flex flex-wrap items-start justify-between gap-3.5">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <span className="text-lg">🏢</span>
              <span className="text-[11px] font-bold tracking-wider text-link uppercase">
                {t("badge")}
              </span>
              <span className="badge badge-available">
                {t("active")}
              </span>
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
          <button
            type="button"
            className="btn btn-outline text-[12.5px]"
            onClick={onOpenEditModal}
            id="btn-edit-org"
          >
            ✏️ <span>{t("btnEdit")}</span>
          </button>
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
              {t("commission")}
            </div>
            <div className="text-xs text-muted-foreground">
              {t("netPayout")}
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
