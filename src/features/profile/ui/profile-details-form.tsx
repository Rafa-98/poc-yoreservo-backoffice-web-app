"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Save, CheckCircle, Loader2 } from "lucide-react";
import type { UpdateProfileInput, UserProfileData } from "../model/types";

interface ProfileDetailsFormProps {
  profile: UserProfileData;
  onSubmit: (input: UpdateProfileInput) => Promise<void>;
  isSubmitting?: boolean;
}

function parseProfilePhone(rawPhone?: string | null): {
  countryCode: string;
  operator: string;
  phoneNum: string;
} {
  if (!rawPhone) {
    return { countryCode: "+58", operator: "0412", phoneNum: "" };
  }
  const compact = rawPhone.replace(/[\s-]/g, "");
  let rest = compact;
  let countryCode = "+58";

  const knownCountryCodes = ["+507", "+58", "+34", "+57", "+52", "+56", "+54", "+51", "+1"];
  for (const code of knownCountryCodes) {
    if (rest.startsWith(code)) {
      countryCode = code;
      rest = rest.slice(code.length);
      break;
    }
  }

  const knownOperators = ["0412", "0422", "0414", "0424", "0416", "0426", "0212"];
  for (const op of knownOperators) {
    if (rest.startsWith(op)) {
      return { countryCode, operator: op, phoneNum: rest.slice(op.length) };
    }
    const withoutZero = op.slice(1);
    if (rest.startsWith(withoutZero)) {
      return { countryCode, operator: op, phoneNum: rest.slice(withoutZero.length) };
    }
  }

  return { countryCode, operator: "OTRO", phoneNum: rest };
}

export function ProfileDetailsForm({
  profile,
  onSubmit,
  isSubmitting = false,
}: ProfileDetailsFormProps) {
  const t = useTranslations("profile");
  const parsedPhone = parseProfilePhone(profile.phone);

  const [name, setName] = useState(profile.name || "");
  const [lastName, setLastName] = useState(profile.lastName || "");
  const [docType, setDocType] = useState(profile.documentType || "V");
  const [docNum, setDocNum] = useState(profile.documentNumber || "");
  const [countryCode, setCountryCode] = useState(parsedPhone.countryCode);
  const [operator, setOperator] = useState(parsedPhone.operator);
  const [phoneNum, setPhoneNum] = useState(parsedPhone.phoneNum);
  const [prefLang, setPrefLang] = useState(profile.preferredLanguage || "es");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullPhone = `${countryCode}${operator === "OTRO" ? "" : operator}${phoneNum}`.trim();
    const cleanAvatar = profile.imageUrl?.trim() || undefined;

    await onSubmit({
      name,
      lastName,
      documentType: docType,
      documentNumber: docNum,
      phone: fullPhone,
      preferredLanguage: prefLang,
      imageUrl: cleanAvatar,
      avatarUrl: cleanAvatar,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Name & Last Name */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-foreground mb-1.5">
            {t("general.firstName")}
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface text-foreground text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-accent/40 shadow-2xs"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-foreground mb-1.5">
            {t("general.lastName")}
          </label>
          <input
            type="text"
            required
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface text-foreground text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-accent/40 shadow-2xs"
          />
        </div>
      </div>

      {/* National ID / Document */}
      <div>
        <label className="block text-xs font-bold text-foreground mb-1.5">
          {t("general.document")}
        </label>
        <div className="flex gap-2">
          <select
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
            className="w-28 shrink-0 px-3 py-2.5 rounded-xl border border-border bg-surface text-foreground text-xs sm:text-sm font-bold focus:outline-hidden focus:ring-2 focus:ring-accent/40 shadow-2xs"
          >
            <option value="V">{t("general.docV")}</option>
            <option value="E">{t("general.docE")}</option>
            <option value="J">{t("general.docJ")}</option>
            <option value="G">{t("general.docG")}</option>
            <option value="P">{t("general.docP")}</option>
            <option value="C">{t("general.docC")}</option>
          </select>
          <input
            type="text"
            required
            value={docNum}
            onChange={(e) => setDocNum(e.target.value)}
            className="flex-1 px-3.5 py-2.5 rounded-xl border border-border bg-surface text-foreground text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-accent/40 shadow-2xs"
            placeholder="19876543"
          />
        </div>
      </div>

      {/* WhatsApp Phone */}
      <div>
        <label className="block text-xs font-bold text-foreground mb-1.5">
          {t("general.phone")}
        </label>
        <div className="flex gap-2 flex-wrap sm:flex-nowrap">
          <select
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value)}
            className="w-36 shrink-0 px-3 py-2.5 rounded-xl border border-border bg-surface text-foreground text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-accent/40 shadow-2xs"
          >
            <option value="+58">🇻🇪 +58 (VEN)</option>
            <option value="+1">🇺🇸 +1 (USA/CAN)</option>
            <option value="+34">🇪🇸 +34 (ESP)</option>
            <option value="+57">🇨🇴 +57 (COL)</option>
            <option value="+507">🇵🇦 +507 (PAN)</option>
            <option value="+52">🇲🇽 +52 (MEX)</option>
            <option value="+56">🇨🇱 +56 (CHL)</option>
            <option value="+54">🇦🇷 +54 (ARG)</option>
            <option value="+51">🇵🇪 +51 (PER)</option>
          </select>

          <select
            value={operator}
            onChange={(e) => setOperator(e.target.value)}
            className="w-32 shrink-0 px-3 py-2.5 rounded-xl border border-border bg-surface text-foreground text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-accent/40 shadow-2xs"
          >
            <option value="0414">0414 (Movistar)</option>
            <option value="0412">0412 (Digitel)</option>
            <option value="0422">0422 (Digitel)</option>
            <option value="0424">0424 (Movistar)</option>
            <option value="0416">0416 (Movilnet)</option>
            <option value="0426">0426 (Movilnet)</option>
            <option value="0212">{t("general.opLandline")}</option>
            <option value="OTRO">{t("general.opOther")}</option>
          </select>

          <input
            type="tel"
            required
            value={phoneNum}
            onChange={(e) => setPhoneNum(e.target.value)}
            placeholder="1234567"
            className="flex-1 min-w-[120px] px-3.5 py-2.5 rounded-xl border border-border bg-surface text-foreground text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-accent/40 tracking-wider shadow-2xs"
          />
        </div>
      </div>

      {/* Email & Preferred Language */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-foreground">
              {t("general.email")}
            </label>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="size-3" />
              <span>{t("general.emailVerified")}</span>
            </span>
          </div>
          <input
            type="email"
            disabled
            value={profile.email}
            className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface-muted text-muted-foreground text-xs sm:text-sm cursor-not-allowed shadow-2xs"
          />
          <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
            {t("general.emailDisclaimer")}
          </p>
        </div>

        <div>
          <label className="block text-xs font-bold text-foreground mb-1.5">
            {t("general.prefLang")}
          </label>
          <select
            value={prefLang}
            onChange={(e) => setPrefLang(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface text-foreground text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-accent/40 shadow-2xs"
          >
            <option value="es">{t("general.langEs")}</option>
            <option value="en">{t("general.langEn")}</option>
          </select>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-accent-foreground font-bold text-xs sm:text-sm shadow-xs hover:brightness-105 active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
        >
          {isSubmitting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          <span>
            {isSubmitting ? t("general.saving") : t("general.saveChanges")}
          </span>
        </button>
      </div>
    </form>
  );
}
