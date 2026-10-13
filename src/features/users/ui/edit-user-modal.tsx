"use client";

import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/shared/ui/button";
import { updateUserPrivilegesAction } from "../actions/users-actions";
import type { GeneralStatus, UpdateUserPrivilegesInput, UserItem, UserRole } from "../model/types";

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserItem | null;
  venues: Array<{ id: string; name: string }>;
  onSuccess: (updated: any) => void;
}

export function EditUserModal({
  isOpen,
  onClose,
  user,
  venues,
  onSuccess,
}: EditUserModalProps) {
  const t = useTranslations("users.modalEdit");

  const [role, setRole] = useState<UserRole>("VALIDATOR");
  const [venueScope, setVenueScope] = useState<string>("org-all");
  const [status, setStatus] = useState<GeneralStatus>("ACTIVE");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setRole(user.role);
      setVenueScope(user.venueId || "org-all");
      setStatus((user.status === "INVITATION_PENDING" ? "ACTIVE" : user.status) as GeneralStatus);
    }
  }, [user]);

  if (!isOpen || !user) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setErrorMsg(null);

    const input: UpdateUserPrivilegesInput = {
      role,
      managedVenueId: venueScope === "org-all" ? null : venueScope,
      status,
    };

    const res = await updateUserPrivilegesAction(user.id, input);
    setLoading(false);

    if (res.ok) {
      onSuccess(res.data);
      onClose();
    } else {
      setErrorMsg(res.error.code || "Error al actualizar privilegios");
    }
  }

  return (
    <div
      className="modal-backdrop"
      id="edit-modal-backdrop"
      onClick={onClose}
    >
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "480px" }}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h3 className="font-display text-lg font-bold text-foreground">
              {t("title")}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t("desc")}
            </p>
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
              {t("userLabel")}
            </label>
            <input
              type="text"
              readOnly
              value={`${user.name} (${user.email})`}
              className="form-input opacity-80 bg-muted cursor-not-allowed text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              {t("roleLabel")}
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="form-select"
              id="edit-user-role"
            >
              <option value="ALLY">🏢 ALLY (Propietario Club)</option>
              <option value="VALIDATOR">🎟️ VALIDATOR (Recepción / Mostrador)</option>
              <option value="ACCOUNTING">💳 ACCOUNTING (Finanzas / Facturación)</option>
              <option value="ADMIN">👑 ADMIN (Superusuario Global)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              {t("scopeLabel")}
            </label>
            <select
              value={venueScope}
              onChange={(e) => setVenueScope(e.target.value)}
              className="form-select"
              id="edit-user-venue"
            >
              <option value="org-all">🏢 Toda la Organización (Todas las sedes)</option>
              {venues.map((v) => (
                <option key={v.id} value={v.id}>
                  📍 {v.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              {t("statusLabel")}
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as GeneralStatus)}
              className="form-select"
              id="edit-user-status"
            >
              <option value="ACTIVE">Activo</option>
              <option value="INACTIVE">Inactivo (Suspendido)</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-border">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onClose}
              disabled={loading}
              id="btn-cancel-edit"
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={loading}
              id="btn-save-edit"
            >
              {t("save")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
