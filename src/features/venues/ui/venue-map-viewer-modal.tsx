"use client";

import React, { useEffect, useRef } from "react";
import { useLocale } from "next-intl";
import { ExternalLink, MapPin, X } from "lucide-react";
import type L from "leaflet";
import type { VenueItem } from "../model/types";

interface VenueMapViewerModalProps {
  venue: VenueItem | null;
  locationLabel?: string;
  onClose: () => void;
}

const DEFAULT_CARACAS_COORDS = { lat: 10.4806, lng: -66.9036 };

export function VenueMapViewerModal({
  venue,
  locationLabel = "",
  onClose,
}: VenueMapViewerModalProps) {
  const locale = useLocale();
  const isEn = locale.toLowerCase().startsWith("en");
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  const safeLat =
    venue &&
    Number.isFinite(venue.locationLat) &&
    Math.abs(venue.locationLat) > 0.0001
      ? venue.locationLat
      : DEFAULT_CARACAS_COORDS.lat;
  const safeLng =
    venue &&
    Number.isFinite(venue.locationLng) &&
    Math.abs(venue.locationLng) > 0.0001
      ? venue.locationLng
      : DEFAULT_CARACAS_COORDS.lng;

  useEffect(() => {
    if (!venue) return;
    let isMounted = true;

    async function initMap() {
      if (!mapContainerRef.current) return;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      const leafletModule = await import("leaflet");
      const Leaflet = (leafletModule.default ?? leafletModule) as typeof L;
      if (!isMounted || !mapContainerRef.current || !venue) return;

      const map = Leaflet.map(mapContainerRef.current, {
        center: [safeLat, safeLng],
        zoom: 16,
        zoomControl: true,
        scrollWheelZoom: true,
      });

      Leaflet.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

      const pinIcon = Leaflet.divIcon({
        className: "yr-venue-viewer-pin",
        html: `
          <div style="
            display:flex;
            align-items:center;
            justify-content:center;
            width:42px;
            height:42px;
            border-radius:9999px;
            background:#0B3D2E;
            color:#D4AF37;
            border:3px solid #D4AF37;
            box-shadow:0 10px 24px rgba(11,61,46,0.5);
            font-size:20px;
            transform:translate(-21px, -21px);
          ">📍</div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      const marker = Leaflet.marker([safeLat, safeLng], {
        icon: pinIcon,
      }).addTo(map);

      marker
        .bindPopup(
          `<div style="font-family:sans-serif;padding:2px 4px;">
            <strong style="font-size:13px;display:block;margin-bottom:2px;">${venue.name}</strong>
            <span style="font-size:11.5px;color:#555;">${venue.address}</span>
          </div>`
        )
        .openPopup();

      mapRef.current = map;

      setTimeout(() => {
        map.invalidateSize();
      }, 120);
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [venue, safeLat, safeLng]);

  useEffect(() => {
    if (!venue) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [venue, onClose]);

  if (!venue) return null;

  return (
    <div
      className="modal-backdrop"
      id="venue-map-viewer-backdrop"
      onClick={onClose}
    >
      <div
        className="modal-card flex max-h-[90vh] w-full max-w-[780px] flex-col overflow-hidden rounded-2xl border border-border-medium bg-surface shadow-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="min-w-0 pr-3">
            <div className="flex items-center gap-2">
              <MapPin className="size-4 shrink-0 text-link" />
              <h3 className="m-0 truncate text-base font-bold text-foreground">
                {venue.name}
              </h3>
            </div>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {locationLabel ? `${locationLabel.replace(/^📍\s*/, "")} · ` : ""}
              {venue.address}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-border bg-muted/50 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label={isEn ? "Close map" : "Cerrar mapa"}
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Map Canvas */}
        <div className="relative h-[440px] w-full bg-muted">
          <div ref={mapContainerRef} className="h-full w-full z-0" />
        </div>

        {/* Footer with Coordinates & Google Maps Link */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-muted/30 px-6 py-3.5">
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span>
              {isEn ? "Latitude:" : "Latitud:"}{" "}
              <strong className="font-mono text-foreground">
                {safeLat.toFixed(6)}
              </strong>
            </span>
            <span className="text-border">|</span>
            <span>
              {isEn ? "Longitude:" : "Longitud:"}{" "}
              <strong className="font-mono text-foreground">
                {safeLng.toFixed(6)}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <a
              href={`https://www.google.com/maps?q=${safeLat},${safeLng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-border-medium bg-surface px-3.5 py-2 text-xs font-bold text-foreground transition-colors hover:border-accent hover:bg-accent/15"
            >
              <span>{isEn ? "Open in Google Maps" : "Abrir en Google Maps"}</span>
              <ExternalLink className="size-3.5" />
            </a>
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-xl bg-accent px-4 py-2 text-xs font-bold text-accent-foreground transition-all hover:brightness-95"
            >
              {isEn ? "Close" : "Cerrar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

