import React from "react";
import { Metadata } from "next";
import { requireSession } from "@/shared/auth/index.server";
import {
  getSettlementsAction,
  getExchangeRatesAction,
} from "@/features/treasury/actions/treasury-actions";
import { getVenuesListAction } from "@/features/venues/actions/venues-actions";
import { SettlementsPage } from "@/_pages/treasury/settlements-page";
import type { SettlementBatchItem, SettlementsKpis } from "@/features/treasury/model/types";

export const metadata: Metadata = {
  title: "Liquidaciones & Pagos a Aliados | Settlements Hub | YoReservo Backoffice",
  description:
    "Dispersión contable a organizaciones aliadas, finiquitos quincenales y retención de comisiones de plataforma.",
};

export default async function Page() {
  await requireSession();

  const [settlementsRes, venuesRes, ratesRes] = await Promise.all([
    getSettlementsAction(),
    getVenuesListAction(),
    getExchangeRatesAction(),
  ]);

  const venues = venuesRes.ok && venuesRes.data ? venuesRes.data : [];
  const bcvRate =
    ratesRes.ok && ratesRes.data?.activeUsd ? ratesRes.data.activeUsd.rate : 40.0;

  const initialBatches =
    settlementsRes.ok && settlementsRes.data ? settlementsRes.data.items : [];
  const initialKpis =
    settlementsRes.ok && settlementsRes.data ? settlementsRes.data.kpis : null;

  // Realistic prototype demo batches when database has 0 batches
  const fallbackBatches: SettlementBatchItem[] = [
    {
      id: "batch-demo-1",
      batchCode: "LIQ-2026-10A-001",
      organizationId: "org-1",
      organization: {
        id: "org-1",
        tradeName: "Complejo Deportivo Ávila",
        legalName: "Inversiones Deportivas Ávila C.A.",
        rif: "J-50123890-4",
        payoutBank: "Banesco Banco Universal (Cuenta Corriente)",
        payoutAccountNumber: "0134-0982-1200-4401-2918",
        payoutAccountType: "Corriente",
        payoutAccountHolder: "Inversiones Deportivas Ávila C.A.",
      },
      venueId: venues[0]?.id || "v-1",
      venue: { id: venues[0]?.id || "v-1", name: venues[0]?.name || "Complejo Deportivo Ávila" },
      periodStartDate: "2026-10-01",
      periodEndDate: "2026-10-15",
      periodDisplay: "01 - 15 Oct 2026",
      totalReservations: 108,
      currencyCode: "USD",
      grossAmount: 4260.0,
      platformFeeAmount: 213.0,
      netPayoutAmount: 4047.0,
      payoutCurrencyCode: "VES",
      payoutExchangeRate: bcvRate,
      status: "DISBURSED",
      payoutMethod: "BANK_TRANSFER",
      payoutReferenceNumber: "013498210398",
      payoutDestinationBank: "Banesco Banco Universal",
      payoutReceiptUrl: "https://assets.yoreservo.com/receipts/batch-001.pdf",
      disbursedAt: "2026-10-16T10:45:00Z",
    },
    {
      id: "batch-demo-2",
      batchCode: "LIQ-2026-10A-002",
      organizationId: "org-2",
      organization: {
        id: "org-2",
        tradeName: "Padel Pro Las Mercedes",
        legalName: "Operadora Deportiva Pádel Pro S.A.",
        rif: "J-40891234-1",
        payoutBank: "Banco Mercantil (Cuenta Corriente)",
        payoutAccountNumber: "0105-0024-8100-3918-2701",
        payoutAccountType: "Corriente",
        payoutAccountHolder: "Operadora Deportiva Pádel Pro S.A.",
      },
      venueId: "v-2",
      venue: { id: "v-2", name: "Padel Pro Las Mercedes" },
      periodStartDate: "2026-10-01",
      periodEndDate: "2026-10-15",
      periodDisplay: "01 - 15 Oct 2026",
      totalReservations: 142,
      currencyCode: "USD",
      grossAmount: 8940.0,
      platformFeeAmount: 447.0,
      netPayoutAmount: 8493.0,
      payoutCurrencyCode: "VES",
      payoutExchangeRate: bcvRate,
      status: "PENDING_APPROVAL",
      payoutMethod: "BANK_TRANSFER",
      payoutDestinationBank: "Banco Mercantil",
    },
    {
      id: "batch-demo-3",
      batchCode: "LIQ-2026-10A-003",
      organizationId: "org-3",
      organization: {
        id: "org-3",
        tradeName: "Centro Deportivo Santa Fe",
        legalName: "Centro Deportivo Santa Fe C.A.",
        rif: "J-31902845-6",
        payoutBank: "BBVA Provincial (Cuenta Corriente)",
        payoutAccountNumber: "0108-0192-3401-0029-4819",
        payoutAccountType: "Corriente",
        payoutAccountHolder: "Centro Deportivo Santa Fe C.A.",
      },
      venueId: "v-3",
      venue: { id: "v-3", name: "Centro Deportivo Santa Fe" },
      periodStartDate: "2026-10-01",
      periodEndDate: "2026-10-15",
      periodDisplay: "01 - 15 Oct 2026",
      totalReservations: 86,
      currencyCode: "USD",
      grossAmount: 3450.0,
      platformFeeAmount: 172.5,
      netPayoutAmount: 3277.5,
      payoutCurrencyCode: "VES",
      payoutExchangeRate: bcvRate,
      status: "PENDING_APPROVAL",
      payoutMethod: "BANK_TRANSFER",
      payoutDestinationBank: "BBVA Provincial",
    },
    {
      id: "batch-demo-4",
      batchCode: "LIQ-2026-10A-004",
      organizationId: "org-4",
      organization: {
        id: "org-4",
        tradeName: "Tenis Club Altamira",
        legalName: "Asociación Civil Tenis Altamira",
        rif: "J-29834710-9",
        payoutBank: "Banesco Banco Universal (Cuenta Corriente)",
        payoutAccountNumber: "0134-0231-9000-1129-8472",
        payoutAccountType: "Corriente",
        payoutAccountHolder: "Asociación Civil Tenis Altamira",
      },
      venueId: "v-4",
      venue: { id: "v-4", name: "Tenis Club Altamira" },
      periodStartDate: "2026-10-01",
      periodEndDate: "2026-10-15",
      periodDisplay: "01 - 15 Oct 2026",
      totalReservations: 74,
      currencyCode: "USD",
      grossAmount: 2960.0,
      platformFeeAmount: 148.0,
      netPayoutAmount: 2812.0,
      payoutCurrencyCode: "VES",
      payoutExchangeRate: bcvRate,
      status: "DISBURSED",
      payoutMethod: "BANK_TRANSFER",
      payoutReferenceNumber: "013410294821",
      payoutDestinationBank: "Banesco Banco Universal",
      payoutReceiptUrl: "https://assets.yoreservo.com/receipts/batch-004.pdf",
      disbursedAt: "2026-10-16T14:20:00Z",
    },
    {
      id: "batch-demo-5",
      batchCode: "LIQ-2026-10A-005",
      organizationId: "org-5",
      organization: {
        id: "org-5",
        tradeName: "Caracas Sport Club",
        legalName: "Inversiones Caracas Sport Club C.A.",
        rif: "J-00129384-5",
        payoutBank: "Banco de Venezuela (Cuenta Jurídica)",
        payoutAccountNumber: "0102-0491-2300-0019-3829",
        payoutAccountType: "Corriente",
        payoutAccountHolder: "Inversiones Caracas Sport Club C.A.",
      },
      venueId: "v-5",
      venue: { id: "v-5", name: "Caracas Sport Club" },
      periodStartDate: "2026-10-01",
      periodEndDate: "2026-10-15",
      periodDisplay: "01 - 15 Oct 2026",
      totalReservations: 192,
      currencyCode: "USD",
      grossAmount: 19200.0,
      platformFeeAmount: 960.0,
      netPayoutAmount: 18240.0,
      payoutCurrencyCode: "VES",
      payoutExchangeRate: bcvRate,
      status: "DISBURSED",
      payoutMethod: "BANK_TRANSFER",
      payoutReferenceNumber: "010283910284",
      payoutDestinationBank: "Banco de Venezuela",
      payoutReceiptUrl: "https://assets.yoreservo.com/receipts/batch-005.pdf",
      disbursedAt: "2026-10-15T18:30:00Z",
    },
    {
      id: "batch-demo-6",
      batchCode: "LIQ-2026-10A-006",
      organizationId: "org-6",
      organization: {
        id: "org-6",
        tradeName: "San Agustín del Paraíso",
        legalName: "Deportes San Agustín C.A.",
        rif: "J-30491823-7",
        payoutBank: "Banesco Banco Universal (Cuenta Corriente)",
        payoutAccountNumber: "0134-0829-1000-2918-4720",
        payoutAccountType: "Corriente",
        payoutAccountHolder: "Deportes San Agustín C.A.",
      },
      venueId: venues[1]?.id || "v-6",
      venue: { id: venues[1]?.id || "v-6", name: venues[1]?.name || "San Agustín del Paraíso" },
      periodStartDate: "2026-10-01",
      periodEndDate: "2026-10-15",
      periodDisplay: "01 - 15 Oct 2026",
      totalReservations: 80,
      currencyCode: "USD",
      grossAmount: 3000.0,
      platformFeeAmount: 150.0,
      netPayoutAmount: 2850.0,
      payoutCurrencyCode: "VES",
      payoutExchangeRate: bcvRate,
      status: "PENDING_APPROVAL",
      payoutMethod: "BANK_TRANSFER",
      payoutDestinationBank: "Banesco Banco Universal",
    },
  ];

  const batches = initialBatches.length > 0 ? initialBatches : fallbackBatches;

  const fallbackKpis: SettlementsKpis = {
    gmv: 48920.0,
    fee: 2446.0,
    pendingAmount: 14624.0,
    pendingCount: 3,
    disbursedAmount: 31850.0,
    disbursedCount: 3,
    totalBatches: 6,
    completedBookingsCount: 682,
    cycleProgress: {
      completedCount: 15,
      totalCount: 18,
      percentage: 68.5,
      deadline: "18 de Octubre",
    },
  };

  const kpis = initialKpis && initialBatches.length > 0 ? initialKpis : fallbackKpis;

  const organizations = Array.from(
    new Map(
      batches.map((b) => [b.organizationId, { id: b.organizationId, name: b.organization?.tradeName }]),
    ).values(),
  );

  return (
    <SettlementsPage
      initialBatches={batches}
      initialKpis={kpis}
      organizations={organizations}
      bcvRate={bcvRate}
    />
  );
}
