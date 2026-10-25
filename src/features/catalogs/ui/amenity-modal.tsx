"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/shared/ui/button";
import {
  createAmenityAction,
  updateAmenityAction,
} from "../actions/catalogs-actions";
import type {
  ActivityTypeItem,
  AmenityItem,
  CreateAmenityInput,
  EntityStatus,
  LocalizedName,
} from "../model/types";

interface AmenityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (amenity: AmenityItem) => void;
  initialData?: AmenityItem | null;
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
  "fútbol 7": "7v7 Soccer",
  "futbol 7": "7v7 Soccer",
  "fútbol 9": "9v9 Soccer",
  "futbol 9": "9v9 Soccer",
  "fútbol 11": "11v11 Soccer",
  "futbol 11": "11v11 Soccer",
  "pádel": "Padel",
  "padel": "Padel",
  "pádel dobles": "Padel Doubles",
  "padel dobles": "Padel Doubles",
  "pádel individual": "Padel Singles",
  "padel individual": "Padel Singles",
  "tenis": "Tennis",
  "tenis individual": "Tennis Singles",
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

const EMOJI_CATALOG = [
  {
    categoryEs: "🏟️ Infraestructura & Sede",
    categoryEn: "🏟️ Infrastructure & Venue",
    items: [
      { emoji: "💡", labelEs: "Iluminación LED", labelEn: "LED Lighting" },
      { emoji: "🅿️", labelEs: "Estacionamiento", labelEn: "Parking" },
      { emoji: "🚿", labelEs: "Duchas / Vestuarios", labelEn: "Showers / Lockers" },
      { emoji: "☕", labelEs: "Cafetería / Bar", labelEn: "Cafeteria / Bar" },
      { emoji: "📶", labelEs: "Wi-Fi", labelEn: "Wi-Fi" },
      { emoji: "❄️", labelEs: "Aire Acondicionado", labelEn: "Air Conditioning" },
      { emoji: "🏟️", labelEs: "Gradas / Tribuna", labelEn: "Bleachers / Stands" },
      { emoji: "📹", labelEs: "Cámara / Streaming", labelEn: "Camera / Streaming" },
      { emoji: "⏱️", labelEs: "Marcador Digital", labelEn: "Digital Scoreboard" },
      { emoji: "🧊", labelEs: "Hidratación / Hielo", labelEn: "Hydration / Ice" },
      { emoji: "🛍️", labelEs: "Tienda / Pro Shop", labelEn: "Pro Shop / Store" },
      { emoji: "🏖️", labelEs: "Zona Playa / Lavapiés", labelEn: "Beach / Foot Wash" },
      { emoji: "🔒", labelEs: "Lockers / Seguridad", labelEn: "Lockers / Security" },
      { emoji: "🩺", labelEs: "Primeros Auxilios", labelEn: "First Aid" },
      { emoji: "♿", labelEs: "Acceso Universal", labelEn: "Universal Access" },
      { emoji: "🍔", labelEs: "Restaurante / Snacks", labelEn: "Restaurant / Snacks" },
    ],
  },
  {
    categoryEs: "⚽ Equipamiento Deportivo",
    categoryEn: "⚽ Sports Equipment",
    items: [
      { emoji: "⚽", labelEs: "Balones de Fútbol", labelEn: "Soccer Balls" },
      { emoji: "🎾", labelEs: "Raquetas / Palas", labelEn: "Rackets / Paddles" },
      { emoji: "🏓", labelEs: "Paletas / Ping-pong", labelEn: "Paddles / Ping-pong" },
      { emoji: "🏐", labelEs: "Balones Voleibol", labelEn: "Volleyballs" },
      { emoji: "🥅", labelEs: "Porterías / Redes", labelEn: "Goals / Nets" },
      { emoji: "🧤", labelEs: "Guantes / Protección", labelEn: "Gloves / Gear" },
      { emoji: "🪑", labelEs: "Banquillos / Silla Juez", labelEn: "Benches / Umpire Chair" },
      { emoji: "🤖", labelEs: "Lanzapelotas", labelEn: "Ball Machine" },
      { emoji: "🪟", labelEs: "Cristal Panorámico", labelEn: "Panoramic Glass" },
      { emoji: "🏃", labelEs: "Zona Exterior / Pista", labelEn: "Out-of-court Zone" },
      { emoji: "🏀", labelEs: "Básquetbol", labelEn: "Basketball" },
      { emoji: "⚾", labelEs: "Béisbol / Bateo", labelEn: "Baseball / Batting" },
      { emoji: "🏅", labelEs: "Arbitraje / Torneo", labelEn: "Referee / Tournament" },
      { emoji: "🏆", labelEs: "Equipamiento Pro", labelEn: "Pro Equipment" },
      { emoji: "🎯", labelEs: "Entrenamiento", labelEn: "Training" },
      { emoji: "✨", labelEs: "Servicio Especial", labelEn: "Special Service" },
    ],
  },
];

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
  return "🏅";
}

function generateAmenityCode(name: string): string {
  const slug = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 24);
  return `AMN_${slug || "CUSTOM"}`;
}

export function AmenityModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
  taxonomy = [],
}: AmenityModalProps) {
  const t = useTranslations("catalogs.modalAmenity");
  const locale = useLocale();
  const isEn = locale.toLowerCase().startsWith("en");
  const isEditing = Boolean(initialData);

  const [name, setName] = useState("");
  const [icon, setIcon] = useState("💡");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [description, setDescription] = useState("");
  const [suitedSports, setSuitedSports] = useState<string[]>([]);
  const [status, setStatus] = useState<EntityStatus>("ENABLED");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const availableSports = useMemo(() => {
    const fromTaxonomy = taxonomy
      .flatMap((type) =>
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
      )
      .filter((s) => Boolean(s.name));

    return fromTaxonomy.length > 0 ? fromTaxonomy : FALLBACK_SPORTS;
  }, [taxonomy]);

  useEffect(() => {
    if (initialData) {
      setName(getLocalizedText(initialData.name as any, isEn));
      setIcon(initialData.icon || "✨");
      setDescription(getLocalizedText(initialData.description as any, isEn));
      setSuitedSports(
        initialData.suitedSports && initialData.suitedSports.length > 0
          ? initialData.suitedSports
          : availableSports.map((sp) => sp.name)
      );
      setStatus(initialData.status || "ENABLED");
    } else {
      setName("");
      setIcon("💡");
      setDescription("");
      setSuitedSports(availableSports.map((sp) => sp.name));
      setStatus("ENABLED");
    }
    setShowEmojiPicker(false);
    setErrorMsg(null);
  }, [initialData, isOpen, availableSports, isEn]);

  if (!isOpen) return null;

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
        return Array.from(next);
      });
    }
  }

  function handleSelectAllSports() {
    const allSelected = availableSports.every((sp) =>
      isSportSelected(sp.name, sp.formats)
    );
    if (allSelected) {
      setSuitedSports([]);
    } else {
      setSuitedSports(availableSports.map((sp) => sp.name));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (suitedSports.length === 0) {
      setErrorMsg(
        isEn
          ? "Select at least one compatible sport."
          : "Selecciona al menos un deporte compatible.",
      );
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const input: CreateAmenityInput = {
      ...(initialData ? {} : { code: generateAmenityCode(name) }),
      name: name.trim(),
      icon: icon.trim() || "✨",
      description: description.trim(),
      suitedSports,
      status,
    };

    const res = initialData
      ? await updateAmenityAction(initialData.id, input)
      : await createAmenityAction(input);
    setLoading(false);

    if (res.ok && res.data) {
      onSuccess(res.data);
      onClose();
    } else if (!res.ok) {
      setErrorMsg(res.error.code || t("errorCreate"));
    }
  }

  const allSportsSelected =
    availableSports.length > 0 &&
    availableSports.every((sp) => isSportSelected(sp.name, sp.formats));

  const matchedEmoji = EMOJI_CATALOG.flatMap((g) => g.items).find(
    (i) => i.emoji === icon
  );
  const selectedEmojiLabel = matchedEmoji
    ? isEn
      ? matchedEmoji.labelEn
      : matchedEmoji.labelEs
    : isEn
      ? "Selected icon"
      : "Ícono seleccionado";

  return (
    <div
      className="modal-backdrop"
      id="amenity-modal-backdrop"
      onClick={onClose}
    >
      <div
        className="modal-card max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "560px" }}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-accent/15 border border-accent/30 text-2xl">
              {icon || "✨"}
            </div>
            <div>
              <h3 className="font-display text-lg font-bold text-foreground">
                {isEditing
                  ? isEn
                    ? "Edit Amenity / Service"
                    : "Editar Amenidad / Servicio"
                  : t("title")}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isEditing
                  ? isEn
                    ? "Update the icon, description, compatible sports, or status"
                    : "Actualiza el ícono, descripción, deportes compatibles o estado"
                  : t("desc")}
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

          {/* EMOJI SELECTOR + SERVICE NAME */}
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-5">
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  {t("icon")}
                </label>
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker((prev) => !prev)}
                  className="w-full cursor-pointer flex items-center justify-between gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-left transition-all hover:border-accent"
                >
                  <span className="flex items-center gap-2.5 truncate">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-xl">
                      {icon}
                    </span>
                    <span className="truncate text-xs font-bold text-foreground">
                      {selectedEmojiLabel}
                    </span>
                  </span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {showEmojiPicker ? "▲" : "▼"}
                  </span>
                </button>
              </div>

              <div className="sm:col-span-7">
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  {t("name")}
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("placeholderName")}
                  className="form-input h-12"
                />
              </div>
            </div>

            {/* EXPANDABLE VISUAL EMOJI SELECTOR GRID */}
            {showEmojiPicker && (
              <div className="rounded-2xl border border-accent/40 bg-muted/25 p-3.5 space-y-3 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">
                    {isEn
                      ? "Select an icon from the catalog"
                      : "Selecciona un ícono del catálogo"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(false)}
                    className="cursor-pointer text-[11px] font-bold text-muted-foreground hover:text-foreground"
                  >
                    {isEn ? "Close ✕" : "Cerrar ✕"}
                  </button>
                </div>

                {EMOJI_CATALOG.map((group) => {
                  const groupCategory = isEn
                    ? group.categoryEn
                    : group.categoryEs;
                  return (
                    <div key={group.categoryEs} className="space-y-1.5">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        {groupCategory}
                      </span>
                      <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                        {group.items.map((item) => {
                          const active = icon === item.emoji;
                          const itemLabel = isEn
                            ? item.labelEn
                            : item.labelEs;
                          return (
                            <button
                              key={item.emoji}
                              type="button"
                              title={itemLabel}
                              onClick={() => {
                                setIcon(item.emoji);
                                setShowEmojiPicker(false);
                              }}
                              className={`cursor-pointer flex flex-col items-center justify-center rounded-xl border p-1.5 transition-all ${
                                active
                                  ? "border-accent bg-accent/20 shadow-xs scale-105"
                                  : "border-border bg-surface hover:border-accent/60 hover:bg-muted/50"
                              }`}
                            >
                              <span className="text-xl leading-none">
                                {item.emoji}
                              </span>
                              <span className="mt-1 w-full truncate text-center text-[9px] font-medium text-muted-foreground">
                                {itemLabel.split(" ")[0]}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* DESCRIPTION */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              {t("description")}
            </label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("placeholderDesc")}
              className="form-input text-xs"
            />
          </div>

          {/* COMPATIBLE SPORTS MULTI-SELECTOR */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {isEn ? "Compatible Sports *" : "Deportes Compatibles *"}
                </label>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {isEn
                    ? "Select all if it is a general venue amenity, or choose specific sports"
                    : "Marca todos si es una amenidad general de sede, o elige deportes específicos"}
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
                    ? "🌟 All sports"
                    : "🌟 Todos los deportes"}
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {availableSports.map((sport) => {
                const isSelected = isSportSelected(sport.name, sport.formats);
                return (
                  <button
                    key={sport.name}
                    type="button"
                    onClick={() => toggleSport(sport.name, sport.formats)}
                    className={`cursor-pointer flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left text-xs font-bold transition-all ${
                      isSelected
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
                        isSelected
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
              disabled={loading}
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={loading}
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
