"use client";

import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useTimeFormat } from "@/shared/lib/time-format";
import { Button } from "@/shared/ui/button";
import { getSpacesAction } from "@/features/venues/actions/venues-actions";
import { createWalkInReservationAction } from "../actions/reservations-actions";
import type { CreateWalkInReservationInput } from "../model/types";

const WALKIN_TIME_OPTIONS = Array.from({ length: 35 }, (_, i) => {
  const totalMins = 6 * 60 + i * 30;
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
});

interface WalkInModalProps {
  isOpen: boolean;
  onClose: () => void;
  venues: Array<{ id: string; name: string }>;
  spaces: Array<{ id: string; name: string; venueId: string; pricePerHour: number }>;
  onSuccess: () => void;
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
  const filteredSpaces = allSpaces.filter((s) => s.venueId === selectedVenueId);
  const [selectedSpaceId, setSelectedSpaceId] = useState(
    filteredSpaces[0]?.id || "",
  );
  const [loadingSpaces, setLoadingSpaces] = useState(false);

  const todayStr = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(todayStr);
  const [startTime, setStartTime] = useState("17:00");
  const [duration, setDuration] = useState("90");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "PAGO_MOVIL" | "POS">("CASH");

  const computePriceForDuration = (ratePerHour: number, durationStr: string) => {
    const mins = Number(durationStr) || 60;
    return Math.round(ratePerHour * (mins / 60) * 100) / 100;
  };

  const [price, setPrice] = useState(() =>
    computePriceForDuration(filteredSpaces[0]?.pricePerHour ?? 0, "90")
  );

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
        setSelectedSpaceId(venueSpaces[0].id);
        setPrice(computePriceForDuration(venueSpaces[0].pricePerHour, duration));
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
            name: sp.spaceNumber,
            venueId: sp.venueId,
            pricePerHour: sp.pricePerHour,
          }));
          setAllSpaces((prev) => {
            const existingIds = new Set(prev.map((p) => p.id));
            return [...prev, ...loaded.filter((l) => !existingIds.has(l.id))];
          });
          setSelectedSpaceId(loaded[0].id);
          setPrice(computePriceForDuration(loaded[0].pricePerHour, duration));
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
  }, [isOpen, selectedVenueId, allSpaces, selectedSpaceId, duration]);

  if (!isOpen) return null;

  function calculateEndTime(start: string, durationMins: number): string {
    const [h, m] = start.split(":").map(Number);
    const totalMins = h * 60 + m + durationMins;
    const endH = Math.floor(totalMins / 60) % 24;
    const endM = totalMins % 60;
    return `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const fullPhone = `${countryCode} ${phoneOp === "OTRO" ? "" : phoneOp} ${phoneNum.trim()}`.replace(/\s+/g, " ").trim();
    const fullDni = `${docType}-${docNum.trim()}`;
    const endTime = calculateEndTime(startTime, Number(duration));

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
    };

    const res = await createWalkInReservationAction(input);
    setLoading(false);

    if (res.ok) {
      onSuccess();
      onClose();
    } else {
      setErrorMsg(res.error.code || t("errorCreate"));
    }
  }

  return (
    <div
      className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      id="walkin-modal-backdrop"
    >
      <div
        className="modal-card w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-border p-6 bg-surface">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎟️</span>
            <div>
              <h3 className="font-display text-lg font-bold text-foreground">
                {t("title")}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t("desc")}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-all cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            {errorMsg && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs font-semibold text-rose-400">
                {errorMsg}
              </div>
            )}

            {/* Client Name & DNI */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                  {t("clientName")}
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("clientNamePlaceholder")}
                  className="form-input"
                  id="walkin-name"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                  {t("clientDni")}
                </label>
                <div className="flex gap-2 min-w-0">
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value as any)}
                    className="form-select font-bold px-2 py-2 text-xs w-[70px] shrink-0"
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
                    className="form-input flex-1 min-w-0"
                    id="walkin-doc-num"
                  />
                </div>
              </div>
            </div>

            {/* WhatsApp */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                {t("clientPhone")}
              </label>
              <div className="flex gap-2 min-w-0">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="form-select text-xs px-2 py-2 w-[100px] shrink-0"
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
                  className="form-select text-xs font-bold px-2 py-2 w-[85px] shrink-0"
                >
                  <option value="0412">0412</option>
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
                  className="form-input flex-1 min-w-0"
                  id="walkin-phone-num"
                />
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
                      setPrice(computePriceForDuration(newSpaces[0].pricePerHour, duration));
                    }
                  }}
                  className="form-select"
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
                    if (s) setPrice(computePriceForDuration(s.pricePerHour, duration));
                  }}
                  className="form-select"
                  id="walkin-court"
                >
                  {filteredSpaces.map((sp) => (
                    <option key={sp.id} value={sp.id}>
                      {sp.name} (${sp.pricePerHour}/h)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date, Time & Duration */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                  {t("date")}
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="form-input"
                  id="walkin-date"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                  {t("time")}
                </label>
                <select
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="form-select"
                  id="walkin-time"
                >
                  {WALKIN_TIME_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {formatTime(opt)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                  {t("duration")}
                </label>
                <select
                  value={duration}
                  onChange={(e) => {
                    const nextDur = e.target.value;
                    setDuration(nextDur);
                    const s = allSpaces.find((sp) => sp.id === selectedSpaceId);
                    if (s) setPrice(computePriceForDuration(s.pricePerHour, nextDur));
                  }}
                  className="form-select"
                  id="walkin-duration"
                >
                  <option value="60">{t("duration60")}</option>
                  <option value="90">{t("duration90")}</option>
                  <option value="120">{t("duration120")}</option>
                </select>
              </div>
            </div>

            {/* Payment & Amount */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                  {t("paymentMethod")}
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="form-select"
                  id="walkin-payment"
                >
                  <option value="CASH">{t("cash")}</option>
                  <option value="PAGO_MOVIL">{t("pagoMovil")}</option>
                  <option value="POS">{t("pos")}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                  {t("amount")}
                </label>
                <input
                  type="number"
                  required
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="form-input font-bold"
                  id="walkin-price"
                />
              </div>
            </div>
          </div>

          {/* FOOTER */}
          <div className="border-t border-border bg-muted/50 p-5 flex items-center justify-end gap-3">
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
              disabled={loading}
              id="btn-confirm-walkin"
            >
              {loading ? t("btnCreating") : t("btnConfirm")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
