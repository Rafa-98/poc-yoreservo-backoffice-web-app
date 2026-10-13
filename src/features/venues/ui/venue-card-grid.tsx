"use client";

import React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ROUTES } from "@/shared/config";
import type { VenueItem } from "../model/types";

interface VenueCardGridProps {
  venues: VenueItem[];
  onOpenEditVenue: (venue: VenueItem) => void;
  onOpenCreateVenue: () => void;
}

export function VenueCardGrid({
  venues,
  onOpenEditVenue,
  onOpenCreateVenue,
}: VenueCardGridProps) {
  const t = useTranslations("venues.venues");

  function getLocationString(venue: VenueItem): string {
    const loc = venue.location;
    if (!loc) return "📍 Caracas, Venezuela";

    const hood = typeof loc.name === "object" ? loc.name?.es || loc.name?.en : loc.name;
    const city = loc.parent ? (typeof loc.parent.name === "object" ? loc.parent.name?.es : loc.parent.name) : "";
    const state = loc.parent?.parent
      ? typeof loc.parent.parent.name === "object"
        ? loc.parent.parent.name?.es
        : loc.parent.parent.name
      : "";

    if (state && city && hood) {
      return `📍 ${state}, ${city} • ${hood}`;
    }
    return `📍 ${hood || "Caracas"}`;
  }

  return (
    <section style={{ padding: "24px 0" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0 20px 16px",
        }}
      >
        <div style={{ fontSize: "14px", color: "var(--text-muted)", fontWeight: 500 }}>
          {venues.length === 1 ? "1 Sede Registrada" : `${venues.length} Sedes Registradas`}
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={onOpenCreateVenue}
          id="btn-add-venue"
          style={{ fontSize: "13px" }}
        >
          <span>+</span>
          <span>{t("btnAdd")}</span>
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
          gap: "24px",
          padding: "0 20px 32px",
        }}
      >
        {venues.map((venue) => {
          const isActive = venue.status === "ACTIVE";
          const borderTopColor = isActive ? "var(--brand-lime)" : "var(--status-hold-text, #EAB308)";
          const sportsText =
            venue.sports && venue.sports.length > 0
              ? venue.sports.slice(0, 2).join(" / ")
              : "Fútbol / Pádel";

          return (
            <div
              key={venue.id}
              className="venue-card"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "20px",
                overflow: "hidden",
                boxShadow: "var(--shadow-sm)",
                display: "flex",
                flexDirection: "column",
                borderTop: `4px solid ${borderTopColor}`,
              }}
            >
              {/* Hero Image */}
              <div
                style={{
                  height: "160px",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  backgroundImage: venue.imageUrl
                    ? `url('${venue.imageUrl}')`
                    : "linear-gradient(135deg, #1A2418 0%, #0F1710 100%)",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(18,24,17,0.85) 100%)",
                    display: "flex",
                    alignItems: "flex-end",
                    padding: "16px",
                  }}
                >
                  {isActive ? (
                    <span className="badge badge-available">
                      {t("activeInApp")}
                    </span>
                  ) : (
                    <span className="badge badge-hold">
                      {t("inAudit")}
                    </span>
                  )}
                </div>
              </div>

              {/* Body */}
              <div
                style={{
                  padding: "20px",
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div style={{ marginBottom: "8px" }}>
                  <h3
                    style={{
                      fontSize: "18px",
                      fontWeight: 700,
                      marginBottom: "4px",
                      color: "var(--text-main)",
                    }}
                  >
                    {venue.name}
                  </h3>
                  <div style={{ fontSize: "12.5px", color: "var(--text-muted)" }}>
                    {getLocationString(venue)}
                  </div>
                </div>

                <div
                  style={{
                    fontSize: "12px",
                    color: "var(--text-muted)",
                    marginBottom: "16px",
                    lineHeight: "1.5",
                  }}
                >
                  {venue.address}
                </div>

                {/* Amenities Chips */}
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "6px",
                    marginBottom: "20px",
                  }}
                >
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      padding: "4px 9px",
                      borderRadius: "8px",
                      background: "var(--bg-muted)",
                      fontSize: "11.5px",
                      fontWeight: 600,
                      color: "var(--text-muted)",
                    }}
                  >
                    🚗 Estacionamiento Privado
                  </span>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      padding: "4px 9px",
                      borderRadius: "8px",
                      background: "var(--bg-muted)",
                      fontSize: "11.5px",
                      fontWeight: 600,
                      color: "var(--text-muted)",
                    }}
                  >
                    💡 Iluminación LED
                  </span>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      padding: "4px 9px",
                      borderRadius: "8px",
                      background: "var(--bg-muted)",
                      fontSize: "11.5px",
                      fontWeight: 600,
                      color: "var(--text-muted)",
                    }}
                  >
                    🚿 Vestuarios & Duchas
                  </span>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      padding: "4px 9px",
                      borderRadius: "8px",
                      background: "var(--bg-muted)",
                      fontSize: "11.5px",
                      fontWeight: 600,
                      color: "var(--text-muted)",
                    }}
                  >
                    🍔 Cafetín
                  </span>
                </div>

                {/* Stats Strip */}
                <div
                  style={{
                    background: "var(--bg-muted)",
                    borderRadius: "12px",
                    padding: "12px",
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    textAlign: "center",
                    gap: "8px",
                    marginBottom: "20px",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                      {t("courts")}
                    </div>
                    <div
                      style={{
                        fontSize: "16px",
                        fontWeight: 700,
                        color: "var(--text-link)",
                      }}
                    >
                      {venue.spacesCount}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                      {t("sports")}
                    </div>
                    <div style={{ fontSize: "14px", fontWeight: 700 }}>
                      {sportsText}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                      {t("staff")}
                    </div>
                    <div style={{ fontSize: "14px", fontWeight: 700 }}>
                      {venue.staffCount} pers.
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ marginTop: "auto", display: "flex", gap: "10px" }}>
                  <Link
                    href={`${ROUTES.spaces}?venueId=${venue.id}`}
                    prefetch={false}
                    className="btn btn-primary"
                    style={{ flex: 1, fontSize: "12.5px", textAlign: "center" }}
                  >
                    ⚙️ <span>{t("btnManageCourts")}</span>
                  </Link>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => onOpenEditVenue(venue)}
                    style={{ fontSize: "12.5px" }}
                  >
                    ✏️ <span>{t("btnEdit")}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
