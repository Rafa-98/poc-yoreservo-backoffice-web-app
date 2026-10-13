"use client";

import { useTranslations } from "next-intl";
import type { PaymentItem } from "../model/types";

interface PaymentsTableProps {
  payments: PaymentItem[];
  onOpenVoucher: (payment: PaymentItem) => void;
  onApprove: (paymentId: string) => Promise<void>;
  onOpenReject: (payment: PaymentItem) => void;
  onViewReason: (payment: PaymentItem) => void;
  isProcessingId?: string | null;
}

export function PaymentsTable({
  payments,
  onOpenVoucher,
  onApprove,
  onOpenReject,
  onViewReason,
  isProcessingId,
}: PaymentsTableProps) {
  const t = useTranslations("treasury.inbox.table");

  if (payments.length === 0) {
    return (
      <div
        style={{
          padding: "48px 24px",
          textAlign: "center",
          background: "var(--bg-surface)",
          borderRadius: 20,
          border: "1px solid var(--border-subtle)",
          color: "var(--text-muted)",
          fontSize: 14,
        }}
      >
        <span style={{ fontSize: 32, display: "block", marginBottom: 8 }}>📭</span>
        {t("empty")}
      </div>
    );
  }

  const getBankLabel = (bankCode: string | null) => {
    switch (bankCode) {
      case "0134":
        return "0134 — Banesco";
      case "0105":
        return "0105 — Mercantil";
      case "0102":
        return "0102 — BDV";
      case "0172":
        return "0172 — Bancamiga";
      default:
        return bankCode ?? "Bancaribe / Otro";
    }
  };

  return (
    <div
      className="table-responsive"
      style={{
        width: "100%",
        overflowX: "auto",
        backgroundColor: "var(--bg-surface)",
        border: "1px solid var(--border-subtle)",
        borderRadius: 20,
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <table className="data-table" style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13.5 }}>
        <thead>
          <tr style={{ background: "var(--bg-app)", borderBottom: "1px solid var(--border-subtle)" }}>
            <th style={{ padding: "14px 18px", color: "var(--text-muted)", fontWeight: 700, fontSize: 11.5, textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>
              {t("ref")}
            </th>
            <th style={{ padding: "14px 18px", color: "var(--text-muted)", fontWeight: 700, fontSize: 11.5, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {t("client")}
            </th>
            <th style={{ padding: "14px 18px", color: "var(--text-muted)", fontWeight: 700, fontSize: 11.5, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {t("bank")}
            </th>
            <th style={{ padding: "14px 18px", color: "var(--text-muted)", fontWeight: 700, fontSize: 11.5, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {t("amount")}
            </th>
            <th style={{ padding: "14px 18px", color: "var(--text-muted)", fontWeight: 700, fontSize: 11.5, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {t("age")}
            </th>
            <th style={{ padding: "14px 18px", color: "var(--text-muted)", fontWeight: 700, fontSize: 11.5, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {t("status")}
            </th>
            <th style={{ padding: "14px 18px", color: "var(--text-muted)", fontWeight: 700, fontSize: 11.5, textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "right" }}>
              {t("actions")}
            </th>
          </tr>
        </thead>
        <tbody>
          {payments.map((p) => {
            const isPending = p.status === "PENDING";
            const isVerified = p.status === "VERIFIED";
            const isRejected = p.status === "REJECTED" || p.status === "FAILED";

            const amountBs = p.amountVes
              ? p.amountVes.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
              : (p.amount * (p.exchangeRate || 876.8)).toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

            const amountUsd = p.amountReference
              ? p.amountReference.toFixed(2)
              : p.amount.toFixed(2);

            const isCurrentProcessing = isProcessingId === p.id;

            return (
              <tr
                key={p.id}
                id={`row-pm-${p.referenceNumber ?? p.id}`}
                className={isVerified || isRejected ? "row-verified" : ""}
                style={{
                  borderBottom: "1px solid var(--border-subtle)",
                  transition: "background-color 0.15s ease",
                  opacity: isVerified ? 0.85 : 1,
                }}
              >
                {/* 1. REF & THUMBNAIL */}
                <td style={{ padding: "14px 18px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div
                      className="receipt-thumb"
                      onClick={() => onOpenVoucher(p)}
                      title="Ver Comprobante"
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 10,
                        backgroundColor: "var(--bg-muted)",
                        border: "1px solid var(--border-subtle)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 20,
                        transition: "transform 0.15s ease",
                      }}
                    >
                      🧾
                    </div>
                    <div>
                      <div
                        style={{
                          fontFamily: "Outfit, sans-serif",
                          fontWeight: 700,
                          fontSize: 14,
                          color: isRejected ? "var(--status-cancelled-text)" : "var(--text-link)",
                        }}
                      >
                        #{p.referenceNumber ?? "S/N"}
                      </div>
                      <span
                        className="text-link"
                        style={{
                          fontSize: 11,
                          cursor: "pointer",
                          color: "var(--text-link)",
                          textDecoration: "underline",
                        }}
                        onClick={() => onOpenVoucher(p)}
                      >
                        👁️ {t("inspect")}
                      </span>
                    </div>
                  </div>
                </td>

                {/* 2. CLIENT & BOOKING */}
                <td style={{ padding: "14px 18px" }}>
                  <div style={{ fontWeight: 700, color: "var(--text-main)" }}>
                    {p.reservation?.client?.name} {p.reservation?.client?.lastName}
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--text-muted)" }}>
                    Reserva: <strong>#{p.reservation?.shortCode}</strong> • {p.reservation?.space?.spaceNumber}
                  </div>
                </td>

                {/* 3. ORIGIN BANK & PHONE */}
                <td style={{ padding: "14px 18px" }}>
                  <div style={{ fontWeight: 600, color: "var(--text-main)" }}>
                    {getBankLabel(p.originBank)}
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--text-muted)" }}>
                    {p.phoneNumber ?? "+58 424 000 0000"}
                  </div>
                </td>

                {/* 4. AMOUNT IN BS & USD */}
                <td style={{ padding: "14px 18px" }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-main)" }}>
                    Bs. {amountBs}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    ${amountUsd} USD @ {(p.exchangeRate || 876.8).toFixed(2)}
                  </div>
                </td>

                {/* 5. AGE / TIMESTAMP */}
                <td style={{ padding: "14px 18px" }}>
                  {isPending ? (
                    <span
                      className="badge badge-hold"
                      style={{
                        fontSize: 11,
                        background: "rgba(234, 118, 0, 0.12)",
                        color: "var(--status-hold-text)",
                        padding: "3px 8px",
                        borderRadius: 6,
                        fontWeight: 600,
                      }}
                    >
                      Hace 8 min
                    </span>
                  ) : (
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      {p.paymentDate || "Hoy 08:00 AM"}
                    </span>
                  )}
                </td>

                {/* 6. STATUS BADGE */}
                <td style={{ padding: "14px 18px" }}>
                  {isPending && (
                    <span
                      className="badge badge-hold"
                      style={{
                        background: "rgba(234, 118, 0, 0.12)",
                        color: "var(--status-hold-text)",
                        padding: "4px 8px",
                        borderRadius: 6,
                        fontWeight: 700,
                        fontSize: 11.5,
                      }}
                    >
                      ⏳ Pendiente
                    </span>
                  )}
                  {isVerified && (
                    <span
                      className="badge badge-available"
                      style={{
                        background: "rgba(16, 185, 129, 0.12)",
                        color: "#059669",
                        padding: "4px 8px",
                        borderRadius: 6,
                        fontWeight: 700,
                        fontSize: 11.5,
                      }}
                    >
                      ✅ Conciliado
                    </span>
                  )}
                  {isRejected && (
                    <span
                      className="badge badge-cancelled"
                      style={{
                        background: "rgba(239, 68, 68, 0.12)",
                        color: "var(--status-cancelled-text)",
                        padding: "4px 8px",
                        borderRadius: 6,
                        fontWeight: 700,
                        fontSize: 11.5,
                      }}
                    >
                      ❌ No Conciliado
                    </span>
                  )}
                </td>

                {/* 7. AUDIT ACTIONS */}
                <td style={{ padding: "14px 18px", textAlign: "right" }}>
                  {isPending && (
                    <div style={{ display: "inline-flex", gap: 8 }}>
                      <button
                        id={`btn-validate-${p.referenceNumber ?? p.id}`}
                        type="button"
                        className="btn btn-primary"
                        style={{ padding: "6px 12px", fontSize: 12, borderRadius: 8 }}
                        onClick={() => onApprove(p.id)}
                        disabled={isCurrentProcessing}
                        title="Validar Pago"
                      >
                        ✓ {t("validate")}
                      </button>
                      <button
                        id={`btn-reject-${p.referenceNumber ?? p.id}`}
                        type="button"
                        className="btn btn-destructive"
                        style={{ padding: "6px 12px", fontSize: 12, borderRadius: 8 }}
                        onClick={() => onOpenReject(p)}
                        disabled={isCurrentProcessing}
                        title="Rechazar Pago"
                      >
                        ✕ {t("reject")}
                      </button>
                    </div>
                  )}

                  {isVerified && (
                    <button
                      type="button"
                      className="btn btn-outline"
                      style={{ padding: "6px 12px", fontSize: 12, borderRadius: 8 }}
                      onClick={() => onOpenVoucher(p)}
                    >
                      👁️ {t("audit")}
                    </button>
                  )}

                  {isRejected && (
                    <button
                      type="button"
                      className="btn btn-outline"
                      style={{ padding: "6px 12px", fontSize: 12, borderRadius: 8 }}
                      onClick={() => onViewReason(p)}
                    >
                      ⚠️ {t("viewReason")}
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
