"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  getPaymentsInboxAction,
  rejectPaymentAction,
  verifyPaymentAction,
} from "@/features/treasury/actions/treasury-actions";
import type { PaymentItem, PaymentsInboxData } from "@/features/treasury/model/types";
import { PaymentsKpiStrip } from "@/features/treasury/ui/payments-kpi-strip";
import { PaymentsFilterBar } from "@/features/treasury/ui/payments-filter-bar";
import { PaymentsTable } from "@/features/treasury/ui/payments-table";
import { VoucherDrawer } from "@/features/treasury/ui/voucher-drawer";
import { PaymentRejectModal } from "@/features/treasury/ui/payment-reject-modal";

interface PaymentsInboxPageProps {
  initialData: PaymentsInboxData;
}

export function PaymentsInboxPage({ initialData }: PaymentsInboxPageProps) {
  const t = useTranslations("treasury.inbox");

  const [items, setItems] = useState<PaymentItem[]>(initialData.items);
  const [kpis, setKpis] = useState(initialData.kpis);

  // Filters
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [bankFilter, setBankFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals / Drawers
  const [selectedVoucherPayment, setSelectedVoucherPayment] = useState<PaymentItem | null>(null);
  const [rejectingPayment, setRejectingPayment] = useState<PaymentItem | null>(null);
  const [isProcessingId, setIsProcessingId] = useState<string | null>(null);
  const [reasonModalPayment, setReasonModalPayment] = useState<PaymentItem | null>(null);

  // Filtered payments
  const filteredItems = useMemo(() => {
    return items.filter((p) => {
      // 1. Status Filter
      if (statusFilter !== "ALL") {
        if (statusFilter === "PENDING" && p.status !== "PENDING") return false;
        if (statusFilter === "VERIFIED" && p.status !== "VERIFIED") return false;
        if (statusFilter === "REJECTED" && p.status !== "REJECTED" && p.status !== "FAILED") return false;
      }

      // 2. Bank Filter
      if (bankFilter !== "ALL" && p.originBank !== bankFilter) {
        return false;
      }

      // 3. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesRef = p.referenceNumber?.toLowerCase().includes(q);
        const matchesName = `${p.reservation?.client?.name} ${p.reservation?.client?.lastName}`
          .toLowerCase()
          .includes(q);
        const matchesPhone = p.phoneNumber?.includes(q);
        const matchesCode = p.reservation?.shortCode?.toLowerCase().includes(q);
        if (!matchesRef && !matchesName && !matchesPhone && !matchesCode) {
          return false;
        }
      }

      return true;
    });
  }, [items, statusFilter, bankFilter, searchQuery]);

  // Counts for filter chips
  const counts = useMemo(() => {
    let all = items.length;
    let pending = 0;
    let verified = 0;
    let rejected = 0;

    for (const item of items) {
      if (item.status === "PENDING") pending++;
      else if (item.status === "VERIFIED") verified++;
      else if (item.status === "REJECTED" || item.status === "FAILED") rejected++;
    }

    return { all, pending, verified, rejected };
  }, [items]);

  // Actions
  const handleApprove = async (paymentId: string) => {
    setIsProcessingId(paymentId);
    try {
      const res = await verifyPaymentAction(paymentId);
      if (res.ok) {
        // Optimistic update
        setItems((prev) =>
          prev.map((item) =>
            item.id === paymentId
              ? { ...item, status: "VERIFIED", verifiedAt: new Date().toISOString() }
              : item,
          ),
        );
        setKpis((prev) => ({
          ...prev,
          pendingCount: Math.max(0, prev.pendingCount - 1),
          verifiedTodayCount: prev.verifiedTodayCount + 1,
        }));
        if (selectedVoucherPayment?.id === paymentId) {
          setSelectedVoucherPayment((prev) => (prev ? { ...prev, status: "VERIFIED" } : null));
        }
      }
    } finally {
      setIsProcessingId(null);
    }
  };

  const handleOpenReject = (payment: PaymentItem) => {
    setRejectingPayment(payment);
  };

  const handleConfirmReject = async (paymentId: string, reason: string, notes?: string) => {
    setIsProcessingId(paymentId);
    try {
      const res = await rejectPaymentAction(paymentId, reason, notes);
      if (res.ok) {
        setItems((prev) =>
          prev.map((item) =>
            item.id === paymentId
              ? {
                  ...item,
                  status: "REJECTED",
                  rejectionReason: reason,
                  verifiedAt: new Date().toISOString(),
                }
              : item,
          ),
        );
        setKpis((prev) => ({
          ...prev,
          pendingCount: Math.max(0, prev.pendingCount - 1),
          rejectedCount: prev.rejectedCount + 1,
        }));
        setRejectingPayment(null);
        if (selectedVoucherPayment?.id === paymentId) {
          setSelectedVoucherPayment((prev) => (prev ? { ...prev, status: "REJECTED", rejectionReason: reason } : null));
        }
      }
    } finally {
      setIsProcessingId(null);
    }
  };

  const handleViewReason = (payment: PaymentItem) => {
    setReasonModalPayment(payment);
  };

  return (
    <div className="payments-inbox-container" style={{ paddingBottom: 40 }}>
      {/* KPI STRIP */}
      <PaymentsKpiStrip kpis={kpis} />

      {/* FILTERS */}
      <PaymentsFilterBar
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        bankFilter={bankFilter}
        onBankChange={setBankFilter}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        counts={counts}
      />

      {/* TABLE */}
      <section style={{ padding: "0 20px" }}>
        <PaymentsTable
          payments={filteredItems}
          onOpenVoucher={setSelectedVoucherPayment}
          onApprove={handleApprove}
          onOpenReject={handleOpenReject}
          onViewReason={handleViewReason}
          isProcessingId={isProcessingId}
        />
      </section>

      {/* IN-LINE VOUCHER AUDIT DRAWER */}
      <VoucherDrawer
        payment={selectedVoucherPayment}
        isOpen={Boolean(selectedVoucherPayment)}
        onClose={() => setSelectedVoucherPayment(null)}
        onApprove={handleApprove}
        onOpenReject={handleOpenReject}
        isProcessing={isProcessingId === selectedVoucherPayment?.id}
      />

      {/* REJECT AUDIT REASON MODAL */}
      <PaymentRejectModal
        payment={rejectingPayment}
        isOpen={Boolean(rejectingPayment)}
        onClose={() => setRejectingPayment(null)}
        onConfirm={handleConfirmReject}
        isProcessing={isProcessingId === rejectingPayment?.id}
      />

      {/* VIEW REASON POPUP / MODAL */}
      {reasonModalPayment && (
        <div
          className="modal-backdrop"
          onClick={() => setReasonModalPayment(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
            zIndex: 10000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: 20,
              width: "100%",
              maxWidth: 440,
              padding: 24,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <span style={{ fontSize: 24 }}>⚠️</span>
              <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: "var(--text-main)" }}>
                Causa de Rechazo de Pago #{reasonModalPayment.referenceNumber}
              </h3>
            </div>

            <div
              style={{
                background: "rgba(239, 68, 68, 0.08)",
                border: "1px solid rgba(239, 68, 68, 0.2)",
                borderRadius: 12,
                padding: "14px 16px",
                marginBottom: 20,
              }}
            >
              <div style={{ fontSize: 13.5, color: "var(--status-cancelled-text)", fontWeight: 600 }}>
                {reasonModalPayment.rejectionReason || "Referencia bancaria no localizada en el extracto de cuenta."}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                className="btn btn-outline"
                style={{ padding: "8px 16px", fontSize: 13, borderRadius: 10 }}
                onClick={() => setReasonModalPayment(null)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
