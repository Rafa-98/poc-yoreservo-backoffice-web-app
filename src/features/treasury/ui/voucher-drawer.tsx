"use client";

import { useTranslations } from "next-intl";
import type { PaymentItem } from "../model/types";

interface VoucherDrawerProps {
  payment: PaymentItem | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (paymentId: string) => Promise<void>;
  onOpenReject: (payment: PaymentItem) => void;
  isProcessing?: boolean;
}

export function VoucherDrawer({
  payment,
  isOpen,
  onClose,
  onApprove,
  onOpenReject,
  isProcessing = false,
}: VoucherDrawerProps) {
  const t = useTranslations("treasury.inbox.voucher");

  if (!isOpen || !payment) return null;

  const bankName =
    payment.originBank === "0134"
      ? "BANESCO BANCO UNIVERSAL"
      : payment.originBank === "0105"
      ? "BANCO MERCANTIL"
      : payment.originBank === "0102"
      ? "BANCO DE VENEZUELA"
      : payment.originBank === "0172"
      ? "BANCAMIGA BANCO UNIVERSAL"
      : payment.originBank || "BANCO UNIVERSAL";

  const bankAccentColor =
    payment.originBank === "0134"
      ? "#005696"
      : payment.originBank === "0105"
      ? "#EA7600"
      : payment.originBank === "0102"
      ? "#B91C1C"
      : payment.originBank === "0172"
      ? "#008852"
      : "var(--brand-lime)";

  const amountBs = payment.amountVes
    ? payment.amountVes.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : (payment.amount * (payment.exchangeRate || 876.8)).toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const amountUsd = payment.amountReference
    ? payment.amountReference.toFixed(2)
    : payment.amount.toFixed(2);

  const rateValue = payment.exchangeRate ? payment.exchangeRate.toFixed(2) : "876.80";

  return (
    <>
      {/* BACKDROP */}
      <div
        className="drawer-backdrop"
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(4px)",
          zIndex: 9998,
        }}
      />

      {/* DRAWER PANEL */}
      <aside
        id="voucher-drawer-panel"
        className="drawer-panel"
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "100%",
          maxWidth: 520,
          background: "var(--bg-surface)",
          borderLeft: "1px solid var(--border-subtle)",
          boxShadow: "-8px 0 24px rgba(0,0,0,0.25)",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* HEADER */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid var(--border-subtle)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "var(--text-link)",
              }}
            >
              {t("title")}
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginTop: 2, color: "var(--text-main)" }}>
              {t("refTitle", { ref: payment.referenceNumber ?? "S/N" })}
            </h3>
          </div>
          <button
            type="button"
            className="btn-icon"
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: 18,
              cursor: "pointer",
              color: "var(--text-muted)",
            }}
          >
            ✕
          </button>
        </div>

        {/* BODY */}
        <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>
          {/* COMPARISON BANNER */}
          <div
            style={{
              background: "rgba(198, 242, 59, 0.12)",
              border: "1px solid rgba(198, 242, 59, 0.25)",
              borderRadius: 12,
              padding: "12px 14px",
              marginBottom: 20,
            }}
          >
            <div style={{ fontSize: 12.5, color: "var(--text-main)", lineHeight: 1.4 }}>
              🔍 <strong>{t("directViewer")}</strong> {t("directViewerDesc")}
            </div>
          </div>

          {/* SIMULATED DIGITAL RECEIPT */}
          <div
            style={{
              background: "#080C07",
              borderRadius: 16,
              padding: 18,
              border: "1px solid var(--border-subtle)",
              marginBottom: 20,
            }}
          >
            <div
              style={{
                background: "#FFFFFF",
                color: "#121811",
                borderRadius: 12,
                padding: 20,
                fontFamily: "'Courier New', Courier, monospace",
                fontSize: 12,
                lineHeight: 1.5,
                boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
                borderTop: `5px solid ${bankAccentColor}`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderBottom: "1px dashed #CAD0C5",
                  paddingBottom: 8,
                  marginBottom: 12,
                }}
              >
                <strong style={{ color: bankAccentColor, fontSize: 13.5 }}>{bankName}</strong>
                <span style={{ fontSize: 10, color: "#5C6659" }}>PAGO MÓVIL P2P</span>
              </div>

              <div style={{ textAlign: "center", margin: "14px 0" }}>
                <div style={{ fontSize: 11, color: "#5C6659", textTransform: "uppercase" }}>
                  {t("transferredAmount")}
                </div>
                <div style={{ fontSize: 24, fontWeight: 700, color: "#141A13" }}>Bs. {amountBs}</div>
                <div style={{ fontSize: 11, color: "#059669", fontWeight: 600 }}>
                  {t("rateEquivalent", { usd: amountUsd, rate: rateValue })}
                </div>
              </div>

              <div
                style={{
                  borderTop: "1px dashed #CAD0C5",
                  paddingTop: 10,
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#5C6659" }}>{t("refCode")}</span>
                  <strong>{payment.referenceNumber ?? "---"}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#5C6659" }}>{t("payer")}</span>
                  <strong>{payment.reservation?.client?.name} {payment.reservation?.client?.lastName}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#5C6659" }}>{t("idDoc")}</span>
                  <strong>{payment.payerIdDocument ?? "V-24.889.123"}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#5C6659" }}>{t("phone")}</span>
                  <strong>{payment.phoneNumber ?? "+58 424 555 4433"}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#5C6659" }}>{t("destination")}</span>
                  <strong>0134 • 0414 123 4567</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#5C6659" }}>{t("dateTime")}</span>
                  <strong>
                    {payment.paymentDate ? `${payment.paymentDate} 15:42:10` : "12/10/2026 15:42:10"}
                  </strong>
                </div>
              </div>

              <div
                style={{
                  textAlign: "center",
                  marginTop: 14,
                  fontSize: 9.5,
                  color: "#5C6659",
                  borderTop: "1px solid #E2E6DF",
                  paddingTop: 8,
                }}
              >
                {t("suicheNotice")}
              </div>
            </div>
          </div>

          {/* ASSOCIATED BOOKING */}
          <div
            style={{
              background: "var(--bg-muted)",
              borderRadius: 14,
              padding: "14px 16px",
              border: "1px solid var(--border-subtle)",
              marginBottom: 20,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                color: "var(--text-muted)",
                marginBottom: 4,
              }}
            >
              {t("linkedBooking")}
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-main)" }}>
              #{payment.reservation?.shortCode} — {payment.reservation?.space?.spaceNumber} ({payment.reservation?.startTime} - {payment.reservation?.endTime})
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
              {payment.reservation?.space?.venue?.name}
            </div>
          </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid var(--border-subtle)",
            display: "flex",
            gap: 12,
            background: "var(--bg-surface)",
          }}
        >
          {payment.status === "PENDING" && (
            <>
              <button
                id="drawer-reject-btn"
                type="button"
                className="btn btn-destructive"
                style={{ flex: 1, padding: "10px 16px", fontSize: 13, borderRadius: 10 }}
                onClick={() => onOpenReject(payment)}
                disabled={isProcessing}
              >
                ✕ {t("reject")}
              </button>
              <button
                id="drawer-approve-btn"
                type="button"
                className="btn btn-primary"
                style={{ flex: 1.5, padding: "10px 16px", fontSize: 13, borderRadius: 10 }}
                onClick={() => onApprove(payment.id)}
                disabled={isProcessing}
              >
                ✓ {t("reconcileConfirm")}
              </button>
            </>
          )}

          {payment.status !== "PENDING" && (
            <button
              type="button"
              className="btn btn-outline"
              style={{ width: "100%", padding: "10px 16px", fontSize: 13, borderRadius: 10 }}
              onClick={onClose}
            >
              Cerrar Auditoría
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
