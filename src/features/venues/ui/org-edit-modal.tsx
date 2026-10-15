"use client";

import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/shared/ui/button";
import type {
  OrganizationData,
  PaymentCollectionMode,
  UpdateOrganizationInput,
} from "../model/types";
import { updateOrganizationAction } from "../actions/venues-actions";

interface OrgEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  organization: OrganizationData;
  onSuccess: (updated: OrganizationData) => void;
  userRole?: string;
}

export function OrgEditModal({
  isOpen,
  onClose,
  organization,
  onSuccess,
  userRole,
}: OrgEditModalProps) {
  const t = useTranslations("venues.org");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [tradeName, setTradeName] = useState(organization.tradeName || "");
  const [legalName, setLegalName] = useState(organization.legalName || "");
  const [rif, setRif] = useState(organization.rif || "");
  const [contactEmail, setContactEmail] = useState(organization.contactEmail || "");
  const [contactPhone, setContactPhone] = useState(
    organization.pagoMovilPhone || organization.contactPhone || ""
  );
  const [fiscalAddress, setFiscalAddress] = useState(organization.fiscalAddress || "");
  const [referenceCurrencyCode, setReferenceCurrencyCode] = useState(
    organization.referenceCurrencyCode || "USD"
  );
  const [payoutBank, setPayoutBank] = useState(
    organization.payoutBank || organization.bankName || "0102 - Banco de Venezuela"
  );
  const [payoutAccountNumber, setPayoutAccountNumber] = useState(
    organization.payoutAccountNumber || ""
  );
  const [payoutAccountType, setPayoutAccountType] = useState(
    organization.payoutAccountType || "Corriente"
  );
  const [payoutAccountHolder, setPayoutAccountHolder] = useState(
    organization.payoutAccountHolder || ""
  );
  const [paymentCollectionMode, setPaymentCollectionMode] =
    useState<PaymentCollectionMode>(
      organization.paymentCollectionMode === "ALLY_DIRECT"
        ? "ALLY_DIRECT"
        : "PLATFORM_CUSTODY"
    );
  const [manualCommissionRate, setManualCommissionRate] = useState(
    Number(organization.manualCommissionRate ?? organization.commissionRate ?? 0.05)
  );
  const [minimumMonthlyFee, setMinimumMonthlyFee] = useState(
    Number(organization.minimumMonthlyFee ?? 20)
  );

  useEffect(() => {
    setTradeName(organization.tradeName || "");
    setLegalName(organization.legalName || "");
    setRif(organization.rif || "");
    setContactEmail(organization.contactEmail || "");
    setContactPhone(organization.pagoMovilPhone || organization.contactPhone || "");
    setFiscalAddress(organization.fiscalAddress || "");
    setReferenceCurrencyCode(organization.referenceCurrencyCode || "USD");
    setPayoutBank(
      organization.payoutBank || organization.bankName || "0102 - Banco de Venezuela"
    );
    setPayoutAccountNumber(organization.payoutAccountNumber || "");
    setPayoutAccountType(organization.payoutAccountType || "Corriente");
    setPayoutAccountHolder(organization.payoutAccountHolder || "");
    setPaymentCollectionMode(
      organization.paymentCollectionMode === "ALLY_DIRECT"
        ? "ALLY_DIRECT"
        : "PLATFORM_CUSTODY"
    );
    setManualCommissionRate(
      Number(organization.manualCommissionRate ?? organization.commissionRate ?? 0.05)
    );
    setMinimumMonthlyFee(Number(organization.minimumMonthlyFee ?? 20));
    setErrorMsg(null);
  }, [organization, isOpen]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (
      paymentCollectionMode === "ALLY_DIRECT" &&
      (!payoutBank.trim() || !contactPhone.trim())
    ) {
      setErrorMsg(t("errorDirectModeBankPhone"));
      return;
    }

    setLoading(true);

    const input: UpdateOrganizationInput = {
      tradeName,
      legalName,
      rif,
      contactEmail,
      contactPhone,
      pagoMovilPhone: contactPhone,
      fiscalAddress,
      referenceCurrencyCode,
      payoutBank,
      bankName: payoutBank,
      payoutAccountNumber,
      payoutAccountType,
      payoutAccountHolder,
      paymentCollectionMode,
      ...(userRole === "PLATFORM_ADMIN"
        ? { manualCommissionRate, minimumMonthlyFee }
        : {}),
    };

    const res = await updateOrganizationAction(input);
    setLoading(false);

    if (res.ok && res.data) {
      onSuccess(res.data);
      onClose();
    } else if (!res.ok) {
      setErrorMsg(res.error.code || t("errorUpdate"));
    }
  }

  return (
    <div
      className="modal-backdrop"
      id="org-modal-backdrop"
      onClick={onClose}
    >
      <div
        className="modal-card flex max-h-[90vh] w-full max-w-[680px] flex-col overflow-hidden rounded-2xl border border-border-medium bg-surface shadow-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4.5">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🏢</span>
            <h3 className="m-0 text-[17px] font-bold text-foreground">
              {t("modalTitle")}
            </h3>
          </div>
          <button
            type="button"
            className="btn-icon cursor-pointer border-none bg-transparent text-lg text-muted-foreground hover:text-foreground"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5">
          {errorMsg && (
            <div className="mb-4 rounded-lg border border-status-cancelled-border bg-status-cancelled-bg px-3.5 py-2.5 text-[13px] text-status-cancelled-fg">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* Modalidad de Cobro de Reservas */}
          <div className="mb-4 rounded-xl border border-accent/40 bg-accent/5 p-3.5">
            <div className="mb-2 text-xs font-extrabold tracking-wider text-foreground uppercase">
              💳 {t("collectionModeSectionTitle")}
            </div>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <label
                className={`flex cursor-pointer flex-col rounded-xl border p-3 transition-all ${
                  paymentCollectionMode === "PLATFORM_CUSTODY"
                    ? "border-accent bg-surface ring-1 ring-accent"
                    : "border-border bg-surface/60 hover:border-border-medium"
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="paymentCollectionMode"
                    value="PLATFORM_CUSTODY"
                    checked={paymentCollectionMode === "PLATFORM_CUSTODY"}
                    onChange={() => setPaymentCollectionMode("PLATFORM_CUSTODY")}
                    className="accent-accent"
                    id="radio-mode-platform-custody"
                  />
                  <span className="text-xs font-bold text-foreground">
                    {t("modeOption1Title")}
                  </span>
                </div>
                <span className="mt-1 pl-5 text-[11px] leading-snug text-muted-foreground">
                  {t("modeOption1Desc")}
                </span>
              </label>

              <label
                className={`flex cursor-pointer flex-col rounded-xl border p-3 transition-all ${
                  paymentCollectionMode === "ALLY_DIRECT"
                    ? "border-accent bg-surface ring-1 ring-accent"
                    : "border-border bg-surface/60 hover:border-border-medium"
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="paymentCollectionMode"
                    value="ALLY_DIRECT"
                    checked={paymentCollectionMode === "ALLY_DIRECT"}
                    onChange={() => setPaymentCollectionMode("ALLY_DIRECT")}
                    className="accent-accent"
                    id="radio-mode-ally-direct"
                  />
                  <span className="text-xs font-bold text-foreground">
                    {t("modeOption2Title")}
                  </span>
                </div>
                <span className="mt-1 pl-5 text-[11px] leading-snug text-muted-foreground">
                  {t("modeOption2Desc")}
                </span>
              </label>
            </div>

            {userRole === "PLATFORM_ADMIN" && (
              <div className="mt-3 grid grid-cols-1 gap-3 border-t border-border/60 pt-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-muted-foreground">
                    {t("manualCommissionRateLabel")}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={manualCommissionRate}
                    onChange={(e) => setManualCommissionRate(Number(e.target.value))}
                    className="input-field form-input text-xs"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-muted-foreground">
                    {t("minimumMonthlyFeeLabel")}
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={minimumMonthlyFee}
                    onChange={(e) => setMinimumMonthlyFee(Number(e.target.value))}
                    className="input-field form-input text-xs"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="mb-3.5 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <div className="form-group">
              <label className="form-label mb-1 block text-xs font-semibold text-foreground">
                {t("tradeName")}
              </label>
              <input
                type="text"
                id="org-trade-name-input"
                className="input-field form-input"
                required
                value={tradeName}
                onChange={(e) => setTradeName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label mb-1 block text-xs font-semibold text-foreground">
                {t("legalName")}
              </label>
              <input
                type="text"
                id="org-legal-name-input"
                className="input-field form-input"
                required
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
              />
            </div>
          </div>

          <div className="mb-3.5 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <div className="form-group">
              <label className="form-label mb-1 block text-xs font-semibold text-foreground">
                {t("rif")}
              </label>
              <input
                type="text"
                id="org-rif-input"
                className="input-field form-input"
                required
                value={rif}
                onChange={(e) => setRif(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label mb-1 block text-xs font-semibold text-foreground">
                {t("referenceCurrency")}
              </label>
              <select
                id="org-currency-select"
                className="input-field form-select"
                value={referenceCurrencyCode}
                onChange={(e) => setReferenceCurrencyCode(e.target.value)}
              >
                <option value="USD">{t("currencyUsd")}</option>
                <option value="EUR">{t("currencyEur")}</option>
              </select>
            </div>
          </div>

          <div className="mb-3.5 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <div className="form-group">
              <label className="form-label mb-1 block text-xs font-semibold text-foreground">
                {t("contactEmail")}
              </label>
              <input
                type="email"
                id="org-email-input"
                className="input-field form-input"
                required
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label mb-1 block text-xs font-semibold text-foreground">
                {t("contactPhone")}
              </label>
              <input
                type="tel"
                id="org-phone-input"
                className="input-field form-input"
                required
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group mb-4">
            <label className="form-label mb-1 block text-xs font-semibold text-foreground">
              {t("fiscalAddress")}
            </label>
            <input
              type="text"
              id="org-address-input"
              className="input-field form-input"
              required
              value={fiscalAddress}
              onChange={(e) => setFiscalAddress(e.target.value)}
            />
          </div>

          {/* Payout Banking Details */}
          <div className="mb-4 rounded-xl border border-border bg-muted p-3.5">
            <div className="mb-2.5 text-xs font-bold text-link uppercase">
              🏦 {t("payoutBank")}
            </div>

            <div className="mb-2.5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="form-group">
                <label className="form-label mb-1 block text-[11px] font-medium text-muted-foreground">
                  {t("bankName")}
                </label>
                <select
                  id="org-bank-select"
                  className="input-field form-select"
                  value={payoutBank}
                  onChange={(e) => setPayoutBank(e.target.value)}
                >
                  <option value="0102 - Banco de Venezuela">0102 - Banco de Venezuela</option>
                  <option value="0134 - Banesco">0134 - Banesco</option>
                  <option value="0105 - Banco Mercantil">0105 - Banco Mercantil</option>
                  <option value="0108 - Banco Provincial">0108 - Banco Provincial</option>
                  <option value="0172 - Bancamiga">0172 - Bancamiga</option>
                  <option value="0114 - Bancaribe">0114 - Bancaribe</option>
                  <option value="0116 - Banco Occidental de Descuento (BOD)">0116 - B.O.D.</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label mb-1 block text-[11px] font-medium text-muted-foreground">
                  {t("accountType")}
                </label>
                <select
                  id="org-account-type-select"
                  className="input-field form-select"
                  value={payoutAccountType}
                  onChange={(e) => setPayoutAccountType(e.target.value)}
                >
                  <option value="Corriente">{t("accountTypeChecking")}</option>
                  <option value="Ahorro">{t("accountTypeSavings")}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1.2fr_1fr]">
              <div className="form-group">
                <label className="form-label mb-1 block text-[11px] font-medium text-muted-foreground">
                  {t("accountNumber")}
                </label>
                <input
                  type="text"
                  id="org-account-number-input"
                  className="input-field form-input"
                  maxLength={20}
                  placeholder="01020000000000000001"
                  required
                  value={payoutAccountNumber}
                  onChange={(e) => setPayoutAccountNumber(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label mb-1 block text-[11px] font-medium text-muted-foreground">
                  {t("accountHolder")}
                </label>
                <input
                  type="text"
                  id="org-account-holder-input"
                  className="input-field form-input"
                  placeholder={t("accountHolderPlaceholder")}
                  required
                  value={payoutAccountHolder}
                  onChange={(e) => setPayoutAccountHolder(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="mt-5 flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onClose}
              disabled={loading}
              id="btn-cancel-org"
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={loading}
              id="btn-save-org"
            >
              {t("save")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
