"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  getPaymentsInboxAction,
  rejectPaymentAction,
  verifyPaymentAction,
} from "@/features/treasury/actions/treasury-actions";
import type {
  PaymentItem,
  PaymentsInboxData,
  TreasuryKpis,
} from "@/features/treasury/model/types";
import { PaymentsKpiStrip } from "@/features/treasury/ui/payments-kpi-strip";
import {
  PaymentsFilterBar,
  type PaymentCustodyTab,
  type PaymentDatePreset,
  type PaymentMethodTab,
  type PaymentMethodTabCounts,
} from "@/features/treasury/ui/payments-filter-bar";
import { PaymentsTable } from "@/features/treasury/ui/payments-table";
import { VoucherDrawer } from "@/features/treasury/ui/voucher-drawer";
import { PaymentRejectModal } from "@/features/treasury/ui/payment-reject-modal";
import { useActiveVenue } from "@/features/venues/context/venue-context";
import { useSidebarBadge } from "@/_app/layouts/app-sidebar";
import type { BackofficeRole } from "@/shared/config";

interface PaymentsInboxPageProps {
  initialData: PaymentsInboxData;
  userRole?: BackofficeRole;
}

function getCaracasTodayIso(): string {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "America/Caracas",
  }).format(new Date());
}

function shiftIsoDate(isoDate: string, deltaDays: number): string {
  const d = new Date(`${isoDate}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + deltaDays);
  return d.toISOString().slice(0, 10);
}

function computeDateBounds(
  preset: PaymentDatePreset,
  customFrom: string,
  customTo: string,
): { fromDate?: string; toDate?: string } {
  const today = getCaracasTodayIso();
  switch (preset) {
    case "TODAY":
      return { fromDate: today, toDate: today };
    case "YESTERDAY": {
      const yesterday = shiftIsoDate(today, -1);
      return { fromDate: yesterday, toDate: yesterday };
    }
    case "LAST_7_DAYS":
      return { fromDate: shiftIsoDate(today, -6), toDate: today };
    case "THIS_MONTH":
      return { fromDate: `${today.slice(0, 7)}-01`, toDate: today };
    case "CUSTOM":
      return {
        fromDate: customFrom || undefined,
        toDate: customTo || undefined,
      };
    case "ALL":
    default:
      return {};
  }
}

export function PaymentsInboxPage({
  initialData,
  userRole = "PLATFORM_ADMIN",
}: PaymentsInboxPageProps) {
  const { activeVenueId } = useActiveVenue();
  const { setPendingPaymentsCount } = useSidebarBadge();

  const defaultTab: PaymentCustodyTab =
    userRole === "ALLY_ADMIN" || userRole === "ALLY_ACCOUNTING"
      ? "ALLY_DIRECT"
      : "PLATFORM_CUSTODY";

  const [items, setItems] = useState<PaymentItem[]>(initialData.items);

  // Filters
  const [custodyTab, setCustodyTab] = useState<PaymentCustodyTab>(defaultTab);
  const [paymentMethodTab, setPaymentMethodTab] =
    useState<PaymentMethodTab>("PAGO_MOVIL");
  const [datePreset, setDatePreset] =
    useState<PaymentDatePreset>("LAST_7_DAYS");
  const [customFromDate, setCustomFromDate] = useState(() =>
    shiftIsoDate(getCaracasTodayIso(), -6),
  );
  const [customToDate, setCustomToDate] = useState(() => getCaracasTodayIso());
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [bankFilter, setBankFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Modals / Drawers
  const [selectedVoucherPayment, setSelectedVoucherPayment] =
    useState<PaymentItem | null>(null);
  const [rejectingPayment, setRejectingPayment] = useState<PaymentItem | null>(
    null,
  );
  const [isProcessingId, setIsProcessingId] = useState<string | null>(null);
  const isFirstRender = useRef(true);

  const activeBounds = useMemo(
    () => computeDateBounds(datePreset, customFromDate, customToDate),
    [datePreset, customFromDate, customToDate],
  );

  // Re-fetch from backend when Venue or Date Range changes
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    let cancelled = false;
    getPaymentsInboxAction({
      venueId:
        activeVenueId && activeVenueId !== "ALL" ? activeVenueId : undefined,
      fromDate: activeBounds.fromDate,
      toDate: activeBounds.toDate,
    }).then((res) => {
      if (!cancelled && res.ok) {
        setItems(res.data.items);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [activeVenueId, activeBounds.fromDate, activeBounds.toDate]);

  // 1. Venue + Date scoped payments
  const venueAndDateScopedItems = useMemo(() => {
    return items.filter((p) => {
      if (
        activeVenueId &&
        activeVenueId !== "ALL" &&
        p.reservation?.space?.venue?.id !== activeVenueId
      ) {
        return false;
      }

      const pDate =
        p.paymentDate || (p.createdAt ? p.createdAt.slice(0, 10) : "");
      if (activeBounds.fromDate && pDate && pDate < activeBounds.fromDate) {
        return false;
      }
      if (activeBounds.toDate && pDate && pDate > activeBounds.toDate) {
        return false;
      }
      return true;
    });
  }, [items, activeVenueId, activeBounds.fromDate, activeBounds.toDate]);

  // Custody tab counts across the active Sede + Date Range
  const custodyCounts = useMemo(() => {
    let allyDirectTotal = 0;
    let allyDirectPending = 0;
    let platformCustodyTotal = 0;
    let platformCustodyPending = 0;

    for (const p of venueAndDateScopedItems) {
      if (p.collectionMode === "ALLY_DIRECT") {
        allyDirectTotal++;
        if (p.status === "PENDING") allyDirectPending++;
      } else {
        platformCustodyTotal++;
        if (p.status === "PENDING") platformCustodyPending++;
      }
    }

    return {
      allyDirectTotal,
      allyDirectPending,
      platformCustodyTotal,
      platformCustodyPending,
    };
  }, [venueAndDateScopedItems]);

  // 2. Custody-scoped payments (for the active tab: ALLY_DIRECT vs PLATFORM_CUSTODY)
  const custodyScopedItems = useMemo(() => {
    return venueAndDateScopedItems.filter(
      (p) => (p.collectionMode ?? "PLATFORM_CUSTODY") === custodyTab,
    );
  }, [venueAndDateScopedItems, custodyTab]);

  // Counts per Payment Method within the active Custody Tab + Sede + Date Range
  const methodCounts = useMemo<
    Record<PaymentMethodTab, PaymentMethodTabCounts>
  >(() => {
    const map: Record<PaymentMethodTab, PaymentMethodTabCounts> = {
      PAGO_MOVIL: { total: 0, pending: 0 },
      CASH: { total: 0, pending: 0 },
      ZELLE: { total: 0, pending: 0 },
      PIPOL_PAY: { total: 0, pending: 0 },
    };

    for (const p of custodyScopedItems) {
      const m = (p.paymentMethod || "PAGO_MOVIL") as PaymentMethodTab;
      if (map[m]) {
        map[m].total++;
        if (p.status === "PENDING") {
          map[m].pending++;
        }
      }
    }
    return map;
  }, [custodyScopedItems]);

  // 3. Method-scoped payments (strictly separated by PaymentMethodTab)
  const methodScopedItems = useMemo(() => {
    return custodyScopedItems.filter(
      (p) => (p.paymentMethod || "PAGO_MOVIL") === paymentMethodTab,
    );
  }, [custodyScopedItems, paymentMethodTab]);

  // 4. Dynamic KPIs calculated from the active Sede + Date Range across ALL payment methods & custody accounts
  const dynamicKpis = useMemo<TreasuryKpis>(() => {
    let pendingCount = 0;
    let verifiedCount = 0;
    let rejectedCount = 0;

    for (const p of venueAndDateScopedItems) {
      if (p.status === "PENDING") pendingCount++;
      else if (p.status === "VERIFIED") verifiedCount++;
      else if (p.status === "REJECTED" || p.status === "FAILED")
        rejectedCount++;
    }

    const totalDecided = verifiedCount + rejectedCount;
    const approvalRatePct =
      totalDecided > 0
        ? Math.round((verifiedCount / totalDecided) * 1000) / 10
        : 100;

    return {
      pendingCount,
      pendingAmountBs: 0,
      pendingAmountUsd: 0,
      verifiedTodayCount: verifiedCount,
      rejectedCount,
      averageSpeedMin: "—",
      approvalRatePct,
    };
  }, [venueAndDateScopedItems]);

  // 5. Counts for Status Filter Chips (within the active Custody Tab + Payment Method Tab + Sede + Date Range)
  const counts = useMemo(() => {
    let pending = 0;
    let verified = 0;
    let rejected = 0;

    for (const p of methodScopedItems) {
      if (p.status === "PENDING") pending++;
      else if (p.status === "VERIFIED") verified++;
      else if (p.status === "REJECTED" || p.status === "FAILED") rejected++;
    }

    return {
      all: methodScopedItems.length,
      pending,
      verified,
      rejected,
    };
  }, [methodScopedItems]);

  // 6. Final table rows (filtered by Status, Bank, Search)
  const filteredItems = useMemo(() => {
    return methodScopedItems.filter((p) => {
      if (statusFilter !== "ALL") {
        if (statusFilter === "PENDING" && p.status !== "PENDING") return false;
        if (statusFilter === "VERIFIED" && p.status !== "VERIFIED")
          return false;
        if (
          statusFilter === "REJECTED" &&
          p.status !== "REJECTED" &&
          p.status !== "FAILED"
        )
          return false;
      }

      if (
        paymentMethodTab === "PAGO_MOVIL" &&
        bankFilter !== "ALL" &&
        p.originBank !== bankFilter
      ) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesRef = p.referenceNumber?.toLowerCase().includes(q);
        const matchesName =
          `${p.reservation?.client?.name} ${p.reservation?.client?.lastName}`
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
  }, [methodScopedItems, paymentMethodTab, statusFilter, bankFilter, searchQuery]);

  // Keep sidebar pending badge synchronized with total pending across all payment methods & accounts
  useEffect(() => {
    setPendingPaymentsCount(dynamicKpis.pendingCount);
  }, [dynamicKpis.pendingCount, setPendingPaymentsCount]);

  // Reset pagination to page 1 when any filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [
    custodyTab,
    paymentMethodTab,
    datePreset,
    customFromDate,
    customToDate,
    statusFilter,
    bankFilter,
    searchQuery,
    activeVenueId,
  ]);

  // Actions
  const handleApprove = async (paymentId: string) => {
    setIsProcessingId(paymentId);
    try {
      const res = await verifyPaymentAction(paymentId);
      if (res.ok) {
        setItems((prev) =>
          prev.map((item) =>
            item.id === paymentId
              ? {
                  ...item,
                  status: "VERIFIED",
                  verifiedAt: new Date().toISOString(),
                }
              : item,
          ),
        );
        if (selectedVoucherPayment?.id === paymentId) {
          setSelectedVoucherPayment((prev) =>
            prev ? { ...prev, status: "VERIFIED" } : null,
          );
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
        setRejectingPayment(null);
        if (selectedVoucherPayment?.id === paymentId) {
          setSelectedVoucherPayment((prev) =>
            prev
              ? { ...prev, status: "REJECTED", rejectionReason: reason }
              : null,
          );
        }
      }
    } finally {
      setIsProcessingId(null);
    }
  };

  return (
    <div className="payments-inbox-container pb-10">
      {/* 3-CARD KPI STRIP (Reactive to Sede, Date Range, Custody Tab & Payment Method Tab) */}
      <PaymentsKpiStrip kpis={dynamicKpis} />

      {/* CUSTODY TABS, DATE SELECTOR, PAYMENT METHOD TABS & FILTERS */}
      <PaymentsFilterBar
        custodyTab={custodyTab}
        onCustodyTabChange={setCustodyTab}
        custodyCounts={custodyCounts}
        paymentMethodTab={paymentMethodTab}
        onPaymentMethodTabChange={setPaymentMethodTab}
        methodCounts={methodCounts}
        datePreset={datePreset}
        onDatePresetChange={setDatePreset}
        customFromDate={customFromDate}
        onCustomFromDateChange={setCustomFromDate}
        customToDate={customToDate}
        onCustomToDateChange={setCustomToDate}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        bankFilter={bankFilter}
        onBankChange={setBankFilter}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        counts={counts}
      />

      {/* CLEAN 6-COLUMN ATOMIC TABLE WITH 5-ITEM PAGINATION */}
      <section className="px-5">
        <PaymentsTable
          payments={filteredItems}
          paymentMethodTab={paymentMethodTab}
          userRole={userRole}
          onOpenVoucher={setSelectedVoucherPayment}
          page={currentPage}
          pageSize={5}
          onPageChange={setCurrentPage}
        />
      </section>

      {/* IN-LINE VOUCHER DETAILS & AUDIT DRAWER */}
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
    </div>
  );
}
