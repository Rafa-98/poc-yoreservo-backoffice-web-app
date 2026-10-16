"use client";

import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/shared/ui/button";
import { uploadBackofficeFileAction } from "@/shared/api/upload-action";
import type {
  CreateSpaceInput,
  SpaceItem,
  SportCategoryItem,
  UpdateSpaceInput,
} from "../model/types";
import { createSpaceAction, updateSpaceAction } from "../actions/venues-actions";

interface CourtModalProps {
  isOpen: boolean;
  onClose: () => void;
  venueId: string;
  space: SpaceItem | null;
  categories: SportCategoryItem[];
  onSuccess: (savedSpace: SpaceItem) => void;
}

export function CourtModal({
  isOpen,
  onClose,
  venueId,
  space,
  categories,
  onSuccess,
}: CourtModalProps) {
  const t = useTranslations("venues.spaces");
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [spaceNumber, setSpaceNumber] = useState("");
  const [activityCategoryId, setActivityCategoryId] = useState("");
  const [pricePerHour, setPricePerHour] = useState<number>(25);
  const [surfaceType, setSurfaceType] = useState("");
  const [capacity, setCapacity] = useState<number>(10);
  const [isCovered, setIsCovered] = useState(false);
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    if (space) {
      setSpaceNumber(space.spaceNumber || "");
      setActivityCategoryId(space.activityCategoryId || "");
      setPricePerHour(space.pricePerHour || 25);
      setSurfaceType(space.surfaceType || "");
      setCapacity(space.capacity || 10);
      setIsCovered(Boolean(space.isCovered));
      setImageUrl(space.imageUrl || "");
    } else {
      setSpaceNumber("");
      setActivityCategoryId(categories[0]?.id || "");
      setPricePerHour(25);
      setSurfaceType("");
      setCapacity(10);
      setIsCovered(false);
      setImageUrl("");
    }
  }, [space, categories, isOpen]);

  if (!isOpen) return null;

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
        spaceNumber,
        activityCategoryId: catId,
        pricePerHour: Number(pricePerHour),
        surfaceType,
        capacity: Number(capacity),
        isCovered,
        imageUrl: imageUrl.trim() || undefined,
      };

      const res = await updateSpaceAction(space.id, updateDto);
      setLoading(false);
      if (res.ok && res.data) {
        onSuccess(res.data);
        onClose();
      } else if (!res.ok) {
        setErrorMsg(res.error.code || t("errorUpdate"));
      }
    } else {
      const createDto: CreateSpaceInput = {
        spaceNumber,
        activityCategoryId: catId,
        pricePerHour: Number(pricePerHour),
        surfaceType,
        capacity: Number(capacity),
        isCovered,
        imageUrl: imageUrl.trim() || undefined,
      };

      const res = await createSpaceAction(venueId, createDto);
      setLoading(false);
      if (res.ok && res.data) {
        onSuccess(res.data);
        onClose();
      } else if (!res.ok) {
        setErrorMsg(res.error.code || t("errorCreate"));
      }
    }
  }

  return (
    <div
      className="modal-backdrop"
      id="space-modal-backdrop"
      onClick={onClose}
    >
      <div
        className="modal-card flex max-h-[90vh] w-full max-w-[540px] flex-col overflow-hidden rounded-2xl border border-border-medium bg-surface shadow-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4.5">
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

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5">
          {errorMsg && (
            <div className="mb-4 rounded-lg border border-status-cancelled-border bg-status-cancelled-bg px-3.5 py-2.5 text-[13px] text-status-cancelled-fg">
              {errorMsg}
            </div>
          )}

          <div className="form-group mb-3.5">
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

          <div className="mb-3.5 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <div className="form-group">
              <label
                className="form-label mb-1 block text-xs font-semibold text-foreground"
                htmlFor="court-category-select"
              >
                {t("sport")}
              </label>
              <select
                id="court-category-select"
                className="input-field form-select cursor-pointer"
                value={activityCategoryId}
                onChange={(e) => setActivityCategoryId(e.target.value)}
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {getCategoryName(cat)}
                  </option>
                ))}
              </select>
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
                className="input-field form-input"
                required
                value={pricePerHour}
                onChange={(e) => setPricePerHour(parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="form-group mb-3.5">
            <label
              className="form-label mb-1 block text-xs font-semibold text-foreground"
              htmlFor="court-surface-input"
            >
              {t("surface")}
            </label>
            <input
              type="text"
              id="court-surface-input"
              className="input-field form-input"
              placeholder={t("surfacePlaceholder")}
              required
              value={surfaceType}
              onChange={(e) => setSurfaceType(e.target.value)}
            />
          </div>

          <div className="mb-4 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <div className="form-group">
              <label
                className="form-label mb-1 block text-xs font-semibold text-foreground"
                htmlFor="court-capacity-input"
              >
                {t("maxCapacityLabel")}
              </label>
              <input
                type="number"
                min="2"
                max="30"
                id="court-capacity-input"
                className="input-field form-input"
                value={capacity}
                onChange={(e) => setCapacity(parseInt(e.target.value, 10) || 10)}
              />
            </div>

            <div className="form-group mt-6 flex items-center gap-2.5">
              <input
                type="checkbox"
                id="court-covered-checkbox"
                checked={isCovered}
                onChange={(e) => setIsCovered(e.target.checked)}
                className="h-4.5 w-4.5 accent-accent"
              />
              <label
                htmlFor="court-covered-checkbox"
                className="cursor-pointer text-[13px] font-semibold text-foreground"
              >
                {t("isCovered")}
              </label>
            </div>
          </div>

          {/* COURT PHOTO UPLOAD & URL */}
          <div className="form-group mb-4">
            <label
              className="form-label mb-1 block text-xs font-semibold text-foreground"
              htmlFor="court-image-url"
            >
              📷 Foto de la Cancha (URL o Subir Imagen)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                id="court-image-url"
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
                  id="court-image-file"
                />
              </label>
            </div>
            {imageUrl && (
              <div className="mt-2 overflow-hidden rounded-xl border border-border bg-muted/40 p-1.5">
                <img
                  src={imageUrl}
                  alt={spaceNumber || "Vista previa de la cancha"}
                  className="h-28 w-full rounded-lg object-cover"
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
              {t("save")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
