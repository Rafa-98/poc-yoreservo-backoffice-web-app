"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/shared/ui/button";
import { createCategoryAction } from "../actions/catalogs-actions";
import type { ActivityItem, CreateCategoryInput } from "../model/types";

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  activity: ActivityItem | null;
  onSuccess: (category: any) => void;
}

export function CategoryModal({
  isOpen,
  onClose,
  activity,
  onSuccess,
}: CategoryModalProps) {
  const t = useTranslations("catalogs.modalCategory");

  const [nameEs, setNameEs] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !activity) return null;

  const parentName = typeof activity.name === "object" ? activity.name.es : String(activity.name);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!activity) return;

    setLoading(true);
    setErrorMsg(null);

    const input: CreateCategoryInput = {
      activityId: activity.id,
      name: { es: nameEs.trim(), en: nameEn.trim() },
      imageUrl: imageUrl.trim() || undefined,
    };

    const res = await createCategoryAction(input);
    setLoading(false);

    if (res.ok) {
      onSuccess(res.data);
      onClose();
    } else {
      setErrorMsg(res.error.code || "Error al registrar el formato de juego");
    }
  }

  return (
    <div
      className="modal-backdrop"
      id="category-modal-backdrop"
      onClick={onClose}
    >
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "460px" }}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🏆</span>
            <div>
              <h3 className="font-display text-lg font-bold text-foreground">
                {t("title")}
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
              {t("sportLabel")}
            </label>
            <input
              type="text"
              readOnly
              value={parentName}
              className="form-input opacity-80 bg-muted cursor-not-allowed text-xs font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              {t("nameEs")}
            </label>
            <input
              type="text"
              required
              value={nameEs}
              onChange={(e) => setNameEs(e.target.value)}
              placeholder="Ej: Pádel Dobles (4 Jugadores)"
              className="form-input"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              {t("nameEn")}
            </label>
            <input
              type="text"
              required
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              placeholder="Ej: Padel Doubles (4 Players)"
              className="form-input"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              {t("imageUrl")}
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
              className="form-input text-xs"
            />
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
