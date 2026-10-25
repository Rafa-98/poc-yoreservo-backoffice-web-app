"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import {
  ShieldCheck,
  CreditCard,
  MessageSquare,
  TrendingUp,
  Building2,
  MapPin,
  Edit3,
  ExternalLink,
} from "lucide-react";
import { ROUTES } from "@/shared/config";
import { DEFAULT_BCV_EUR_RATE, DEFAULT_BCV_USD_RATE } from "@/shared/lib";
import { useActiveVenue } from "@/features/venues/context/venue-context";
import type {
  OrganizationData,
  PaymentMethodConfigItem,
  PlatformConfigData,
  VenueItem,
} from "@/features/venues/model/types";
import { PaymentMethodsConfigCard } from "@/features/venues/ui/payment-methods-config-card";
import { PlatformSupportConfigCard } from "@/features/venues/ui/platform-support-config-card";
import { OrgEditModal } from "@/features/venues/ui/org-edit-modal";

export interface PlatformSettingsPageProps {
  initialPlatformOrg?: OrganizationData;
  initialPlatformVenues?: VenueItem[];
  initialPaymentMethods?: PaymentMethodConfigItem[];
  initialPlatformConfig?: PlatformConfigData;
  bcvRate?: number;
  bcvEurRate?: number;
  userRole?: string;
}

export function PlatformSettingsPage({
  initialPlatformOrg,
  initialPlatformVenues = [],
  initialPaymentMethods = [],
  initialPlatformConfig,
  bcvRate = DEFAULT_BCV_USD_RATE,
  bcvEurRate = DEFAULT_BCV_EUR_RATE,
  userRole,
}: PlatformSettingsPageProps) {
  const locale = useLocale();
  const isEn = locale.toLowerCase().startsWith("en");
  const { setActiveOrganizationId, setActiveVenueId } = useActiveVenue();
  const [platformOrg, setPlatformOrg] = useState<OrganizationData | undefined>(
    initialPlatformOrg,
  );
  const [platformVenues] = useState<VenueItem[]>(initialPlatformVenues);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodConfigItem[]>(
    initialPaymentMethods,
  );
  const [platformConfig, setPlatformConfig] = useState<PlatformConfigData | undefined>(
    initialPlatformConfig,
  );
  const [isEditOrgModalOpen, setIsEditOrgModalOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; isError: boolean } | null>(
    null,
  );

  function showToast(message: string, isError = false) {
    setToast({ message, isError });
    setTimeout(() => setToast(null), 4000);
  }

  const activeMethodsCount = paymentMethods.filter((m) => m.isEnabled).length;
  const totalOwnSpaces = platformVenues.reduce(
    (acc, v) => acc + (v.spacesCount || 0),
    0,
  );

  return (
    <div className="platform-settings-page pb-10">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5 pb-2.5">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/15 px-3 py-0.5 text-[11px] font-extrabold tracking-wider text-foreground uppercase">
            <ShieldCheck className="size-3.5" />
            <span>
              {isEn
                ? "⚡ YoReservo Official • Super Organization & Custody"
                : "⚡ YoReservo Oficial • Super Organización & Custodia"}
            </span>
          </div>
          <h1 className="mt-1.5 text-[22px] sm:text-2xl font-extrabold text-foreground">
            {isEn
              ? "YoReservo (Platform, Own Venues & Custody)"
              : "YoReservo (Plataforma, Sedes Propias & Custodia)"}
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground">
            {isEn
              ? "Manage YoReservo Official's corporate profile, its own sports complexes (100% direct revenue with 0% third-party commission), Custody collection accounts, and official athlete support channels."
              : "Administra la ficha corporativa de YoReservo Oficial, sus complejos deportivos propios (100% ingreso directo sin comisión a terceros), las cuentas recaudadoras en Custodia y los canales oficiales de atención al atleta."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href={ROUTES.organization}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border-medium bg-surface px-3.5 text-xs font-bold text-foreground shadow-2xs hover:bg-muted transition-all"
          >
            <span>🏢</span>
            <span>
              {isEn
                ? `Ally Directory (${platformOrg?.organizations?.length ?? 9})`
                : `Directorio de Aliados (${platformOrg?.organizations?.length ?? 9})`}
            </span>
          </Link>

          <Link
            href={ROUTES.exchangeRate}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border-medium bg-surface px-3.5 text-xs font-bold text-foreground shadow-2xs hover:bg-muted transition-all"
          >
            <span>💱</span>
            <span>{isEn ? "Official BCV Rate" : "Tasa Oficial BCV"}</span>
          </Link>
        </div>
      </div>

      {/* Toast Feedback Banner */}
      {toast && (
        <div className="mt-2 px-5">
          <div
            className={`flex items-center justify-between rounded-xl border px-4 py-3 text-[13.5px] font-semibold ${
              toast.isError
                ? "border-status-cancelled-border bg-status-cancelled-bg text-status-cancelled-fg"
                : "border-status-available-border bg-status-available-bg text-status-available-fg"
            }`}
          >
            <span>{toast.message}</span>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="cursor-pointer border-none bg-transparent font-bold text-current"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* 1. YoReservo Super Organization Corporate Profile + Own First-Party Venues */}
      {platformOrg && (
        <section className="px-5 pt-4">
          <div className="rounded-2xl border-2 border-accent/40 bg-surface p-5 shadow-card">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-md bg-accent/25 border border-accent/50 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-foreground">
                    {isEn
                      ? "⚡ OFFICIAL SUPER ORGANIZATION"
                      : "⚡ SUPER ORGANIZACIÓN OFICIAL"}
                  </span>
                  <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs font-bold text-muted-foreground">
                    {platformOrg.rif}
                  </span>
                  <span className="badge badge-available text-[10px]">
                    {isEn ? "ACTIVE • 0% COMMISSION" : "ACTIVA • 0% COMISIÓN"}
                  </span>
                </div>
                <h2 className="mt-1.5 text-lg sm:text-xl font-extrabold text-foreground">
                  {platformOrg.tradeName}{" "}
                  <span className="text-sm font-medium text-muted-foreground">
                    ({platformOrg.legalName})
                  </span>
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  📍 {platformOrg.fiscalAddress || "Caracas, Distrito Capital"} • ✉️{" "}
                  {platformConfig?.supportEmails && platformConfig.supportEmails.length > 0
                    ? platformConfig.supportEmails.join(" / ")
                    : platformOrg.contactEmail}{" "}
                  • 📞{" "}
                  {platformConfig?.supportPhones && platformConfig.supportPhones.length > 0
                    ? platformConfig.supportPhones.join(" / ")
                    : platformOrg.contactPhone}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditOrgModalOpen(true)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border-medium bg-background px-3.5 text-xs font-bold text-foreground shadow-2xs hover:bg-muted transition-all cursor-pointer"
                >
                  <Edit3 className="size-3.5" />
                  <span>
                    {isEn
                      ? "Edit YoReservo Corporate Profile"
                      : "Editar Ficha Corporativa YoReservo"}
                  </span>
                </button>

                <Link
                  href={ROUTES.agenda}
                  onClick={() => {
                    setActiveOrganizationId(platformOrg.id);
                    setActiveVenueId("ALL");
                  }}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-accent px-3.5 text-xs font-extrabold text-accent-foreground shadow-2xs hover:opacity-95 transition-all"
                >
                  <span>📅</span>
                  <span>
                    {isEn
                      ? "View Own Venues Agenda"
                      : "Ver Agenda de Sedes Propias"}
                  </span>
                  <ExternalLink className="size-3.5" />
                </Link>
              </div>
            </div>

            {/* First-party Venues Grid */}
            <div className="mt-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-extrabold text-foreground">
                    🏟️{" "}
                    {isEn
                      ? `YoReservo's Own Sports Complexes (${platformVenues.length})`
                      : `Complejos Deportivos Propios de YoReservo (${platformVenues.length})`}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {isEn
                      ? "These venues belong directly to YoReservo Official. Their revenue does not generate third-party settlement batches."
                      : "Estas sedes pertenecen directamente a YoReservo Oficial. Sus ingresos no generan lotes de liquidación a terceros."}
                  </p>
                </div>

                <Link
                  href={ROUTES.venues}
                  onClick={() => {
                    setActiveOrganizationId(platformOrg.id);
                    setActiveVenueId("ALL");
                  }}
                  className="text-xs font-bold text-link hover:underline"
                >
                  {isEn
                    ? "Manage Own Venues in /venues →"
                    : "Gestionar Sedes Propias en /venues →"}
                </Link>
              </div>

              {platformVenues.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                  {isEn
                    ? "No own venues registered under YoReservo Official yet."
                    : "Aún no hay sedes propias registradas bajo YoReservo Oficial."}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {platformVenues.map((venue) => {
                    const isActive = venue.status === "ACTIVE";
                    return (
                      <div
                        key={venue.id}
                        className="flex flex-col justify-between rounded-xl border border-border bg-muted/35 p-3.5"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div className="text-sm font-extrabold text-foreground">
                              ⚡ {venue.name}
                            </div>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                isActive
                                  ? "bg-status-available-bg text-status-available-fg border border-status-available-border"
                                  : "bg-amber-500/15 text-amber-500 border border-amber-500/30"
                              }`}
                            >
                              {isActive
                                ? isEn
                                  ? "Active in App"
                                  : "Activa en App"
                                : isEn
                                  ? "In Review"
                                  : "En Revisión"}
                            </span>
                          </div>
                          <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="size-3 shrink-0" />
                            <span className="truncate">{venue.address}</span>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center justify-between border-t border-border/70 pt-2.5 text-xs text-muted-foreground">
                          <span>
                            ⚽{" "}
                            <strong className="text-foreground">
                              {venue.spacesCount}
                            </strong>{" "}
                            {venue.spacesCount === 1
                              ? isEn
                                ? "court"
                                : "cancha"
                              : isEn
                                ? "courts"
                                : "canchas"}
                          </span>
                          <div className="flex items-center gap-3">
                            <Link
                              href={`${ROUTES.spaces}?venueId=${venue.id}`}
                              onClick={() => {
                                setActiveOrganizationId(platformOrg.id);
                                setActiveVenueId(venue.id);
                              }}
                              className="font-bold text-link hover:underline"
                            >
                              {isEn ? "Courts →" : "Canchas →"}
                            </Link>
                            <Link
                              href={`${ROUTES.schedules}?venueId=${venue.id}`}
                              onClick={() => {
                                setActiveOrganizationId(platformOrg.id);
                                setActiveVenueId(venue.id);
                              }}
                              className="font-bold text-link hover:underline"
                            >
                              {isEn ? "Schedules →" : "Horarios →"}
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* 2. YoReservo Platform Custody Accepted Payment Methods */}
      <PaymentMethodsConfigCard
        scope="PLATFORM"
        initialMethods={paymentMethods}
        userRole={userRole}
        onSaved={(updatedMethods) => setPaymentMethods(updatedMethods)}
        onToast={showToast}
      />

      {/* 3. YoReservo Official Support Channels (WhatsApp & Email) */}
      <PlatformSupportConfigCard
        initialConfig={platformConfig}
        onSaved={(updatedConfig) => setPlatformConfig(updatedConfig)}
        onToast={(msg, variant) => showToast(msg, variant === "warning")}
      />

      {/* Edit Modal for YoReservo Oficial Corporate Data */}
      {platformOrg && (
        <OrgEditModal
          isOpen={isEditOrgModalOpen}
          onClose={() => setIsEditOrgModalOpen(false)}
          organization={platformOrg}
          onSuccess={(updated) => {
            setPlatformOrg((prev) =>
              prev ? { ...prev, ...updated } : updated,
            );
            showToast(
              isEn
                ? "YoReservo Official corporate profile updated successfully."
                : "Ficha corporativa de YoReservo Oficial actualizada correctamente.",
              false,
            );
          }}
          userRole={userRole}
        />
      )}
    </div>
  );
}

