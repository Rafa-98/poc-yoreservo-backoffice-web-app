"use client";

import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/shared/ui/button";
import { COMMON_IANA_TIMEZONES, DEFAULT_VENUE_TIMEZONE } from "@/shared/lib";
import { uploadBackofficeFileAction } from "@/shared/api/upload-action";
import type { CreateVenueInput, LocationNode, UpdateVenueInput, VenueItem } from "../model/types";
import { createVenueAction, updateVenueAction } from "../actions/venues-actions";

interface VenueModalProps {
  isOpen: boolean;
  onClose: () => void;
  venue: VenueItem | null;
  locationsTree: LocationNode[];
  onSuccess: (savedVenue: VenueItem) => void;
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
  const [uploadingImage, setUploadingImage] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [rif, setRif] = useState("");
  const [address, setAddress] = useState("");
  const [timezone, setTimezone] = useState<string>(DEFAULT_VENUE_TIMEZONE);
  const [status, setStatus] = useState<"ACTIVE" | "PENDING_VERIFICATION">("ACTIVE");
  const [imageUrl, setImageUrl] = useState("");

  // Phone components
  const [countryCode, setCountryCode] = useState("+58");
  const [operator, setOperator] = useState("0212");
  const [phoneNum, setPhoneNum] = useState("");

  // Cascading Location Tree
  const [selectedStateId, setSelectedStateId] = useState<string>("");
  const [selectedCityId, setSelectedCityId] = useState<string>("");
  const [selectedHoodId, setSelectedHoodId] = useState<string>("");

  function getLocationNodeName(node: LocationNode): string {
    if (typeof node.name === "string") return node.name;
    return node.name?.es || node.name?.en || "";
  }

  function resolveInitialLocationIds(
    targetVenue: VenueItem | null,
    tree: LocationNode[]
  ): { stateId: string; cityId: string; hoodId: string } {
    const firstState = tree?.[0];
    const firstCity = firstState?.children?.[0];
    const firstHood = firstCity?.children?.[0];
    const fallback = {
      stateId: firstState?.id || "",
      cityId: firstCity?.id || "",
      hoodId: firstHood?.id || "",
    };

    if (!targetVenue || !tree || tree.length === 0) {
      return fallback;
    }

    const targetHoodId =
      targetVenue.neighborhoodId ||
      targetVenue.locationId ||
      targetVenue.location?.id ||
      "";
    const targetCityId =
      targetVenue.cityId ||
      targetVenue.location?.parent?.id ||
      targetVenue.location?.parentId ||
      "";
    const targetStateId =
      targetVenue.stateId ||
      targetVenue.location?.parent?.parent?.id ||
      targetVenue.location?.parent?.parentId ||
      "";
    const targetCityName = (targetVenue.city || "").toLowerCase().trim();

    // 1. Direct match if stateId, cityId, neighborhoodId are all known and valid in tree
    if (targetStateId) {
      const matchedState = tree.find((s) => s.id === targetStateId);
      if (matchedState) {
        const matchedCity =
          matchedState.children?.find((c) => c.id === targetCityId) ||
          matchedState.children?.[0];
        const matchedHood =
          matchedCity?.children?.find((h) => h.id === targetHoodId) ||
          matchedCity?.children?.[0];
        return {
          stateId: matchedState.id,
          cityId: matchedCity?.id || "",
          hoodId: matchedHood?.id || "",
        };
      }
    }

    // 2. Search tree by neighborhoodId, cityId, or city name
    for (const st of tree) {
      for (const ct of st.children || []) {
        for (const hd of ct.children || []) {
          if (targetHoodId && hd.id === targetHoodId) {
            return { stateId: st.id, cityId: ct.id, hoodId: hd.id };
          }
        }
        if (
          (targetCityId && ct.id === targetCityId) ||
          (targetHoodId && ct.id === targetHoodId) ||
          (targetCityName &&
            getLocationNodeName(ct).toLowerCase().trim() === targetCityName)
        ) {
          return {
            stateId: st.id,
            cityId: ct.id,
            hoodId: ct.children?.[0]?.id || "",
          };
        }
      }
      if (targetHoodId && st.id === targetHoodId) {
        const ct = st.children?.[0];
        return {
          stateId: st.id,
          cityId: ct?.id || "",
          hoodId: ct?.children?.[0]?.id || "",
        };
      }
    }

    // 3. If venue has explicit IDs even if tree is flat/partial
    if (targetStateId || targetCityId || targetHoodId) {
      return {
        stateId: targetStateId || fallback.stateId,
        cityId: targetCityId || fallback.cityId,
        hoodId: targetHoodId || fallback.hoodId,
      };
    }

    return fallback;
  }

  useEffect(() => {
    if (venue) {
      setName(venue.name || "");
      setRif(venue.rif || "");
      setAddress(venue.address || "");
      setTimezone(venue.timezone || DEFAULT_VENUE_TIMEZONE);
      setStatus(venue.status === "PENDING_VERIFICATION" ? "PENDING_VERIFICATION" : "ACTIVE");
      setImageUrl(venue.imageUrl || "");

      if (venue.contactPhone) {
        const parts = venue.contactPhone.split(" ");
        if (parts.length >= 3) {
          setCountryCode(parts[0]);
          setOperator(parts[1]);
          setPhoneNum(parts.slice(2).join(""));
        } else {
          setPhoneNum(venue.contactPhone);
        }
      } else {
        setPhoneNum("");
      }
    } else {
      setName("");
      setRif("");
      setAddress("");
      setTimezone(DEFAULT_VENUE_TIMEZONE);
      setStatus("ACTIVE");
      setImageUrl("");
      setCountryCode("+58");
      setOperator("0212");
      setPhoneNum("");
    }

    const resolved = resolveInitialLocationIds(venue, locationsTree);
    setSelectedStateId(resolved.stateId);
    setSelectedCityId(resolved.cityId);
    setSelectedHoodId(resolved.hoodId);
  }, [venue, isOpen, locationsTree]);

  const currentState = locationsTree?.find((s) => s.id === selectedStateId);
  const cities = currentState?.children || [];
  const currentCity = cities.find((c) => c.id === selectedCityId);
  const hoods = currentCity?.children || [];

  function handleStateChange(newStateId: string) {
    setSelectedStateId(newStateId);
    const st = locationsTree?.find((s) => s.id === newStateId);
    const firstCity = st?.children?.[0];
    setSelectedCityId(firstCity?.id || "");
    setSelectedHoodId(firstCity?.children?.[0]?.id || "");
  }

  function handleCityChange(newCityId: string) {
    setSelectedCityId(newCityId);
    const ct = cities.find((c) => c.id === newCityId);
    const firstHood = ct?.children?.[0];
    setSelectedHoodId(firstHood?.id || "");
  }

  if (!isOpen) return null;

  async function handleImageFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    setErrorMsg(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("category", "VENUE_IMAGE");
      const res = await uploadBackofficeFileAction(fd);
      if (res.ok && res.data) {
        setImageUrl(res.data.url);
      } else if (!res.ok) {
        setErrorMsg(res.error.code || t("errorUpdate"));
      }
    } finally {
      setUploadingImage(false);
    }
  }

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
        timezone,
        status,
        imageUrl: imageUrl.trim() || undefined,
      };

      const res = await updateVenueAction(venue.id, updateDto);
      setLoading(false);
      if (res.ok && res.data) {
        onSuccess(res.data);
        onClose();
      } else if (!res.ok) {
        setErrorMsg(res.error.code || t("errorUpdate"));
      }
    } else {
      const createDto: CreateVenueInput = {
        name,
        rif,
        address,
        contactPhone: formattedPhone,
        locationId: chosenLocationId,
        timezone,
        status,
        imageUrl: imageUrl.trim() || undefined,
      };

      const res = await createVenueAction(createDto);
      setLoading(false);
      if (res.ok && res.data) {
        onSuccess(res.data);
        onClose();
      } else if (!res.ok) {
        setErrorMsg(res.error.code || t("errorCreate"));
      }
    }
  }

  function getLocationName(node: LocationNode): string {
    if (typeof node.name === "string") return node.name;
    return node.name?.es || node.name?.en || t("defaultLocationName");
  }

  return (
    <div
      className="modal-backdrop"
      id="venue-modal-backdrop"
      onClick={onClose}
    >
      <div
        className="modal-card flex max-h-[90vh] w-full max-w-[600px] flex-col overflow-hidden rounded-2xl border border-border-medium bg-surface shadow-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4.5">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🏟️</span>
            <h3
              className="m-0 text-[17px] font-bold text-foreground"
              id="venue-modal-title"
            >
              {venue ? t("modalTitleEdit") : t("modalTitleNew")}
            </h3>
          </div>
          <button
            type="button"
            className="btn-icon cursor-pointer border-none bg-transparent text-lg text-muted-foreground hover:text-foreground"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5">
          {errorMsg && (
            <div className="mb-4 rounded-lg border border-status-cancelled-border bg-status-cancelled-bg px-3.5 py-2.5 text-[13px] text-status-cancelled-fg">
              {errorMsg}
            </div>
          )}

          <div className="form-group mb-3.5">
            <label
              className="form-label mb-1 block text-xs font-semibold text-foreground"
              htmlFor="venue-name-input"
            >
              {t("name")}
            </label>
            <input
              type="text"
              id="venue-name-input"
              className="input-field form-input"
              placeholder={t("namePlaceholder")}
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="mb-3.5 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <div className="form-group">
              <label
                className="form-label mb-1 block text-xs font-semibold text-foreground"
                htmlFor="venue-rif-input"
              >
                {t("rifLabel")}
              </label>
              <input
                type="text"
                id="venue-rif-input"
                className="input-field form-input"
                required
                value={rif}
                onChange={(e) => setRif(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label
                className="form-label mb-1 block text-xs font-semibold text-foreground"
                htmlFor="venue-status-select"
              >
                {t("statusLabel")}
              </label>
              <select
                id="venue-status-select"
                className="input-field form-select"
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as "ACTIVE" | "PENDING_VERIFICATION")
                }
              >
                <option value="ACTIVE">{t("statusOptionActive")}</option>
                <option value="PENDING_VERIFICATION">{t("statusOptionReview")}</option>
              </select>
            </div>
          </div>

          <div className="form-group mb-3.5">
            <label
              className="form-label mb-1 block text-xs font-semibold text-foreground"
              htmlFor="venue-timezone-select"
            >
              🌎 {t("timezoneLabel")}
            </label>
            <select
              id="venue-timezone-select"
              className="input-field form-select"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
            >
              {!COMMON_IANA_TIMEZONES.some((tz) => tz.value === timezone) && (
                <option value={timezone}>{timezone}</option>
              )}
              {COMMON_IANA_TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
          </div>

          {/* CASCADING GEOGRAPHY SELECTOR */}
          <div className="mb-4 rounded-xl border border-border bg-muted p-4">
            <div className="mb-2.5 text-[11px] font-bold text-link uppercase">
              🗺️ {t("geoTitle")}
            </div>

            <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-2.5">
              <div>
                <label className="form-label mb-1 block text-[11px] font-medium text-muted-foreground">
                  {t("state")}
                </label>
                <select
                  id="geo-state"
                  className="input-field form-select px-2.5 py-2 text-[12.5px]"
                  value={selectedStateId}
                  onChange={(e) => handleStateChange(e.target.value)}
                >
                  {locationsTree?.map((s) => (
                    <option key={s.id} value={s.id}>
                      {getLocationName(s)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label mb-1 block text-[11px] font-medium text-muted-foreground">
                  {t("city")}
                </label>
                <select
                  id="geo-city"
                  className="input-field form-select px-2.5 py-2 text-[12.5px]"
                  value={selectedCityId}
                  onChange={(e) => handleCityChange(e.target.value)}
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
                <label className="form-label mb-1 block text-[11px] font-medium text-muted-foreground">
                  {t("neighborhood")}
                </label>
                <select
                  id="geo-hood"
                  className="input-field form-select px-2.5 py-2 text-[12.5px]"
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

          <div className="form-group mb-3.5">
            <label
              className="form-label mb-1 block text-xs font-semibold text-foreground"
              htmlFor="venue-address-input"
            >
              {t("address")}
            </label>
            <textarea
              id="venue-address-input"
              className="input-field form-textarea"
              rows={2}
              placeholder={t("addressPlaceholder")}
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <div className="form-group mb-3.5">
            <label className="form-label mb-1 block text-xs font-semibold text-foreground">
              {t("phone")}
            </label>
            <div className="flex items-center gap-1.5">
              <select
                id="venue-phone-country"
                className="input-field form-select w-[135px] shrink-0 px-2.5 py-2 text-[12.5px]"
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
                className="input-field form-select w-[110px] shrink-0 px-2.5 py-2 text-[12.5px]"
                value={operator}
                onChange={(e) => setOperator(e.target.value)}
              >
                <option value="0212">{t("operatorLandline")}</option>
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
                className="input-field form-input flex-1 text-[13px]"
                placeholder="1234567"
                maxLength={8}
                required
                value={phoneNum}
                onChange={(e) => setPhoneNum(e.target.value)}
              />
            </div>
          </div>

          {/* VENUE PHOTO UPLOAD & URL */}
          <div className="form-group mb-4">
            <label
              className="form-label mb-1 block text-xs font-semibold text-foreground"
              htmlFor="venue-image-url"
            >
              📷 Foto de la Sede (URL o Subir Imagen)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                id="venue-image-url"
                className="input-field form-input flex-1 text-xs"
                placeholder="https://..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
              <label className="btn btn-outline shrink-0 cursor-pointer px-3 py-2 text-xs">
                <span>{uploadingImage ? "Subiendo..." : "📤 Subir Foto"}</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleImageFileChange}
                  disabled={uploadingImage}
                  id="venue-image-file"
                />
              </label>
            </div>
            {imageUrl && (
              <div className="mt-2 overflow-hidden rounded-xl border border-border bg-muted/40 p-1.5">
                <img
                  src={imageUrl}
                  alt={name || "Vista previa de la sede"}
                  className="h-32 w-full rounded-lg object-cover"
                />
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onClose}
              disabled={loading || uploadingImage}
              id="btn-cancel-venue"
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={loading || uploadingImage}
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
