"use client";

import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/shared/ui/button";
import { inviteUserAction } from "../actions/users-actions";
import type { DocumentType, InviteUserInput, UserRole } from "../model/types";

interface InviteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  venues: Array<{ id: string; name: string }>;
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

export function InviteUserModal({
  isOpen,
  onClose,
  venues,
  onSuccess,
  currentUserRole,
}: InviteUserModalProps) {
  const t = useTranslations("users.modalInvite");

  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [countryCode, setCountryCode] = useState("+58");
  const [operator, setOperator] = useState("0412");
  const [phoneNum, setPhoneNum] = useState("");
  const [docType, setDocType] = useState<DocumentType>("V");
  const [docNum, setDocNum] = useState("");
  const [role, setRole] = useState<UserRole>("ALLY_VALIDATOR");
  const [venueScope, setVenueScope] = useState<string>("org-all");
  const [deliveryMethod, setDeliveryMethod] = useState<"magic_link" | "temp_pass">("magic_link");
  const [tempPass, setTempPass] = useState(() => buildRandomTempPass());
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTempPass(buildRandomTempPass());
      setCopied(false);
    }
  }, [isOpen]);

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
    setLoading(true);
    setErrorMsg(null);

    const fullPhone = `${countryCode} ${operator} ${phoneNum}`.trim();
    const input: InviteUserInput = {
      name,
      lastName,
      email,
      phone: fullPhone,
      documentType: docType,
      documentNumber: docNum,
      role,
      managedVenueId: venueScope === "org-all" ? null : venueScope,
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
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "560px", maxHeight: "90vh", display: "flex", flexDirection: "column" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✉️</span>
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {errorMsg && (
            <div className="rounded-xl border border-destructive/30 bg-destructive-subtle p-3 text-xs text-destructive">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* First & Last Name */}
          <div className="grid grid-cols-2 gap-3">
            <div>
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
            <div>
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
          <div>
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

          {/* Phone */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              {t("phone")}
            </label>
            <div className="flex gap-2">
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="form-select w-32 shrink-0 text-xs"
              >
                <option value="+58">🇻🇪 +58 (VEN)</option>
                <option value="+1">🇺🇸 +1 (USA)</option>
                <option value="+34">🇪🇸 +34 (ESP)</option>
                <option value="+57">🇨🇴 +57 (COL)</option>
                <option value="+507">🇵🇦 +507 (PAN)</option>
              </select>
              <select
                value={operator}
                onChange={(e) => setOperator(e.target.value)}
                className="form-select w-28 shrink-0 text-xs"
              >
                <option value="0412">0412 (Digitel)</option>
                <option value="0422">0422 (Digitel)</option>
                <option value="0414">0414 (Movistar)</option>
                <option value="0424">0424 (Movistar)</option>
                <option value="0416">0416 (Movilnet)</option>
                <option value="0426">0426 (Movilnet)</option>
              </select>
              <input
                type="tel"
                required
                value={phoneNum}
                onChange={(e) => setPhoneNum(e.target.value)}
                placeholder="9876543"
                maxLength={8}
                className="form-input flex-1"
                id="inv-phone-num"
              />
            </div>
          </div>

          {/* DNI */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              {t("dni")}
            </label>
            <div className="flex gap-2">
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value as DocumentType)}
                className="form-select w-28 shrink-0 font-bold text-xs"
              >
                <option value="V">V - Ven</option>
                <option value="E">E - Ext</option>
                <option value="J">J - Jur</option>
                <option value="G">G - Gub</option>
                <option value="P">P - Pas</option>
              </select>
              <input
                type="text"
                required
                value={docNum}
                onChange={(e) => setDocNum(e.target.value)}
                placeholder="19876543"
                className="form-input flex-1"
                id="inv-doc-num"
              />
            </div>
          </div>

          {/* Role & Scope */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                {t("role")}
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="form-select"
                id="inv-role"
              >
                <option value="ALLY_ADMIN">🏢 {t("roleAlly")}</option>
                <option value="ALLY_ACCOUNTING">📊 {t("roleAllyAccounting")}</option>
                <option value="ALLY_VALIDATOR">🎟️ {t("roleValidator")}</option>
                {currentUserRole !== "ALLY_ADMIN" && (
                  <>
                    <option value="PLATFORM_ACCOUNTING">💳 {t("roleAccounting")}</option>
                    <option value="PLATFORM_ADMIN">👑 {t("roleAdmin")}</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                {t("venueScope")}
              </label>
              <select
                value={venueScope}
                onChange={(e) => setVenueScope(e.target.value)}
                className="form-select"
                id="inv-venue"
              >
                <option value="org-all">{t("orgWide")}</option>
                {venues.map((v) => (
                  <option key={v.id} value={v.id}>
                    📍 {v.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Credential Delivery Method */}
          <div className="rounded-xl border border-border bg-muted/60 p-4 space-y-3">
            <div className="text-xs font-bold text-foreground">
              {t("credMethod")}
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2.5 text-xs font-semibold text-foreground cursor-pointer">
                <input
                  type="radio"
                  name="cred_method"
                  value="magic_link"
                  checked={deliveryMethod === "magic_link"}
                  onChange={() => setDeliveryMethod("magic_link")}
                  className="accent-accent"
                />
                <span>{t("magicLink")}</span>
              </label>

              <label className="flex items-center gap-2.5 text-xs font-semibold text-foreground cursor-pointer">
                <input
                  type="radio"
                  name="cred_method"
                  value="temp_pass"
                  checked={deliveryMethod === "temp_pass"}
                  onChange={() => setDeliveryMethod("temp_pass")}
                  className="accent-accent"
                />
                <span>{t("tempPass")}</span>
              </label>
            </div>

            {deliveryMethod === "temp_pass" && (
              <div className="pt-2 space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tempPass}
                    readOnly
                    className="form-input flex-1 font-mono text-xs bg-surface"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={generatePass}
                    className="h-10 text-xs px-3"
                  >
                    {t("btnGenerate")}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleCopy}
                    className="h-10 text-xs px-3"
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
