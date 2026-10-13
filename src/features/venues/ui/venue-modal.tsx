"use client";

import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/shared/ui/button";
import type { CreateVenueInput, LocationNode, UpdateVenueInput, VenueItem } from "../model/types";
import { createVenueAction, updateVenueAction } from "../actions/venues-actions";

interface VenueModalProps {
  isOpen: boolean;
  onClose: () => void;
  venue: VenueItem | null;
  locationsTree: LocationNode[];
  onSuccess: (savedVenue: any) => void;
}

export function VenueModal({
  isOpen,
  onClose,
  venue,
  locationsTree,
  onSuccess,
}: VenueModalProps) {
  const t = useTranslations("venues.venues");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [rif, setRif] = useState("");
  const [address, setAddress] = useState("");
  const [status, setStatus] = useState<"ACTIVE" | "PENDING_VERIFICATION">("ACTIVE");

  // Phone components
  const [countryCode, setCountryCode] = useState("+58");
  const [operator, setOperator] = useState("0212");
  const [phoneNum, setPhoneNum] = useState("9912044");

  // Cascading Location Tree
  const [selectedStateId, setSelectedStateId] = useState<string>("");
  const [selectedCityId, setSelectedCityId] = useState<string>("");
  const [selectedHoodId, setSelectedHoodId] = useState<string>("");

  useEffect(() => {
    if (venue) {
      setName(venue.name || "");
      setRif(venue.rif || "");
      setAddress(venue.address || "");
      setStatus(venue.status === "PENDING_VERIFICATION" ? "PENDING_VERIFICATION" : "ACTIVE");

      if (venue.contactPhone) {
        const parts = venue.contactPhone.split(" ");
        if (parts.length >= 3) {
          setCountryCode(parts[0]);
          setOperator(parts[1]);
          setPhoneNum(parts.slice(2).join(""));
        } else {
          setPhoneNum(venue.contactPhone);
        }
      }
    } else {
      setName("");
      setRif("J-30492811-0");
      setAddress("");
      setStatus("ACTIVE");
      setCountryCode("+58");
      setOperator("0212");
      setPhoneNum("9912044");
    }
  }, [venue, isOpen]);

  // Set default state/city/hood on locationsTree load
  useEffect(() => {
    if (locationsTree && locationsTree.length > 0) {
      if (!selectedStateId) {
        setSelectedStateId(locationsTree[0].id);
      }
    }
  }, [locationsTree, selectedStateId]);

  const currentState = locationsTree?.find((s) => s.id === selectedStateId);
  const cities = currentState?.children || [];

  useEffect(() => {
    if (cities.length > 0) {
      if (!selectedCityId || !cities.some((c) => c.id === selectedCityId)) {
        setSelectedCityId(cities[0].id);
      }
    } else {
      setSelectedCityId("");
    }
  }, [cities, selectedCityId]);

  const currentCity = cities.find((c) => c.id === selectedCityId);
  const hoods = currentCity?.children || [];

  useEffect(() => {
    if (hoods.length > 0) {
      if (!selectedHoodId || !hoods.some((h) => h.id === selectedHoodId)) {
        setSelectedHoodId(hoods[0].id);
      }
    } else {
      setSelectedHoodId("");
    }
  }, [hoods, selectedHoodId]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const chosenLocationId = selectedHoodId || selectedCityId || selectedStateId;
    const formattedPhone = `${countryCode} ${operator} ${phoneNum}`.trim();

    if (venue) {
      const updateDto: UpdateVenueInput = {
        name,
        rif,
        address,
        contactPhone: formattedPhone,
        locationId: chosenLocationId,
        status,
      };

      const res = await updateVenueAction(venue.id, updateDto);
      setLoading(false);
      if (res.ok) {
        onSuccess(res.data);
        onClose();
      } else {
        setErrorMsg(res.error.code || "Error al actualizar la sede");
      }
    } else {
      const createDto: CreateVenueInput = {
        name,
        rif,
        address,
        contactPhone: formattedPhone,
        locationId: chosenLocationId,
        status,
      };

      const res = await createVenueAction(createDto);
      setLoading(false);
      if (res.ok) {
        onSuccess(res.data);
        onClose();
      } else {
        setErrorMsg(res.error.code || "Error al crear la sede");
      }
    }
  }

  function getLocationName(node: LocationNode): string {
    if (typeof node.name === "string") return node.name;
    return node.name?.es || node.name?.en || "Ubicación";
  }

  return (
    <div
      className="modal-backdrop"
      id="venue-modal-backdrop"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.65)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "16px",
      }}
    >
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-medium)",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "600px",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "var(--shadow-lg, 0 10px 25px rgba(0,0,0,0.3))",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "18px 24px",
            borderBottom: "1px solid var(--border-subtle)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "20px" }}>🏟️</span>
            <h3 style={{ fontSize: "17px", fontWeight: 700, margin: 0 }} id="venue-modal-title">
              {venue ? t("modalTitleEdit") : t("modalTitleNew")}
            </h3>
          </div>
          <button
            type="button"
            className="btn-icon"
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "18px",
              cursor: "pointer",
              color: "var(--text-muted)",
            }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>
          {errorMsg && (
            <div
              style={{
                background: "rgba(220, 38, 38, 0.1)",
                border: "1px solid rgba(220, 38, 38, 0.3)",
                color: "var(--status-cancelled-text, #ef4444)",
                padding: "10px 14px",
                borderRadius: "8px",
                fontSize: "13px",
                marginBottom: "16px",
              }}
            >
              {errorMsg}
            </div>
          )}

          <div className="form-group" style={{ marginBottom: "14px" }}>
            <label className="form-label" htmlFor="venue-name-input" style={{ fontSize: "12px", fontWeight: 600 }}>
              {t("name")}
            </label>
            <input
              type="text"
              id="venue-name-input"
              className="input-field"
              placeholder="ej. Complejo Deportivo Los Samanes"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: "12px", fontWeight: 600 }}>
                RIF de la Sede *
              </label>
              <input
                type="text"
                id="venue-rif-input"
                className="input-field"
                required
                value={rif}
                onChange={(e) => setRif(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: "12px", fontWeight: 600 }}>
                Estatus Operativo *
              </label>
              <select
                id="venue-status-select"
                className="input-field"
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
              >
                <option value="ACTIVE">● Activo en App</option>
                <option value="PENDING_VERIFICATION">⏳ En Verificación / Auditoría</option>
              </select>
            </div>
          </div>

          {/* CASCADING GEOGRAPHY SELECTOR */}
          <div
            style={{
              background: "var(--bg-muted)",
              borderRadius: "14px",
              padding: "16px",
              marginBottom: "16px",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                fontWeight: 700,
                textTransform: "uppercase",
                color: "var(--text-link)",
                marginBottom: "10px",
              }}
            >
              🗺️ {t("geoTitle")}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "10px" }}>
              <div>
                <label className="form-label" style={{ fontSize: "11px" }}>
                  {t("state")}
                </label>
                <select
                  id="geo-state"
                  className="input-field"
                  style={{ padding: "8px 10px", fontSize: "12.5px" }}
                  value={selectedStateId}
                  onChange={(e) => setSelectedStateId(e.target.value)}
                >
                  {locationsTree?.map((s) => (
                    <option key={s.id} value={s.id}>
                      {getLocationName(s)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: "11px" }}>
                  {t("city")}
                </label>
                <select
                  id="geo-city"
                  className="input-field"
                  style={{ padding: "8px 10px", fontSize: "12.5px" }}
                  value={selectedCityId}
                  onChange={(e) => setSelectedCityId(e.target.value)}
                  disabled={cities.length === 0}
                >
                  {cities.map((c) => (
                    <option key={c.id} value={c.id}>
                      {getLocationName(c)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: "11px" }}>
                  {t("neighborhood")}
                </label>
                <select
                  id="geo-hood"
                  className="input-field"
                  style={{ padding: "8px 10px", fontSize: "12.5px" }}
                  value={selectedHoodId}
                  onChange={(e) => setSelectedHoodId(e.target.value)}
                  disabled={hoods.length === 0}
                >
                  {hoods.map((h) => (
                    <option key={h.id} value={h.id}>
                      {getLocationName(h)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: "14px" }}>
            <label className="form-label" htmlFor="venue-address-input" style={{ fontSize: "12px", fontWeight: 600 }}>
              {t("address")}
            </label>
            <textarea
              id="venue-address-input"
              className="input-field"
              rows={2}
              placeholder="Av. Principal, sector..."
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: "16px" }}>
            <label className="form-label" style={{ fontSize: "12px", fontWeight: 600 }}>
              {t("phone")}
            </label>
            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
              <select
                id="venue-phone-country"
                className="input-field"
                style={{ width: "135px", flexShrink: 0, padding: "8px 10px", fontSize: "12.5px" }}
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
              >
                <option value="+58">🇻🇪 +58 (VEN)</option>
                <option value="+1">🇺🇸 +1 (USA)</option>
                <option value="+34">🇪🇸 +34 (ESP)</option>
                <option value="+57">🇨🇴 +57 (COL)</option>
                <option value="+507">🇵🇦 +507 (PAN)</option>
                <option value="+52">🇲🇽 +52 (MEX)</option>
              </select>

              <select
                id="venue-phone-operator"
                className="input-field"
                style={{ width: "110px", flexShrink: 0, padding: "8px 10px", fontSize: "12.5px" }}
                value={operator}
                onChange={(e) => setOperator(e.target.value)}
              >
                <option value="0212">0212 (Fijo)</option>
                <option value="0412">0412 (Digitel)</option>
                <option value="0414">0414 (Movistar)</option>
                <option value="0424">0424 (Movistar)</option>
                <option value="0416">0416 (Movilnet)</option>
                <option value="0426">0426 (Movilnet)</option>
                <option value="0241">0241 (Valencia)</option>
              </select>

              <input
                type="tel"
                id="venue-phone-num"
                className="input-field"
                placeholder="1234567"
                maxLength={8}
                required
                value={phoneNum}
                onChange={(e) => setPhoneNum(e.target.value)}
                style={{ flex: 1, fontSize: "13px" }}
              />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onClose}
              disabled={loading}
              id="btn-cancel-venue"
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={loading}
              id="btn-save-venue"
            >
              {t("save")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
