"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { CalendarPlus, Check, MessageSquare, Plus, ShieldAlert, X } from "lucide-react";
import { useTimeFormat } from "@/shared/lib";
import type { CourtBlock, CourtReservation, CourtSpace } from "../model/types";
import type { AgendaDayPart } from "./agenda-controls-bar";

export interface AgendaSelectedRange {
  courtId: string;
  startHour: string;
  endHour: string;
}

export interface AgendaMatrixProps {
  spaces: CourtSpace[];
  selectedDayPart?: AgendaDayPart;
  isValidator?: boolean;
  selectedRange?: AgendaSelectedRange | null;
  onSelectedRangeChange?: (range: AgendaSelectedRange | null) => void;
  onSlotClick: (court: CourtSpace, startTime: string, endTime?: string) => void;
  onRequestBlock?: (court: CourtSpace, startTime: string, endTime?: string) => void;
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

function isHourAvailableOnSpace(space: CourtSpace, hour: string): boolean {
  const hasReservation = space.reservations.some(
    (r) => r.startTime <= hour && r.endTime > hour
  );
  if (hasReservation) return false;

  const hasBlock = space.blocks.some(
    (b) => b.startTime <= hour && b.endTime > hour
  );
  if (hasBlock) return false;

  const isWithinOperatingShift =
    Array.isArray(space.shifts) &&
    space.shifts.length > 0 &&
    space.shifts.some((s) => s.openTime <= hour && s.closeTime > hour);

  return isWithinOperatingShift;
}

export function AgendaMatrix({
  spaces,
  selectedDayPart = "all",
  isValidator = false,
  selectedRange: controlledRange,
  onSelectedRangeChange,
  onSlotClick,
  onRequestBlock,
  onReservationClick,
  onBlockClick,
}: AgendaMatrixProps) {
  const t = useTranslations("agenda");
  const { formatTime } = useTimeFormat();
  const [hoveredTarget, setHoveredTarget] = useState<{
    spaceId: string;
    hour: string;
  } | null>(null);
  const [internalRange, setInternalRange] = useState<AgendaSelectedRange | null>(
    null
  );

  const selectedRange =
    controlledRange !== undefined ? controlledRange : internalRange;
  const setSelectedRange = (next: AgendaSelectedRange | null) => {
    if (onSelectedRangeChange) {
      onSelectedRangeChange(next);
    } else {
      setInternalRange(next);
    }
  };

  const getShiftEnd = (start: string) => {
    const [h] = start.split(":").map(Number);
    const endH = String(h + 1).padStart(2, "0");
    return `${endH}:00`;
  };

  // Clear selection if selected court is no longer in visible spaces
  useEffect(() => {
    if (
      selectedRange &&
      !spaces.some((s) => s.id === selectedRange.courtId)
    ) {
      setSelectedRange(null);
    }
  }, [spaces, selectedRange]);

  const handleAvailableSlotClick = (space: CourtSpace, hour: string) => {
    if (isValidator) return;

    const clickedH = Number(hour.split(":")[0]);
    const singleEnd = getShiftEnd(hour);

    if (!selectedRange || selectedRange.courtId !== space.id) {
      setSelectedRange({
        courtId: space.id,
        startHour: hour,
        endHour: singleEnd,
      });
      return;
    }

    const curStartH = Number(selectedRange.startHour.split(":")[0]);
    const curEndH = Number(selectedRange.endHour.split(":")[0]);

    // Clicked inside current selection
    if (clickedH >= curStartH && clickedH < curEndH) {
      if (curEndH - curStartH === 1) {
        setSelectedRange(null);
      } else if (clickedH === curEndH - 1) {
        setSelectedRange({
          courtId: space.id,
          startHour: selectedRange.startHour,
          endHour: hour,
        });
      } else if (clickedH === curStartH) {
        setSelectedRange({
          courtId: space.id,
          startHour: singleEnd,
          endHour: selectedRange.endHour,
        });
      } else {
        setSelectedRange({
          courtId: space.id,
          startHour: selectedRange.startHour,
          endHour: singleEnd,
        });
      }
      return;
    }

    // Clicked outside current selection on the same court: check if all hours between are available
    const nextStartH = Math.min(curStartH, clickedH);
    const nextEndH = Math.max(curEndH, clickedH + 1);

    let allConsecutiveAvailable = true;
    for (let h = nextStartH; h < nextEndH; h++) {
      const slotStr = `${String(h).padStart(2, "0")}:00`;
      if (!isHourAvailableOnSpace(space, slotStr)) {
        allConsecutiveAvailable = false;
        break;
      }
    }

    if (allConsecutiveAvailable) {
      setSelectedRange({
        courtId: space.id,
        startHour: `${String(nextStartH).padStart(2, "0")}:00`,
        endHour: `${String(nextEndH).padStart(2, "0")}:00`,
      });
    } else {
      // Start fresh selection at clicked slot
      setSelectedRange({
        courtId: space.id,
        startHour: hour,
        endHour: singleEnd,
      });
    }
  };

  const selectedCourt = selectedRange
    ? spaces.find((s) => s.id === selectedRange.courtId) || null
    : null;
  const selectedDurationHours = selectedRange
    ? Math.max(
        1,
        Number(selectedRange.endHour.split(":")[0]) -
          Number(selectedRange.startHour.split(":")[0])
      )
    : 0;
  const selectedTotalPrice = selectedCourt
    ? Number(selectedCourt.pricePerHour || 0) * selectedDurationHours
    : 0;

  const visibleHours = HOURS.filter((hour) => {
    const h = Number(hour.split(":")[0]);
    if (selectedDayPart === "morning") return h < 12;
    if (selectedDayPart === "afternoon") return h >= 12 && h < 18;
    if (selectedDayPart === "night") return h >= 18;
    return true;
  });

  return (
    <div className="space-y-3">
      {/* Multi-Hour Selection Action Banner */}
      {selectedRange && selectedCourt && (
        <div
          id="agenda-multi-hour-selection-bar"
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-primary bg-primary px-4 py-3 text-primary-foreground shadow-card animate-in fade-in slide-in-from-bottom-2 duration-150"
        >
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-2.5 py-1 text-xs font-extrabold text-accent-foreground">
              <Check className="size-3.5" />
              <span>
                {t("selectionHoursCount", { count: selectedDurationHours })}
              </span>
            </span>
            <div className="text-xs sm:text-sm">
              <span className="font-bold text-primary-foreground">
                {selectedCourt.venueName ? `${selectedCourt.venueName} · ` : ""}
                {selectedCourt.spaceNumber}
              </span>
              <span className="mx-2 text-primary-foreground/50">|</span>
              <span className="font-mono font-bold text-accent">
                {formatTime(selectedRange.startHour)} –{" "}
                {formatTime(selectedRange.endHour)}
              </span>
              <span className="mx-2 text-primary-foreground/50">|</span>
              <span className="font-extrabold text-accent">
                ${selectedTotalPrice.toFixed(2)}
              </span>
            </div>
            <span className="hidden xl:inline text-[11px] text-primary-foreground/75">
              ({t("selectionHint")})
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onRequestBlock && (
              <button
                type="button"
                onClick={() => {
                  onRequestBlock(
                    selectedCourt,
                    selectedRange.startHour,
                    selectedRange.endHour
                  );
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-primary-foreground/25 bg-primary-foreground/10 px-3 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary-foreground/20 transition-all"
              >
                <ShieldAlert className="size-3.5" />
                <span>{t("blockModalTitle")}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                onSlotClick(
                  selectedCourt,
                  selectedRange.startHour,
                  selectedRange.endHour
                );
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-3.5 py-1.5 text-xs font-extrabold text-accent-foreground shadow-xs hover:brightness-105 transition-all active:scale-95"
            >
              <CalendarPlus className="size-3.5" />
              <span>
                {t("btnBookSelected", { hours: selectedDurationHours })} ($
                {selectedTotalPrice.toFixed(2)})
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedRange(null)}
              title={t("selectionClear")}
              className="inline-flex size-7 items-center justify-center rounded-lg text-primary-foreground/70 hover:bg-primary-foreground/15 hover:text-primary-foreground transition-colors"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      )}

      <div
        id="agenda-matrix-scroll-container"
        className="max-h-[calc(100vh-190px)] overflow-auto rounded-2xl border border-border bg-surface shadow-card"
      >
        <table className="w-full min-w-[760px] border-separate border-spacing-0 select-none">
          {/* STICKY HEADER ROW */}
          <thead>
            <tr>
              {/* Top-Left Corner Cell: Sticky both Top and Left */}
              <th
                scope="col"
                className="sticky top-0 left-0 z-30 w-24 min-w-[6rem] max-w-[6rem] border-b border-r border-border bg-muted p-3.5 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground"
              >
                {t("thTime")}
              </th>

              {/* Sticky Court Column Headers */}
              {spaces.map((space) => {
                const categoryName =
                  typeof space.category === "object"
                    ? space.category?.es || space.category?.en
                    : space.category || t("defaultSport");
                const isTargetSpace =
                  hoveredTarget?.spaceId === space.id ||
                  selectedRange?.courtId === space.id;

                return (
                  <th
                    key={space.id}
                    scope="col"
                    className={`sticky top-0 z-20 min-w-[175px] border-b border-r border-border last:border-r-0 p-3.5 text-left align-top transition-colors duration-150 ${
                      isTargetSpace
                        ? "bg-primary text-primary-foreground shadow-[inset_0_-3px_0_0_var(--accent)]"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    {space.venueName && (
                      <div
                        className={`mb-0.5 max-w-[210px] truncate text-[10px] font-bold uppercase tracking-wider transition-colors duration-150 ${
                          isTargetSpace
                            ? "text-accent"
                            : "text-accent-foreground/80"
                        }`}
                      >
                        {space.venueName}
                      </div>
                    )}
                    <div
                      className={`max-w-[210px] truncate font-display text-sm font-bold transition-colors duration-150 ${
                        isTargetSpace ? "text-primary-foreground" : "text-foreground"
                      }`}
                    >
                      {space.spaceNumber}
                    </div>
                    <div
                      className={`mt-0.5 text-[11px] font-normal transition-colors duration-150 ${
                        isTargetSpace
                          ? "text-primary-foreground/80"
                          : "text-muted-foreground"
                      }`}
                    >
                      <span>{categoryName}</span>
                      <span className="mx-1.5">•</span>
                      <span
                        className={`font-semibold transition-colors duration-150 ${
                          isTargetSpace ? "text-accent" : "text-link"
                        }`}
                      >
                        ${Number(space.pricePerHour || 0).toFixed(2)}/h
                      </span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* TIME ROWS */}
          <tbody onMouseLeave={() => setHoveredTarget(null)}>
            {visibleHours.map((hour, rowIndex) => {
              const nextHour = getShiftEnd(hour);
              const isLastRow = rowIndex === visibleHours.length - 1;
              const rowBorderClass = isLastRow ? "" : "border-b border-border";
              const isSelectedHour =
                Boolean(selectedRange) &&
                hour >= (selectedRange?.startHour ?? "") &&
                hour < (selectedRange?.endHour ?? "");
              const isTargetHour = hoveredTarget?.hour === hour || isSelectedHour;

              return (
                <tr key={hour} className="h-[76px]">
                  {/* Sticky First Column: Hour Cell */}
                  <td
                    className={`sticky left-0 z-10 w-24 min-w-[6rem] max-w-[6rem] ${rowBorderClass} border-r border-border px-1 text-center align-middle font-mono text-xs whitespace-nowrap transition-colors duration-150 ${
                      isTargetHour
                        ? "bg-primary font-extrabold text-accent shadow-[inset_-3px_0_0_0_var(--accent)]"
                        : "bg-surface font-semibold text-muted-foreground"
                    }`}
                  >
                    {formatTime(hour)}
                  </td>

                  {/* Court Cells */}
                  {spaces.map((space) => {
                    const isTargetSpace = hoveredTarget?.spaceId === space.id;
                    const isTargetCell =
                      isTargetSpace && hoveredTarget?.hour === hour;
                    const isCrosshair =
                      !isTargetCell &&
                      (isTargetSpace || hoveredTarget?.hour === hour);
                    const isSlotInSelectedRange =
                      selectedRange?.courtId === space.id &&
                      hour >= selectedRange.startHour &&
                      hour < selectedRange.endHour;
                    const isLastSlotInSelectedRange =
                      isSlotInSelectedRange &&
                      nextHour === selectedRange?.endHour;

                    const cellBgClass = isSlotInSelectedRange
                      ? "bg-accent/25"
                      : isTargetCell
                      ? "bg-accent/20 ring-2 ring-inset ring-primary/35"
                      : isCrosshair
                      ? "bg-surface-hover"
                      : "bg-surface";

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
                        <td
                          key={`${space.id}-${hour}`}
                          onMouseEnter={() =>
                            setHoveredTarget({ spaceId: space.id, hour })
                          }
                          className={`h-[76px] min-w-[175px] ${rowBorderClass} border-r border-border last:border-r-0 ${cellBgClass} p-1.5 align-middle transition-colors duration-100`}
                        >
                          <div
                            onClick={() => onBlockClick(block, space)}
                            className="flex h-full min-h-[62px] flex-col justify-between rounded-xl border border-status-blocked-border bg-status-blocked-bg p-2 text-status-blocked-fg cursor-pointer transition-all hover:brightness-95"
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
                        </td>
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
                        <td
                          key={`${space.id}-${hour}`}
                          onMouseEnter={() =>
                            setHoveredTarget({ spaceId: space.id, hour })
                          }
                          className={`h-[76px] min-w-[175px] ${rowBorderClass} border-r border-border last:border-r-0 ${cellBgClass} p-1.5 align-middle transition-colors duration-100`}
                        >
                          <div
                            onClick={() => onReservationClick(reservation, space)}
                            className={`flex h-full min-h-[62px] flex-col justify-between rounded-xl border p-2 cursor-pointer transition-all hover:shadow-xs active:scale-[0.99] ${statusClasses}`}
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
                        </td>
                      );
                    }

                    if (!isWithinOperatingShift) {
                      return (
                        <td
                          key={`${space.id}-${hour}`}
                          onMouseEnter={() =>
                            setHoveredTarget({ spaceId: space.id, hour })
                          }
                          className={`h-[76px] min-w-[175px] ${rowBorderClass} border-r border-border last:border-r-0 ${cellBgClass} p-1.5 align-middle transition-colors duration-100`}
                        >
                          <div className="flex h-full min-h-[62px] flex-col items-center justify-center rounded-xl border border-border/50 bg-muted/40 p-2 text-muted-foreground/60 select-none cursor-not-allowed">
                            <span className="text-[11px] font-semibold uppercase tracking-wider">
                              {t("slotClosed")}
                            </span>
                          </div>
                        </td>
                      );
                    }

                    // Selected Available Slot
                    if (isSlotInSelectedRange && selectedRange) {
                      return (
                        <td
                          key={`${space.id}-${hour}`}
                          onMouseEnter={() =>
                            setHoveredTarget({ spaceId: space.id, hour })
                          }
                          className={`h-[76px] min-w-[175px] ${rowBorderClass} border-r border-border last:border-r-0 ${cellBgClass} p-1.5 align-middle transition-colors duration-100`}
                        >
                          <div
                            onClick={() => handleAvailableSlotClick(space, hour)}
                            className="flex h-full min-h-[62px] flex-col justify-between rounded-xl border-2 border-primary bg-accent/45 p-2 text-foreground cursor-pointer shadow-xs transition-all"
                            title={t("selectionHint")}
                          >
                            <div className="flex items-center justify-between gap-1 text-xs font-extrabold">
                              <span className="inline-flex items-center gap-1 truncate">
                                <Check className="size-3.5 shrink-0 text-primary" />
                                <span>{t("slotSelected")}</span>
                              </span>
                              <span className="text-[10px] font-bold">
                                ${Number(space.pricePerHour || 0).toFixed(2)}
                              </span>
                            </div>

                            {isLastSlotInSelectedRange ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSlotClick(
                                    space,
                                    selectedRange.startHour,
                                    selectedRange.endHour
                                  );
                                }}
                                className="mt-1 inline-flex w-full items-center justify-center gap-1 rounded-lg bg-primary px-2 py-1 text-[10px] font-extrabold text-accent hover:brightness-110 transition-all"
                              >
                                <CalendarPlus className="size-3" />
                                <span>
                                  {t("btnBookSelected", {
                                    hours: selectedDurationHours,
                                  })}{" "}
                                  (${selectedTotalPrice.toFixed(2)})
                                </span>
                              </button>
                            ) : (
                              <div className="text-[10px] font-semibold text-foreground/75 truncate">
                                {formatTime(hour)} – {formatTime(nextHour)}
                              </div>
                            )}
                          </div>
                        </td>
                      );
                    }

                    // Available Slot
                    return (
                      <td
                        key={`${space.id}-${hour}`}
                        onMouseEnter={() =>
                          setHoveredTarget({ spaceId: space.id, hour })
                        }
                        className={`h-[76px] min-w-[175px] ${rowBorderClass} border-r border-border last:border-r-0 ${cellBgClass} p-1.5 align-middle transition-colors duration-100`}
                      >
                        <div
                          onClick={() => handleAvailableSlotClick(space, hour)}
                          className="group flex h-full min-h-[62px] flex-col justify-between rounded-xl border border-dashed border-status-available-border bg-status-available-bg/60 p-2 text-status-available-fg cursor-pointer transition-all hover:bg-status-available-bg hover:shadow-xs active:scale-[0.99]"
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
                            ${Number(space.pricePerHour || 0).toFixed(2)}
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
