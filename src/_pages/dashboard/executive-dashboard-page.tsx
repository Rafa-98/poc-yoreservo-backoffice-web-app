"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2, Info } from "lucide-react";
import type {
  CourtRibbonItem,
  ExecutiveDashboardData,
  RolePerspective,
  TimeframeKey,
} from "@/features/dashboard/model/types";
import { checkInReservationAction } from "@/features/reservations/actions/reservations-actions";
import { checkInAction } from "@/features/agenda/actions/agenda-actions";
import { DashboardTopbarControls } from "@/features/dashboard/ui/dashboard-topbar-controls";
import { DashboardTimeframeBar } from "@/features/dashboard/ui/dashboard-timeframe-bar";
import { DashboardAdminBanner } from "@/features/dashboard/ui/dashboard-admin-banner";
import { DashboardAdminKpis } from "@/features/dashboard/ui/dashboard-admin-kpis";
import { DashboardAllyKpis } from "@/features/dashboard/ui/dashboard-ally-kpis";
import { DashboardCourtRibbon } from "@/features/dashboard/ui/dashboard-court-ribbon";
import { DashboardRevenueChart } from "@/features/dashboard/ui/dashboard-revenue-chart";
import { DashboardSportsDistribution } from "@/features/dashboard/ui/dashboard-sports-distribution";
import { DashboardActivityStream } from "@/features/dashboard/ui/dashboard-activity-stream";

interface ExecutiveDashboardPageProps {
  initialData: ExecutiveDashboardData;
}

export function ExecutiveDashboardPage({
  initialData,
}: ExecutiveDashboardPageProps) {
  const t = useTranslations("dashboard");

  const [perspective, setPerspective] = useState<RolePerspective>(
    initialData.perspective
  );
  const [timeframe, setTimeframe] = useState<TimeframeKey>("MES");
  const [checkedInIds, setCheckedInIds] = useState<Set<string>>(new Set());
  const [pendingCheckIns, setPendingCheckIns] = useState<number>(
    initialData.allyKpis?.pendingCheckInCount ?? 4
  );
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "info";
  } | null>(null);

  const showToast = (message: string, type: "success" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const handleTogglePerspective = (newPerspective: RolePerspective) => {
    setPerspective(newPerspective);
    showToast(
      t("toast.viewSwitched", {
        role:
          newPerspective === "ADMIN"
            ? t("roles.admin")
            : t("roles.ally"),
      }),
      "info"
    );
  };

  const handleCheckIn = async (court: CourtRibbonItem) => {
    const res = court.reservationId
      ? await checkInReservationAction(court.reservationId, "SHORT_CODE_MANUAL")
      : court.bookingCode
      ? await checkInAction({
          code: court.bookingCode,
          method: "SHORT_CODE_MANUAL",
        })
      : await checkInReservationAction(court.id, "SHORT_CODE_MANUAL");

    if (res.ok) {
      setCheckedInIds((prev) => new Set(prev).add(court.id));
      setPendingCheckIns((prev) => Math.max(0, prev - 1));
      showToast(
        t("toast.checkinSuccess", {
          name: court.customerName || t("defaultPlayer"),
          code: court.bookingCode || court.id,
        }),
        "success"
      );
    } else {
      showToast(t("toast.checkinError"), "info");
    }
  };

  const handleBarClick = (label: string, gmv: number, fee: number) => {
    showToast(
      t("toast.chartDetail", {
        label,
        gmv: gmv.toFixed(2),
        fee: fee.toFixed(2),
      }),
      "info"
    );
  };

  const currentChartData = initialData.chartData[timeframe];

  return (
    <div className="space-y-6 max-w-[1480px] mx-auto w-full">
      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-foreground">
              {perspective === "ADMIN" ? t("title") : t("titleAlly")}
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              {t("live")}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-3xl leading-relaxed">
            {perspective === "ADMIN" ? t("subtitle") : t("subtitleAlly")}
          </p>
        </div>

        <DashboardTopbarControls
          perspective={perspective}
          onTogglePerspective={handleTogglePerspective}
        />
      </div>

      {/* Timeframe selector bar */}
      <DashboardTimeframeBar
        perspective={perspective}
        timeframe={timeframe}
        onSelectTimeframe={setTimeframe}
        bcvRate={initialData.bcvRate}
      />

      {/* Actionable Alerts Banner (Admin View Only) */}
      {perspective === "ADMIN" && <DashboardAdminBanner />}

      {/* Role-Adaptive KPI Cards */}
      {perspective === "ADMIN" ? (
        <DashboardAdminKpis
          timeframe={timeframe}
          chartData={currentChartData}
          bcvRate={initialData.bcvRate}
          metrics={initialData.metrics}
          adminKpis={initialData.adminKpis}
        />
      ) : (
        <DashboardAllyKpis
          bcvRate={initialData.bcvRate}
          pendingCheckInCount={pendingCheckIns}
          allyKpis={initialData.allyKpis}
        />
      )}

      {/* Live Court Status Ribbon (Ally Organization View) */}
      {perspective === "ALLY" && (
        <DashboardCourtRibbon
          courts={initialData.courtsRibbon}
          checkedInIds={checkedInIds}
          onCheckIn={handleCheckIn}
        />
      )}

      {/* Financial Analytics & Sports Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <DashboardRevenueChart
            data={currentChartData}
            onBarClick={handleBarClick}
          />
        </div>
        <div>
          <DashboardSportsDistribution data={initialData.sportsDistribution} />
        </div>
      </div>

      {/* Bottom Section: Activity Stream & Platform Status */}
      <DashboardActivityStream
        perspective={perspective}
        adminFeed={initialData.adminActivityFeed}
        allyFeed={initialData.allyActivityFeed}
      />

      {/* Interactive Toast Notification */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl bg-forest-950 text-white dark:bg-forest-900 border border-accent/40 shadow-xl animate-in fade-in slide-in-from-bottom-5 duration-200"
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="size-5 text-accent-foreground shrink-0" />
          ) : (
            <Info className="size-5 text-blue-400 shrink-0" />
          )}
          <span className="text-xs sm:text-sm font-medium">{toast.message}</span>
        </div>
      )}
    </div>
  );
}
