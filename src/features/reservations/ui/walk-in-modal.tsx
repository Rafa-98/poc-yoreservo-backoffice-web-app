"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  CalendarClock,
  Check,
  Clock,
  CreditCard,
  Lock,
  MapPin,
  ShieldCheck,
  User,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useTimeFormat } from "@/shared/lib/time-format";
import { todayInTimezone } from "@/shared/lib";
import { Button } from "@/shared/ui/button";
import { getSpacesAction } from "@/features/venues/actions/venues-actions";
import { getAgendaAction } from "@/features/agenda/actions/agenda-actions";
import type { CourtSpace } from "@/features/agenda/model/types";
import { createWalkInReservationAction } from "../actions/reservations-actions";
import type { CreateWalkInReservationInput } from "../model/types";

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  if (Number.isNaN(h)) return 0;
  return h * 60 + (Number.isNaN(m) ? 0 : m);
}

function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

interface HourlySlotItem {
  shiftIndex: number;
  shiftLabel: string;
  startMin: number;
  endMin: number;
  startTime: string;
  endTime: string;
  status: "AVAILABLE" | "RESERVED" | "BLOCKED";
  reservationCode?: string;
  customerName?: string;
}

interface WalkInModalProps {
  isOpen: boolean;
  onClose: () => void;
  venues: Array<{ id: string; name: string; referenceCurrencyCode?: string }>;
  spaces: Array<{ id: string; name: string; venueId: string; pricePerHour: number }>;
  onSuccess: (createdDate?: string) => void;
}

export function WalkInModal({
  isOpen,
  onClose,
  venues,
  spaces,
  onSuccess,
}: WalkInModalProps) {
  const t = useTranslations("reservations.modalWalkIn");
  const { formatTime } = useTimeFormat();

  const [name, setName] = useState("");
  const [docType, setDocType] = useState<"V" | "E" | "J" | "G" | "P" | "C">("V");
  const [docNum, setDocNum] = useState("");
  const [countryCode, setCountryCode] = useState("+58");
  const [phoneOp, setPhoneOp] = useState("0412");
  const [phoneNum, setPhoneNum] = useState("");

  const [allSpaces, setAllSpaces] = useState(spaces);
  const [selectedVenueId, setSelectedVenueId] = useState(venues[0]?.id || "");
  const filteredSpaces = useMemo(
    () => allSpaces.filter((s) => s.venueId === selectedVenueId),
    [allSpaces, selectedVenueId],
  );
  const [selectedSpaceId, setSelectedSpaceId] = useState(
    filteredSpaces[0]?.id || "",
  );
  const [loadingSpaces, setLoadingSpaces] = useState(false);

  const todayStr = todayInTimezone("America/Caracas");
  const [date, setDate] = useState(todayStr);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "PAGO_MOVIL" | "POS">("CASH");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [originBank, setOriginBank] = useState("");

  const [agendaSpaces, setAgendaSpaces] = useState<CourtSpace[]>([]);
  const [loadingAvailability, setLoadingAvailability] = useState(false);

  // Temporary Hour-by-Hour Availability Modal state
  const [isAvailabilityModalOpen, setIsAvailabilityModalOpen] = useState(false);
  const [tempStartMin, setTempStartMin] = useState<number | null>(null);
  const [tempEndMin, setTempEndMin] = useState<number | null>(null);

  const computePriceForHours = (ratePerHour: number, start: string, end: string) => {
    if (!start || !end) return 0;
    const startMin = timeToMinutes(start);
    const endMin = timeToMinutes(end);
    if (endMin <= startMin) return 0;
    const hours = (endMin - startMin) / 60;
    return Math.round(ratePerHour * hours * 100) / 100;
  };

  const [price, setPrice] = useState(0);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Reset selected hours when the modal opens fresh
  useEffect(() => {
    if (isOpen) {
      setStartTime("");
      setEndTime("");
      setPrice(0);
      setErrorMsg(null);
      setIsAvailabilityModalOpen(false);
      setTempStartMin(null);
      setTempEndMin(null);
    }
  }, [isOpen]);

  useEffect(() => {
    setAllSpaces((prev) => {
      const existingIds = new Set(prev.map((p) => p.id));
      const additions = spaces.filter((s) => !existingIds.has(s.id));
      return additions.length > 0 ? [...prev, ...additions] : prev;
    });
  }, [spaces]);

  useEffect(() => {
    if (!isOpen || !selectedVenueId) return;
    const venueSpaces = allSpaces.filter((s) => s.venueId === selectedVenueId);
    if (venueSpaces.length > 0) {
      if (!venueSpaces.some((s) => s.id === selectedSpaceId)) {
        const nextSpace = venueSpaces[0];
        setSelectedSpaceId(nextSpace.id);
        setPrice(computePriceForHours(nextSpace.pricePerHour, startTime, endTime));
      }
      return;
    }

    let active = true;
    setLoadingSpaces(true);
    getSpacesAction(selectedVenueId)
      .then((res) => {
        if (!active) return;
        if (res.ok && res.data.length > 0) {
          const loaded = res.data.map((sp) => ({
            id: sp.id,
            name: sp.spaceNumber.toLowerCase().includes("cancha")
              ? sp.spaceNumber
              : `Cancha ${sp.spaceNumber}`,
            venueId: sp.venueId,
            pricePerHour: sp.pricePerHour,
          }));
          setAllSpaces((prev) => {
            const existingIds = new Set(prev.map((p) => p.id));
            return [...prev, ...loaded.filter((l) => !existingIds.has(l.id))];
          });
          setSelectedSpaceId(loaded[0].id);
          setPrice(computePriceForHours(loaded[0].pricePerHour, startTime, endTime));
        } else {
          setSelectedSpaceId("");
        }
      })
      .finally(() => {
        if (active) setLoadingSpaces(false);
      });

    return () => {
      active = false;
    };
  }, [isOpen, selectedVenueId, allSpaces, selectedSpaceId, startTime, endTime]);

  // Fetch real space shifts, reservations & maintenance blocks for the selected venue + date
  useEffect(() => {
    if (!isOpen || !selectedVenueId || !date) return;
    let active = true;
    setLoadingAvailability(true);
    getAgendaAction(selectedVenueId, date)
      .then((res) => {
        if (!active) return;
        if (res.ok && res.data?.spaces) {
          setAgendaSpaces(res.data.spaces);
        } else {
          setAgendaSpaces([]);
        }
      })
      .finally(() => {
        if (active) setLoadingAvailability(false);
      });

    return () => {
      active = false;
    };
  }, [isOpen, selectedVenueId, date]);

  const currentAgendaSpace = useMemo(
    () => agendaSpaces.find((s) => s.id === selectedSpaceId) || null,
    [agendaSpaces, selectedSpaceId],
  );

  // Build the complete hour-by-hour availability list for the selected space & date
  const hourlySlots = useMemo<HourlySlotItem[]>(() => {
    const rawShifts =
      currentAgendaSpace?.shifts && currentAgendaSpace.shifts.length > 0
        ? currentAgendaSpace.shifts
        : [{ id: "default", openTime: "06:00", closeTime: "23:00" }];

    const reservations = (currentAgendaSpace?.reservations || []).map((r) => ({
      startMin: timeToMinutes(r.startTime),
      endMin: timeToMinutes(r.endTime) === 0 ? 24 * 60 : timeToMinutes(r.endTime),
      shortCode: r.shortCode,
      customerName: r.customerName,
    }));

    const blocks = (currentAgendaSpace?.blocks || []).map((b) => ({
      startMin: timeToMinutes(b.startTime),
      endMin: timeToMinutes(b.endTime) === 0 ? 24 * 60 : timeToMinutes(b.endTime),
    }));

    const list: HourlySlotItem[] = [];
    rawShifts.forEach((shift, sIdx) => {
      const openMin = timeToMinutes(shift.openTime);
      const rawCloseMin = timeToMinutes(shift.closeTime);
      const closeMin = rawCloseMin === 0 && openMin > 0 ? 24 * 60 : rawCloseMin;
      const shiftLabel = `T${sIdx + 1}: ${formatTime(shift.openTime)} – ${formatTime(shift.closeTime)}`;

      for (let m = openMin; m + 60 <= closeMin; m += 60) {
        const slotEnd = m + 60;
        const matchingRes = reservations.find(
          (r) => r.startMin < slotEnd && r.endMin > m,
        );
        const matchingBlock = blocks.find(
          (b) => b.startMin < slotEnd && b.endMin > m,
        );

        let status: HourlySlotItem["status"] = "AVAILABLE";
        if (matchingRes) status = "RESERVED";
        else if (matchingBlock) status = "BLOCKED";

        if (!list.some((existing) => existing.startMin === m)) {
          list.push({
            shiftIndex: sIdx,
            shiftLabel,
            startMin: m,
            endMin: slotEnd,
            startTime: minutesToTime(m),
            endTime: minutesToTime(slotEnd),
            status,
            reservationCode: matchingRes?.shortCode,
            customerName: matchingRes?.customerName,
          });
        }
      }
    });

    return list.sort((a, b) => a.startMin - b.startMin);
  }, [currentAgendaSpace, formatTime]);

  const availableSlots = useMemo(
    () => hourlySlots.filter((s) => s.status === "AVAILABLE"),
    [hourlySlots],
  );

  // Validate existing selection if space/date changes; never auto-select default hours
  useEffect(() => {
    if (!startTime || !endTime || hourlySlots.length === 0) return;

    const currStartMin = timeToMinutes(startTime);
    const currEndMin = timeToMinutes(endTime);

    let isCurrentRangeValid = currStartMin >= 0 && currEndMin > currStartMin;
    if (isCurrentRangeValid) {
      let targetShift: number | null = null;
      for (let m = currStartMin; m < currEndMin; m += 60) {
        const slot = hourlySlots.find((s) => s.startMin === m);
        if (!slot || slot.status !== "AVAILABLE") {
          isCurrentRangeValid = false;
          break;
        }
        if (targetShift === null) targetShift = slot.shiftIndex;
        else if (slot.shiftIndex !== targetShift) {
          isCurrentRangeValid = false;
          break;
        }
      }
    }

    if (!isCurrentRangeValid) {
      setStartTime("");
      setEndTime("");
      setPrice(0);
    } else {
      const activeSpace = allSpaces.find((sp) => sp.id === selectedSpaceId);
      if (activeSpace) {
        setPrice(computePriceForHours(activeSpace.pricePerHour, startTime, endTime));
      }
    }
  }, [hourlySlots, selectedSpaceId, allSpaces, startTime, endTime]);

  if (!isOpen) return null;

  const selectedVenue = venues.find((v) => v.id === selectedVenueId);
  const selectedSpaceObj = allSpaces.find((sp) => sp.id === selectedSpaceId);
  const isEurVenue = selectedVenue?.referenceCurrencyCode === "EUR";
  const venueCurrencySymbol = isEurVenue ? "€" : "$";
  const venueCurrencyLabel = isEurVenue ? "EUR" : "USD";

  const durationHours =
    startTime && endTime
      ? Math.max(0, (timeToMinutes(endTime) - timeToMinutes(startTime)) / 60)
      : 0;

  // Open the temporary hour-by-hour availability modal
  function handleOpenAvailabilityModal() {
    if (startTime && endTime) {
      setTempStartMin(timeToMinutes(startTime));
      setTempEndMin(timeToMinutes(endTime));
    } else {
      setTempStartMin(null);
      setTempEndMin(null);
    }
    setIsAvailabilityModalOpen(true);
  }

  // Handle clicking a 1-hour slot inside the temporary Availability Modal
  function handleSelectSlotInModal(slot: HourlySlotItem) {
    if (slot.status !== "AVAILABLE") return;

    // If nothing is selected yet, select this 1h slot
    if (tempStartMin === null || tempEndMin === null) {
      setTempStartMin(slot.startMin);
      setTempEndMin(slot.endMin);
      return;
    }

    // If the user clicked the exact single slot that is already selected, keep it or toggle
    if (tempStartMin === slot.startMin && tempEndMin === slot.endMin) {
      return;
    }

    // Check if the clicked slot can form a contiguous AVAILABLE range in the SAME shift with tempStartMin
    const rangeStart = Math.min(tempStartMin, slot.startMin);
    const rangeEnd = Math.max(tempEndMin, slot.endMin);

    // If the user clicked inside an already multi-hour selection (or clicked a new start after having a range),
    // let's check if they are extending from a single-hour anchor (`tempEndMin - tempStartMin === 60`)
    // OR clicking an adjacent hour to expand/shrink:
    const isSingleHourAnchor = tempEndMin - tempStartMin === 60;
    const isImmediatelyAdjacent =
      slot.startMin === tempEndMin || slot.endMin === tempStartMin;

    if (isSingleHourAnchor || isImmediatelyAdjacent) {
      let canFormContiguous = true;
      for (let m = rangeStart; m < rangeEnd; m += 60) {
        const s = hourlySlots.find((item) => item.startMin === m);
        if (!s || s.status !== "AVAILABLE" || s.shiftIndex !== slot.shiftIndex) {
          canFormContiguous = false;
          break;
        }
      }

      if (canFormContiguous) {
        setTempStartMin(rangeStart);
        setTempEndMin(rangeEnd);
        return;
      }
    }

    // Otherwise start a fresh 1-hour selection at the clicked slot
    setTempStartMin(slot.startMin);
    setTempEndMin(slot.endMin);
  }

  function handleConfirmAvailabilitySelection() {
    if (tempStartMin === null || tempEndMin === null || tempEndMin <= tempStartMin) {
      return;
    }
    const nextStart = minutesToTime(tempStartMin);
    const nextEnd = minutesToTime(tempEndMin);
    setStartTime(nextStart);
    setEndTime(nextEnd);
    if (selectedSpaceObj) {
      setPrice(computePriceForHours(selectedSpaceObj.pricePerHour, nextStart, nextEnd));
    }
    setIsAvailabilityModalOpen(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!startTime || !endTime || availableSlots.length === 0) {
      setErrorMsg(t("noSlotsAvailable"));
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const fullPhone = `${countryCode} ${phoneOp === "OTRO" ? "" : phoneOp} ${phoneNum.trim()}`
      .replace(/\s+/g, " ")
      .trim();
    const fullDni = `${docType}-${docNum.trim()}`;

    const input: CreateWalkInReservationInput = {
      spaceId: selectedSpaceId,
      reservationDate: date,
      startTime,
      endTime,
      customerName: name.trim(),
      customerPhone: fullPhone,
      customerDni: fullDni,
      customerDocumentType: docType,
      customerDocumentNumber: docNum.trim(),
      paymentMethod,
      referenceNumber:
        paymentMethod === "PAGO_MOVIL" && referenceNumber.trim()
          ? referenceNumber.trim()
          : undefined,
      originBank:
        paymentMethod === "PAGO_MOVIL" && originBank.trim()
          ? originBank.trim()
          : undefined,
      subtotalOverride: price,
    };

    const res = await createWalkInReservationAction(input);
    setLoading(false);

    if (res.ok) {
      onSuccess(date);
      onClose();
    } else {
      setErrorMsg(res.error.code || t("errorCreate"));
    }
  }

  const tempDurationHours =
    tempStartMin !== null && tempEndMin !== null && tempEndMin > tempStartMin
      ? (tempEndMin - tempStartMin) / 60
      : 0;
  const tempEstimatedPrice =
    selectedSpaceObj && tempDurationHours > 0
      ? Math.round(selectedSpaceObj.pricePerHour * tempDurationHours * 100) / 100
      : 0;

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4"
        onClick={onClose}
        id="walkin-modal-backdrop"
      >
        <div
          className="w-full max-w-2xl rounded-2xl border border-border-medium bg-surface text-foreground shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* HEADER */}
          <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5 bg-surface shrink-0">
            <div className="flex items-center gap-3.5">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent/20 border border-accent/40 text-xl">
                🎟️
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-lg font-bold text-foreground">
                    {t("title")}
                  </h3>
                  <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-500">
                    0% Comisión App
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t("desc")}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
              aria-label="Cerrar"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* FORM */}
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              {errorMsg && (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs font-semibold text-rose-400">
                  {errorMsg}
                </div>
              )}

              {/* SECTION 1: CUSTOMER IDENTITY */}
              <div className="rounded-xl border border-border bg-muted/25 p-4 space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <User className="size-3.5 text-link" />
                  <span>Datos del Jugador / Titular</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                  {/* Client Name */}
                  <div className="sm:col-span-7">
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                      {t("clientName")}
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t("clientNamePlaceholder")}
                      className="w-full rounded-xl border border-border-medium bg-surface px-3.5 py-2.5 text-sm text-foreground placeholder:text-faint-foreground focus:border-ring focus:outline-none"
                      id="walkin-name"
                    />
                  </div>

                  {/* Client DNI */}
                  <div className="sm:col-span-5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                      {t("clientDni")}
                    </label>
                    <div className="flex items-center gap-2">
                      <select
                        value={docType}
                        onChange={(e) => setDocType(e.target.value as any)}
                        className="w-16 shrink-0 rounded-xl border border-border-medium bg-surface px-2.5 py-2.5 text-sm font-bold text-foreground focus:border-ring focus:outline-none cursor-pointer"
                        id="walkin-doc-type"
                      >
                        <option value="V">V</option>
                        <option value="E">E</option>
                        <option value="J">J</option>
                        <option value="G">G</option>
                        <option value="P">P</option>
                        <option value="C">C</option>
                      </select>
                      <input
                        type="text"
                        required
                        value={docNum}
                        onChange={(e) => setDocNum(e.target.value)}
                        placeholder={t("clientDniPlaceholder")}
                        className="w-full min-w-0 flex-1 rounded-xl border border-border-medium bg-surface px-3.5 py-2.5 text-sm text-foreground placeholder:text-faint-foreground focus:border-ring focus:outline-none font-mono"
                        id="walkin-doc-num"
                      />
                    </div>
                  </div>
                </div>

                {/* WhatsApp Phone */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                    {t("clientPhone")}
                  </label>
                  <div className="grid grid-cols-12 gap-2">
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="col-span-4 sm:col-span-3 rounded-xl border border-border-medium bg-surface px-2.5 py-2.5 text-xs font-semibold text-foreground focus:border-ring focus:outline-none cursor-pointer"
                    >
                      <option value="+58">🇻🇪 +58</option>
                      <option value="+1">🇺🇸 +1</option>
                      <option value="+34">🇪🇸 +34</option>
                      <option value="+57">🇨🇴 +57</option>
                      <option value="+507">🇵🇦 +507</option>
                    </select>
                    <select
                      value={phoneOp}
                      onChange={(e) => setPhoneOp(e.target.value)}
                      className="col-span-3 sm:col-span-3 rounded-xl border border-border-medium bg-surface px-2.5 py-2.5 text-xs font-bold text-foreground focus:border-ring focus:outline-none cursor-pointer"
                    >
                      <option value="0412">0412</option>
                      <option value="0422">0422</option>
                      <option value="0414">0414</option>
                      <option value="0424">0424</option>
                      <option value="0416">0416</option>
                      <option value="0426">0426</option>
                      <option value="OTRO">{t("phoneOpOther")}</option>
                    </select>
                    <input
                      type="tel"
                      required
                      value={phoneNum}
                      onChange={(e) => setPhoneNum(e.target.value)}
                      placeholder={t("clientPhonePlaceholder")}
                      className="col-span-5 sm:col-span-6 rounded-xl border border-border-medium bg-surface px-3.5 py-2.5 text-sm text-foreground placeholder:text-faint-foreground focus:border-ring focus:outline-none font-mono"
                      id="walkin-phone-num"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: VENUE, COURT & AVAILABILITY PICKER */}
              <div className="rounded-xl border border-border bg-muted/25 p-4 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <MapPin className="size-3.5 text-link" />
                    <span>Cancha & Horario Disponible</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {!loadingAvailability && (
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${
                          availableSlots.length > 0
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
                            : "border-rose-500/30 bg-rose-500/10 text-rose-400"
                        }`}
                      >
                        {availableSlots.length > 0
                          ? `✓ ${t("slotsAvailableBadge", { count: availableSlots.length })}`
                          : "⚠️ Sin cupos disponibles"}
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={handleOpenAvailabilityModal}
                      disabled={loadingAvailability || loadingSpaces || !selectedSpaceId}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-accent bg-accent/20 hover:bg-accent/30 px-3 py-1 text-xs font-bold text-foreground shadow-xs transition-all cursor-pointer disabled:opacity-50"
                      id="btn-open-availability-modal"
                    >
                      <CalendarClock className="size-3.5 text-link" />
                      <span>{t("btnCheckAvailability")}</span>
                    </button>
                  </div>
                </div>

                {/* Venue & Court */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                      {t("venue")}
                    </label>
                    <select
                      value={selectedVenueId}
                      onChange={(e) => {
                        const nextVenueId = e.target.value;
                        setSelectedVenueId(nextVenueId);
                        const newSpaces = allSpaces.filter((s) => s.venueId === nextVenueId);
                        if (newSpaces[0]) {
                          setSelectedSpaceId(newSpaces[0].id);
                          setPrice(
                            computePriceForHours(newSpaces[0].pricePerHour, startTime, endTime),
                          );
                        }
                      }}
                      className="w-full rounded-xl border border-border-medium bg-surface px-3.5 py-2.5 text-sm font-semibold text-foreground focus:border-ring focus:outline-none cursor-pointer"
                      id="walkin-venue"
                    >
                      {venues.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                      {t("court")}
                    </label>
                    <select
                      value={selectedSpaceId}
                      disabled={loadingSpaces}
                      onChange={(e) => {
                        setSelectedSpaceId(e.target.value);
                        const s = allSpaces.find((sp) => sp.id === e.target.value);
                        if (s) {
                          setPrice(computePriceForHours(s.pricePerHour, startTime, endTime));
                        }
                      }}
                      className="w-full rounded-xl border border-border-medium bg-surface px-3.5 py-2.5 text-sm font-semibold text-foreground focus:border-ring focus:outline-none cursor-pointer disabled:opacity-60"
                      id="walkin-court"
                    >
                      {filteredSpaces.map((sp) => (
                        <option key={sp.id} value={sp.id}>
                          {sp.name} ({venueCurrencySymbol}{sp.pricePerHour}/h)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Date + Read-Only Start Time & End Time (Autofilled via "Ver disponibilidad") */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                      <Calendar className="size-3.5" />
                      <span>{t("date")}</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full rounded-xl border border-border-medium bg-surface px-3 py-2.5 text-sm font-semibold text-foreground focus:border-ring focus:outline-none"
                      id="walkin-date"
                    />
                  </div>

                  <div>
                    <label className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                      <span className="flex items-center gap-1.5">
                        <Clock className="size-3.5" />
                        <span>{t("time")}</span>
                      </span>
                      <Lock className="size-3 text-muted-foreground/70" />
                    </label>
                    <input
                      type="text"
                      readOnly
                      tabIndex={-1}
                      value={startTime ? formatTime(startTime) : t("mustSelectHoursPlaceholder")}
                      className={`w-full rounded-xl border border-border bg-muted/60 px-3.5 py-2.5 text-sm select-none cursor-not-allowed ${
                        startTime
                          ? "font-bold text-foreground"
                          : "font-medium italic text-muted-foreground"
                      }`}
                      id="walkin-time"
                    />
                  </div>

                  <div>
                    <label className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                      <span className="flex items-center gap-1.5">
                        <Clock className="size-3.5 text-link" />
                        <span>{t("endTime")}</span>
                      </span>
                      {durationHours > 0 ? (
                        <span className="rounded bg-accent/25 px-1.5 py-0.2 text-[10px] font-bold text-foreground">
                          {durationHours}h
                        </span>
                      ) : (
                        <Lock className="size-3 text-muted-foreground/70" />
                      )}
                    </label>
                    <input
                      type="text"
                      readOnly
                      tabIndex={-1}
                      value={
                        endTime
                          ? `${formatTime(endTime)}${durationHours > 0 ? ` (${durationHours}h)` : ""}`
                          : t("mustSelectHoursPlaceholder")
                      }
                      className={`w-full rounded-xl border border-border bg-muted/60 px-3.5 py-2.5 text-sm select-none cursor-not-allowed ${
                        endTime
                          ? "font-bold text-foreground"
                          : "font-medium italic text-muted-foreground"
                      }`}
                      id="walkin-end-time"
                    />
                  </div>
                </div>

                {(!startTime || !endTime) && availableSlots.length > 0 && !loadingAvailability && (
                  <div className="rounded-lg border border-border bg-surface/80 px-3 py-2 text-xs font-medium text-muted-foreground flex items-center justify-between gap-2">
                    <span>ℹ️ {t("mustSelectHoursHint")}</span>
                  </div>
                )}

                {availableSlots.length === 0 && !loadingAvailability && (
                  <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-400">
                    {t("noSlotsAvailable")}
                  </div>
                )}
              </div>

              {/* SECTION 3: PAYMENT & AMOUNT */}
              <div className="rounded-xl border border-border bg-muted/25 p-4 space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <CreditCard className="size-3.5 text-link" />
                  <span>Liquidación en Taquilla</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                      {t("paymentMethod")}
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                      className="w-full rounded-xl border border-border-medium bg-surface px-3.5 py-2.5 text-sm font-semibold text-foreground focus:border-ring focus:outline-none cursor-pointer"
                      id="walkin-payment"
                    >
                      <option value="CASH">
                        💵 Efectivo {venueCurrencyLabel} en Caja
                      </option>
                      <option value="PAGO_MOVIL">{t("pagoMovil")}</option>
                      <option value="POS">{t("pos")}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                      Monto a Cobrar ({venueCurrencySymbol} {venueCurrencyLabel})
                    </label>
                    <div className="relative">
                      <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-sm font-bold text-muted-foreground">
                        {venueCurrencySymbol}
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        value={price}
                        onChange={(e) => setPrice(Number(e.target.value))}
                        className="w-full rounded-xl border border-border-medium bg-surface pl-8 pr-3.5 py-2.5 text-sm font-extrabold text-foreground focus:border-ring focus:outline-none"
                        id="walkin-price"
                      />
                    </div>
                  </div>
                </div>

                {paymentMethod === "PAGO_MOVIL" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                        Banco Origen (Opcional)
                      </label>
                      <input
                        type="text"
                        value={originBank}
                        onChange={(e) => setOriginBank(e.target.value)}
                        placeholder="Ej: Banesco, BDV, Mercantil..."
                        className="w-full rounded-xl border border-border-medium bg-surface px-3.5 py-2 text-xs text-foreground placeholder:text-faint-foreground focus:border-ring focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                        Nº de Referencia (Opcional)
                      </label>
                      <input
                        type="text"
                        value={referenceNumber}
                        onChange={(e) => setReferenceNumber(e.target.value)}
                        placeholder="Ej: 847291"
                        className="w-full rounded-xl border border-border-medium bg-surface px-3.5 py-2 text-xs font-mono text-foreground placeholder:text-faint-foreground focus:border-ring focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* FOOTER */}
            <div className="border-t border-border bg-muted/40 px-6 py-4 flex items-center justify-between gap-3 shrink-0">
              <div className="text-xs text-muted-foreground hidden sm:flex items-center gap-1.5">
                <ShieldCheck className="size-4 text-emerald-500" />
                <span>Actualiza inmediatamente la disponibilidad de la cancha</span>
              </div>

              <div className="flex items-center gap-3 ml-auto">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={onClose}
                  disabled={loading}
                >
                  {t("btnCancel")}
                </Button>

                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={loading}
                  disabled={
                    loading ||
                    loadingSpaces ||
                    loadingAvailability ||
                    !startTime ||
                    !endTime ||
                    availableSlots.length === 0
                  }
                  id="btn-confirm-walkin"
                >
                  {loading ? t("btnCreating") : t("btnConfirm")}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* TEMPORARY HOUR-BY-HOUR AVAILABILITY MODAL */}
      {isAvailabilityModalOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 backdrop-blur-xs p-4"
          onClick={() => setIsAvailabilityModalOpen(false)}
          id="walkin-availability-modal-backdrop"
        >
          <div
            className="w-full max-w-xl rounded-2xl border border-border-medium bg-surface text-foreground shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
            id="walkin-availability-modal"
          >
            {/* Availability Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-4 bg-surface shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <CalendarClock className="size-5 text-link" />
                  <h4 className="font-display text-base font-bold text-foreground">
                    {t("availabilityModalTitle")}
                  </h4>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {selectedVenue?.name} •{" "}
                  <strong className="text-foreground">
                    {selectedSpaceObj?.name}
                  </strong>{" "}
                  • <span className="font-mono">{date}</span>
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {t("availabilityModalSubtitle")}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsAvailabilityModalOpen(false)}
                className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Status Legend Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/30 px-6 py-2.5 text-[11px] font-semibold">
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1.5 text-foreground">
                  <span className="size-2.5 rounded-full bg-emerald-500" />
                  {t("legendAvailable")}
                </span>
                <span className="inline-flex items-center gap-1.5 text-foreground">
                  <span className="size-2.5 rounded-full bg-accent border border-foreground/30" />
                  {t("legendSelected")}
                </span>
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <span className="size-2.5 rounded-full bg-rose-500/70" />
                  {t("legendReserved")}
                </span>
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <span className="size-2.5 rounded-full bg-slate-400" />
                  {t("legendBlocked")}
                </span>
              </div>

              {selectedSpaceObj && (
                <span className="font-bold text-foreground">
                  {venueCurrencySymbol}
                  {selectedSpaceObj.pricePerHour}/h
                </span>
              )}
            </div>

            {/* Hour-by-Hour Slots Grid */}
            <div className="p-5 overflow-y-auto flex-1 space-y-3">
              {hourlySlots.length === 0 ? (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-6 text-center text-xs font-semibold text-amber-400">
                  {t("noSlotsAvailable")}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {hourlySlots.map((slot) => {
                    const isSelected =
                      tempStartMin !== null &&
                      tempEndMin !== null &&
                      slot.startMin >= tempStartMin &&
                      slot.endMin <= tempEndMin &&
                      slot.status === "AVAILABLE";

                    const isAvailable = slot.status === "AVAILABLE";
                    const isReserved = slot.status === "RESERVED";

                    let cardClass =
                      "border-border bg-surface hover:border-accent hover:bg-accent/5 text-foreground cursor-pointer";
                    if (isSelected) {
                      cardClass =
                        "border-accent bg-accent/25 text-foreground ring-2 ring-accent/50 shadow-sm cursor-pointer";
                    } else if (isReserved) {
                      cardClass =
                        "border-rose-500/25 bg-rose-500/10 text-muted-foreground opacity-70 cursor-not-allowed";
                    } else if (!isAvailable) {
                      cardClass =
                        "border-border bg-muted/60 text-muted-foreground opacity-60 cursor-not-allowed";
                    }

                    return (
                      <button
                        key={slot.startTime}
                        type="button"
                        disabled={!isAvailable}
                        onClick={() => handleSelectSlotInModal(slot)}
                        className={`flex flex-col justify-between rounded-xl border p-3 text-left transition-all ${cardClass}`}
                        id={`slot-btn-${slot.startTime.replace(":", "")}`}
                      >
                        <div className="flex items-center justify-between gap-1 w-full">
                          <span className="font-mono text-xs font-bold">
                            {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                          </span>
                          {isSelected && (
                            <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                              <Check className="size-3 stroke-[3]" />
                            </span>
                          )}
                        </div>

                        <div className="mt-2 flex items-center justify-between gap-1 w-full text-[10px] font-bold uppercase tracking-wider">
                          {isSelected ? (
                            <span className="text-link">Seleccionado</span>
                          ) : isAvailable ? (
                            <span className="text-emerald-500">
                              ● {t("slotAvailable")}
                            </span>
                          ) : isReserved ? (
                            <span className="text-rose-400 truncate">
                              ✕ {slot.reservationCode ? `#${slot.reservationCode}` : t("slotReserved")}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">
                              🔒 {t("slotBlocked")}
                            </span>
                          )}

                          {isAvailable && selectedSpaceObj && (
                            <span className="text-muted-foreground font-mono">
                              {venueCurrencySymbol}
                              {selectedSpaceObj.pricePerHour}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Availability Modal Footer */}
            <div className="border-t border-border bg-muted/40 px-6 py-4 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="text-xs">
                {tempStartMin !== null && tempEndMin !== null && tempDurationHours > 0 ? (
                  <div>
                    <div className="font-bold text-foreground">
                      {t("selectedRangeSummary", {
                        start: formatTime(minutesToTime(tempStartMin)),
                        end: formatTime(minutesToTime(tempEndMin)),
                        hours: tempDurationHours,
                      })}
                    </div>
                    <div className="text-[11px] font-semibold text-link">
                      Subtotal estimado: {venueCurrencySymbol}
                      {tempEstimatedPrice.toFixed(2)} {venueCurrencyLabel}
                    </div>
                  </div>
                ) : (
                  <span className="text-muted-foreground font-medium">
                    {t("noSelectionYet")}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2.5 ml-auto">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsAvailabilityModalOpen(false)}
                >
                  {t("btnCancel")}
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  disabled={tempStartMin === null || tempEndMin === null || tempDurationHours <= 0}
                  onClick={handleConfirmAvailabilitySelection}
                  id="btn-confirm-availability-hours"
                >
                  {t("btnConfirmHours")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
