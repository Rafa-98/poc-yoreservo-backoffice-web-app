"use client";

import { useTranslations } from "next-intl";
import { MessageSquare, Plus, ShieldAlert } from "lucide-react";
import { useTimeFormat } from "@/shared/lib";
import type { CourtBlock, CourtReservation, CourtSpace } from "../model/types";

export interface AgendaMatrixProps {
  spaces: CourtSpace[];
  onSlotClick: (court: CourtSpace, startTime: string) => void;
  onReservationClick: (reservation: CourtReservation, court: CourtSpace) => void;
  onBlockClick: (block: CourtBlock, court: CourtSpace) => void;
}

const HOURS = [
  "07:00",
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
  "21:00",
  "22:00",
];

export function AgendaMatrix({
  spaces,
  onSlotClick,
  onReservationClick,
  onBlockClick,
}: AgendaMatrixProps) {
  const t = useTranslations("agenda");
  const { formatTime } = useTimeFormat();

  const getShiftEnd = (start: string) => {
    const [h] = start.split(":").map(Number);
    const endH = String(h + 1).padStart(2, "0");
    return `${endH}:00`;
  };

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-surface shadow-card">
      <div className="min-w-[760px] select-none">
        {/* HEADER ROW */}
        <div className="flex border-b border-border bg-muted/60 text-xs font-bold text-foreground">
          {/* Time Column Header */}
          <div className="w-24 shrink-0 border-r border-border p-3.5 text-center text-muted-foreground uppercase tracking-wider">
            {t("thTime")}
          </div>

          {/* Court Columns Headers */}
          <div className="grid flex-1 grid-flow-col auto-cols-[minmax(155px,1fr)] divide-x divide-border">
            {spaces.map((space) => {
              const categoryName =
                typeof space.category === "object"
                  ? space.category?.es || space.category?.en
                  : space.category || t("defaultSport");

              return (
                <div key={space.id} className="min-w-[155px] p-3.5 text-left">
                  {space.venueName && (
                    <div className="mb-0.5 truncate text-[10px] font-bold uppercase tracking-wider text-accent-foreground/80">
                      {space.venueName}
                    </div>
                  )}
                  <div className="font-display text-sm font-bold text-foreground truncate">
                    {space.spaceNumber}
                  </div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">
                    <span>{categoryName}</span>
                    <span className="mx-1.5">•</span>
                    <span className="font-semibold text-link">
                      ${space.pricePerHour.toFixed(2)}/h
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* TIME ROWS */}
        <div className="divide-y divide-border">
          {HOURS.map((hour) => {
            const nextHour = getShiftEnd(hour);

            return (
              <div key={hour} className="flex min-h-[72px]">
                {/* Fixed Hour Cell */}
                <div className="flex w-24 shrink-0 items-center justify-center border-r border-border bg-muted/20 font-mono text-xs font-semibold text-muted-foreground whitespace-nowrap px-1">
                  {formatTime(hour)}
                </div>

                {/* Court Cells */}
                <div className="grid flex-1 grid-flow-col auto-cols-[minmax(155px,1fr)] divide-x divide-border p-1.5 gap-1.5">
                  {spaces.map((space) => {

                    // Check if reservation covers this hour (including multi-hour bookings)
                    const reservation = space.reservations.find((r) => {
                      return r.startTime <= hour && r.endTime > hour;
                    });

                    // Check if maintenance block covers this hour (including multi-hour blocks)
                    const block = space.blocks.find((b) => {
                      return b.startTime <= hour && b.endTime > hour;
                    });

                    // Check if hour is within court's configured operating shifts
                    const isWithinOperatingShift =
                      Array.isArray(space.shifts) &&
                      space.shifts.length > 0 &&
                      space.shifts.some(
                        (s) => s.openTime <= hour && s.closeTime > hour
                      );

                    if (block) {
                      return (
                        <div
                          key={`${space.id}-${hour}`}
                          onClick={() => onBlockClick(block, space)}
                          className="flex h-full flex-col justify-between rounded-xl border border-status-blocked-border bg-status-blocked-bg p-2 text-status-blocked-fg cursor-pointer transition-all hover:brightness-95"
                          title={t("blockClickTitle")}
                        >
                          <div className="flex items-center gap-1.5 text-xs font-bold">
                            <ShieldAlert className="size-3.5 shrink-0" />
                            <span className="truncate">{block.reason}</span>
                          </div>
                          <div className="text-[10px] text-status-blocked-fg/80 truncate">
                            {block.notes || t("blockDisabledTitle")}
                          </div>
                        </div>
                      );
                    }

                    if (reservation) {
                      const isCompleted = reservation.status === "COMPLETED";
                      const isConfirmed = reservation.status === "CONFIRMED";

                      const statusClasses = isCompleted
                        ? "border-status-completed-border bg-status-completed-bg text-status-completed-fg"
                        : isConfirmed
                        ? "border-status-confirmed-border bg-status-confirmed-bg text-status-confirmed-fg"
                        : "border-status-hold-border bg-status-hold-bg text-status-hold-fg";

                      const badgeText = isCompleted
                        ? t("badgeChecked")
                        : isConfirmed
                        ? t("badgePaid")
                        : t("badgePending");

                      return (
                        <div
                          key={`${space.id}-${hour}`}
                          onClick={() => onReservationClick(reservation, space)}
                          className={`flex h-full flex-col justify-between rounded-xl border p-2 cursor-pointer transition-all hover:shadow-xs active:scale-[0.99] ${statusClasses}`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <div className="font-semibold text-xs truncate max-w-[120px]">
                              {reservation.customerName}
                            </div>
                            {reservation.customerPhone && (
                              <a
                                href={`https://wa.me/${reservation.customerPhone.replace(/[^0-9]/g, "")}`}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                title={t("whatsappContactTitle")}
                                className="flex size-5 shrink-0 items-center justify-center rounded bg-emerald-500/20 text-emerald-600 hover:scale-110 transition-transform"
                              >
                                <MessageSquare className="size-3" />
                              </a>
                            )}
                          </div>

                          <div className="flex items-center justify-between text-[10px]">
                            <span className="font-mono font-bold tracking-wider">
                              #{reservation.shortCode}
                            </span>
                            <span
                              className={`rounded-md px-1.5 py-0.5 font-bold uppercase text-[9px] ${
                                isCompleted
                                  ? "bg-status-completed-fg/15 text-status-completed-fg"
                                  : isConfirmed
                                  ? "bg-status-confirmed-fg/15 text-status-confirmed-fg"
                                  : "bg-status-hold-fg/15 text-status-hold-fg"
                              }`}
                            >
                              {badgeText}
                            </span>
                          </div>
                        </div>
                      );
                    }

                    if (!isWithinOperatingShift) {
                      return (
                        <div
                          key={`${space.id}-${hour}`}
                          className="flex h-full flex-col items-center justify-center rounded-xl border border-border/50 bg-muted/40 p-2 text-muted-foreground/60 select-none cursor-not-allowed"
                        >
                          <span className="text-[11px] font-semibold uppercase tracking-wider">
                            {t("slotClosed")}
                          </span>
                        </div>
                      );
                    }

                    // Available Slot
                    return (
                      <div
                        key={`${space.id}-${hour}`}
                        onClick={() => onSlotClick(space, hour)}
                        className="group flex h-full flex-col justify-between rounded-xl border border-dashed border-status-available-border bg-status-available-bg/60 p-2 text-status-available-fg cursor-pointer transition-all hover:bg-status-available-bg hover:shadow-xs active:scale-[0.99]"
                        title={t("slotBookTitle", {
                          court: space.spaceNumber,
                          start: formatTime(hour),
                          end: formatTime(nextHour),
                        })}

                      >
                        <div className="flex items-center gap-1 text-xs font-semibold">
                          <Plus className="size-3.5 transition-transform group-hover:rotate-90 duration-150" />
                          <span>{t("slotAvailable")}</span>
                        </div>
                        <div className="text-[10px] font-medium text-status-available-fg/80">
                          ${space.pricePerHour.toFixed(2)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
