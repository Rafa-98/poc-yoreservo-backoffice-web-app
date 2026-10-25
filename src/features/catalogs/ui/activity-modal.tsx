"use client";

import React, { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/shared/ui/button";
import { uploadBackofficeFileAction } from "@/shared/api/upload-action";
import {
  createActivityAction,
  updateActivityAction,
} from "../actions/catalogs-actions";
import type {
  ActivityItem,
  CreateActivityInput,
  EntityStatus,
} from "../model/types";

interface ActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  activityTypeId: string;
  initialActivity?: ActivityItem | null;
  onSuccess: (activity: any) => void;
}

const DEFAULT_SPORT_FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=900&q=80";

function getLocalized(val: any): { es: string; en: string } {
  if (typeof val === "object" && val !== null) {
    return { es: val.es || "", en: val.en || "" };
  }
  return { es: String(val || ""), en: String(val || "") };
}

export function ActivityModal({
  isOpen,
  onClose,
  activityTypeId,
  initialActivity = null,
  onSuccess,
}: ActivityModalProps) {
  const t = useTranslations("catalogs.modalSport");
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

  const isEditMode = Boolean(initialActivity);

  useEffect(() => {
    if (isOpen) {
      if (initialActivity) {
        const loc = getLocalized(initialActivity.name);
        setNameEs(loc.es);
        setNameEn(loc.en);
        setImageUrl(initialActivity.imageUrl || "");
        setStatus(initialActivity.status || "ENABLED");
      } else {
        setNameEs("");
        setNameEn("");
        setImageUrl("");
        setStatus("ENABLED");
      }
      setErrorMsg(null);
    }
  }, [isOpen, initialActivity]);

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
    setLoading(true);
    setErrorMsg(null);

    const resolvedImage = imageUrl.trim() || DEFAULT_SPORT_FALLBACK_IMAGE;

    if (isEditMode && initialActivity) {
      const res = await updateActivityAction(initialActivity.id, {
        ...(activityTypeId ? { activityTypeId } : {}),
        name: { es: nameEs.trim(), en: nameEn.trim() },
        imageUrl: resolvedImage,
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
              ? "Error updating sport."
              : "Error al actualizar el deporte."),
        );
      }
      return;
    }

    const input: CreateActivityInput = {
      activityTypeId,
      name: { es: nameEs.trim(), en: nameEn.trim() },
      imageUrl: resolvedImage,
      status,
    };

    const res = await createActivityAction(input);
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
      id="activity-modal-backdrop"
      onClick={onClose}
    >
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "520px" }}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🎾</span>
            <div>
              <h3 className="font-display text-lg font-bold text-foreground">
                {isEditMode
                  ? isEn
                    ? "Edit Sport / Discipline"
                    : "Editar Deporte / Disciplina"
                  : t("title")}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isEditMode
                  ? isEn
                    ? "Update the cover photo, bilingual name, or visibility of the sport."
                    : "Actualiza la foto representativa, nombre bilingüe o visibilidad del deporte."
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

          {/* 1. INTERACTIVE PHOTO UPLOADER (MATCHING /VENUES) */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-xs font-bold text-foreground">
                {isEn
                  ? "📷 Main Sport Photo"
                  : "📷 Foto Principal del Deporte"}
              </label>
              <span className="text-[11px] text-muted-foreground">
                {imageUrl
                  ? isEn
                    ? "Click on the image to change it"
                    : "Haz clic en la imagen para cambiarla"
                  : isEn
                    ? "JPG, PNG or WEBP"
                    : "JPG, PNG o WEBP"}
              </span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageFileChange}
              disabled={uploadingImage}
              id="sport-image-file"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImage}
              className="group relative flex h-44 w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-border-medium bg-muted/40 text-center transition-all hover:border-accent"
            >
              {imageUrl ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageUrl}
                    alt={
                      (isEn ? nameEn || nameEs : nameEs || nameEn) ||
                      (isEn ? "Sport photo" : "Foto del deporte")
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
                          ? "📷 Change sport photo"
                          : "📷 Cambiar foto del deporte"}
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
                        ? "Click here to upload the sport photo"
                        : "Haz clic aquí para subir la foto del deporte"}
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

          {/* 2. NOMBRES BILINGÜES */}
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

          {/* 3. ESTADO DEL DEPORTE */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              {isEn ? "Platform Status" : "Estado en Plataforma"}
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as EntityStatus)}
              className="h-10 w-full rounded-xl border border-border-medium bg-surface px-3 text-xs font-bold text-foreground focus:border-accent focus:outline-none"
            >
              <option value="ENABLED">
                {isEn
                  ? "🟢 Active (Available for courts and bookings)"
                  : "🟢 Activo (Disponible para canchas y reservas)"}
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
