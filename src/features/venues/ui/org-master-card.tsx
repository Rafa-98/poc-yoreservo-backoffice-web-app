"use client";

import React from "react";
import { useTranslations } from "next-intl";
import type { OrganizationData } from "../model/types";

interface OrgMasterCardProps {
  organization: OrganizationData;
  bcvRate?: number;
  onOpenEditModal: () => void;
}

export function OrgMasterCard({
  organization,
  bcvRate = 41.0,
  onOpenEditModal,
}: OrgMasterCardProps) {
  const t = useTranslations("venues.org");

  const isEur = organization.referenceCurrencyCode === "EUR";
  const currencyLabel = isEur ? "Euro BCV (€ EUR)" : "Dólar BCV ($ USD)";
  const currencyRateLabel = isEur
    ? `Tasa: ${(bcvRate * 1.08).toFixed(2)} Bs./EUR`
    : `Tasa: ${bcvRate.toFixed(2)} Bs./USD`;

  return (
    <section style={{ padding: "20px 20px 0" }}>
      <div
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-medium)",
          borderRadius: "16px",
          padding: "18px 20px",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: "14px",
            marginBottom: "14px",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "4px",
              }}
            >
              <span style={{ fontSize: "18px" }}>🏢</span>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "var(--text-link)",
                }}
              >
                {t("badge")}
              </span>
              <span className="badge badge-available">
                {t("active")}
              </span>
            </div>
            <h3
              style={{ fontSize: "20px", fontWeight: 700, margin: 0 }}
              id="card-org-name"
            >
              {organization.tradeName || organization.legalName}
            </h3>
            <div
              style={{
                fontSize: "13px",
                color: "var(--text-muted)",
                marginTop: "2px",
              }}
            >
              <strong style={{ color: "var(--text-main)" }}>
                {t("legalName").replace(" *", "")}:
              </strong>{" "}
              {organization.legalName} •{" "}
              <strong style={{ color: "var(--text-main)" }}>
                {t("rif").replace(" *", "")}:
              </strong>{" "}
              {organization.rif}
            </div>
          </div>
          <button
            type="button"
            className="btn btn-outline"
            onClick={onOpenEditModal}
            id="btn-edit-org"
            style={{ fontSize: "12.5px" }}
          >
            ✏️ <span>{t("btnEdit")}</span>
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "12px",
            background: "var(--bg-muted)",
            borderRadius: "12px",
            padding: "14px",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "11.5px",
                color: "var(--text-muted)",
                textTransform: "uppercase",
                fontWeight: 600,
              }}
            >
              {t("bcvRef")}
            </div>
            <div
              style={{
                fontSize: "13px",
                fontWeight: 700,
                color: "#2563EB",
                marginTop: "3px",
              }}
              id="card-org-currency"
            >
              {currencyLabel}
            </div>
            <div
              style={{ fontSize: "12px", color: "var(--text-muted)" }}
              id="card-org-rate"
            >
              {currencyRateLabel}
            </div>
          </div>

          <div>
            <div
              style={{
                fontSize: "11.5px",
                color: "var(--text-muted)",
                textTransform: "uppercase",
                fontWeight: 600,
              }}
            >
              {t("payoutBank")}
            </div>
            <div
              style={{ fontSize: "13px", fontWeight: 700, marginTop: "3px" }}
              id="card-org-bank"
            >
              {organization.payoutBank || "0102 - Banco de Venezuela"}
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              Cta. {organization.payoutAccountType || "Corriente"} ••••
              {organization.payoutAccountNumber?.slice(-4) || "0000"} (
              {organization.rif})
            </div>
          </div>

          <div>
            <div
              style={{
                fontSize: "11.5px",
                color: "var(--text-muted)",
                textTransform: "uppercase",
                fontWeight: 600,
              }}
            >
              {t("commercialTerms")}
            </div>
            <div
              style={{
                fontSize: "13px",
                fontWeight: 700,
                color: "var(--brand-lime-text, var(--text-link))",
                marginTop: "3px",
              }}
            >
              {t("commission")}
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              {t("netPayout")}
            </div>
          </div>

          <div>
            <div
              style={{
                fontSize: "11.5px",
                color: "var(--text-muted)",
                textTransform: "uppercase",
                fontWeight: 600,
              }}
            >
              {t("managedVenues")}
            </div>
            <div
              style={{ fontSize: "13px", fontWeight: 700, marginTop: "3px" }}
            >
              {t("managedCount", {
                count: organization.venuesCount,
              })}
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              {organization.spacesCount} canchas totales
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
