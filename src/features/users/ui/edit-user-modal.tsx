"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/shared/ui/button";
import { SearchableSelect } from "./searchable-select";
import { updateUserPrivilegesAction } from "../actions/users-actions";
import type { GeneralStatus, UpdateUserPrivilegesInput, UserItem, UserRole } from "../model/types";

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserItem | null;
  venues: Array<{ id: string; name: string; organizationId?: string }>;
  allVenues?: Array<{ id: string; name: string; organizationId?: string }>;
  organizations?: Array<{
    id: string;
    tradeName: string;
    rif?: string | null;
    isPlatformOrg?: boolean;
    venuesCount?: number;
  }>;
  onSuccess: (updated: any) => void;
  currentUserRole?: string;
}

export function EditUserModal({
  isOpen,
  onClose,
  user,
  venues,
  allVenues,
  organizations = [],
  onSuccess,
  currentUserRole,
}: EditUserModalProps) {
  const t = useTranslations("users.modalEdit");
  const tFilters = useTranslations("users.filters");
  const tInvite = useTranslations("users.modalInvite");
  const isEn = useLocale().toLowerCase().startsWith("en");

  const [role, setRole] = useState<UserRole>("ALLY_VALIDATOR");
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");
  const [venueScope, setVenueScope] = useState<string>("org-all");
  const [status, setStatus] = useState<GeneralStatus>("ACTIVE");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isAllyCaller =
    currentUserRole === "ALLY_ADMIN" ||
    currentUserRole === "ALLY_ACCOUNTING" ||
    currentUserRole === "ALLY_VALIDATOR";

  const allyOrganizations = useMemo(() => {
    const nonPlat = organizations.filter((o) => !o.isPlatformOrg);
    return nonPlat.length > 0 ? nonPlat : organizations;
  }, [organizations]);

  const effectiveAllVenues =
    allVenues && allVenues.length > 0 ? allVenues : venues;

  const venuesForSelectedOrg = useMemo(() => {
    if (isAllyCaller || !selectedOrgId) {
      return venues;
    }
    return effectiveAllVenues.filter((v) => v.organizationId === selectedOrgId);
  }, [isAllyCaller, selectedOrgId, venues, effectiveAllVenues]);

  useEffect(() => {
    if (user) {
      setRole(user.role);
      const initialOrg = user.organizationId || allyOrganizations[0]?.id || "";
      setSelectedOrgId(initialOrg);
      const orgVenues =
        !isAllyCaller && initialOrg
          ? effectiveAllVenues.filter((v) => v.organizationId === initialOrg)
          : venues;
      if (user.role === "ALLY_VALIDATOR") {
        setVenueScope(user.venueId || orgVenues[0]?.id || "");
      } else {
        setVenueScope("org-all");
      }
      setStatus((user.status === "INVITATION_PENDING" ? "ACTIVE" : user.status) as GeneralStatus);
      setErrorMsg(null);
    }
  }, [user, venues, allyOrganizations, isAllyCaller, effectiveAllVenues]);

  function handleOrganizationChange(nextOrgId: string) {
    setSelectedOrgId(nextOrgId);
    setErrorMsg(null);
    const orgVenues = effectiveAllVenues.filter(
      (v) => v.organizationId === nextOrgId,
    );
    if (role === "ALLY_VALIDATOR") {
      if (orgVenues.length === 0) {
        setRole("ALLY_ADMIN");
        setVenueScope("org-all");
      } else {
        setVenueScope(orgVenues[0]?.id || "");
      }
    } else {
      setVenueScope("org-all");
    }
  }

  function handleRoleChange(nextRole: string) {
    const casted = nextRole as UserRole;
    setRole(casted);
    setErrorMsg(null);
    if (casted === "ALLY_VALIDATOR") {
      setVenueScope((prev) =>
        prev &&
        prev !== "org-all" &&
        venuesForSelectedOrg.some((v) => v.id === prev)
          ? prev
          : user?.venueId &&
            venuesForSelectedOrg.some((v) => v.id === user.venueId)
          ? user.venueId
          : venuesForSelectedOrg[0]?.id || "",
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

  const organizationSelectOptions = useMemo(() => {
    if (isPlatformRole) {
      return [
        {
          value: "PLATFORM",
          label: isEn ? "YoReservo Team (Global)" : "Equipo YoReservo (Global)",
          icon: "👑",
        },
      ];
    }
    return allyOrganizations.map((org) => {
      const count = org.venuesCount ?? 0;
      const sedesLabel = isEn
        ? `${count} ${count === 1 ? "venue" : "venues"}`
        : `${count} ${count === 1 ? "sede" : "sedes"}`;
      return {
        value: org.id,
        label: `${org.tradeName} (${sedesLabel})`,
        icon: "🏢",
      };
    });
  }, [isPlatformRole, allyOrganizations, isEn]);

  const scopeOptions = useMemo(() => {
    if (isValidatorRole) {
      return venuesForSelectedOrg.map((v) => ({
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
  }, [isValidatorRole, isPlatformRole, venuesForSelectedOrg, t]);

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
      organizationId: isPlatformRole
        ? null
        : !isAllyCaller && selectedOrgId
        ? selectedOrgId
        : undefined,
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

          {!isAllyCaller && allyOrganizations.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                {isEn
                  ? "ASSIGNED ORGANIZATION *"
                  : "ORGANIZACIÓN ASIGNADA *"}
              </label>
              <SearchableSelect
                id="edit-user-organization"
                value={isPlatformRole ? "PLATFORM" : selectedOrgId}
                onChange={handleOrganizationChange}
                options={organizationSelectOptions}
                placeholder={
                  isEn
                    ? "Select an organization..."
                    : "Selecciona una organización..."
                }
                searchPlaceholder={
                  isEn
                    ? "Search organization..."
                    : "Buscar organización..."
                }
                emptyText={tFilters("noOptionsFound")}
                disabled={isPlatformRole}
              />
            </div>
          )}

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
