"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/shared/ui/button";
import { uploadBackofficeFileAction } from "@/shared/api/upload-action";
import {
  createSurfaceAction,
  updateSurfaceAction,
} from "../actions/catalogs-actions";
import type {
  ActivityTypeItem,
  CreateSurfaceInput,
  EntityStatus,
  LocalizedName,
  SurfaceItem,
} from "../model/types";

interface SurfaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (surface: SurfaceItem) => void;
  initialData?: SurfaceItem | null;
  taxonomy?: ActivityTypeItem[];
}

const FALLBACK_SPORTS = [
  { name: "Fútbol", icon: "⚽", formats: ["Fútbol 5", "Fútbol 7", "Fútbol 9", "Fútbol 11"] },
  { name: "Pádel", icon: "🎾", formats: ["Pádel dobles", "Pádel individual"] },
  { name: "Tenis", icon: "🎾", formats: ["Tenis individual", "Tenis dobles"] },
  { name: "Pickleball", icon: "🏓", formats: ["Pickleball individual", "Pickleball dobles"] },
  { name: "Ping-pong", icon: "🏓", formats: ["Ping-pong individual", "Ping-pong dobles"] },
  { name: "Voleibol", icon: "🏐", formats: ["Voleibol de sala", "Voleibol de playa"] },
];

const SPORT_TAG_EN_MAP: Record<string, string> = {
  "fútbol": "Soccer",
  "futbol": "Soccer",
  "fútbol 5": "5v5 Soccer",
  "futbol 5": "5v5 Soccer",
  "fútbol 5 (cancha sintética)": "5-a-side Soccer",
  "fútbol 7": "7v7 Soccer",
  "futbol 7": "7v7 Soccer",
  "fútbol 7 (media cancha)": "7-a-side Soccer",
  "fútbol 9": "9v9 Soccer",
  "futbol 9": "9v9 Soccer",
  "fútbol 11": "11v11 Soccer",
  "futbol 11": "11v11 Soccer",
  "pádel": "Padel",
  "padel": "Padel",
  "pádel dobles": "Padel Doubles",
  "padel dobles": "Padel Doubles",
  "pádel dobles (4 jugadores)": "Padel Doubles (4 Players)",
  "pádel individual": "Padel Singles",
  "padel individual": "Padel Singles",
  "pádel individual (1 vs 1)": "Padel Singles (1 vs 1)",
  "tenis": "Tennis",
  "tenis individual": "Tennis Singles",
  "tenis singles": "Tennis Singles",
  "tenis dobles": "Tennis Doubles",
  "pickleball": "Pickleball",
  "pickleball individual": "Pickleball Singles",
  "pickleball dobles": "Pickleball Doubles",
  "ping-pong": "Table Tennis",
  "ping pong": "Table Tennis",
  "ping-pong individual": "Table Tennis Singles",
  "ping-pong dobles": "Table Tennis Doubles",
  "voleibol": "Volleyball",
  "voleibol de sala": "Indoor Volleyball",
  "voleibol de playa": "Beach Volleyball",
};

function getLocalizedText(
  val: LocalizedName | string | undefined,
  isEn = false,
): string {
  if (!val) return "";
  if (typeof val === "string") return val;
  return isEn ? val.en || val.es || "" : val.es || val.en || "";
}

function translateSportTag(
  tag: string,
  isEn: boolean,
  taxonomy: ActivityTypeItem[] = [],
): string {
  if (!tag || !isEn) return tag;
  const lower = tag.trim().toLowerCase();
  if (SPORT_TAG_EN_MAP[lower]) {
    return SPORT_TAG_EN_MAP[lower];
  }
  for (const t of taxonomy) {
    for (const act of t.activities || []) {
      if (typeof act.name === "object" && act.name !== null) {
        if ((act.name.es || "").toLowerCase() === lower && act.name.en) {
          return act.name.en;
        }
      }
      for (const cat of act.categories || []) {
        if (typeof cat.name === "object" && cat.name !== null) {
          if ((cat.name.es || "").toLowerCase() === lower && cat.name.en) {
            return cat.name.en;
          }
        }
      }
    }
  }
  return tag;
}

function getSportEmoji(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("fútbol") || n.includes("futbol") || n.includes("soccer")) return "⚽";
  if (n.includes("pádel") || n.includes("padel")) return "🎾";
  if (n.includes("tenis") || n.includes("tennis")) return "🎾";
  if (n.includes("pickleball")) return "🏓";
  if (n.includes("ping") || n.includes("mesa") || n.includes("table tennis")) return "🏓";
  if (n.includes("voleibol") || n.includes("volley")) return "🏐";
  if (n.includes("básquet") || n.includes("basket")) return "🏀";
  if (n.includes("béisbol") || n.includes("baseball")) return "⚾";
  return "🏅";
}

function generateSurfaceCode(name: string): string {
  const slug = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 24);
  return `SURF_${slug || "CUSTOM"}`;
}

export function SurfaceModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
  taxonomy = [],
}: SurfaceModalProps) {
  const t = useTranslations("catalogs.modalSurface");
  const locale = useLocale();
  const isEn = locale.toLowerCase().startsWith("en");
  const isEditing = Boolean(initialData);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [suitedSports, setSuitedSports] = useState<string[]>([]);
  const [status, setStatus] = useState<EntityStatus>("ENABLED");
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Build available sports & formats dynamically from the system's taxonomy (using canonical ES keys for storage)
  const availableSports = useMemo(() => {
    const fromTaxonomy = taxonomy.flatMap((type) =>
      (type.activities || []).map((act) => {
        const sportName = getLocalizedText(act.name, false);
        const formats = (act.categories || [])
          .map((c) => getLocalizedText(c.name, false))
          .filter(Boolean);
        return {
          name: sportName,
          icon: getSportEmoji(sportName),
          formats,
        };
      })
    ).filter((s) => Boolean(s.name));

    return fromTaxonomy.length > 0 ? fromTaxonomy : FALLBACK_SPORTS;
  }, [taxonomy]);

  useEffect(() => {
    if (initialData) {
      setName(getLocalizedText(initialData.name as any, isEn));
      setDescription(getLocalizedText(initialData.description as any, isEn));
      setImageUrl(initialData.imageUrl || "");
      setSuitedSports(initialData.suitedSports || []);
      setStatus(initialData.status || "ENABLED");
    } else {
      setName("");
      setDescription("");
      setImageUrl("");
      setSuitedSports([]);
      setStatus("ENABLED");
    }
    setErrorMsg(null);
  }, [initialData, isOpen, isEn]);

  if (!isOpen) return null;

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    setErrorMsg(null);

    const fd = new FormData();
    fd.append("file", file);

    const res = await uploadBackofficeFileAction(fd);
    setUploadingImage(false);

    if (res.ok && res.data?.url) {
      setImageUrl(res.data.url);
    } else {
      setErrorMsg(
        isEn
          ? "Error uploading reference image. Please try another file."
          : "Error al subir la imagen de referencia. Intenta con otro archivo.",
      );
    }
  }

  function isSportSelected(sportName: string, formats: string[]): boolean {
    const normSport = sportName.toLowerCase();
    return suitedSports.some(
      (s) =>
        s.toLowerCase() === normSport ||
        s.toLowerCase().includes(normSport) ||
        formats.some((f) => f.toLowerCase() === s.toLowerCase())
    );
  }

  function toggleSport(sportName: string, formats: string[]) {
    const selected = isSportSelected(sportName, formats);
    if (selected) {
      const normSport = sportName.toLowerCase();
      const normFormats = new Set(formats.map((f) => f.toLowerCase()));
      setSuitedSports((prev) =>
        prev.filter(
          (s) =>
            s.toLowerCase() !== normSport &&
            !s.toLowerCase().includes(normSport) &&
            !normFormats.has(s.toLowerCase())
        )
      );
    } else {
      setSuitedSports((prev) => {
        const next = new Set(prev);
        next.add(sportName);
        formats.forEach((f) => next.add(f));
        return Array.from(next);
      });
    }
  }

  function toggleFormat(sportName: string, formatName: string, allFormats: string[]) {
    setSuitedSports((prev) => {
      const exists = prev.some((s) => s.toLowerCase() === formatName.toLowerCase());
      let next: string[];
      if (exists) {
        next = prev.filter((s) => s.toLowerCase() !== formatName.toLowerCase());
        // If no formats of this sport remain, also remove the parent sport tag
        const anyFormatLeft = allFormats.some((f) =>
          next.some((s) => s.toLowerCase() === f.toLowerCase())
        );
        if (!anyFormatLeft) {
          next = next.filter((s) => s.toLowerCase() !== sportName.toLowerCase());
        }
      } else {
        next = [...prev, formatName];
        if (!next.some((s) => s.toLowerCase() === sportName.toLowerCase())) {
          next.unshift(sportName);
        }
      }
      return next;
    });
  }

  function handleSelectAllSports() {
    const allSelected = availableSports.every((sp) =>
      isSportSelected(sp.name, sp.formats)
    );
    if (allSelected) {
      setSuitedSports([]);
    } else {
      const allTags = new Set<string>();
      availableSports.forEach((sp) => {
        allTags.add(sp.name);
        sp.formats.forEach((f) => allTags.add(f));
      });
      setSuitedSports(Array.from(allTags));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (suitedSports.length === 0) {
      setErrorMsg(
        isEn
          ? "Select at least one compatible sport for this surface."
          : "Selecciona al menos un deporte compatible para esta superficie.",
      );
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const input: CreateSurfaceInput = {
      ...(initialData ? {} : { code: generateSurfaceCode(name) }),
      name: name.trim(),
      description: description.trim(),
      imageUrl: imageUrl.trim() || null,
      suitedSports,
      status,
    };

    const res = initialData
      ? await updateSurfaceAction(initialData.id, input)
      : await createSurfaceAction(input);
    setLoading(false);

    if (res.ok && res.data) {
      onSuccess(res.data);
      onClose();
    } else if (!res.ok) {
      setErrorMsg(res.error.code || t("errorSave"));
    }
  }

  const allSportsSelected =
    availableSports.length > 0 &&
    availableSports.every((sp) => isSportSelected(sp.name, sp.formats));

  return (
    <div
      className="modal-backdrop"
      id="surface-modal-backdrop"
      onClick={onClose}
    >
      <div
        className="modal-card max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "560px" }}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-accent/15 border border-accent/30 text-xl">
              🌱
            </div>
            <div>
              <h3 className="font-display text-lg font-bold text-foreground">
                {isEditing
                  ? isEn
                    ? "Edit Court Surface"
                    : "Editar Superficie de Cancha"
                  : isEn
                    ? "New Court Surface"
                    : "Nueva Superficie de Cancha"}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isEditing
                  ? isEn
                    ? "Update the reference photo, composition, and compatible sports"
                    : "Actualiza la foto de referencia, composición y deportes compatibles"
                  : isEn
                    ? "Register a surface type to link with courts on the platform"
                    : "Registra un tipo de superficie para asociar a las canchas de la plataforma"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-lg cursor-pointer p-1"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {errorMsg && (
            <div className="rounded-xl border border-destructive/30 bg-destructive-subtle p-3 text-xs text-destructive">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* REFERENCE IMAGE UPLOADER (Venues style) */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                📷{" "}
                {isEn
                  ? "Surface Reference Photo"
                  : "Foto de Referencia de la Superficie"}{" "}
                <span className="font-normal text-muted-foreground">
                  ({isEn ? "Optional" : "Opcional"})
                </span>
              </label>
              <span className="text-[11px] text-muted-foreground">
                {isEn
                  ? "Click on the image to change it"
                  : "Haz clic en la imagen para cambiarla"}
              </span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className="group relative h-40 w-full cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed border-accent/60 bg-muted/30 transition-all hover:border-accent"
            >
              {imageUrl ? (
                <>
                  <img
                    src={imageUrl}
                    alt={name || (isEn ? "Surface" : "Superficie")}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                  <div className="absolute inset-0 bg-black/25 transition-opacity group-hover:bg-black/40" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="rounded-xl bg-surface/95 px-4 py-2 text-xs font-bold text-foreground shadow-md transition-transform group-hover:scale-105">
                      {uploadingImage
                        ? isEn
                          ? "⏳ Uploading photo..."
                          : "⏳ Subiendo foto..."
                        : isEn
                          ? "📷 Change reference photo"
                          : "📷 Cambiar foto de referencia"}
                    </span>
                  </div>
                  <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setImageUrl("");
                      }}
                      className="rounded-lg bg-black/75 px-2.5 py-1 text-[11px] font-semibold text-rose-300 hover:bg-black"
                    >
                      {isEn ? "Remove" : "Quitar"}
                    </button>
                    <span className="rounded-lg bg-black/75 px-2.5 py-1 text-[11px] font-semibold text-white">
                      {isEn ? "✏️ Click to edit photo" : "✏️ Clic para editar foto"}
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-1.5 p-4 text-center">
                  <div className="flex size-10 items-center justify-center rounded-full bg-accent/15 text-xl">
                    {uploadingImage ? "⏳" : "📷"}
                  </div>
                  <span className="text-xs font-bold text-foreground">
                    {uploadingImage
                      ? isEn
                        ? "Uploading image..."
                        : "Subiendo imagen..."
                      : isEn
                        ? "Click to upload a reference photo of the surface"
                        : "Haz clic para subir una foto de referencia de la superficie"}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {isEn
                      ? "e.g. Synthetic turf texture, panoramic glass, clay, or hardwood"
                      : "Ej: Textura de grama sintética, cristal panorámico, arcilla o parquet"}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* SURFACE NAME & COMPOSITION */}
          <div className="grid grid-cols-1 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                {t("name")}
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={
                  isEn
                    ? "e.g. Padel Monofilament Turf (WPT)"
                    : "Ej: Césped Monofilamento Pádel (WPT)"
                }
                className="form-input"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                {t("description")}
              </label>
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={
                  isEn
                    ? "e.g. Polyethylene fiber with 0.2-0.6mm silica sand infill"
                    : "Ej: Fibra de polietileno con relleno de arena sílice 0.2-0.6mm"
                }
                className="form-input text-xs"
              />
            </div>
          </div>

          {/* FRIENDLY MULTI-SELECT FOR COMPATIBLE SPORTS */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {isEn ? "Compatible Sports *" : "Deportes Compatibles *"}
                </label>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {isEn
                    ? "Select the sports and formats where this surface can be used"
                    : "Selecciona los deportes y formatos donde se puede utilizar esta superficie"}
                </p>
              </div>
              <button
                type="button"
                onClick={handleSelectAllSports}
                className="cursor-pointer text-[11px] font-bold text-link hover:underline shrink-0"
              >
                {allSportsSelected
                  ? isEn
                    ? "Deselect all"
                    : "Desmarcar todos"
                  : isEn
                    ? "Select all"
                    : "Seleccionar todos"}
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {availableSports.map((sport) => {
                const selected = isSportSelected(sport.name, sport.formats);
                return (
                  <button
                    key={sport.name}
                    type="button"
                    onClick={() => toggleSport(sport.name, sport.formats)}
                    className={`cursor-pointer flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left text-xs font-bold transition-all ${
                      selected
                        ? "border-accent bg-accent/15 text-foreground shadow-2xs"
                        : "border-border bg-muted/30 text-muted-foreground hover:border-accent/50 hover:text-foreground"
                    }`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <span className="text-base leading-none">{sport.icon}</span>
                      <span className="truncate">
                        {translateSportTag(sport.name, isEn, taxonomy)}
                      </span>
                    </span>
                    <span
                      className={`flex size-4 shrink-0 items-center justify-center rounded-md text-[10px] ${
                        selected
                          ? "bg-accent text-accent-foreground font-extrabold"
                          : "border border-border bg-surface text-transparent"
                      }`}
                    >
                      ✓
                    </span>
                  </button>
                );
              })}
            </div>

            {/* SPECIFIC FORMATS FOR SELECTED SPORTS */}
            {availableSports.some(
              (sp) => isSportSelected(sp.name, sp.formats) && sp.formats.length > 0
            ) && (
              <div className="mt-3 rounded-xl border border-border/80 bg-muted/20 p-3 space-y-2.5">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {isEn
                    ? "Specific formats included (click to adjust):"
                    : "Formatos específicos incluidos (haz clic para ajustar):"}
                </span>
                <div className="space-y-2">
                  {availableSports
                    .filter(
                      (sp) =>
                        isSportSelected(sp.name, sp.formats) && sp.formats.length > 0
                    )
                    .map((sp) => (
                      <div key={sp.name} className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] font-bold text-foreground mr-1">
                          {sp.icon} {translateSportTag(sp.name, isEn, taxonomy)}:
                        </span>
                        {sp.formats.map((fmt) => {
                          const fmtChecked = suitedSports.some(
                            (s) => s.toLowerCase() === fmt.toLowerCase()
                          );
                          return (
                            <button
                              key={fmt}
                              type="button"
                              onClick={() => toggleFormat(sp.name, fmt, sp.formats)}
                              className={`cursor-pointer rounded-lg border px-2 py-0.5 text-[11px] font-semibold transition-all ${
                                fmtChecked
                                  ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                                  : "border-border bg-surface text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              {fmtChecked ? "✓ " : "+ "}
                              {translateSportTag(fmt, isEn, taxonomy)}
                            </button>
                          );
                        })}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* STATUS SELECTOR WHEN EDITING */}
          {isEditing && (
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                {isEn ? "Platform Status" : "Estado en Plataforma"}
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setStatus("ENABLED")}
                  className={`cursor-pointer rounded-xl border px-3 py-2 text-xs font-bold transition-all ${
                    status === "ENABLED"
                      ? "border-emerald-500 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                      : "border-border bg-surface text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {isEn ? "● Active (Available)" : "● Activo (Disponible)"}
                </button>
                <button
                  type="button"
                  onClick={() => setStatus("DISABLED")}
                  className={`cursor-pointer rounded-xl border px-3 py-2 text-xs font-bold transition-all ${
                    status === "DISABLED"
                      ? "border-rose-500 bg-rose-500/15 text-rose-500"
                      : "border-border bg-surface text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {isEn ? "○ Inactive (Hidden)" : "○ Inactivo (Oculto)"}
                </button>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-border">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onClose}
              disabled={loading || uploadingImage}
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={loading}
              disabled={uploadingImage}
            >
              {isEditing
                ? isEn
                  ? "Save Changes ✓"
                  : "Guardar Cambios ✓"
                : t("save")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
