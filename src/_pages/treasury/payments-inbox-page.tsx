"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  rejectPaymentAction,
  verifyPaymentAction,
} from "@/features/treasury/actions/treasury-actions";
import type { PaymentItem, PaymentsInboxData } from "@/features/treasury/model/types";
import { PaymentsKpiStrip } from "@/features/treasury/ui/payments-kpi-strip";
import { PaymentsFilterBar } from "@/features/treasury/ui/payments-filter-bar";
import { PaymentsTable } from "@/features/treasury/ui/payments-table";
import { VoucherDrawer } from "@/features/treasury/ui/voucher-drawer";
import { PaymentRejectModal } from "@/features/treasury/ui/payment-reject-modal";

import type { BackofficeRole } from "@/shared/config";

interface PaymentsInboxPageProps {
  initialData: PaymentsInboxData;
  userRole?: BackofficeRole;
}

export function PaymentsInboxPage({
  initialData,
  userRole = "PLATFORM_ADMIN",
}: PaymentsInboxPageProps) {
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
    const all = items.length;
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

  const handleConfirmReject = async (
    paymentId: string,
    reason: string,
    action: "RETRY" | "CANCEL" = "RETRY",
    notes?: string,
  ) => {
    setIsProcessingId(paymentId);
    try {
      const res = await rejectPaymentAction(paymentId, reason, action, notes);
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
          setSelectedVoucherPayment((prev) =>
            prev ? { ...prev, status: "REJECTED", rejectionReason: reason } : null,
          );
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
    <div className="payments-inbox-container pb-10">
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
      <section className="px-5">
        <PaymentsTable
          payments={filteredItems}
          userRole={userRole}
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
        userRole={userRole}
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
          className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
          onClick={() => setReasonModalPayment(null)}
        >
          <div
            className="modal-card w-full max-w-[440px] rounded-[20px] border border-border bg-surface p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3.5 flex items-center gap-2.5">
              <span className="text-2xl">⚠️</span>
              <h3 className="m-0 text-[17px] font-bold text-foreground">
                {t("reasonModal.title", {
                  ref: reasonModalPayment.referenceNumber ?? t("table.noRef"),
                })}
              </h3>
            </div>

            <div className="mb-5 rounded-xl border border-status-cancelled-border bg-status-cancelled-bg px-4 py-3.5">
              <div className="text-[13.5px] font-semibold text-status-cancelled-fg">
                {reasonModalPayment.rejectionReason || t("reasonModal.defaultReason")}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                className="btn btn-outline rounded-[10px] px-4 py-2 text-[13px]"
                onClick={() => setReasonModalPayment(null)}
              >
                {t("reasonModal.close")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
