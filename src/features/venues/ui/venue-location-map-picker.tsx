"use client";

import React, { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { Check, Maximize2, Minimize2 } from "lucide-react";
import type L from "leaflet";

interface VenueLocationMapPickerProps {
  lat: number;
  lng: number;
  onChange: (coords: { lat: number; lng: number }) => void;
  contextAddress?: string;
}

const DEFAULT_CARACAS_COORDS = { lat: 10.4806, lng: -66.9036 };

export function VenueLocationMapPicker({
  lat,
  lng,
  onChange,
  contextAddress = "",
}: VenueLocationMapPickerProps) {
  const locale = useLocale();
  const isEn = locale.toLowerCase().startsWith("en");
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const leafletRef = useRef<typeof L | null>(null);

  const [isReady, setIsReady] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<
    Array<{ display_name: string; lat: string; lon: string }>
  >([]);
  const [geoMessage, setGeoMessage] = useState<string | null>(null);

  const safeLat =
    Number.isFinite(lat) && Math.abs(lat) > 0.0001
      ? lat
      : DEFAULT_CARACAS_COORDS.lat;
  const safeLng =
    Number.isFinite(lng) && Math.abs(lng) > 0.0001
      ? lng
      : DEFAULT_CARACAS_COORDS.lng;

  // Keep latest onChange callback in ref for map event listeners
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (!mapContainerRef.current || mapRef.current) return;

      const leafletModule = await import("leaflet");
      const Leaflet = (leafletModule.default ?? leafletModule) as typeof L;
      if (!isMounted || !mapContainerRef.current) return;

      leafletRef.current = Leaflet;

      const map = Leaflet.map(mapContainerRef.current, {
        center: [safeLat, safeLng],
        zoom: 15,
        zoomControl: true,
        scrollWheelZoom: true,
      });

      Leaflet.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

      const pinIcon = Leaflet.divIcon({
        className: "yr-venue-picker-pin",
        html: `
          <div style="
            display:flex;
            align-items:center;
            justify-content:center;
            width:38px;
            height:38px;
            border-radius:9999px;
            background:#0B3D2E;
            color:#D4AF37;
            border:3px solid #D4AF37;
            box-shadow:0 8px 20px rgba(11,61,46,0.45);
            font-size:18px;
            cursor:grab;
            transform:translate(-19px, -19px);
          ">📍</div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      const marker = Leaflet.marker([safeLat, safeLng], {
        icon: pinIcon,
        draggable: true,
      }).addTo(map);

      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        onChangeRef.current({
          lat: Number(pos.lat.toFixed(6)),
          lng: Number(pos.lng.toFixed(6)),
        });
      });

      map.on("click", (e: L.LeafletMouseEvent) => {
        const clickedLat = Number(e.latlng.lat.toFixed(6));
        const clickedLng = Number(e.latlng.lng.toFixed(6));
        marker.setLatLng([clickedLat, clickedLng]);
        onChangeRef.current({
          lat: clickedLat,
          lng: clickedLng,
        });
      });

      mapRef.current = map;
      markerRef.current = marker;
      setIsReady(true);

      setTimeout(() => {
        map.invalidateSize();
      }, 150);
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  // Recalculate Leaflet canvas size when toggling fullscreen mode
  useEffect(() => {
    if (!isReady || !mapRef.current) return;
    const map = mapRef.current;
    map.invalidateSize();
    const timer1 = setTimeout(() => {
      map.invalidateSize();
      map.setView([safeLat, safeLng], map.getZoom(), { animate: false });
    }, 60);
    const timer2 = setTimeout(() => {
      map.invalidateSize();
    }, 220);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [isFullscreen, isReady]);

  // Allow Escape key to close fullscreen map without closing the VenueModal
  useEffect(() => {
    if (!isFullscreen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        setIsFullscreen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [isFullscreen]);

  // Sync marker position when lat/lng props change externally
  useEffect(() => {
    if (!isReady || !mapRef.current || !markerRef.current) return;
    const currentPos = markerRef.current.getLatLng();
    const diffLat = Math.abs(currentPos.lat - safeLat);
    const diffLng = Math.abs(currentPos.lng - safeLng);
    if (diffLat > 0.00001 || diffLng > 0.00001) {
      markerRef.current.setLatLng([safeLat, safeLng]);
      mapRef.current.setView(
        [safeLat, safeLng],
        Math.max(mapRef.current.getZoom(), 15),
        {
          animate: true,
        }
      );
    }
  }, [safeLat, safeLng, isReady]);

  async function runGeocodeSearch(queryToSearch: string) {
    const q = queryToSearch.trim();
    if (!q) return;
    setIsSearching(true);
    setGeoMessage(null);
    setSearchResults([]);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=ve&limit=4&q=${encodeURIComponent(
        q
      )}`;
      const res = await fetch(url, {
        headers: {
          "Accept-Language": isEn ? "en" : "es",
        },
      });
      if (!res.ok) throw new Error("Error consultando el mapa");
      const data = (await res.json()) as Array<{
        display_name: string;
        lat: string;
        lon: string;
      }>;
      if (!data || data.length === 0) {
        setGeoMessage(
          isEn
            ? "No matches found. You can click directly on the map."
            : "No se encontraron coincidencias. Puedes hacer clic directamente en el mapa."
        );
      } else {
        setSearchResults(data);
        const first = data[0];
        const newLat = Number(parseFloat(first.lat).toFixed(6));
        const newLng = Number(parseFloat(first.lon).toFixed(6));
        if (Number.isFinite(newLat) && Number.isFinite(newLng)) {
          onChange({ lat: newLat, lng: newLng });
          if (mapRef.current && markerRef.current) {
            markerRef.current.setLatLng([newLat, newLng]);
            mapRef.current.flyTo([newLat, newLng], 16, { duration: 0.7 });
          }
        }
      }
    } catch {
      setGeoMessage(
        isEn
          ? "Could not connect to search. Click or drag the pin on the map."
          : "No se pudo conectar al buscador. Haz clic o arrastra el pin en el mapa."
      );
    } finally {
      setIsSearching(false);
    }
  }

  function handleUseMyLocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoMessage(
        isEn
          ? "Your browser does not support geolocation."
          : "Tu navegador no soporta geolocalización."
      );
      return;
    }
    setGeoMessage(
      isEn ? "Getting GPS location..." : "Obteniendo ubicación GPS..."
    );
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newLat = Number(pos.coords.latitude.toFixed(6));
        const newLng = Number(pos.coords.longitude.toFixed(6));
        onChange({ lat: newLat, lng: newLng });
        if (mapRef.current && markerRef.current) {
          markerRef.current.setLatLng([newLat, newLng]);
          mapRef.current.flyTo([newLat, newLng], 16, { duration: 0.7 });
        }
        setGeoMessage(null);
      },
      () => {
        setGeoMessage(
          isEn
            ? "Could not get your current GPS location."
            : "No se pudo obtener tu ubicación GPS actual."
        );
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  return (
    <div
      className={
        isFullscreen
          ? "fixed inset-0 z-[10010] flex flex-col bg-surface p-4 sm:p-6"
          : "rounded-xl border border-border bg-muted/40 p-3.5"
      }
    >
      {/* Header & Quick Actions */}
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-foreground sm:text-sm">
            <span>
              📍{" "}
              {isEn
                ? "Exact Location on Map (GPS Coordinates)"
                : "Ubicación Exacta en el Mapa (Coordenadas GPS)"}
            </span>
            {isFullscreen && (
              <span className="rounded-full bg-accent/20 px-2.5 py-0.5 text-[11px] font-bold text-foreground">
                {isEn ? "Fullscreen Mode" : "Modo Pantalla Completa"}
              </span>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground">
            {isEn ? (
              <>
                Click on the map or drag the marker{" "}
                <strong className="text-foreground">📍</strong> to the exact
                venue location.
              </>
            ) : (
              <>
                Haz clic en el mapa o arrastra el marcador{" "}
                <strong className="text-foreground">📍</strong> hasta el punto
                exacto de la sede.
              </>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {contextAddress && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery(contextAddress);
                runGeocodeSearch(contextAddress);
              }}
              className="cursor-pointer rounded-lg border border-border bg-surface px-2.5 py-1.5 text-[11px] font-semibold text-foreground transition-colors hover:border-accent hover:bg-accent/10"
              title={
                isEn
                  ? "Locate on map using the selected area"
                  : "Ubicar en el mapa usando la zona seleccionada"
              }
            >
              {isEn ? "🔎 Locate area" : "🔎 Ubicar zona"}
            </button>
          )}
          <button
            type="button"
            onClick={handleUseMyLocation}
            className="cursor-pointer rounded-lg border border-border bg-surface px-2.5 py-1.5 text-[11px] font-semibold text-foreground transition-colors hover:border-accent hover:bg-accent/10"
          >
            {isEn ? "🎯 Use my GPS" : "🎯 Usar mi GPS"}
          </button>

          {!isFullscreen ? (
            <button
              type="button"
              onClick={() => setIsFullscreen(true)}
              id="btn-expand-venue-map"
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-accent/60 bg-accent/15 px-3 py-1.5 text-[11.5px] font-bold text-foreground shadow-2xs transition-all hover:bg-accent hover:text-accent-foreground"
              title={
                isEn
                  ? "Open map in fullscreen to locate more comfortably"
                  : "Abrir mapa en pantalla completa para ubicar con mayor comodidad"
              }
            >
              <Maximize2 className="size-3.5" />
              <span>{isEn ? "Fullscreen" : "Pantalla completa"}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsFullscreen(false)}
              id="btn-collapse-venue-map"
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-xs font-bold text-accent-foreground shadow-sm transition-all hover:brightness-95"
            >
              <Check className="size-4 stroke-[2.5]" />
              <span>
                {isEn
                  ? "Done · Confirm map point"
                  : "Listo · Confirmar punto en mapa"}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Address Search Bar inside Map Picker */}
      <div className="mb-2.5 flex items-center gap-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              runGeocodeSearch(searchQuery);
            }
          }}
          placeholder={
            isEn
              ? "Search avenue, neighborhood, or landmark in Venezuela..."
              : "Buscar avenida, urbanización o punto de referencia en Venezuela..."
          }
          className="h-9 flex-1 rounded-xl border border-border bg-surface px-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none"
        />
        <button
          type="button"
          disabled={isSearching || !searchQuery.trim()}
          onClick={() => runGeocodeSearch(searchQuery)}
          className="h-9 shrink-0 cursor-pointer rounded-xl bg-accent px-3.5 text-xs font-bold text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {isSearching
            ? isEn
              ? "Searching..."
              : "Buscando..."
            : isEn
              ? "Search"
              : "Buscar"}
        </button>
      </div>

      {geoMessage && (
        <div className="mb-2 rounded-lg bg-surface px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground">
          {geoMessage}
        </div>
      )}

      {searchResults.length > 1 && (
        <div className="mb-2.5 flex flex-col gap-1 rounded-xl border border-border bg-surface p-2">
          <div className="text-[10.5px] font-bold text-muted-foreground uppercase">
            {isEn ? "Suggested results:" : "Resultados sugeridos:"}
          </div>
          {searchResults.map((item, idx) => (
            <button
              key={`${item.lat}-${item.lon}-${idx}`}
              type="button"
              onClick={() => {
                const nLat = Number(parseFloat(item.lat).toFixed(6));
                const nLng = Number(parseFloat(item.lon).toFixed(6));
                onChange({ lat: nLat, lng: nLng });
                if (mapRef.current && markerRef.current) {
                  markerRef.current.setLatLng([nLat, nLng]);
                  mapRef.current.flyTo([nLat, nLng], 16, { duration: 0.6 });
                }
                setSearchResults([]);
              }}
              className="cursor-pointer truncate rounded-lg px-2 py-1 text-left text-[11.5px] text-foreground transition-colors hover:bg-muted"
            >
              📍 {item.display_name}
            </button>
          ))}
        </div>
      )}

      {/* Interactive Map Canvas */}
      <div
        className={`relative w-full overflow-hidden rounded-xl border border-border bg-surface shadow-inner ${
          isFullscreen ? "min-h-0 flex-1" : "h-[240px]"
        }`}
      >
        <div ref={mapContainerRef} className="h-full w-full z-0" />

        {/* Floating Fullscreen Toggle Button inside Map Top-Right Corner */}
        <button
          type="button"
          onClick={() => setIsFullscreen((prev) => !prev)}
          className="absolute right-3 top-3 z-[500] inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-border-medium bg-surface/95 px-3 py-1.5 text-xs font-bold text-foreground shadow-md backdrop-blur-xs transition-all hover:border-accent hover:bg-surface"
          title={
            isFullscreen
              ? isEn
                ? "Exit fullscreen"
                : "Salir de pantalla completa"
              : isEn
                ? "Open map in fullscreen"
                : "Abrir mapa en pantalla completa"
          }
        >
          {isFullscreen ? (
            <>
              <Minimize2 className="size-3.5" />
              <span>{isEn ? "Shrink map" : "Reducir mapa"}</span>
            </>
          ) : (
            <>
              <Maximize2 className="size-3.5" />
              <span>{isEn ? "Expand map" : "Ampliar mapa"}</span>
            </>
          )}
        </button>
      </div>

      {/* Coordinates Strip */}
      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-surface px-3 py-2">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="font-semibold text-muted-foreground">
            {isEn ? "Latitude:" : "Latitud:"}{" "}
            <strong className="font-mono text-foreground">
              {safeLat.toFixed(6)}
            </strong>
          </span>
          <span className="text-border">|</span>
          <span className="font-semibold text-muted-foreground">
            {isEn ? "Longitude:" : "Longitud:"}{" "}
            <strong className="font-mono text-foreground">
              {safeLng.toFixed(6)}
            </strong>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={`https://www.google.com/maps?q=${safeLat},${safeLng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11.5px] font-bold text-link hover:underline"
          >
            {isEn ? "View in Google Maps ↗" : "Ver en Google Maps ↗"}
          </a>
          {isFullscreen && (
            <button
              type="button"
              onClick={() => setIsFullscreen(false)}
              className="cursor-pointer rounded-lg bg-accent px-3 py-1 text-xs font-bold text-accent-foreground hover:brightness-95"
            >
              {isEn
                ? "Confirm and return to form"
                : "Confirmar y volver al formulario"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
