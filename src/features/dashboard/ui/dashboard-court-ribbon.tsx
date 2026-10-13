"use client";

import Link from "next/link";
import { Check, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { ROUTES } from "@/shared/config";
import type { CourtRibbonItem } from "../model/types";

interface DashboardCourtRibbonProps {
  courts: CourtRibbonItem[];
  checkedInIds: Set<string>;
  onCheckIn: (court: CourtRibbonItem) => void;
}

export function DashboardCourtRibbon({
  courts,
  checkedInIds,
  onCheckIn,
}: DashboardCourtRibbonProps) {
  const t = useTranslations("dashboard");

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <h3 className="text-sm font-bold text-foreground">
          {t("courtRibbon.title")}
        </h3>
        <span className="text-xs text-muted-foreground">
          {t("courtRibbon.summary")}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {courts.map((court) => {
          const isActuallyCheckedIn = court.checkInDone || checkedInIds.has(court.id);

          return (
            <div
              key={court.id}
              className={`relative overflow-hidden rounded-xl border bg-surface p-4 shadow-2xs hover:shadow-xs transition-all border-l-4 ${
                court.status === "in-play"
                  ? "border-border border-l-emerald-500"
                  : court.status === "upcoming"
                  ? "border-border border-l-amber-500"
                  : "border-border border-l-blue-500"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-foreground leading-tight">
                    {court.name}
                  </h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {court.surface}
                  </p>
                </div>

                {court.status === "in-play" && (
                  <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                    {t("courtRibbon.statusInPlay")}
                  </span>
                )}
                {court.status === "upcoming" && (
                  <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400">
                    {t("courtRibbon.statusUpcoming")}
                  </span>
                )}
                {court.status === "available" && (
                  <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400">
                    {t("courtRibbon.statusAvailable")}
                  </span>
                )}
              </div>

              {court.status !== "available" ? (
                <>
                  <div className="mt-2 text-xs text-foreground font-semibold">
                    <span>{court.timeSlot}</span>
                    {court.customerName && (
                      <span className="text-muted-foreground font-normal">
                        {" "}• {court.customerName}{" "}
                        {court.bookingCode && `(#${court.bookingCode})`}
                      </span>
                    )}
                  </div>

                  <div className="mt-2 pt-2 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>
                      {t("courtRibbon.paymentConfirmed")} (${court.amount?.toFixed(2)})
                    </span>

                    {isActuallyCheckedIn ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                        <Check className="size-3" />
                        <span>{t("courtRibbon.checkinDone")}</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onCheckIn(court)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-accent text-accent-foreground font-bold hover:brightness-105 active:scale-95 transition-all cursor-pointer shadow-2xs"
                      >
                        <span>{t("actions.validateCheckin")}</span>
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="mt-2 text-xs text-muted-foreground">
                    <span>{t("courtRibbon.freeSlot")} </span>
                    <strong className="text-foreground">{court.timeSlot}</strong>
                    <span> ({court.freeSlotText})</span>
                  </div>

                  <div className="mt-2 pt-2 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>{t("courtRibbon.noReservation")}</span>
                    <Link
                      href={ROUTES.agenda}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded border border-border bg-surface text-foreground font-semibold hover:bg-surface-muted active:scale-95 transition-all"
                    >
                      <Plus className="size-3" />
                      <span>{t("actions.walkInAction")}</span>
                    </Link>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
