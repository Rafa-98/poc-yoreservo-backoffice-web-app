"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Lock, Mail, Phone, Plus, Trash2 } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { DEFAULT_VENUE_TIMEZONE } from "@/shared/lib";
import { uploadBackofficeFileAction } from "@/shared/api/upload-action";
import type { BackofficeRole } from "@/shared/config";
import {
  SearchableSelect,
  type SearchableOption,
} from "@/features/users/ui/searchable-select";
import type {
  CreateVenueInput,
  LocationNode,
  UpdateVenueInput,
  VenueItem,
  VenueStatusType,
} from "../model/types";
import { useActiveVenue } from "../context/venue-context";
import { createVenueAction, updateVenueAction } from "../actions/venues-actions";
import { VenueLocationMapPicker } from "./venue-location-map-picker";

function onlyDigits(val: string): string {
  return val.replace(/\D/g, "");
}

interface PhoneEntry {
  operator: string;
  number: string;
}

function parsePhoneToEntry(rawPhone: string): PhoneEntry {
  const trimmed = (rawPhone || "").trim();
  if (!trimmed) {
    return { operator: "0212", number: "" };
  }
  const digits = onlyDigits(trimmed);
  const localDigits = digits.startsWith("58") ? digits.slice(2) : digits;
  const normalizedLocal =
    localDigits.length === 10 && !localDigits.startsWith("0")
      ? `0${localDigits}`
      : localDigits;

  if (normalizedLocal.length >= 11 && normalizedLocal.startsWith("0")) {
    return {
      operator: normalizedLocal.slice(0, 4),
      number: normalizedLocal.slice(4, 11),
    };
  }

  const parts = trimmed.split(/[\s-]+/);
  if (parts.length >= 3) {
    const rawOp = onlyDigits(parts[1]);
    const normOp =
      rawOp.length === 3 && !rawOp.startsWith("0") ? `0${rawOp}` : rawOp;
    return {
      operator: normOp || "0212",
      number: onlyDigits(parts.slice(2).join("")).slice(0, 7),
    };
  }

  return {
    operator: "0212",
    number: onlyDigits(trimmed).slice(-7),
  };
}

interface VenueModalProps {
  isOpen: boolean;
  onClose: () => void;
  venue: VenueItem | null;
  locationsTree: LocationNode[];
  onSuccess: (savedVenue: VenueItem) => void;
  userRole?: BackofficeRole;
}

const DEFAULT_CARACAS_COORDS = { lat: 10.4806, lng: -66.9036 };

export function VenueModal({
  isOpen,
  onClose,
  venue,
  locationsTree,
  onSuccess,
  userRole = "ALLY_ADMIN",
}: VenueModalProps) {
  const locale = useLocale();
  const isEn = locale.toLowerCase().startsWith("en");
  const t = useTranslations("venues.venues");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const phoneOperatorOptions = useMemo<SearchableOption[]>(
    () => [
      {
        value: "0212",
        label: "0212",
        subtitle: isEn
          ? "Caracas / Greater Caracas (Landline)"
          : "Caracas / Gran Caracas (Fijo)",
      },
      { value: "0412", label: "0412", subtitle: "Digitel" },
      { value: "0422", label: "0422", subtitle: "Digitel" },
      { value: "0414", label: "0414", subtitle: "Movistar" },
      { value: "0424", label: "0424", subtitle: "Movistar" },
      { value: "0416", label: "0416", subtitle: "Movilnet" },
      { value: "0426", label: "0426", subtitle: "Movilnet" },
      {
        value: "0241",
        label: "0241",
        subtitle: isEn
          ? "Valencia / Carabobo (Landline)"
          : "Valencia / Carabobo (Fijo)",
      },
      {
        value: "0251",
        label: "0251",
        subtitle: isEn
          ? "Barquisimeto / Lara (Landline)"
          : "Barquisimeto / Lara (Fijo)",
      },
      {
        value: "0261",
        label: "0261",
        subtitle: isEn
          ? "Maracaibo / Zulia (Landline)"
          : "Maracaibo / Zulia (Fijo)",
      },
      {
        value: "0281",
        label: "0281",
        subtitle: isEn
          ? "Lechería / Anzoátegui (Landline)"
          : "Lechería / Anzoátegui (Fijo)",
      },
    ],
    [isEn]
  );

  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [rifDigits, setRifDigits] = useState("");
  const [address, setAddress] = useState("");
  const [status, setStatus] = useState<VenueStatusType>("ACTIVE");
  const [imageUrl, setImageUrl] = useState("");

  // Map coordinates
  const [locationLat, setLocationLat] = useState<number>(
    DEFAULT_CARACAS_COORDS.lat
  );
  const [locationLng, setLocationLng] = useState<number>(
    DEFAULT_CARACAS_COORDS.lng
  );

  // Multiple Phone Entries (+58 fixed for VE, operator select, 7-digit number)
  const [phoneEntries, setPhoneEntries] = useState<PhoneEntry[]>([
    { operator: "0212", number: "" },
  ]);

  // Multiple Contact Email Entries
  const [emailEntries, setEmailEntries] = useState<string[]>([""]);

  // Cascading Location Tree
  const [selectedStateId, setSelectedStateId] = useState<string>("");
  const [selectedCityId, setSelectedCityId] = useState<string>("");
  const [selectedHoodId, setSelectedHoodId] = useState<string>("");

  const isPlatformStaff =
    userRole === "PLATFORM_ADMIN" || userRole === "PLATFORM_ACCOUNTING";

  const { organizations, activeOrganizationId } = useActiveVenue();
  const allyOrganizations = useMemo(
    () => organizations.filter((o) => !o.isPlatformOrg),
    [organizations],
  );
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");

  const organizationOptions = useMemo<SearchableOption[]>(
    () =>
      (allyOrganizations.length > 0 ? allyOrganizations : organizations).map(
        (org) => ({
          value: org.id,
          label: org.tradeName,
          subtitle: org.rif
            ? `${org.rif} · ${org.venuesCount} ${
                isEn
                  ? org.venuesCount === 1
                    ? "venue"
                    : "venues"
                  : org.venuesCount === 1
                    ? "sede"
                    : "sedes"
              }`
            : undefined,
          icon: "🏢",
        }),
      ),
    [allyOrganizations, organizations, isEn],
  );

  function getLocationNodeName(node: LocationNode): string {
    if (typeof node.name === "string") return node.name;
    return isEn
      ? node.name?.en || node.name?.es || ""
      : node.name?.es || node.name?.en || "";
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
    setErrorMsg(null);
    if (venue) {
      setName(venue.name || "");
      const rawRif = (venue.rif || "").trim();
      const cleanedRif = rawRif.replace(/^[JjVGvgEe]\s*-?\s*/, "");
      setRifDigits(cleanedRif);
      setAddress(venue.address || "");

      const normalizedStatus: VenueStatusType =
        venue.status === "PENDING_VERIFICATION" ||
        venue.status === "IN_VERIFICATION"
          ? "IN_VERIFICATION"
          : venue.status === "INACTIVE"
            ? "INACTIVE"
            : "ACTIVE";
      setStatus(normalizedStatus);
      setImageUrl(venue.imageUrl || "");

      setLocationLat(
        typeof venue.locationLat === "number" &&
          Math.abs(venue.locationLat) > 0.0001
          ? venue.locationLat
          : DEFAULT_CARACAS_COORDS.lat
      );
      setLocationLng(
        typeof venue.locationLng === "number" &&
          Math.abs(venue.locationLng) > 0.0001
          ? venue.locationLng
          : DEFAULT_CARACAS_COORDS.lng
      );

      const rawPhones =
        venue.contactPhones && venue.contactPhones.length > 0
          ? venue.contactPhones
          : venue.contactPhone
            ? [venue.contactPhone]
            : [];
      if (rawPhones.length > 0) {
        setPhoneEntries(rawPhones.map(parsePhoneToEntry));
      } else {
        setPhoneEntries([{ operator: "0212", number: "" }]);
      }

      const rawEmails =
        venue.contactEmails && venue.contactEmails.length > 0
          ? venue.contactEmails
          : venue.contactEmail
            ? [venue.contactEmail]
            : [];
      if (rawEmails.length > 0) {
        setEmailEntries(rawEmails);
      } else {
        setEmailEntries([""]);
      }
    } else {
      setName("");
      setRifDigits("");
      setAddress("");
      setStatus("ACTIVE");
      setImageUrl("");
      setLocationLat(DEFAULT_CARACAS_COORDS.lat);
      setLocationLng(DEFAULT_CARACAS_COORDS.lng);
      setPhoneEntries([{ operator: "0212", number: "" }]);
      setEmailEntries([""]);
      if (isPlatformStaff) {
        const defaultOrg =
          activeOrganizationId && activeOrganizationId !== "ALL"
            ? activeOrganizationId
            : allyOrganizations[0]?.id || organizations[0]?.id || "";
        setSelectedOrgId(defaultOrg);
      }
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

  const stateOptions = useMemo<SearchableOption[]>(
    () =>
      (locationsTree || []).map((s) => ({
        value: s.id,
        label: getLocationNodeName(s) || (isEn ? "State" : "Estado"),
      })),
    [locationsTree, isEn]
  );

  const cityOptions = useMemo<SearchableOption[]>(
    () =>
      cities.map((c) => ({
        value: c.id,
        label: getLocationNodeName(c) || (isEn ? "City" : "Ciudad"),
      })),
    [cities, isEn]
  );

  const hoodOptions = useMemo<SearchableOption[]>(
    () =>
      hoods.map((h) => ({
        value: h.id,
        label:
          getLocationNodeName(h) ||
          (isEn ? "Neighborhood / Zone" : "Urbanización / Zona"),
      })),
    [hoods, isEn]
  );

  const statusOptions = useMemo<SearchableOption[]>(() => {
    const baseOptions: SearchableOption[] = [
      {
        value: "ACTIVE",
        label: isEn ? "Enabled (Active in App)" : "Habilitado (Activo en App)",
        subtitle: isEn
          ? "Visible and available for player bookings"
          : "Visible y disponible para reservas de jugadores",
        icon: "🟢",
      },
      {
        value: "INACTIVE",
        label: isEn ? "Disabled (Inactive)" : "Deshabilitado (Inactivo)",
        subtitle: isEn
          ? "Temporarily paused for new bookings"
          : "Pausado temporalmente para nuevas reservas",
        icon: "🔴",
      },
    ];
    if (isPlatformStaff) {
      baseOptions.push({
        value: "IN_VERIFICATION",
        label: isEn
          ? "In Review / Audit (YoReservo)"
          : "En Revisión / Auditoría (YoReservo)",
        subtitle: isEn
          ? "YoReservo Staff Exclusive · Under operational validation"
          : "Exclusivo Staff YoReservo · En validación operativa",
        icon: "⏳",
      });
    }
    return baseOptions;
  }, [isPlatformStaff, isEn]);

  const isLockedInReviewForAlly =
    !isPlatformStaff && status === "IN_VERIFICATION";

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

  function handlePhoneOperatorChange(index: number, newOp: string) {
    setPhoneEntries((prev) =>
      prev.map((item, idx) =>
        idx === index ? { ...item, operator: newOp } : item
      )
    );
  }

  function handlePhoneNumberChange(index: number, newNum: string) {
    const digits = onlyDigits(newNum).slice(0, 7);
    setPhoneEntries((prev) =>
      prev.map((item, idx) =>
        idx === index ? { ...item, number: digits } : item
      )
    );
  }

  function handleAddPhone() {
    setPhoneEntries((prev) => [...prev, { operator: "0412", number: "" }]);
  }

  function handleRemovePhone(index: number) {
    setPhoneEntries((prev) =>
      prev.length > 1 ? prev.filter((_, idx) => idx !== index) : prev
    );
  }

  function handleEmailChange(index: number, value: string) {
    setEmailEntries((prev) =>
      prev.map((item, idx) => (idx === index ? value : item))
    );
  }

  function handleAddEmail() {
    setEmailEntries((prev) => [...prev, ""]);
  }

  function handleRemoveEmail(index: number) {
    setEmailEntries((prev) =>
      prev.length > 1 ? prev.filter((_, idx) => idx !== index) : [""]
    );
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
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const chosenLocationId =
      selectedHoodId || selectedCityId || selectedStateId;

    const formattedPhones = phoneEntries
      .map((entry) =>
        entry.number.trim()
          ? `+58 ${entry.operator} ${entry.number.trim()}`
          : ""
      )
      .filter(Boolean);

    if (formattedPhones.length === 0) {
      setLoading(false);
      setErrorMsg(
        isEn
          ? "You must provide at least one contact phone number."
          : "Debes indicar al menos un número de teléfono de contacto."
      );
      return;
    }

    const formattedEmails = emailEntries
      .map((em) => em.trim().toLowerCase())
      .filter(Boolean);

    const formattedRif = rifDigits.trim() ? `J-${rifDigits.trim()}` : "";

    if (venue) {
      const updateDto: UpdateVenueInput = {
        name: name.trim(),
        rif: formattedRif,
        address: address.trim(),
        contactPhone: formattedPhones[0],
        contactPhones: formattedPhones,
        contactEmail: formattedEmails[0] || "",
        contactEmails: formattedEmails,
        locationId: chosenLocationId,
        timezone: DEFAULT_VENUE_TIMEZONE,
        status,
        imageUrl: imageUrl.trim() || undefined,
        locationLat,
        locationLng,
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
        organizationId:
          isPlatformStaff && selectedOrgId ? selectedOrgId : undefined,
        name: name.trim(),
        rif: formattedRif || undefined,
        address: address.trim(),
        contactPhone: formattedPhones[0],
        contactPhones: formattedPhones,
        contactEmail: formattedEmails[0] || undefined,
        contactEmails: formattedEmails,
        locationId: chosenLocationId,
        timezone: DEFAULT_VENUE_TIMEZONE,
        status,
        imageUrl: imageUrl.trim() || undefined,
        locationLat,
        locationLng,
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

  const currentHood = hoods.find((h) => h.id === selectedHoodId);
  const contextSearchAddress = [
    currentHood ? getLocationNodeName(currentHood) : "",
    currentCity ? getLocationNodeName(currentCity) : "",
    currentState ? getLocationNodeName(currentState) : "",
    "Venezuela",
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div
      className="modal-backdrop"
      id="venue-modal-backdrop"
      onClick={onClose}
    >
      <div
        className="modal-card flex max-h-[92vh] w-full max-w-[660px] flex-col overflow-hidden rounded-2xl border border-border-medium bg-surface shadow-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
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
            aria-label={isEn ? "Close modal" : "Cerrar modal"}
            className="btn-icon cursor-pointer border-none bg-transparent text-lg text-muted-foreground hover:text-foreground"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-5 space-y-4"
        >
          {errorMsg && (
            <div className="rounded-xl border border-status-cancelled-border bg-status-cancelled-bg px-3.5 py-2.5 text-[13px] font-semibold text-status-cancelled-fg">
              {errorMsg}
            </div>
          )}

          {/* 1. FIRST INPUT: CLICKABLE VENUE PICTURE (No URL text input) */}
          <div className="form-group">
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground">
                {isEn ? "📷 Main Venue Photo" : "📷 Foto Principal de la Sede"}
              </label>
              <span className="text-[11px] font-medium text-muted-foreground">
                {isEn
                  ? "Click the image to change it"
                  : "Haz clic en la imagen para cambiarla"}
              </span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={handleImageFileChange}
              disabled={uploadingImage}
              id="venue-image-file"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImage}
              className="group relative flex h-44 w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-border-medium bg-muted/40 text-center transition-all hover:border-accent"
            >
              {imageUrl ? (
                <>
                  <img
                    src={imageUrl}
                    alt={name || (isEn ? "Venue photo" : "Foto de la sede")}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    <span className="rounded-xl bg-surface/95 px-4 py-2 text-xs font-bold text-foreground shadow-md">
                      {uploadingImage
                        ? isEn
                          ? "⏳ Uploading image..."
                          : "⏳ Subiendo imagen..."
                        : isEn
                          ? "📷 Change venue photo"
                          : "📷 Cambiar foto de la sede"}
                    </span>
                  </div>
                  <div className="absolute bottom-2.5 right-2.5 rounded-lg bg-black/65 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-xs">
                    {isEn ? "✏️ Click to edit photo" : "✏️ Clic para editar foto"}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-1.5 px-4 py-6">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent/20 text-xl">
                    📷
                  </div>
                  <span className="text-xs font-bold text-foreground">
                    {uploadingImage
                      ? isEn
                        ? "⏳ Uploading image..."
                        : "⏳ Subiendo imagen..."
                      : isEn
                        ? "Click here to upload the venue photo"
                        : "Haz clic aquí para subir la foto de la sede"}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {isEn
                      ? "Allowed formats: JPG, PNG or WEBP"
                      : "Formatos permitidos: JPG, PNG o WEBP"}
                  </span>
                </div>
              )}
            </button>
          </div>

          {/* 2. OWNER ORGANIZATION (Platform Staff Creating New Venue) */}
          {!venue && isPlatformStaff && organizationOptions.length > 0 && (
            <div className="form-group">
              <label
                className="form-label mb-1 block text-xs font-semibold text-foreground"
                htmlFor="venue-organization-select"
              >
                {isEn
                  ? "🏢 Owner Organization *"
                  : "🏢 Organización Propietaria *"}
              </label>
              <SearchableSelect
                id="venue-organization-select"
                value={selectedOrgId}
                onChange={setSelectedOrgId}
                options={organizationOptions}
                placeholder={
                  isEn
                    ? "Select an organization..."
                    : "Selecciona una organización..."
                }
                searchPlaceholder={
                  isEn ? "Search organization..." : "Buscar organización..."
                }
              />
            </div>
          )}

          {/* 2b. VENUE NAME */}
          <div className="form-group">
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

          {/* 3. RIF (J Disabled Select + Optional Number) & ESTATUS OPERATIVO (Styled + Role-Aware) */}
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            {/* Optional RIF with disabled J select */}
            <div className="form-group">
              <div className="mb-1 flex items-center justify-between">
                <label
                  className="text-xs font-semibold text-foreground"
                  htmlFor="venue-rif-input"
                >
                  {isEn ? "Venue Tax ID (RIF)" : "RIF de la Sede"}
                </label>
                <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                  {isEn ? "Optional" : "Opcional"}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <select
                  id="venue-rif-prefix"
                  disabled
                  value="J"
                  aria-label={isEn ? "Tax ID Type" : "Tipo de RIF"}
                  className="h-10 w-[64px] shrink-0 cursor-not-allowed rounded-xl border border-border bg-muted/70 px-2.5 text-xs font-bold text-muted-foreground opacity-90"
                >
                  <option value="J">J -</option>
                </select>
                <input
                  type="text"
                  id="venue-rif-input"
                  className="h-10 min-w-0 flex-1 rounded-xl border border-border-medium bg-surface px-3 font-mono text-xs font-semibold text-foreground placeholder:font-sans placeholder:font-normal placeholder:text-muted-foreground focus:border-accent focus:outline-none"
                  placeholder={
                    isEn
                      ? "30000001-1 (or use Organization's)"
                      : "30000001-1 (o usar el de la Org.)"
                  }
                  value={rifDigits}
                  onChange={(e) =>
                    setRifDigits(e.target.value.replace(/[^0-9-]/g, ""))
                  }
                />
              </div>
              <p className="mt-1 text-[10.5px] text-muted-foreground">
                {isEn
                  ? "Leave blank if operating under the organization's same tax ID."
                  : "Déjalo en blanco si opera bajo el mismo RIF de la organización."}
              </p>
            </div>

            {/* Styled Operational Status */}
            <div className="form-group">
              <label
                className="form-label mb-1 block text-xs font-semibold text-foreground"
                htmlFor="venue-status-select"
              >
                {t("statusLabel")}
              </label>

              {isLockedInReviewForAlly ? (
                <div className="flex h-10 items-center justify-between rounded-xl border border-status-hold-border bg-status-hold-bg px-3 text-xs font-bold text-status-hold-fg">
                  <span className="flex items-center gap-1.5 truncate">
                    <span>⏳</span>
                    <span className="truncate">
                      {isEn
                        ? "In Review (YoReservo Staff)"
                        : "En Revisión (YoReservo Staff)"}
                    </span>
                  </span>
                  <Lock className="size-3.5 shrink-0" />
                </div>
              ) : (
                <SearchableSelect
                  id="venue-status-select"
                  options={statusOptions}
                  value={status}
                  onChange={(val) => setStatus(val as VenueStatusType)}
                  placeholder={isEn ? "Select status..." : "Seleccionar estatus..."}
                  searchPlaceholder={isEn ? "Search status..." : "Buscar estatus..."}
                />
              )}
              <p className="mt-1 text-[10.5px] text-muted-foreground">
                {isPlatformStaff
                  ? isEn
                    ? "As YoReservo Staff you can manage all statuses."
                    : "Como Staff YoReservo puedes gestionar todos los estados."
                  : isEn
                    ? "You can enable or disable your venue at any time."
                    : "Puedes habilitar o deshabilitar tu sede en cualquier momento."}
              </p>
            </div>
          </div>

          {/* 4. DISABLED TIMEZONE INPUT */}
          <div className="form-group">
            <label
              className="form-label mb-1 block text-xs font-semibold text-foreground"
              htmlFor="venue-timezone-input"
            >
              🌎 {t("timezoneLabel")}
            </label>
            <div className="relative">
              <input
                type="text"
                id="venue-timezone-input"
                disabled
                readOnly
                value="America/Caracas (GMT-4 · Venezuela)"
                className="h-10 w-full cursor-not-allowed rounded-xl border border-border bg-muted/70 px-3.5 pr-9 text-xs font-semibold text-muted-foreground"
              />
              <Lock className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>

          {/* 5. CONTACT PHONES & EMAILS (BEFORE LOCATION!) */}
          <div className="rounded-xl border border-border bg-muted/35 p-4 space-y-4">
            {/* Multiple Contact Phones */}
            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <label className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                  <Phone className="size-3.5 text-link" />
                  <span>
                    {isEn
                      ? "Reception / Front Desk Phones *"
                      : "Teléfonos de Recepción / Mostrador *"}
                  </span>
                </label>
                <button
                  type="button"
                  onClick={handleAddPhone}
                  className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-border-medium bg-surface px-2.5 py-1 text-[11px] font-bold text-foreground transition-colors hover:border-accent hover:bg-accent/15"
                >
                  <Plus className="size-3" />
                  <span>{isEn ? "Add phone" : "Agregar teléfono"}</span>
                </button>
              </div>

              <div className="space-y-2">
                {phoneEntries.map((entry, idx) => (
                  <div
                    key={`phone-row-${idx}`}
                    className="grid grid-cols-12 items-center gap-2"
                  >
                    <div className="col-span-3 sm:col-span-3">
                      <div
                        className="flex h-10 items-center justify-center rounded-xl border border-border bg-muted/60 px-2 text-xs font-semibold text-muted-foreground select-none"
                        title={
                          isEn
                            ? "Country code (Venezuela)"
                            : "Código de país (Venezuela)"
                        }
                      >
                        🇻🇪 +58
                      </div>
                    </div>

                    <div className="col-span-4 sm:col-span-4">
                      <SearchableSelect
                        id={idx === 0 ? "venue-phone-operator" : undefined}
                        options={phoneOperatorOptions}
                        value={entry.operator}
                        onChange={(val) => handlePhoneOperatorChange(idx, val)}
                        placeholder={isEn ? "Carrier" : "Operadora"}
                        searchPlaceholder={
                          isEn ? "E.g. 0212, 0414..." : "Ej. 0212, 0414..."
                        }
                      />
                    </div>

                    <div
                      className={
                        phoneEntries.length > 1
                          ? "col-span-4 sm:col-span-4"
                          : "col-span-5 sm:col-span-5"
                      }
                    >
                      <input
                        type="tel"
                        id={idx === 0 ? "venue-phone-num" : undefined}
                        inputMode="numeric"
                        className="h-10 w-full rounded-xl border border-border-medium bg-surface px-3 font-mono text-xs font-semibold text-foreground placeholder:font-sans placeholder:font-normal placeholder:text-muted-foreground focus:border-accent focus:outline-none"
                        placeholder="1234567"
                        maxLength={7}
                        required={idx === 0}
                        value={entry.number}
                        onChange={(e) =>
                          handlePhoneNumberChange(idx, e.target.value)
                        }
                      />
                    </div>

                    {phoneEntries.length > 1 && (
                      <div className="col-span-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleRemovePhone(idx)}
                          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-border bg-surface text-muted-foreground transition-colors hover:border-status-cancelled-border hover:bg-status-cancelled-bg hover:text-status-cancelled-fg"
                          title={isEn ? "Remove phone" : "Eliminar teléfono"}
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Multiple Contact Emails */}
            <div className="border-t border-border pt-3.5">
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                    <Mail className="size-3.5 text-link" />
                    <span>
                      {isEn
                        ? "Contact Email Addresses"
                        : "Correos Electrónicos de Contacto"}
                    </span>
                  </label>
                  <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                    {isEn ? "Optional" : "Opcional"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleAddEmail}
                  className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-border-medium bg-surface px-2.5 py-1 text-[11px] font-bold text-foreground transition-colors hover:border-accent hover:bg-accent/15"
                >
                  <Plus className="size-3" />
                  <span>{isEn ? "Add email" : "Agregar correo"}</span>
                </button>
              </div>

              <div className="space-y-2">
                {emailEntries.map((emailVal, idx) => (
                  <div
                    key={`email-row-${idx}`}
                    className="flex items-center gap-2"
                  >
                    <input
                      type="email"
                      id={idx === 0 ? "venue-contact-email" : undefined}
                      className="h-10 min-w-0 flex-1 rounded-xl border border-border-medium bg-surface px-3 text-xs font-semibold text-foreground placeholder:font-normal placeholder:text-muted-foreground focus:border-accent focus:outline-none"
                      placeholder={
                        idx === 0
                          ? isEn
                            ? "e.g. reception@sportscomplex.com"
                            : "ej. recepcion@complejodeportivo.com"
                          : isEn
                            ? "e.g. bookings@sportscomplex.com"
                            : "ej. reservas@complejodeportivo.com"
                      }
                      value={emailVal}
                      onChange={(e) => handleEmailChange(idx, e.target.value)}
                    />
                    {(emailEntries.length > 1 || emailVal.trim() !== "") && (
                      <button
                        type="button"
                        onClick={() => handleRemoveEmail(idx)}
                        className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-border bg-surface text-muted-foreground transition-colors hover:border-status-cancelled-border hover:bg-status-cancelled-bg hover:text-status-cancelled-fg"
                        title={isEn ? "Remove email" : "Eliminar correo"}
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 6. CASCADING GEOGRAPHY SELECTOR */}
          <div className="rounded-xl border border-border bg-muted/40 p-4">
            <div className="mb-2.5 text-[11px] font-bold text-link uppercase">
              🗺️ {t("geoTitle")}
            </div>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              <div>
                <label className="form-label mb-1 block text-[11px] font-semibold text-muted-foreground">
                  {t("state")}
                </label>
                <SearchableSelect
                  id="geo-state"
                  options={stateOptions}
                  value={selectedStateId}
                  onChange={handleStateChange}
                  placeholder={isEn ? "State..." : "Estado..."}
                  searchPlaceholder={isEn ? "Search state..." : "Buscar estado..."}
                />
              </div>

              <div>
                <label className="form-label mb-1 block text-[11px] font-semibold text-muted-foreground">
                  {t("city")}
                </label>
                <SearchableSelect
                  id="geo-city"
                  options={cityOptions}
                  value={selectedCityId}
                  onChange={handleCityChange}
                  disabled={cityOptions.length === 0}
                  placeholder={isEn ? "City..." : "Ciudad..."}
                  searchPlaceholder={isEn ? "Search city..." : "Buscar ciudad..."}
                />
              </div>

              <div>
                <label className="form-label mb-1 block text-[11px] font-semibold text-muted-foreground">
                  {t("neighborhood")}
                </label>
                <SearchableSelect
                  id="geo-hood"
                  options={hoodOptions}
                  value={selectedHoodId}
                  onChange={setSelectedHoodId}
                  disabled={hoodOptions.length === 0}
                  placeholder={isEn ? "Zone / Neighborhood..." : "Zona / Urb..."}
                  searchPlaceholder={
                    isEn ? "Search neighborhood..." : "Buscar urbanización..."
                  }
                />
              </div>
            </div>
          </div>

          {/* 7. EXACT ADDRESS & INTERACTIVE MAP LOCATION PICKER */}
          <div className="form-group">
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

          <VenueLocationMapPicker
            lat={locationLat}
            lng={locationLng}
            onChange={({ lat: newLat, lng: newLng }) => {
              setLocationLat(newLat);
              setLocationLng(newLng);
            }}
            contextAddress={contextSearchAddress}
          />

          {/* Actions */}
          <div className="mt-6 flex justify-end gap-3 border-t border-border pt-4">
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
