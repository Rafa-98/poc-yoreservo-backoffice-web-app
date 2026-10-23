"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/shared/ui/button";
import { uploadBackofficeFileAction } from "@/shared/api/upload-action";
import {
  SearchableSelect,
  type SearchableOption,
} from "@/features/users/ui/searchable-select";
import type {
  CreateSpaceInput,
  SpaceItem,
  SportCategoryItem,
  UpdateSpaceInput,
} from "../model/types";
import type {
  AmenityItem,
  SurfaceItem,
} from "@/features/catalogs/model/types";
import {
  createSpaceAction,
  updateSpaceAction,
} from "../actions/venues-actions";

interface CourtModalProps {
  isOpen: boolean;
  onClose: () => void;
  venueId: string;
  space: SpaceItem | null;
  categories: SportCategoryItem[];
  surfaces?: SurfaceItem[];
  amenitiesCatalog?: AmenityItem[];
  onSuccess: (savedSpace: SpaceItem, isNew?: boolean) => void;
}

function normalizeText(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function getSportNameFromCategory(cat: SportCategoryItem | undefined): string {
  if (!cat) return "Deporte";
  const actName =
    typeof cat.activity?.name === "object"
      ? cat.activity?.name?.es || cat.activity?.name?.en || ""
      : String(cat.activity?.name || "");
  const catName =
    typeof cat.name === "object"
      ? cat.name?.es || cat.name?.en || ""
      : String(cat.name || "");
  return actName || catName || "Deporte";
}

/**
 * Checks whether a catalog item (Surface or Amenity) is compatible with the selected sport/format.
 */
function isSuitedForCategory(
  suitedSports: string[] | undefined,
  cat: SportCategoryItem | undefined
): boolean {
  if (!cat) return true;
  if (!suitedSports || suitedSports.length === 0) return true;

  const actName =
    typeof cat.activity?.name === "object"
      ? cat.activity?.name?.es || cat.activity?.name?.en || ""
      : String(cat.activity?.name || "");
  const catName =
    typeof cat.name === "object"
      ? cat.name?.es || cat.name?.en || ""
      : String(cat.name || "");

  const sportNorm = normalizeText(actName);
  const formatNorm = normalizeText(catName);
  const normTags = suitedSports.map(normalizeText);

  // Guard for Beach Volleyball vs Indoor Volleyball
  if (formatNorm.includes("playa") || formatNorm.includes("beach")) {
    if (
      normTags.some((t) => t.includes("sala") || t.includes("indoor")) &&
      !normTags.some((t) => t.includes("playa") || t.includes("beach"))
    ) {
      return false;
    }
  }
  if (formatNorm.includes("sala") || formatNorm.includes("indoor")) {
    if (
      normTags.some((t) => t.includes("playa") || t.includes("beach")) &&
      !normTags.some((t) => t.includes("sala") || t.includes("indoor"))
    ) {
      return false;
    }
  }

  return normTags.some(
    (tag) =>
      (sportNorm &&
        (tag === sportNorm ||
          tag.includes(sportNorm) ||
          sportNorm.includes(tag))) ||
      (formatNorm &&
        (tag === formatNorm ||
          tag.includes(formatNorm) ||
          formatNorm.includes(tag)))
  );
}

function isSportSpecificAmenity(amenity: AmenityItem): boolean {
  const tags = amenity.suitedSports || [];
  if (tags.length === 0) return false;
  if (
    amenity.code === "AMN_STREAMING_CAM" ||
    amenity.code === "AMN_BLEACHERS" ||
    amenity.code === "AMN_LIGHTING_LED" ||
    amenity.code === "AMN_HYDRATION" ||
    amenity.code === "AMN_SCOREBOARD" ||
    amenity.code === "AMN_LOCKERS" ||
    amenity.code === "AMN_PARKING" ||
    amenity.code === "AMN_CAFETERIA" ||
    amenity.code === "AMN_WIFI"
  ) {
    return false;
  }
  return true;
}

/**
 * Returns the recommended maximum player capacity based on the sport/category format.
 */
function getRecommendedCapacityForCategory(
  cat: SportCategoryItem | undefined
): number {
  if (!cat) return 10;

  const actName =
    typeof cat.activity?.name === "object"
      ? `${cat.activity?.name?.es || ""} ${cat.activity?.name?.en || ""}`
      : String(cat.activity?.name || "");
  const catName =
    typeof cat.name === "object"
      ? `${cat.name?.es || ""} ${cat.name?.en || ""}`
      : String(cat.name || "");

  const fullText = `${actName} ${catName}`.toLowerCase();

  // Soccer / Fútbol formats
  if (
    fullText.includes("fútbol 5") ||
    fullText.includes("futbol 5") ||
    fullText.includes("5-a-side") ||
    fullText.includes("futsal")
  ) {
    return 10;
  }
  if (
    fullText.includes("fútbol 7") ||
    fullText.includes("futbol 7") ||
    fullText.includes("7-a-side")
  ) {
    return 14;
  }
  if (
    fullText.includes("fútbol 8") ||
    fullText.includes("futbol 8") ||
    fullText.includes("8-a-side")
  ) {
    return 16;
  }
  if (
    fullText.includes("fútbol 9") ||
    fullText.includes("futbol 9") ||
    fullText.includes("9-a-side")
  ) {
    return 18;
  }
  if (
    fullText.includes("fútbol 11") ||
    fullText.includes("futbol 11") ||
    fullText.includes("11-a-side")
  ) {
    return 22;
  }

  // Singles formats (Tennis, Pickleball, Ping-pong, Padel 1v1)
  if (
    fullText.includes("individual") ||
    fullText.includes("singles") ||
    fullText.includes("1v1") ||
    fullText.includes("1 vs 1")
  ) {
    return 2;
  }

  // Doubles / Padel / Beach Volleyball formats
  if (
    fullText.includes("dobles") ||
    fullText.includes("doubles") ||
    fullText.includes("pádel") ||
    fullText.includes("padel") ||
    fullText.includes("playa") ||
    fullText.includes("beach")
  ) {
    return 4;
  }

  // Indoor Volleyball (6 vs 6)
  if (fullText.includes("voleibol") || fullText.includes("volleyball")) {
    return 12;
  }

  // Basketball 3x3 vs 5x5
  if (fullText.includes("3x3") || fullText.includes("3 vs 3")) {
    return 6;
  }
  if (fullText.includes("baloncesto") || fullText.includes("basketball")) {
    return 10;
  }

  // Bowling
  if (fullText.includes("bowling") || fullText.includes("bolos")) {
    return 6;
  }

  // Baseball / Softball
  if (
    fullText.includes("béisbol") ||
    fullText.includes("beisbol") ||
    fullText.includes("baseball") ||
    fullText.includes("softball")
  ) {
    return 18;
  }

  // Generic N-a-side fallback
  const numMatch = catName.match(/\b(\d{1,2})\b/);
  if (numMatch) {
    const perSide = parseInt(numMatch[1], 10);
    if (perSide >= 1 && perSide <= 15) {
      return perSide * 2;
    }
  }

  return 10;
}

export function CourtModal({
  isOpen,
  onClose,
  venueId,
  space,
  categories,
  surfaces = [],
  amenitiesCatalog = [],
  onSuccess,
}: CourtModalProps) {
  const t = useTranslations("venues.spaces");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [spaceNumber, setSpaceNumber] = useState("");
  const [activityCategoryId, setActivityCategoryId] = useState("");
  const [pricePerHour, setPricePerHour] = useState<number>(25);
  const [surfaceType, setSurfaceType] = useState("");
  const [capacity, setCapacity] = useState<number>(10);
  const [isCovered, setIsCovered] = useState(false);
  const [initialStatus, setInitialStatus] = useState<"ENABLED" | "DISABLED">(
    "DISABLED"
  );
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState("");

  function getCategoryName(cat: SportCategoryItem): string {
    const actName =
      typeof cat.activity?.name === "object"
        ? cat.activity?.name?.es || cat.activity?.name?.en
        : cat.activity?.name;
    const catName =
      typeof cat.name === "object" ? cat.name?.es || cat.name?.en : cat.name;

    if (actName && catName) {
      return `${actName} — ${catName}`;
    }
    return catName || t("defaultSport");
  }

  const categoryOptions = useMemo<SearchableOption[]>(
    () =>
      categories.map((cat) => {
        const recCap = getRecommendedCapacityForCategory(cat);
        return {
          value: cat.id,
          label: getCategoryName(cat),
          subtitle: `Capacidad recomendada: ${recCap} jugadores`,
        };
      }),
    [categories]
  );

  const currentSelectedCategory = useMemo(
    () => categories.find((c) => c.id === activityCategoryId),
    [categories, activityCategoryId]
  );

  // Filter surfaces compatible with the selected sport/category
  const compatibleSurfaces = useMemo(() => {
    const enabled = surfaces.filter((s) => s.status !== "DISABLED");
    const matched = enabled.filter((s) =>
      isSuitedForCategory(s.suitedSports, currentSelectedCategory)
    );
    return matched.length > 0 ? matched : enabled;
  }, [surfaces, currentSelectedCategory]);

  const surfaceOptions = useMemo<SearchableOption[]>(() => {
    const opts: SearchableOption[] = compatibleSurfaces.map((s) => ({
      value: s.name,
      label: s.name,
      subtitle: s.description
        ? `${s.description} · Mant.: ${s.maintenanceProtocol}`
        : s.code,
      icon: "🌱",
    }));
    // Preserve current surface value in options if it was custom-saved previously
    if (
      surfaceType &&
      !opts.some(
        (o) => normalizeText(o.value) === normalizeText(surfaceType)
      ) &&
      isSuitedForCategory([surfaceType], currentSelectedCategory)
    ) {
      opts.unshift({
        value: surfaceType,
        label: surfaceType,
        subtitle: "Superficie actual de la cancha",
        icon: "🌱",
      });
    }
    return opts;
  }, [compatibleSurfaces, surfaceType, currentSelectedCategory]);

  // Filter amenities compatible with the selected sport/category
  const compatibleAmenities = useMemo(() => {
    const enabled = amenitiesCatalog.filter((a) => a.status !== "DISABLED");
    return enabled.filter((a) =>
      isSuitedForCategory(a.suitedSports, currentSelectedCategory)
    );
  }, [amenitiesCatalog, currentSelectedCategory]);

  const sportSpecificAmenities = useMemo(
    () => compatibleAmenities.filter((a) => isSportSpecificAmenity(a)),
    [compatibleAmenities]
  );

  const generalCourtAmenities = useMemo(
    () => compatibleAmenities.filter((a) => !isSportSpecificAmenity(a)),
    [compatibleAmenities]
  );

  useEffect(() => {
    setErrorMsg(null);
    if (space) {
      setSpaceNumber(space.spaceNumber || "");
      const initialCatId = space.activityCategoryId || categories[0]?.id || "";
      setActivityCategoryId(initialCatId);
      setPricePerHour(space.pricePerHour || 25);
      const matchedCat = categories.find((c) => c.id === initialCatId);
      const catSurfaces = surfaces.filter(
        (s) =>
          s.status !== "DISABLED" &&
          isSuitedForCategory(s.suitedSports, matchedCat)
      );
      setSurfaceType(
        space.surfaceType || catSurfaces[0]?.name || surfaces[0]?.name || ""
      );
      setCapacity(
        space.capacity || getRecommendedCapacityForCategory(matchedCat)
      );
      setIsCovered(Boolean(space.isCovered));
      setInitialStatus(space.status === "DISABLED" ? "DISABLED" : "ENABLED");
      setSelectedAmenities(
        Array.isArray(space.amenities) ? space.amenities : []
      );
      setImageUrl(space.imageUrl || "");
    } else {
      const defaultCat = categories[0];
      const catSurfaces = surfaces.filter(
        (s) =>
          s.status !== "DISABLED" &&
          isSuitedForCategory(s.suitedSports, defaultCat)
      );
      const catAmenities = amenitiesCatalog.filter(
        (a) =>
          a.status !== "DISABLED" &&
          isSuitedForCategory(a.suitedSports, defaultCat)
      );
      const defaultSelectedAmenities = catAmenities
        .filter(
          (a) =>
            isSportSpecificAmenity(a) || a.code === "AMN_LIGHTING_LED"
        )
        .slice(0, 4)
        .map((a) => a.name);

      setSpaceNumber("");
      setActivityCategoryId(defaultCat?.id || "");
      setPricePerHour(25);
      setSurfaceType(catSurfaces[0]?.name || surfaces[0]?.name || "");
      setCapacity(getRecommendedCapacityForCategory(defaultCat));
      setIsCovered(false);
      setInitialStatus("DISABLED");
      setSelectedAmenities(defaultSelectedAmenities);
      setImageUrl("");
    }
  }, [space, categories, surfaces, amenitiesCatalog, isOpen]);

  function handleCategoryChange(newCategoryId: string) {
    setActivityCategoryId(newCategoryId);
    const selectedCat = categories.find((c) => c.id === newCategoryId);
    if (selectedCat) {
      setCapacity(getRecommendedCapacityForCategory(selectedCat));

      // Auto-select first compatible surface for the new sport if current isn't compatible
      const validSurfaces = surfaces.filter(
        (s) =>
          s.status !== "DISABLED" &&
          isSuitedForCategory(s.suitedSports, selectedCat)
      );
      const isCurrentSurfaceCompatible = validSurfaces.some(
        (s) => normalizeText(s.name) === normalizeText(surfaceType)
      );
      if (!isCurrentSurfaceCompatible && validSurfaces.length > 0) {
        setSurfaceType(validSurfaces[0].name);
      }

      // Filter out any selected amenities that are incompatible with the new sport
      const validAmenityNames = new Set(
        amenitiesCatalog
          .filter(
            (a) =>
              a.status !== "DISABLED" &&
              isSuitedForCategory(a.suitedSports, selectedCat)
          )
          .map((a) => a.name)
      );
      setSelectedAmenities((prev) =>
        prev.filter((name) => validAmenityNames.has(name))
      );
    }
  }

  function handleToggleAmenity(amenityName: string) {
    setSelectedAmenities((prev) =>
      prev.includes(amenityName)
        ? prev.filter((a) => a !== amenityName)
        : [...prev, amenityName]
    );
  }

  function handleSelectSuggestedAmenities() {
    const suggested = compatibleAmenities
      .filter(
        (a) =>
          isSportSpecificAmenity(a) ||
          a.code === "AMN_LIGHTING_LED" ||
          a.code === "AMN_HYDRATION" ||
          a.code === "AMN_SCOREBOARD"
      )
      .map((a) => a.name);
    setSelectedAmenities(Array.from(new Set(suggested)));
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
      fd.append("category", "SPACE_IMAGE");
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

    const catId = activityCategoryId || categories[0]?.id;
    if (!catId) {
      setErrorMsg(t("errorCategoryRequired"));
      setLoading(false);
      return;
    }

    if (space) {
      const updateDto: UpdateSpaceInput = {
        spaceNumber: spaceNumber.trim(),
        activityCategoryId: catId,
        pricePerHour: Number(pricePerHour),
        surfaceType: surfaceType.trim(),
        capacity: Number(capacity),
        isCovered,
        amenities: selectedAmenities,
        imageUrl: imageUrl.trim() || undefined,
      };

      const res = await updateSpaceAction(space.id, updateDto);
      setLoading(false);
      if (res.ok && res.data) {
        onSuccess(res.data, false);
        onClose();
      } else if (!res.ok) {
        setErrorMsg(res.error.code || t("errorUpdate"));
      }
    } else {
      const createDto: CreateSpaceInput = {
        spaceNumber: spaceNumber.trim(),
        activityCategoryId: catId,
        pricePerHour: Number(pricePerHour),
        surfaceType: surfaceType.trim(),
        capacity: Number(capacity),
        isCovered,
        amenities: selectedAmenities,
        status: initialStatus,
        imageUrl: imageUrl.trim() || undefined,
      };

      const res = await createSpaceAction(venueId, createDto);
      setLoading(false);
      if (res.ok && res.data) {
        onSuccess(res.data, true);
        onClose();
      } else if (!res.ok) {
        setErrorMsg(res.error.code || t("errorCreate"));
      }
    }
  }

  const recommendedCap = getRecommendedCapacityForCategory(
    currentSelectedCategory
  );
  const currentSportName = getSportNameFromCategory(currentSelectedCategory);
  const selectedSurfaceObj = compatibleSurfaces.find(
    (s) => normalizeText(s.name) === normalizeText(surfaceType)
  );

  return (
    <div
      className="modal-backdrop"
      id="space-modal-backdrop"
      onClick={onClose}
    >
      <div
        className="modal-card flex max-h-[92vh] w-full max-w-[580px] flex-col overflow-hidden rounded-2xl border border-border-medium bg-surface shadow-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">⚽</span>
            <h3
              className="m-0 text-[17px] font-bold text-foreground"
              id="space-modal-title"
            >
              {space ? t("modalTitleEdit") : t("modalTitleNew")}
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

        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-5 space-y-4"
        >
          {errorMsg && (
            <div className="rounded-xl border border-status-cancelled-border bg-status-cancelled-bg px-3.5 py-2.5 text-[13px] font-semibold text-status-cancelled-fg">
              {errorMsg}
            </div>
          )}

          {/* 1. FIRST INPUT: CLICKABLE COURT PICTURE (Same style as VenueModal) */}
          <div className="form-group">
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground">
                📷 Foto Principal de la Cancha
              </label>
              <span className="text-[11px] font-medium text-muted-foreground">
                Haz clic en la imagen para cambiarla
              </span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={handleImageFileChange}
              disabled={uploadingImage}
              id="court-image-file"
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
                    alt={spaceNumber || "Foto de la cancha"}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    <span className="rounded-xl bg-surface/95 px-4 py-2 text-xs font-bold text-foreground shadow-md">
                      {uploadingImage
                        ? "⏳ Subiendo imagen..."
                        : "📷 Cambiar foto de la cancha"}
                    </span>
                  </div>
                  <div className="absolute bottom-2.5 right-2.5 rounded-lg bg-black/65 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-xs">
                    ✏️ Clic para editar foto
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-1.5 px-4 py-6">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent/20 text-xl">
                    📷
                  </div>
                  <span className="text-xs font-bold text-foreground">
                    {uploadingImage
                      ? "⏳ Subiendo imagen..."
                      : "Haz clic aquí para subir la foto de la cancha"}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Formatos permitidos: JPG, PNG o WEBP
                  </span>
                </div>
              )}
            </button>
          </div>

          {/* 2. COURT NAME */}
          <div className="form-group">
            <label
              className="form-label mb-1 block text-xs font-semibold text-foreground"
              htmlFor="court-name-input"
            >
              {t("name")}
            </label>
            <input
              type="text"
              id="court-name-input"
              className="input-field form-input"
              placeholder={t("namePlaceholder")}
              required
              value={spaceNumber}
              onChange={(e) => setSpaceNumber(e.target.value)}
            />
          </div>

          {/* 3. SPORT FORMAT & HOURLY PRICE */}
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <div className="form-group">
              <label
                className="form-label mb-1 block text-xs font-semibold text-foreground"
                htmlFor="court-category-select"
              >
                {t("sport")}
              </label>
              <SearchableSelect
                id="court-category-select"
                options={categoryOptions}
                value={activityCategoryId}
                onChange={handleCategoryChange}
                placeholder="Seleccionar formato..."
                searchPlaceholder="Buscar deporte o formato..."
              />
            </div>

            <div className="form-group">
              <label
                className="form-label mb-1 block text-xs font-semibold text-foreground"
                htmlFor="court-price-input"
              >
                {t("price")}
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                id="court-price-input"
                className="input-field form-input h-10"
                required
                value={pricePerHour}
                onChange={(e) =>
                  setPricePerHour(parseFloat(e.target.value) || 0)
                }
              />
            </div>
          </div>

          {/* 4. OFFICIAL SURFACE CATALOG SELECTOR (FILTERED BY SPORT) */}
          <div className="form-group">
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <label
                className="text-xs font-semibold text-foreground"
                htmlFor="court-surface-select"
              >
                {t("surface")}
              </label>
              <span className="inline-flex shrink-0 items-center whitespace-nowrap rounded-full bg-accent/20 px-2.5 py-0.5 text-[10px] font-bold leading-none text-foreground">
                🌱 {compatibleSurfaces.length} superficies para {currentSportName}
              </span>
            </div>

            {surfaceOptions.length > 0 ? (
              <>
                <SearchableSelect
                  id="court-surface-select"
                  options={surfaceOptions}
                  value={surfaceType}
                  onChange={setSurfaceType}
                  placeholder="Seleccionar superficie oficial..."
                  searchPlaceholder={`Buscar superficie de ${currentSportName}...`}
                />
                {selectedSurfaceObj && (
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    <strong className="text-foreground">Especificación:</strong>{" "}
                    {selectedSurfaceObj.description} ·{" "}
                    <span className="italic">
                      Mant.: {selectedSurfaceObj.maintenanceProtocol}
                    </span>
                  </p>
                )}
              </>
            ) : (
              <input
                type="text"
                id="court-surface-input"
                className="input-field form-input"
                placeholder={t("surfacePlaceholder")}
                required
                value={surfaceType}
                onChange={(e) => setSurfaceType(e.target.value)}
              />
            )}
          </div>

          {/* 5. MAX CAPACITY (AUTO-FILLED BY SPORT FORMAT) & COVERED CHECKBOX */}
          <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-[1fr_auto]">
            <div className="form-group">
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <label
                  className="whitespace-nowrap text-xs font-semibold text-foreground"
                  htmlFor="court-capacity-input"
                >
                  {t("maxCapacityLabel")}
                </label>
                <span className="inline-flex shrink-0 items-center whitespace-nowrap rounded-full bg-accent/25 px-2.5 py-0.5 text-[10px] font-bold leading-none text-foreground">
                  Sugerido: {recommendedCap} jug.
                </span>
              </div>
              <input
                type="number"
                min="2"
                max="40"
                id="court-capacity-input"
                className="input-field form-input h-10"
                value={capacity}
                onChange={(e) =>
                  setCapacity(parseInt(e.target.value, 10) || recommendedCap)
                }
              />
            </div>

            <div className="form-group flex h-10 items-center gap-2.5 pr-2">
              <input
                type="checkbox"
                id="court-covered-checkbox"
                checked={isCovered}
                onChange={(e) => setIsCovered(e.target.checked)}
                className="h-4.5 w-4.5 cursor-pointer accent-accent"
              />
              <label
                htmlFor="court-covered-checkbox"
                className="cursor-pointer whitespace-nowrap text-[13px] font-semibold text-foreground"
              >
                {t("isCovered")}
              </label>
            </div>
          </div>

          {/* 6. SPORT-FILTERED AMENITIES & EQUIPMENT SELECTOR */}
          <div className="rounded-2xl border border-border bg-muted/35 p-4 space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-link">
                    ✨ Amenidades & Equipamiento de la Cancha
                  </span>
                  <span className="rounded-full bg-accent/25 px-2 py-0.5 text-[10px] font-bold text-foreground">
                    {selectedAmenities.length} seleccionadas
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  Filtradas automáticamente según el deporte seleccionado (
                  <strong className="text-foreground">{currentSportName}</strong>
                  )
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectSuggestedAmenities}
                  className="cursor-pointer rounded-lg border border-border-medium bg-surface px-2.5 py-1 text-[11px] font-bold text-foreground transition-colors hover:border-accent hover:bg-accent/15"
                >
                  ⚡ Sugeridas
                </button>
                {selectedAmenities.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedAmenities([])}
                    className="cursor-pointer rounded-lg border border-border bg-surface px-2 py-1 text-[11px] font-semibold text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Limpiar
                  </button>
                )}
              </div>
            </div>

            {/* Sport-Specific Equipment Section */}
            {sportSpecificAmenities.length > 0 && (
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-foreground">
                  🏆 Equipamiento Específico de {currentSportName}
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {sportSpecificAmenities.map((item) => {
                    const isChecked = selectedAmenities.includes(item.name);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleToggleAmenity(item.name)}
                        className={`flex cursor-pointer items-start gap-2.5 rounded-xl border p-2.5 text-left transition-all ${
                          isChecked
                            ? "border-accent bg-accent/15 shadow-2xs"
                            : "border-border bg-surface hover:border-border-medium"
                        }`}
                      >
                        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-base">
                          {item.icon}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="truncate text-xs font-bold text-foreground">
                              {item.name}
                            </span>
                            <span
                              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded text-[10px] font-bold ${
                                isChecked
                                  ? "bg-accent text-accent-foreground"
                                  : "border border-border-medium bg-muted/40 text-transparent"
                              }`}
                            >
                              ✓
                            </span>
                          </div>
                          <p className="mt-0.5 line-clamp-1 text-[10.5px] text-muted-foreground">
                            {item.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* General Court Amenities Section */}
            {generalCourtAmenities.length > 0 && (
              <div className="space-y-2 pt-1">
                <div className="text-[11px] font-bold text-foreground">
                  💡 Servicios & Comodidades de Cancha
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {generalCourtAmenities.map((item) => {
                    const isChecked = selectedAmenities.includes(item.name);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleToggleAmenity(item.name)}
                        className={`flex cursor-pointer items-start gap-2.5 rounded-xl border p-2.5 text-left transition-all ${
                          isChecked
                            ? "border-accent bg-accent/15 shadow-2xs"
                            : "border-border bg-surface hover:border-border-medium"
                        }`}
                      >
                        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-base">
                          {item.icon}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="truncate text-xs font-bold text-foreground">
                              {item.name}
                            </span>
                            <span
                              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded text-[10px] font-bold ${
                                isChecked
                                  ? "bg-accent text-accent-foreground"
                                  : "border border-border-medium bg-muted/40 text-transparent"
                              }`}
                            >
                              ✓
                            </span>
                          </div>
                          <p className="mt-0.5 line-clamp-1 text-[10.5px] text-muted-foreground">
                            {item.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 7. INITIAL STATUS & SCHEDULE CONFIGURATION WORKFLOW NOTICE (FOR NEW SPACES) */}
          {!space && (
            <div className="rounded-2xl border border-status-hold-border bg-status-hold-bg/50 p-3.5 space-y-2.5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-foreground">
                    ⏸️ Estado Inicial: Deshabilitada (Pausada) por defecto
                  </div>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                    Por seguridad operativa, las canchas nuevas se crean{" "}
                    <strong className="text-foreground">Deshabilitadas</strong>{" "}
                    hasta que configures sus horarios disponibles. Al guardar,
                    te llevaremos directamente a{" "}
                    <strong className="text-foreground">
                      Turnos &amp; Horarios
                    </strong>
                    .
                  </p>
                </div>
                <label className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border border-border bg-surface px-2.5 py-1.5 text-[11px] font-bold text-foreground">
                  <input
                    type="checkbox"
                    checked={initialStatus === "ENABLED"}
                    onChange={(e) =>
                      setInitialStatus(
                        e.target.checked ? "ENABLED" : "DISABLED"
                      )
                    }
                    className="h-3.5 w-3.5 accent-accent"
                  />
                  <span>Habilitar de inmediato</span>
                </label>
              </div>
            </div>
          )}

          <div className="mt-6 flex justify-end gap-3 border-t border-border pt-4">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onClose}
              disabled={loading || uploadingImage}
              id="btn-cancel-court"
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={loading || uploadingImage}
              id="btn-save-court"
            >
              {space ? t("save") : "Guardar y Configurar Horarios →"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
