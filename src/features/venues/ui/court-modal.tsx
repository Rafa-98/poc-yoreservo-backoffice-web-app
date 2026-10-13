"use client";

import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/shared/ui/button";
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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [spaceNumber, setSpaceNumber] = useState("");
  const [activityCategoryId, setActivityCategoryId] = useState("");
  const [pricePerHour, setPricePerHour] = useState<number>(25);
  const [surfaceType, setSurfaceType] = useState("");
  const [capacity, setCapacity] = useState<number>(10);
  const [isCovered, setIsCovered] = useState(false);

  useEffect(() => {
    if (space) {
      setSpaceNumber(space.spaceNumber || "");
      setActivityCategoryId(space.activityCategoryId || "");
      setPricePerHour(space.pricePerHour || 25);
      setSurfaceType(space.surfaceType || "");
      setCapacity(space.capacity || 10);
      setIsCovered(Boolean(space.isCovered));
    } else {
      setSpaceNumber("");
      setActivityCategoryId(categories[0]?.id || "");
      setPricePerHour(25);
      setSurfaceType("Grama Sintética 50mm");
      setCapacity(10);
      setIsCovered(false);
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
    return catName || "Deporte";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const catId = activityCategoryId || categories[0]?.id;
    if (!catId) {
      setErrorMsg("Debe seleccionar una categoría deportiva válida");
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
      };

      const res = await updateSpaceAction(space.id, updateDto);
      setLoading(false);
      if (res.ok && res.data) {
        onSuccess(res.data);
        onClose();
      } else if (!res.ok) {
        setErrorMsg(res.error.code || "Error al actualizar la cancha");
      }
    } else {
      const createDto: CreateSpaceInput = {
        spaceNumber,
        activityCategoryId: catId,
        pricePerHour: Number(pricePerHour),
        surfaceType,
        capacity: Number(capacity),
        isCovered,
      };

      const res = await createSpaceAction(venueId, createDto);
      setLoading(false);
      if (res.ok && res.data) {
        onSuccess(res.data);
        onClose();
      } else if (!res.ok) {
        setErrorMsg(res.error.code || "Error al crear la cancha");
      }
    }
  }

  return (
    <div
      className="modal-backdrop"
      id="space-modal-backdrop"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.65)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "16px",
      }}
    >
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-medium)",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "540px",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "var(--shadow-lg, 0 10px 25px rgba(0,0,0,0.3))",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "18px 24px",
            borderBottom: "1px solid var(--border-subtle)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "20px" }}>⚽</span>
            <h3 style={{ fontSize: "17px", fontWeight: 700, margin: 0 }} id="space-modal-title">
              {space ? t("modalTitleEdit") : t("modalTitleNew")}
            </h3>
          </div>
          <button
            type="button"
            className="btn-icon"
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "18px",
              cursor: "pointer",
              color: "var(--text-muted)",
            }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>
          {errorMsg && (
            <div
              style={{
                background: "rgba(220, 38, 38, 0.1)",
                border: "1px solid rgba(220, 38, 38, 0.3)",
                color: "var(--status-cancelled-text, #ef4444)",
                padding: "10px 14px",
                borderRadius: "8px",
                fontSize: "13px",
                marginBottom: "16px",
              }}
            >
              {errorMsg}
            </div>
          )}

          <div className="form-group" style={{ marginBottom: "14px" }}>
            <label className="form-label" htmlFor="court-name-input" style={{ fontSize: "12px", fontWeight: 600 }}>
              {t("name")}
            </label>
            <input
              type="text"
              id="court-name-input"
              className="input-field"
              placeholder="ej. Cancha 1 — Grama Sintética"
              required
              value={spaceNumber}
              onChange={(e) => setSpaceNumber(e.target.value)}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
            <div className="form-group">
              <label className="form-label" htmlFor="court-category-select" style={{ fontSize: "12px", fontWeight: 600 }}>
                {t("sport")}
              </label>
              <select
                id="court-category-select"
                className="input-field"
                value={activityCategoryId}
                onChange={(e) => setActivityCategoryId(e.target.value)}
                style={{ cursor: "pointer" }}
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {getCategoryName(cat)}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="court-price-input" style={{ fontSize: "12px", fontWeight: 600 }}>
                {t("price")}
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                id="court-price-input"
                className="input-field"
                required
                value={pricePerHour}
                onChange={(e) => setPricePerHour(parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: "14px" }}>
            <label className="form-label" htmlFor="court-surface-input" style={{ fontSize: "12px", fontWeight: 600 }}>
              {t("surface")}
            </label>
            <input
              type="text"
              id="court-surface-input"
              className="input-field"
              placeholder="ej. Grama Sintética 50mm / Cristal 12mm"
              required
              value={surfaceType}
              onChange={(e) => setSurfaceType(e.target.value)}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "16px" }}>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: "12px", fontWeight: 600 }}>
                Capacidad Máxima (Jugadores)
              </label>
              <input
                type="number"
                min="2"
                max="30"
                id="court-capacity-input"
                className="input-field"
                value={capacity}
                onChange={(e) => setCapacity(parseInt(e.target.value, 10) || 10)}
              />
            </div>

            <div className="form-group" style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "24px" }}>
              <input
                type="checkbox"
                id="court-covered-checkbox"
                checked={isCovered}
                onChange={(e) => setIsCovered(e.target.checked)}
                style={{ width: "18px", height: "18px", accentColor: "var(--brand-lime)" }}
              />
              <label htmlFor="court-covered-checkbox" style={{ fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
                {t("isCovered")}
              </label>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onClose}
              disabled={loading}
              id="btn-cancel-court"
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={loading}
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
