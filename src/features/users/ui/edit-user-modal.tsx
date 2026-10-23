"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/shared/ui/button";
import { SearchableSelect } from "./searchable-select";
import { updateUserPrivilegesAction } from "../actions/users-actions";
import type { GeneralStatus, UpdateUserPrivilegesInput, UserItem, UserRole } from "../model/types";

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserItem | null;
  venues: Array<{ id: string; name: string }>;
  onSuccess: (updated: any) => void;
  currentUserRole?: string;
}

export function EditUserModal({
  isOpen,
  onClose,
  user,
  venues,
  onSuccess,
  currentUserRole,
}: EditUserModalProps) {
  const t = useTranslations("users.modalEdit");
  const tFilters = useTranslations("users.filters");
  const tInvite = useTranslations("users.modalInvite");

  const [role, setRole] = useState<UserRole>("ALLY_VALIDATOR");
  const [venueScope, setVenueScope] = useState<string>("org-all");
  const [status, setStatus] = useState<GeneralStatus>("ACTIVE");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isAllyCaller =
    currentUserRole === "ALLY_ADMIN" ||
    currentUserRole === "ALLY_ACCOUNTING" ||
    currentUserRole === "ALLY_VALIDATOR";

  useEffect(() => {
    if (user) {
      setRole(user.role);
      if (user.role === "ALLY_VALIDATOR") {
        setVenueScope(user.venueId || venues[0]?.id || "");
      } else {
        setVenueScope("org-all");
      }
      setStatus((user.status === "INVITATION_PENDING" ? "ACTIVE" : user.status) as GeneralStatus);
      setErrorMsg(null);
    }
  }, [user, venues]);

  function handleRoleChange(nextRole: string) {
    const casted = nextRole as UserRole;
    setRole(casted);
    setErrorMsg(null);
    if (casted === "ALLY_VALIDATOR") {
      setVenueScope((prev) =>
        prev && prev !== "org-all" ? prev : user?.venueId || venues[0]?.id || "",
      );
    } else {
      setVenueScope("org-all");
    }
  }

  const roleOptions = useMemo(() => {
    const opts = [
      { value: "ALLY_VALIDATOR", label: t("roleValidator"), icon: "🎟️" },
      { value: "ALLY_ADMIN", label: t("roleAlly"), icon: "🏢" },
      { value: "ALLY_ACCOUNTING", label: t("roleAllyAccounting"), icon: "📊" },
    ];
    if (!isAllyCaller) {
      opts.push(
        { value: "PLATFORM_ACCOUNTING", label: t("roleAccounting"), icon: "💳" },
        { value: "PLATFORM_ADMIN", label: t("roleAdmin"), icon: "👑" },
      );
    }
    return opts;
  }, [isAllyCaller, t]);

  const isValidatorRole = role === "ALLY_VALIDATOR";
  const isPlatformRole =
    role === "PLATFORM_ADMIN" || role === "PLATFORM_ACCOUNTING";

  const scopeOptions = useMemo(() => {
    if (isValidatorRole) {
      return venues.map((v) => ({
        value: v.id,
        label: v.name,
        icon: "📍",
      }));
    }
    if (isPlatformRole) {
      return [
        {
          value: "org-all",
          label: t("global"),
          icon: "🌐",
        },
      ];
    }
    return [
      {
        value: "org-all",
        label: t("orgWide"),
        icon: "🏢",
      },
    ];
  }, [isValidatorRole, isPlatformRole, venues, t]);

  const statusOptions = useMemo(() => {
    return [
      { value: "ACTIVE", label: t("statusActive") },
      { value: "INACTIVE", label: t("statusInactive") },
    ];
  }, [t]);

  if (!isOpen || !user) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    setErrorMsg(null);

    if (role === "ALLY_VALIDATOR" && (!venueScope || venueScope === "org-all")) {
      setErrorMsg(t("errorVenueRequired"));
      return;
    }

    setLoading(true);

    const input: UpdateUserPrivilegesInput = {
      role,
      managedVenueId: role === "ALLY_VALIDATOR" ? venueScope : null,
      status,
    };

    const res = await updateUserPrivilegesAction(user.id, input);
    setLoading(false);

    if (res.ok) {
      onSuccess(res.data);
      onClose();
    } else {
      setErrorMsg(res.error.code || t("errorUpdate"));
    }
  }

  return (
    <div
      className="modal-backdrop"
      id="edit-modal-backdrop"
      onClick={onClose}
    >
      <div
        className="modal-card overflow-visible"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "480px", width: "100%" }}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="min-w-0">
            <h3 className="font-display text-lg font-bold text-foreground truncate">
              {t("title")}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t("desc")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
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
            <SearchableSelect
              id="edit-user-role"
              value={role}
              onChange={handleRoleChange}
              options={roleOptions}
              searchPlaceholder={tFilters("searchOptionPlaceholder")}
              emptyText={tFilters("noOptionsFound")}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              {t("scopeLabel")}
            </label>
            <SearchableSelect
              id="edit-user-venue"
              value={isValidatorRole ? venueScope : "org-all"}
              onChange={setVenueScope}
              options={scopeOptions}
              placeholder={tInvite("selectVenuePlaceholder")}
              searchPlaceholder={tFilters("searchOptionPlaceholder")}
              emptyText={tFilters("noOptionsFound")}
              disabled={!isValidatorRole}
            />
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              {isValidatorRole
                ? t("scopeHintValidator")
                : t("scopeHintOrgWide")}
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              {t("statusLabel")}
            </label>
            <SearchableSelect
              id="edit-user-status"
              value={status}
              onChange={(val) => setStatus(val as GeneralStatus)}
              options={statusOptions}
              searchPlaceholder={tFilters("searchOptionPlaceholder")}
              emptyText={tFilters("noOptionsFound")}
            />
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
