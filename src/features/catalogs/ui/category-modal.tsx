"use client";

import React, { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/shared/ui/button";
import { uploadBackofficeFileAction } from "@/shared/api/upload-action";
import {
  createCategoryAction,
  updateCategoryAction,
} from "../actions/catalogs-actions";
import type {
  ActivityCategoryItem,
  ActivityItem,
  CreateCategoryInput,
  EntityStatus,
} from "../model/types";

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  activity: ActivityItem | null;
  initialCategory?: ActivityCategoryItem | null;
  onSuccess: (category: any) => void;
}

function getLocalized(val: any): { es: string; en: string } {
  if (typeof val === "object" && val !== null) {
    return { es: val.es || "", en: val.en || "" };
  }
  return { es: String(val || ""), en: String(val || "") };
}

export function CategoryModal({
  isOpen,
  onClose,
  activity,
  initialCategory = null,
  onSuccess,
}: CategoryModalProps) {
  const t = useTranslations("catalogs.modalCategory");
  const locale = useLocale();
  const isEn = locale.toLowerCase().startsWith("en");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [nameEs, setNameEs] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [status, setStatus] = useState<EntityStatus>("ENABLED");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isEditMode = Boolean(initialCategory);

  useEffect(() => {
    if (isOpen) {
      if (initialCategory) {
        const loc = getLocalized(initialCategory.name);
        setNameEs(loc.es);
        setNameEn(loc.en);
        setImageUrl(initialCategory.imageUrl || "");
        setStatus(initialCategory.status || "ENABLED");
      } else {
        setNameEs("");
        setNameEn("");
        setImageUrl("");
        setStatus("ENABLED");
      }
      setErrorMsg(null);
    }
  }, [isOpen, initialCategory]);

  if (!isOpen || !activity) return null;

  const parentLoc = getLocalized(activity.name);
  const parentName = isEn
    ? parentLoc.en || parentLoc.es
    : parentLoc.es || parentLoc.en;

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
        setErrorMsg(
          res.error.code ||
            (isEn ? "Could not upload image." : "No se pudo subir la imagen."),
        );
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
    if (!activity) return;

    setLoading(true);
    setErrorMsg(null);

    if (isEditMode && initialCategory) {
      const res = await updateCategoryAction(initialCategory.id, {
        name: { es: nameEs.trim(), en: nameEn.trim() },
        imageUrl: imageUrl.trim() || null,
        status,
      });
      setLoading(false);
      if (res.ok) {
        onSuccess(res.data);
        onClose();
      } else {
        setErrorMsg(
          res.error.code ||
            (isEn
              ? "Error updating category."
              : "Error al actualizar la categoría."),
        );
      }
      return;
    }

    const input: CreateCategoryInput = {
      activityId: activity.id,
      name: { es: nameEs.trim(), en: nameEn.trim() },
      imageUrl: imageUrl.trim() || undefined,
      status,
    };

    const res = await createCategoryAction(input);
    setLoading(false);

    if (res.ok) {
      onSuccess(res.data);
      onClose();
    } else {
      setErrorMsg(res.error.code || t("errorCreate"));
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
        style={{ maxWidth: "520px" }}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🏆</span>
            <div>
              <h3 className="font-display text-lg font-bold text-foreground">
                {isEditMode
                  ? isEn
                    ? `Edit ${parentName} Format`
                    : `Editar Formato de ${parentName}`
                  : t("title")}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isEditMode
                  ? isEn
                    ? "Update the bilingual name, optional photo, or availability of this modality."
                    : "Actualiza el nombre bilingüe, foto opcional o disponibilidad de esta modalidad."
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

          {/* 1. DEPORTE ASOCIADO */}
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

          {/* 2. INTERACTIVE PHOTO UPLOADER (MATCHING /VENUES) */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-xs font-bold text-foreground">
                {isEn
                  ? "📷 Format / Modality Photo (Optional)"
                  : "📷 Foto del Formato / Modalidad (Opcional)"}
              </label>
              <span className="text-[11px] text-muted-foreground">
                {imageUrl
                  ? isEn
                    ? "Click on the image to change it"
                    : "Haz clic en la imagen para cambiarla"
                  : isEn
                    ? "Optional • JPG, PNG or WEBP"
                    : "Opcional • JPG, PNG o WEBP"}
              </span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageFileChange}
              disabled={uploadingImage}
              id="category-image-file"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImage}
              className="group relative flex h-36 w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-border-medium bg-muted/40 text-center transition-all hover:border-accent"
            >
              {imageUrl ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageUrl}
                    alt={
                      (isEn ? nameEn || nameEs : nameEs || nameEn) ||
                      (isEn ? "Format photo" : "Foto del formato")
                    }
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    <span className="rounded-xl bg-surface/95 px-4 py-2 text-xs font-bold text-foreground shadow-md">
                      {uploadingImage
                        ? isEn
                          ? "⏳ Uploading image..."
                          : "⏳ Subiendo imagen..."
                        : isEn
                          ? "📷 Change format photo"
                          : "📷 Cambiar foto del formato"}
                    </span>
                  </div>
                  <div className="absolute bottom-2.5 right-2.5 rounded-lg bg-black/65 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-xs">
                    {isEn ? "✏️ Click to edit photo" : "✏️ Clic para editar foto"}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-1.5 px-4 py-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/20 text-lg">
                    📷
                  </div>
                  <span className="text-xs font-bold text-foreground">
                    {uploadingImage
                      ? isEn
                        ? "⏳ Uploading image..."
                        : "⏳ Subiendo imagen..."
                      : isEn
                        ? "Click here to upload a format image"
                        : "Haz clic aquí para subir una imagen del formato"}
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

          {/* 3. NOMBRES BILINGÜES */}
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                {t("nameEs")}
              </label>
              <input
                type="text"
                required
                value={nameEs}
                onChange={(e) => setNameEs(e.target.value)}
                placeholder={t("placeholderEs")}
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
                placeholder={t("placeholderEn")}
                className="form-input"
              />
            </div>
          </div>

          {/* 4. ESTADO DE LA CATEGORÍA */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              {isEn ? "Format Status" : "Estado del Formato"}
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as EntityStatus)}
              className="h-10 w-full rounded-xl border border-border-medium bg-surface px-3 text-xs font-bold text-foreground focus:border-accent focus:outline-none"
            >
              <option value="ENABLED">
                {isEn
                  ? "🟢 Active (Available when creating courts)"
                  : "🟢 Activo (Disponible al crear canchas)"}
              </option>
              <option value="DISABLED">
                {isEn ? "🔴 Inactive (Hidden)" : "🔴 Inactivo (Oculto)"}
              </option>
            </select>
          </div>

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
              {isEditMode
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
