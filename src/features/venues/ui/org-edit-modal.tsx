"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/shared/ui/button";
import type { OrganizationData, UpdateOrganizationInput } from "../model/types";
import { updateOrganizationAction } from "../actions/venues-actions";

interface OrgEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  organization: OrganizationData;
  onSuccess: (updated: OrganizationData) => void;
}

export function OrgEditModal({
  isOpen,
  onClose,
  organization,
  onSuccess,
}: OrgEditModalProps) {
  const t = useTranslations("venues.org");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [tradeName, setTradeName] = useState(organization.tradeName || "");
  const [legalName, setLegalName] = useState(organization.legalName || "");
  const [rif, setRif] = useState(organization.rif || "");
  const [contactEmail, setContactEmail] = useState(organization.contactEmail || "");
  const [contactPhone, setContactPhone] = useState(organization.contactPhone || "");
  const [fiscalAddress, setFiscalAddress] = useState(organization.fiscalAddress || "");
  const [referenceCurrencyCode, setReferenceCurrencyCode] = useState(
    organization.referenceCurrencyCode || "USD"
  );
  const [payoutBank, setPayoutBank] = useState(organization.payoutBank || "0102 - Banco de Venezuela");
  const [payoutAccountNumber, setPayoutAccountNumber] = useState(
    organization.payoutAccountNumber || ""
  );
  const [payoutAccountType, setPayoutAccountType] = useState(
    organization.payoutAccountType || "Corriente"
  );
  const [payoutAccountHolder, setPayoutAccountHolder] = useState(
    organization.payoutAccountHolder || ""
  );

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const input: UpdateOrganizationInput = {
      tradeName,
      legalName,
      rif,
      contactEmail,
      contactPhone,
      fiscalAddress,
      referenceCurrencyCode,
      payoutBank,
      payoutAccountNumber,
      payoutAccountType,
      payoutAccountHolder,
    };

    const res = await updateOrganizationAction(input);
    setLoading(false);

    if (res.ok && res.data) {
      onSuccess(res.data);
      onClose();
    } else if (!res.ok) {
      setErrorMsg(res.error.code || "Error al actualizar la organización");
    }
  }

  return (
    <div
      className="modal-backdrop"
      id="org-modal-backdrop"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.65)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "16px",
      }}
    >
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-medium)",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "640px",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "var(--shadow-lg, 0 10px 25px rgba(0,0,0,0.3))",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "18px 24px",
            borderBottom: "1px solid var(--border-subtle)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "20px" }}>🏢</span>
            <h3 style={{ fontSize: "17px", fontWeight: 700, margin: 0 }}>
              {t("modalTitle")}
            </h3>
          </div>
          <button
            type="button"
            className="btn-icon"
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "18px",
              cursor: "pointer",
              color: "var(--text-muted)",
            }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>
          {errorMsg && (
            <div
              style={{
                background: "rgba(220, 38, 38, 0.1)",
                border: "1px solid rgba(220, 38, 38, 0.3)",
                color: "var(--status-cancelled-text, #ef4444)",
                padding: "10px 14px",
                borderRadius: "8px",
                fontSize: "13px",
                marginBottom: "16px",
              }}
            >
              {errorMsg}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: "12px", fontWeight: 600 }}>
                {t("tradeName")}
              </label>
              <input
                type="text"
                id="org-trade-name-input"
                className="input-field"
                required
                value={tradeName}
                onChange={(e) => setTradeName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: "12px", fontWeight: 600 }}>
                {t("legalName")}
              </label>
              <input
                type="text"
                id="org-legal-name-input"
                className="input-field"
                required
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: "12px", fontWeight: 600 }}>
                {t("rif")}
              </label>
              <input
                type="text"
                id="org-rif-input"
                className="input-field"
                required
                value={rif}
                onChange={(e) => setRif(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: "12px", fontWeight: 600 }}>
                {t("referenceCurrency")}
              </label>
              <select
                id="org-currency-select"
                className="input-field"
                value={referenceCurrencyCode}
                onChange={(e) => setReferenceCurrencyCode(e.target.value)}
              >
                <option value="USD">Dólar BCV ($ USD)</option>
                <option value="EUR">Euro BCV (€ EUR)</option>
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: "12px", fontWeight: 600 }}>
                {t("contactEmail")}
              </label>
              <input
                type="email"
                id="org-email-input"
                className="input-field"
                required
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: "12px", fontWeight: 600 }}>
                {t("contactPhone")}
              </label>
              <input
                type="tel"
                id="org-phone-input"
                className="input-field"
                required
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: "16px" }}>
            <label className="form-label" style={{ fontSize: "12px", fontWeight: 600 }}>
              {t("fiscalAddress")}
            </label>
            <input
              type="text"
              id="org-address-input"
              className="input-field"
              required
              value={fiscalAddress}
              onChange={(e) => setFiscalAddress(e.target.value)}
            />
          </div>

          {/* Payout Banking Details */}
          <div
            style={{
              background: "var(--bg-muted)",
              borderRadius: "12px",
              padding: "14px",
              border: "1px solid var(--border-subtle)",
              marginBottom: "16px",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                fontWeight: 700,
                textTransform: "uppercase",
                color: "var(--text-link)",
                marginBottom: "10px",
              }}
            >
              🏦 {t("payoutBank")}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "10px" }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: "11px" }}>
                  {t("bankName")}
                </label>
                <select
                  id="org-bank-select"
                  className="input-field"
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
                <label className="form-label" style={{ fontSize: "11px" }}>
                  {t("accountType")}
                </label>
                <select
                  id="org-account-type-select"
                  className="input-field"
                  value={payoutAccountType}
                  onChange={(e) => setPayoutAccountType(e.target.value)}
                >
                  <option value="Corriente">Corriente</option>
                  <option value="Ahorro">Ahorro</option>
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "12px" }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: "11px" }}>
                  {t("accountNumber")}
                </label>
                <input
                  type="text"
                  id="org-account-number-input"
                  className="input-field"
                  maxLength={20}
                  placeholder="01020000000000000001"
                  required
                  value={payoutAccountNumber}
                  onChange={(e) => setPayoutAccountNumber(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: "11px" }}>
                  {t("accountHolder")}
                </label>
                <input
                  type="text"
                  id="org-account-holder-input"
                  className="input-field"
                  placeholder="Nombre de la Empresa"
                  required
                  value={payoutAccountHolder}
                  onChange={(e) => setPayoutAccountHolder(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "20px" }}>
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
