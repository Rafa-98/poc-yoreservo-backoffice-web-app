"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/shared/ui/button";
import { SearchableSelect } from "./searchable-select";
import { inviteUserAction } from "../actions/users-actions";
import type { DocumentType, InviteUserInput, UserRole } from "../model/types";

interface InviteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  venues: Array<{ id: string; name: string; organizationId?: string }>;
  allVenues?: Array<{ id: string; name: string; organizationId?: string }>;
  organizations?: Array<{
    id: string;
    tradeName: string;
    rif?: string | null;
    isPlatformOrg?: boolean;
    venuesCount?: number;
  }>;
  defaultOrganizationId?: string;
  onSuccess: (result: any) => void;
  currentUserRole?: string;
}

function buildRandomTempPass(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  let pass = "Y0R#";
  for (let i = 0; i < 8; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  pass += "!2026";
  return pass;
}

const COUNTRY_OPTIONS = [
  { value: "+58", label: "+58 (Venezuela)", icon: "🇻🇪" },
  { value: "+1", label: "+1 (USA / Canadá)", icon: "🇺🇸" },
  { value: "+34", label: "+34 (España)", icon: "🇪🇸" },
  { value: "+57", label: "+57 (Colombia)", icon: "🇨🇴" },
  { value: "+507", label: "+507 (Panamá)", icon: "🇵🇦" },
  { value: "+56", label: "+56 (Chile)", icon: "🇨🇱" },
  { value: "+54", label: "+54 (Argentina)", icon: "🇦🇷" },
  { value: "+52", label: "+52 (México)", icon: "🇲🇽" },
];

const OPERATOR_OPTIONS = [
  { value: "0412", label: "0412 (Digitel)" },
  { value: "0422", label: "0422 (Digitel)" },
  { value: "0414", label: "0414 (Movistar)" },
  { value: "0424", label: "0424 (Movistar)" },
  { value: "0416", label: "0416 (Movilnet)" },
  { value: "0426", label: "0426 (Movilnet)" },
  { value: "OTRO", label: "Otra operadora" },
];

const DOC_TYPE_OPTIONS = [
  { value: "V", label: "V - Venezolano" },
  { value: "E", label: "E - Extranjero" },
  { value: "J", label: "J - Jurídico" },
  { value: "G", label: "G - Gubernamental" },
  { value: "P", label: "P - Pasaporte" },
];

export function InviteUserModal({
  isOpen,
  onClose,
  venues,
  allVenues,
  organizations = [],
  defaultOrganizationId,
  onSuccess,
  currentUserRole,
}: InviteUserModalProps) {
  const t = useTranslations("users.modalInvite");
  const tFilters = useTranslations("users.filters");
  const isEn = useLocale().toLowerCase().startsWith("en");

  const localizedOperatorOptions = useMemo(
    () =>
      OPERATOR_OPTIONS.map((op) =>
        op.value === "OTRO"
          ? { ...op, label: isEn ? "Other carrier" : "Otra operadora" }
          : op,
      ),
    [isEn],
  );
  const localizedDocTypeOptions = useMemo(
    () =>
      isEn
        ? [
            { value: "V", label: "V - Venezuelan" },
            { value: "E", label: "E - Foreigner" },
            { value: "J", label: "J - Corporate" },
            { value: "G", label: "G - Government" },
            { value: "P", label: "P - Passport" },
          ]
        : DOC_TYPE_OPTIONS,
    [isEn],
  );

  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [countryCode, setCountryCode] = useState("+58");
  const [operator, setOperator] = useState("0412");
  const [phoneNum, setPhoneNum] = useState("");
  const [docType, setDocType] = useState<DocumentType>("V");
  const [docNum, setDocNum] = useState("");
  const [role, setRole] = useState<UserRole>("ALLY_VALIDATOR");
  const [venueScope, setVenueScope] = useState<string>(() => venues[0]?.id || "");
  const [deliveryMethod, setDeliveryMethod] = useState<"magic_link" | "temp_pass">("magic_link");
  const [tempPass, setTempPass] = useState(() => buildRandomTempPass());
  const [copied, setCopied] = useState(false);
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

  const [selectedOrgId, setSelectedOrgId] = useState<string>(
    () => defaultOrganizationId || allyOrganizations[0]?.id || "",
  );

  const effectiveAllVenues = allVenues && allVenues.length > 0 ? allVenues : venues;

  const venuesForSelectedOrg = useMemo(() => {
    if (isAllyCaller || !selectedOrgId) {
      return venues;
    }
    return effectiveAllVenues.filter((v) => v.organizationId === selectedOrgId);
  }, [isAllyCaller, selectedOrgId, venues, effectiveAllVenues]);

  useEffect(() => {
    if (isOpen) {
      setTempPass(buildRandomTempPass());
      setCopied(false);
      setErrorMsg(null);

      const initialOrgId =
        defaultOrganizationId ||
        selectedOrgId ||
        allyOrganizations[0]?.id ||
        "";
      if (!isAllyCaller && initialOrgId) {
        setSelectedOrgId(initialOrgId);
      }

      const orgVenues =
        !isAllyCaller && initialOrgId
          ? effectiveAllVenues.filter((v) => v.organizationId === initialOrgId)
          : venues;

      if (role === "ALLY_VALIDATOR") {
        if (orgVenues.length === 0 && !isAllyCaller) {
          setRole("ALLY_ADMIN");
          setVenueScope("org-all");
        } else {
          setVenueScope((prev) =>
            prev && prev !== "org-all" && orgVenues.some((v) => v.id === prev)
              ? prev
              : orgVenues[0]?.id || "",
          );
        }
      } else {
        setVenueScope("org-all");
      }
    }
  }, [isOpen, defaultOrganizationId, allyOrganizations]);

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
      // Validator MUST be assigned to a specific venue
      setVenueScope(venuesForSelectedOrg[0]?.id || "");
    } else {
      // ALLY_ADMIN, ALLY_ACCOUNTING, PLATFORM_* operate across all venues / globally
      setVenueScope("org-all");
    }
  }

  const organizationSelectOptions = useMemo(() => {
    const isPlat =
      role === "PLATFORM_ADMIN" || role === "PLATFORM_ACCOUNTING";
    if (isPlat) {
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
  }, [role, allyOrganizations, isEn]);

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

  if (!isOpen) return null;

  function generatePass() {
    setTempPass(buildRandomTempPass());
    setCopied(false);
  }

  function handleCopy() {
    navigator.clipboard.writeText(tempPass);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (!isAllyCaller && !isPlatformRole && !selectedOrgId) {
      setErrorMsg(
        isEn
          ? "Please select the organization for this user."
          : "Debes seleccionar la organización a la que pertenecerá el usuario.",
      );
      return;
    }

    if (role === "ALLY_VALIDATOR" && (!venueScope || venueScope === "org-all")) {
      setErrorMsg(t("errorVenueRequired"));
      return;
    }

    setLoading(true);

    const cleanOperator = operator === "OTRO" ? "" : operator;
    const fullPhone = [countryCode, cleanOperator, phoneNum.trim()]
      .filter(Boolean)
      .join(" ");

    const input: InviteUserInput = {
      name,
      lastName,
      email,
      phone: fullPhone,
      documentType: docType,
      documentNumber: docNum,
      role,
      organizationId: isPlatformRole
        ? null
        : !isAllyCaller
        ? selectedOrgId
        : undefined,
      managedVenueId: role === "ALLY_VALIDATOR" ? venueScope : null,
      deliveryMethod,
      tempPassword: deliveryMethod === "temp_pass" ? tempPass : undefined,
    };

    const res = await inviteUserAction(input);
    setLoading(false);

    if (res.ok) {
      onSuccess(res.data);
      onClose();
    } else {
      setErrorMsg(res.error.code || t("errorInvite"));
    }
  }

  return (
    <div
      className="modal-backdrop"
      id="invite-modal-backdrop"
      onClick={onClose}
    >
      <div
        className="modal-card overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: "580px",
          width: "100%",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-xl">
              ✉️
            </span>
            <div className="min-w-0">
              <h3 className="font-display text-lg font-bold text-foreground truncate">
                {t("title")}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                {t("desc")}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Form Body (Strict overflow-x-hidden to eliminate horizontal scroll) */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-5 space-y-4"
        >
          {errorMsg && (
            <div className="rounded-xl border border-destructive/30 bg-destructive-subtle p-3 text-xs font-medium text-destructive">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* First & Last Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="min-w-0">
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                {t("firstName")}
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("firstNamePlaceholder")}
                className="form-input"
                id="inv-first-name"
              />
            </div>
            <div className="min-w-0">
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                {t("lastName")}
              </label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder={t("lastNamePlaceholder")}
                className="form-input"
                id="inv-last-name"
              />
            </div>
          </div>

          {/* Corporate Email */}
          <div className="min-w-0">
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              {t("email")}
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="carlos.mendoza@complejoavila.com"
              className="form-input"
              id="inv-email"
            />
          </div>

          {/* Phone: Separated into Country Code, Provider/Operator, and 7-digit Number */}
          <div className="min-w-0">
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              {t("phone")}
            </label>
            <div className="grid grid-cols-12 gap-2">
              <div className="col-span-4 min-w-0">
                <span className="block text-[10px] font-semibold text-muted-foreground mb-1">
                  {t("phoneCountryLabel")}
                </span>
                <SearchableSelect
                  id="inv-phone-country"
                  value={countryCode}
                  onChange={setCountryCode}
                  options={COUNTRY_OPTIONS}
                  searchPlaceholder={tFilters("searchOptionPlaceholder")}
                  emptyText={tFilters("noOptionsFound")}
                />
              </div>
              <div className="col-span-4 min-w-0">
                <span className="block text-[10px] font-semibold text-muted-foreground mb-1">
                  {t("phoneOperatorLabel")}
                </span>
                <SearchableSelect
                  id="inv-phone-operator"
                  value={operator}
                  onChange={setOperator}
                  options={localizedOperatorOptions}
                  searchPlaceholder={tFilters("searchOptionPlaceholder")}
                  emptyText={tFilters("noOptionsFound")}
                />
              </div>
              <div className="col-span-4 min-w-0">
                <span className="block text-[10px] font-semibold text-muted-foreground mb-1">
                  # {t("phoneNumberPlaceholder")}
                </span>
                <input
                  type="tel"
                  required
                  value={phoneNum}
                  onChange={(e) =>
                    setPhoneNum(e.target.value.replace(/[^\d]/g, "").slice(0, 10))
                  }
                  placeholder={t("phoneNumberPlaceholder")}
                  maxLength={10}
                  className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  id="inv-phone-num"
                />
              </div>
            </div>
          </div>

          {/* DNI / Document */}
          <div className="min-w-0">
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              {t("dni")}
            </label>
            <div className="grid grid-cols-12 gap-2">
              <div className="col-span-4 min-w-0">
                <SearchableSelect
                  id="inv-doc-type"
                  value={docType}
                  onChange={(val) => setDocType(val as DocumentType)}
                  options={localizedDocTypeOptions}
                  searchPlaceholder={tFilters("searchOptionPlaceholder")}
                  emptyText={tFilters("noOptionsFound")}
                />
              </div>
              <div className="col-span-8 min-w-0">
                <input
                  type="text"
                  required
                  value={docNum}
                  onChange={(e) =>
                    setDocNum(e.target.value.replace(/[^\dA-Za-z-]/g, ""))
                  }
                  placeholder="19876543"
                  className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  id="inv-doc-num"
                />
              </div>
            </div>
          </div>

          {/* Organization Selector (Platform Admin) */}
          {!isAllyCaller && allyOrganizations.length > 0 && (
            <div className="min-w-0">
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                {isEn
                  ? "ASSIGNED ORGANIZATION *"
                  : "ORGANIZACIÓN ASIGNADA *"}
              </label>
              <SearchableSelect
                id="inv-organization"
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

          {/* Role & Authorization Scope (Dependent on Role) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="min-w-0">
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                {t("role")}
              </label>
              <SearchableSelect
                id="inv-role"
                value={role}
                onChange={handleRoleChange}
                options={roleOptions}
                searchPlaceholder={tFilters("searchOptionPlaceholder")}
                emptyText={tFilters("noOptionsFound")}
              />
            </div>

            <div className="min-w-0">
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                {t("venueScope")}
              </label>
              <SearchableSelect
                id="inv-venue"
                value={isValidatorRole ? venueScope : "org-all"}
                onChange={setVenueScope}
                options={scopeOptions}
                placeholder={t("selectVenuePlaceholder")}
                searchPlaceholder={tFilters("searchOptionPlaceholder")}
                emptyText={tFilters("noOptionsFound")}
                disabled={!isValidatorRole}
              />
            </div>
          </div>

          {/* Contextual Hint Explaining Role -> Scope Rule */}
          <div
            className={`rounded-xl border px-3.5 py-2.5 text-[11px] flex items-center gap-2 ${
              isValidatorRole
                ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-400"
                : "border-blue-500/25 bg-blue-500/10 text-blue-400"
            }`}
          >
            <span>{isValidatorRole ? "📍" : "🏢"}</span>
            <span>
              {isValidatorRole
                ? t("scopeHintValidator")
                : isPlatformRole
                  ? t("scopeHintPlatform")
                  : t("scopeHintOrgWide")}
            </span>
          </div>

          {/* Credential Delivery Method (Friendly wording without "Magic Link" jargon) */}
          <div className="rounded-xl border border-border bg-muted/50 p-4 space-y-3">
            <div className="text-xs font-bold text-foreground">
              {t("credMethod")}
            </div>

            <div className="space-y-2.5">
              <label className="flex items-start gap-2.5 text-xs font-semibold text-foreground cursor-pointer rounded-lg border border-border/70 bg-surface p-3 hover:border-accent/40 transition-colors">
                <input
                  type="radio"
                  name="cred_method"
                  value="magic_link"
                  checked={deliveryMethod === "magic_link"}
                  onChange={() => setDeliveryMethod("magic_link")}
                  className="accent-accent mt-0.5"
                />
                <div className="min-w-0">
                  <div>{t("magicLink")}</div>
                  <p className="text-[11px] font-normal text-muted-foreground mt-0.5">
                    {t("magicLinkHint")}
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-2.5 text-xs font-semibold text-foreground cursor-pointer rounded-lg border border-border/70 bg-surface p-3 hover:border-accent/40 transition-colors">
                <input
                  type="radio"
                  name="cred_method"
                  value="temp_pass"
                  checked={deliveryMethod === "temp_pass"}
                  onChange={() => setDeliveryMethod("temp_pass")}
                  className="accent-accent mt-0.5"
                />
                <div className="min-w-0">
                  <div>{t("tempPass")}</div>
                </div>
              </label>
            </div>

            {deliveryMethod === "temp_pass" && (
              <div className="pt-1 space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tempPass}
                    readOnly
                    className="h-10 flex-1 min-w-0 rounded-xl border border-border bg-surface px-3 font-mono text-xs text-foreground"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={generatePass}
                    className="h-10 text-xs px-3 shrink-0"
                  >
                    {t("btnGenerate")}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleCopy}
                    className="h-10 text-xs px-3 shrink-0"
                  >
                    {copied ? t("copied") : t("btnCopy")}
                  </Button>
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {t("policyDesc")}
                </div>
              </div>
            )}
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-end gap-3 pt-3 border-t border-border">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onClose}
              disabled={loading}
              id="btn-cancel-invite"
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={loading}
              id="btn-submit-invite"
            >
              {t("submit")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
