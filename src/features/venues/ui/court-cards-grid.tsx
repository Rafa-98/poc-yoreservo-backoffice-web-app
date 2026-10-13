"use client";

import React from "react";
import { useTranslations } from "next-intl";
import type { SpaceItem, VenueItem } from "../model/types";

interface CourtCardsGridProps {
  venues: VenueItem[];
  selectedVenueId: string;
  onSelectVenueId: (id: string) => void;
  spaces: SpaceItem[];
  bcvRate: number;
  referenceCurrencyCode: string; // 'USD' | 'EUR'
  onOpenCreateCourt: () => void;
  onOpenEditCourt: (court: SpaceItem) => void;
  onToggleCourtStatus: (court: SpaceItem) => void;
}

export function CourtCardsGrid({
  venues,
  selectedVenueId,
  onSelectVenueId,
  spaces,
  bcvRate,
  referenceCurrencyCode = "USD",
  onOpenCreateCourt,
  onOpenEditCourt,
  onToggleCourtStatus,
}: CourtCardsGridProps) {
  const t = useTranslations("venues.spaces");

  const currentVenue = venues.find((v) => v.id === selectedVenueId) || venues[0];
  const currencySymbol = referenceCurrencyCode === "EUR" ? "€" : "$";
  const currencySuffix = referenceCurrencyCode === "EUR" ? "EUR / h" : "USD / h";

  function getSportBadge(space: SpaceItem): string {
    const raw =
      typeof space.activityCategory?.name === "object"
        ? space.activityCategory?.name?.es || space.activityCategory?.name?.en
        : space.activityCategory?.name;
    const act =
      typeof space.activityCategory?.activity?.name === "object"
        ? space.activityCategory?.activity?.name?.es ||
          space.activityCategory?.activity?.name?.en
        : space.activityCategory?.activity?.name;

    if (raw) return `⚽ ${raw}`;
    if (act) return `🎾 ${act}`;
    return "⚽ Deporte";
  }

  return (
    <section style={{ padding: "20px 0" }}>
      {/* Venue Selector & Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "14px",
          padding: "0 20px 16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-muted)" }}>
            Sede:
          </label>
          <select
            id="venue-selector"
            className="input-field"
            value={selectedVenueId}
            onChange={(e) => onSelectVenueId(e.target.value)}
            style={{ fontWeight: 700, padding: "8px 14px", fontSize: "14px" }}
          >
            {venues.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} ({v.spacesCount} canchas)
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={onOpenCreateCourt}
          id="btn-add-court"
          style={{ fontSize: "13px" }}
        >
          <span>+</span>
          <span>{t("btnAdd")}</span>
        </button>
      </div>

      {/* Database Entity Info Box */}
      <div style={{ padding: "0 20px 20px" }}>
        <div
          style={{
            background: "var(--bg-muted)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "14px",
            padding: "14px 18px",
            fontSize: "12.5px",
            lineHeight: "1.5",
          }}
        >
          <strong style={{ color: "var(--text-main)" }}>
            {t("infoTitle")}
          </strong>{" "}
          <span style={{ color: "var(--text-muted)" }}>
            {t("infoDesc")}
          </span>
        </div>
      </div>

      {/* Grid of Courts */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
          gap: "20px",
          padding: "0 20px 32px",
        }}
      >
        {spaces.map((court) => {
          const isEnabled = court.status === "ENABLED";
          const bcvTotal = (court.pricePerHour * bcvRate).toLocaleString("es-VE", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });

          return (
            <div
              key={court.id}
              className="court-config-card"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "20px",
                padding: "22px",
                boxShadow: "var(--shadow-sm)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                borderTop: isEnabled
                  ? "4px solid var(--brand-lime)"
                  : "4px solid var(--status-hold-text, #EAB308)",
                opacity: isEnabled ? 1 : 0.85,
              }}
            >
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "12px",
                  }}
                >
                  <span className="badge badge-confirmed">
                    {getSportBadge(court)}
                  </span>
                  {isEnabled ? (
                    <span className="badge badge-available">
                      {t("statusEnabled")}
                    </span>
                  ) : (
                    <span className="badge badge-cancelled">
                      {t("statusDisabled")}
                    </span>
                  )}
                </div>

                <h3
                  style={{
                    fontSize: "19px",
                    fontWeight: 700,
                    marginBottom: "6px",
                    color: "var(--text-main)",
                  }}
                >
                  {court.spaceNumber}
                </h3>
                <div
                  style={{
                    fontSize: "12.5px",
                    color: "var(--text-muted)",
                    marginBottom: "14px",
                  }}
                >
                  Superficie:{" "}
                  <strong style={{ color: "var(--text-main)" }}>
                    {court.surfaceType || "Grama Estándar"}
                  </strong>
                </div>

                {/* Price Box */}
                <div
                  style={{
                    background: "var(--bg-muted)",
                    borderRadius: "14px",
                    padding: "14px",
                    marginBottom: "16px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "11px",
                      textTransform: "uppercase",
                      color: "var(--text-muted)",
                      fontWeight: 700,
                      marginBottom: "4px",
                    }}
                  >
                    {t("hourlyRate")}
                  </div>
                  <div
                    style={{
                      fontFamily: "'Outfit', sans-serif",
                      fontSize: "24px",
                      fontWeight: 700,
                      color: "var(--text-link)",
                      display: "flex",
                      alignItems: "baseline",
                      gap: "4px",
                    }}
                  >
                    {currencySymbol}
                    {court.pricePerHour.toFixed(2)}{" "}
                    <span
                      style={{
                        fontSize: "13px",
                        color: "var(--text-muted)",
                        fontWeight: 500,
                      }}
                    >
                      {currencySuffix}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "var(--text-muted)",
                      marginTop: "2px",
                    }}
                  >
                    {t("bcvEquivalent", { amount: bcvTotal })}
                  </div>
                </div>

                <div
                  style={{
                    fontSize: "12px",
                    color: "var(--text-muted)",
                    lineHeight: "1.6",
                    marginBottom: "16px",
                  }}
                >
                  • Capacidad: {court.capacity || 10} a{" "}
                  {(court.capacity || 10) + 2} jugadores
                  <br />
                  • Techado: {court.isCovered ? "100% techada indoor" : "Al aire libre"}
                  <br />
                  • Iluminación LED: Incluida en tarifa
                  {court.activeBookingsCount > 0 && (
                    <div style={{ marginTop: "4px", color: "var(--brand-lime-text, var(--text-link))", fontWeight: 600 }}>
                      ⚡ {court.activeBookingsCount} reservas confirmadas activas
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  borderTop: "1px solid var(--border-subtle)",
                  paddingTop: "14px",
                }}
              >
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => onOpenEditCourt(court)}
                  style={{ flex: 1, fontSize: "12.5px" }}
                >
                  ✏️ <span>{t("btnEdit")}</span>
                </button>

                {isEnabled ? (
                  <button
                    type="button"
                    className="btn btn-destructive"
                    onClick={() => onToggleCourtStatus(court)}
                    style={{ padding: "8px 12px", fontSize: "12px" }}
                    id={`btn-disable-${court.id}`}
                  >
                    ⏸️ <span>{t("btnDisable")}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => onToggleCourtStatus(court)}
                    style={{ padding: "8px 12px", fontSize: "12px" }}
                    id={`btn-enable-${court.id}`}
                  >
                    ▶️ <span>{t("btnEnable")}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
