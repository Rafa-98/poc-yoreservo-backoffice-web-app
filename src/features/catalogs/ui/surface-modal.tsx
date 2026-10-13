"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/shared/ui/button";
import { createSurfaceAction } from "../actions/catalogs-actions";
import type { CreateSurfaceInput } from "../model/types";

interface SurfaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (surface: any) => void;
}

export function SurfaceModal({
  isOpen,
  onClose,
  onSuccess,
}: SurfaceModalProps) {
  const t = useTranslations("catalogs.modalSurface");

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [maintenance, setMaintenance] = useState("");
  const [suitedSports, setSuitedSports] = useState("Pádel Dobles, Tenis");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const input: CreateSurfaceInput = {
      code: code.trim().toUpperCase(),
      name: name.trim(),
      description: description.trim(),
      maintenanceProtocol: maintenance.trim(),
      suitedSports: suitedSports.split(",").map((s) => s.trim()).filter(Boolean),
    };

    const res = await createSurfaceAction(input);
    setLoading(false);

    if (res.ok) {
      onSuccess(res.data);
      onClose();
    } else {
      setErrorMsg(res.error.code || "Error al crear la superficie");
    }
  }

  return (
    <div
      className="modal-backdrop"
      id="surface-modal-backdrop"
      onClick={onClose}
    >
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "480px" }}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🌱</span>
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
              {t("code")}
            </label>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="SURF_PADEL_MONO_12MM"
              className="form-input font-mono uppercase text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              {t("name")}
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Césped Monofilamento Pádel"
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
              placeholder="Arena sílice 0.2-0.6mm"
              className="form-input text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              {t("maintenance")}
            </label>
            <input
              type="text"
              required
              value={maintenance}
              onChange={(e) => setMaintenance(e.target.value)}
              placeholder="Cepillado quincenal"
              className="form-input text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              {t("suitedSports")}
            </label>
            <input
              type="text"
              required
              value={suitedSports}
              onChange={(e) => setSuitedSports(e.target.value)}
              placeholder="Pádel Dobles, Pádel Singles"
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
