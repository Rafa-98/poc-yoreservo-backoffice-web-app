"use client";

import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/shared/ui/button";
import {
  createAmenityAction,
  updateAmenityAction,
} from "../actions/catalogs-actions";
import type { AmenityItem, CreateAmenityInput } from "../model/types";

interface AmenityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (amenity: AmenityItem) => void;
  initialData?: AmenityItem | null;
}

const AVAILABLE_SPORTS = [
  "Fútbol",
  "Pádel",
  "Tenis",
  "Pickleball",
  "Ping-pong",
  "Voleibol",
];

export function AmenityModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}: AmenityModalProps) {
  const t = useTranslations("catalogs.modalAmenity");

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("✨");
  const [description, setDescription] = useState("");
  const [suitedSports, setSuitedSports] = useState<string[]>(AVAILABLE_SPORTS);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setCode(initialData.code);
      setName(initialData.name);
      setIcon(initialData.icon || "✨");
      setDescription(initialData.description || "");
      setSuitedSports(
        initialData.suitedSports && initialData.suitedSports.length > 0
          ? initialData.suitedSports
          : AVAILABLE_SPORTS
      );
    } else {
      setCode("");
      setName("");
      setIcon("✨");
      setDescription("");
      setSuitedSports(AVAILABLE_SPORTS);
    }
    setErrorMsg(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  function toggleSport(sport: string) {
    setSuitedSports((prev) =>
      prev.includes(sport) ? prev.filter((s) => s !== sport) : [...prev, sport]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const input: CreateAmenityInput = {
      code: code.trim().toUpperCase(),
      name: name.trim(),
      icon: icon.trim(),
      description: description.trim(),
      suitedSports: suitedSports.length > 0 ? suitedSports : AVAILABLE_SPORTS,
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

  return (
    <div
      className="modal-backdrop"
      id="amenity-modal-backdrop"
      onClick={onClose}
    >
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "500px" }}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">{icon || "✨"}</span>
            <div>
              <h3 className="font-display text-lg font-bold text-foreground">
                {initialData ? "Editar Amenidad / Equipamiento" : t("title")}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t("desc")}
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

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              {t("code")}
            </label>
            <input
              type="text"
              required
              disabled={Boolean(initialData)}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="AMN_SAUNA_PRO"
              className="form-input font-mono uppercase text-xs disabled:opacity-65"
            />
          </div>

          <div className="grid grid-cols-4 gap-3">
            <div className="col-span-1">
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                {t("icon")}
              </label>
              <input
                type="text"
                required
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                maxLength={4}
                className="form-input text-center text-lg"
              />
            </div>
            <div className="col-span-3">
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                {t("name")}
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("placeholderName")}
                className="form-input"
              />
            </div>
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
              placeholder={t("placeholderDesc")}
              className="form-input text-xs"
            />
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Deportes Compatibles
              </label>
              <button
                type="button"
                onClick={() =>
                  setSuitedSports(
                    suitedSports.length === AVAILABLE_SPORTS.length
                      ? []
                      : [...AVAILABLE_SPORTS]
                  )
                }
                className="cursor-pointer text-[11px] font-bold text-link hover:underline"
              >
                {suitedSports.length === AVAILABLE_SPORTS.length
                  ? "Desmarcar todos"
                  : "Seleccionar todos"}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_SPORTS.map((sport) => {
                const isSelected = suitedSports.some((s) =>
                  s.toLowerCase().includes(sport.toLowerCase())
                );
                return (
                  <button
                    key={sport}
                    type="button"
                    onClick={() => toggleSport(sport)}
                    className={`cursor-pointer rounded-xl border px-3 py-1.5 text-xs font-bold transition-all ${
                      isSelected
                        ? "border-accent bg-accent/20 text-foreground"
                        : "border-border bg-muted/40 text-muted-foreground hover:border-border-medium"
                    }`}
                  >
                    {isSelected ? "✓ " : "+ "}
                    {sport}
                  </button>
                );
              })}
            </div>
          </div>

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
              {t("save")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
