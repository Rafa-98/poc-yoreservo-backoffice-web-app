"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ROUTES } from "@/shared/config";
import { DEFAULT_BCV_EUR_RATE, DEFAULT_BCV_USD_RATE } from "@/shared/lib";
import { useActiveVenue } from "@/features/venues/context/venue-context";
import type {
  OrganizationData,
  PaymentCollectionMode,
  VenueItem,
} from "@/features/venues/model/types";
import {
  getOrganizationAction,
  updateOrganizationAction,
  updateOrganizationStatusAction,
} from "@/features/venues/actions/venues-actions";
import { OrgMasterCard } from "@/features/venues/ui/org-master-card";
import { OrgEditModal } from "@/features/venues/ui/org-edit-modal";
import { CreateOrganizationModal } from "@/features/venues/ui/org-create-modal";
import { OrganizationAdvancedSelector } from "@/features/venues/ui/organization-advanced-selector";
import { PaymentMethodsConfigCard } from "@/features/venues/ui/payment-methods-config-card";
import { Spinner } from "@/shared/ui";

interface OrganizationPageProps {
  initialOrg: OrganizationData;
  initialVenues: VenueItem[];
  bcvRate?: number;
  bcvEurRate?: number;
  userRole?: string;
}

export function OrganizationPage({
  initialOrg,
  initialVenues,
  bcvRate = DEFAULT_BCV_USD_RATE,
  bcvEurRate = DEFAULT_BCV_EUR_RATE,
  userRole,
}: OrganizationPageProps) {
  const locale = useLocale();
  const isEn = locale.toLowerCase().startsWith("en");
  const t = useTranslations("venues.top");
  const tOrg = useTranslations("venues.org");
  const tVenues = useTranslations("venues.venues");
  const { setActiveOrganizationId } = useActiveVenue();

  const [org, setOrg] = useState<OrganizationData>(initialOrg);
  const [venues] = useState<VenueItem[]>(initialVenues);
  const [toast, setToast] = useState<{ message: string; isError: boolean } | null>(null);
  const [isOrgModalOpen, setIsOrgModalOpen] = useState(false);
  const [isCreateOrgModalOpen, setIsCreateOrgModalOpen] = useState(false);
  const [pendingOrgActionId, setPendingOrgActionId] = useState<string | null>(null);

  const isPlatformAdmin = userRole === "PLATFORM_ADMIN";
  const canManageFacilities =
    userRole === "PLATFORM_ADMIN" || userRole === "ALLY_ADMIN";
  const organizations = (org.organizations ?? initialOrg.organizations ?? []).filter(
    (o) => !o.isPlatformOrg,
  );
  const allyVenues = venues.filter((v) => !v.isPlatformOrg);
  const displayedVenues = org.id
    ? allyVenues.filter((v) => !v.organizationId || v.organizationId === org.id)
    : allyVenues;

  function showToast(message: string, isError = false) {
    setToast({ message, isError });
    setTimeout(() => setToast(null), 4000);
  }

  async function handleSelectOrganization(orgId: string) {
    if (!orgId || orgId === org.id) return;
    setActiveOrganizationId(orgId);
    setPendingOrgActionId(`select:${orgId}`);
    try {
      const res = await getOrganizationAction(orgId);
      if (res.ok && res.data) {
        setOrg((prev) => ({
          ...res.data,
          organizations: res.data.organizations ?? prev.organizations,
          platformConfig: res.data.platformConfig ?? prev.platformConfig,
          platformPaymentMethodConfigs:
            res.data.platformPaymentMethodConfigs ??
            prev.platformPaymentMethodConfigs,
        }));
      } else if (!res.ok) {
        showToast(res.error.code || tOrg("errorUpdate"), true);
      }
    } finally {
      setPendingOrgActionId(null);
    }
  }

  function handleOrgSaved(updated: OrganizationData) {
    setOrg((prev) => {
      const nextOrgs =
        updated.organizations ??
        (prev.organizations || []).map((item) =>
          item.id === updated.id
            ? {
                ...item,
                tradeName: updated.tradeName || item.tradeName,
                legalName: updated.legalName || item.legalName,
                rif: updated.rif || item.rif,
                fiscalAddress: updated.fiscalAddress || item.fiscalAddress,
                paymentCollectionMode:
                  updated.paymentCollectionMode || item.paymentCollectionMode,
                commissionRate:
                  updated.commissionRate !== undefined
                    ? updated.commissionRate
                    : item.commissionRate,
                referenceCurrencyCode:
                  updated.referenceCurrencyCode || item.referenceCurrencyCode,
                contactEmail: updated.contactEmail || item.contactEmail,
                contactPhone: updated.contactPhone || item.contactPhone,
              }
            : item,
        );
      return {
        ...updated,
        organizations: nextOrgs,
        venuesCount:
          updated.venuesCount || prev.venuesCount || displayedVenues.length,
        spacesCount: updated.spacesCount || prev.spacesCount,
      };
    });
    showToast(t("toastOrgSaved"), false);
  }

  function handleOrgCreated(created: OrganizationData) {
    setOrg((prev) => {
      const prevOrgs = prev.organizations ?? [];
      const nextOrgs =
        created.organizations && created.organizations.length > 0
          ? created.organizations
          : [
              ...prevOrgs.filter((o) => o.id !== created.id),
              {
                id: created.id,
                tradeName: created.tradeName,
                legalName: created.legalName,
                rif: created.rif,
                status: created.status || "ACTIVE",
                isBookingPaused: Boolean(created.isBookingPaused),
                paymentCollectionMode: created.paymentCollectionMode,
                commissionRate: created.commissionRate,
                referenceCurrencyCode: created.referenceCurrencyCode,
                contactEmail: created.contactEmail,
                contactPhone: created.contactPhone,
                venuesCount: created.venuesCount ?? 0,
              },
            ];
      return {
        ...created,
        organizations: nextOrgs,
      };
    });
    showToast(
      isEn
        ? `✓ Organization "${created.tradeName}" created successfully`
        : `✓ Organización "${created.tradeName}" creada exitosamente`,
      false,
    );
  }

  async function handleUpdateOrgStatus(
    targetOrgId: string,
    payload: { status?: "ACTIVE" | "INACTIVE" | "SUSPENDED"; isBookingPaused?: boolean }
  ) {
    const actionKey =
      payload.status !== undefined
        ? `status:${targetOrgId}`
        : `pause:${targetOrgId}`;
    setPendingOrgActionId(actionKey);
    try {
      const res = await updateOrganizationStatusAction(targetOrgId, payload);
      if (res.ok && res.data) {
        const updated = res.data;
        setOrg((prev) => {
          const nextOrgs =
            updated.organizations ??
            (prev.organizations || []).map((item) =>
              item.id === targetOrgId
                ? {
                    ...item,
                    status: payload.status ?? updated.status ?? item.status,
                    isBookingPaused:
                      payload.isBookingPaused !== undefined
                        ? payload.isBookingPaused
                        : updated.isBookingPaused ?? item.isBookingPaused,
                  }
                : item
            );
          if (prev.id === targetOrgId || updated.id === prev.id) {
            return {
              ...prev,
              ...updated,
              organizations: nextOrgs,
              platformConfig: updated.platformConfig ?? prev.platformConfig,
              platformPaymentMethodConfigs:
                updated.platformPaymentMethodConfigs ??
                prev.platformPaymentMethodConfigs,
            };
          }
          return {
            ...prev,
            organizations: nextOrgs,
          };
        });
        showToast(
          isEn
            ? "✓ Organization operational status updated"
            : "✓ Estado operativo de la organización actualizado",
          false,
        );
      } else if (!res.ok) {
        showToast(res.error.code || tOrg("errorUpdate"), true);
      }
    } finally {
      setPendingOrgActionId(null);
    }
  }

  async function handleQuickSwitchMode(mode: PaymentCollectionMode) {
    const bank = org.payoutBank || org.bankName || "";
    const phone = org.pagoMovilPhone || org.contactPhone || "";
    if (mode === "ALLY_DIRECT" && (!bank.trim() || !phone.trim())) {
      showToast(tOrg("errorDirectModeBankPhone"), true);
      setIsOrgModalOpen(true);
      return;
    }

    const res = await updateOrganizationAction(
      {
        organizationId: org.id || undefined,
        paymentCollectionMode: mode,
        payoutBank: bank || undefined,
        bankName: bank || undefined,
        contactPhone: phone || undefined,
        pagoMovilPhone: phone || undefined,
      },
      org.id
    );

    if (res.ok && res.data) {
      const updated = res.data;
      setOrg((prev) => ({
        ...updated,
        organizations: updated.organizations ?? prev.organizations,
        venuesCount:
          updated.venuesCount || prev.venuesCount || displayedVenues.length,
        spacesCount: updated.spacesCount || prev.spacesCount,
      }));
      showToast(t("toastOrgSaved"), false);
    } else if (!res.ok) {
      showToast(res.error.code || tOrg("errorUpdate"), true);
    }
  }

  // Compute Admin Governance KPIs
  const dirList =
    organizations.length > 0
      ? organizations
      : org.id
      ? [
          {
            id: org.id,
            tradeName: org.tradeName,
            legalName: org.legalName,
            rif: org.rif,
            status: org.status,
            isBookingPaused: org.isBookingPaused,
            paymentCollectionMode: org.paymentCollectionMode,
            commissionRate: org.commissionRate,
            referenceCurrencyCode: org.referenceCurrencyCode,
            contactEmail: org.contactEmail,
            contactPhone: org.contactPhone,
            venuesCount: org.venuesCount,
          },
        ]
      : [];

  const totalOrgsCount = dirList.length;
  const activeOrgsCount = dirList.filter(
    (o) => (o.status || "ACTIVE") === "ACTIVE" && !o.isBookingPaused
  ).length;
  const inactiveOrPausedCount = dirList.filter(
    (o) => (o.status || "ACTIVE") !== "ACTIVE" || Boolean(o.isBookingPaused)
  ).length;
  const custodyOrgsCount = dirList.filter(
    (o) => (o.paymentCollectionMode || "PLATFORM_CUSTODY") === "PLATFORM_CUSTODY"
  ).length;
  const directOrgsCount = totalOrgsCount - custodyOrgsCount;

  return (
    <div className="organization-page pb-10">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 px-5 pt-5 pb-2.5">
        <div>
          <div className="text-[11px] font-bold tracking-wider text-link uppercase">
            {t("orgSubtitle")}
          </div>
          <h1 className="mt-1 text-[22px] font-extrabold text-foreground">
            {t("orgTitle")}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {organizations.length > 1 && (
            <OrganizationAdvancedSelector
              id="organization-selector"
              label={tOrg("selectorLabel")}
              organizations={organizations}
              venues={venues}
              selectedOrganizationId={org.id}
              onSelectOrganization={handleSelectOrganization}
            />
          )}

          {isPlatformAdmin && (
            <button
              type="button"
              id="btn-create-organization"
              onClick={() => setIsCreateOrgModalOpen(true)}
              className="btn btn-primary inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold shadow-xs"
            >
              <span>+</span>
              <span>
                {isEn ? "New Ally Organization" : "Nueva Organización Aliada"}
              </span>
            </button>
          )}

          {isPlatformAdmin && (
            <Link
              href={ROUTES.platform}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3.5 py-2 text-xs font-bold text-foreground shadow-2xs hover:bg-muted transition-all"
              title={
                isEn
                  ? "Manage YoReservo Custody payment methods and support channels"
                  : "Gestionar métodos de pago en Custodia YoReservo y canales de soporte"
              }
            >
              <span>🛡️</span>
              <span>
                {isEn ? "YoReservo Settings" : "Configuración YoReservo"}
              </span>
            </Link>
          )}

          {canManageFacilities && (
            <Link
              href={ROUTES.venues}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3.5 py-2 text-xs font-bold text-foreground shadow-2xs hover:bg-muted transition-all"
            >
              <span>🏟️</span>
              <span>{t("orgBtnManageVenues")}</span>
            </Link>
          )}
        </div>
      </div>

      {/* Toast feedback banner */}
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

      {/* PLATFORM_ADMIN: Directorio & Gobernanza de Organizaciones Aliadas */}
      {isPlatformAdmin && dirList.length > 0 && (
        <section className="px-5 pt-4">
          <div className="rounded-2xl border border-border-medium bg-surface p-5 shadow-card space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-[11px] font-extrabold tracking-wider text-link uppercase">
                  {isEn
                    ? "🛡️ Multi-Organization Governance (YoReservo Admin)"
                    : "🛡️ Gobernanza Multi-Organización (YoReservo Admin)"}
                </div>
                <h2 className="mt-0.5 text-base font-bold text-foreground">
                  {isEn
                    ? `Directory & Governance of Ally Organizations (${totalOrgsCount})`
                    : `Directorio & Gobernanza de Organizaciones Aliadas (${totalOrgsCount})`}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOrgModalOpen(true)}
                className="btn btn-outline text-xs"
              >
                {isEn ? "+ Register Ally" : "+ Registrar Aliado"}
              </button>
            </div>

            {/* 4 Summary KPIs */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-border bg-muted/40 p-3.5">
                <div className="text-[11px] font-bold uppercase text-muted-foreground">
                  {isEn ? "Total Organizations" : "Total Organizaciones"}
                </div>
                <div className="mt-1 font-display text-2xl font-extrabold text-foreground">
                  {totalOrgsCount}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {isEn
                    ? "Registered ally companies"
                    : "Empresas aliadas registradas"}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-muted/40 p-3.5">
                <div className="text-[11px] font-bold uppercase text-muted-foreground">
                  {isEn ? "Active Organizations" : "Organizaciones Activas"}
                </div>
                <div className="mt-1 font-display text-2xl font-extrabold text-status-available-fg">
                  {activeOrgsCount}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {isEn
                    ? "Receiving online bookings"
                    : "Recibiendo reservas en línea"}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-muted/40 p-3.5">
                <div className="text-[11px] font-bold uppercase text-muted-foreground">
                  {isEn
                    ? "Inactive / Paused Bookings"
                    : "Inactivas / Reservas Pausadas"}
                </div>
                <div className="mt-1 font-display text-2xl font-extrabold text-amber-500">
                  {inactiveOrPausedCount}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {isEn ? "Suspended or paused" : "Suspendidas o en pausa"}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-muted/40 p-3.5">
                <div className="text-[11px] font-bold uppercase text-muted-foreground">
                  {isEn
                    ? "Custody vs Direct Collection"
                    : "Custodia vs Cobro Directo"}
                </div>
                <div className="mt-1 font-display text-lg font-extrabold text-link">
                  {isEn
                    ? `${custodyOrgsCount} Custody • ${directOrgsCount} Direct`
                    : `${custodyOrgsCount} Custodia • ${directOrgsCount} Directo`}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {isEn ? "Collection mode" : "Modalidad de recaudación"}
                </div>
              </div>
            </div>

            {/* Interactive Organizations Table */}
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/60 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-3">
                      {isEn ? "Organization & Tax ID" : "Organización & RIF"}
                    </th>
                    <th className="px-4 py-3">{isEn ? "Venues" : "Sedes"}</th>
                    <th className="px-4 py-3">
                      {isEn ? "Currency & Commission" : "Moneda & Comisión"}
                    </th>
                    <th className="px-4 py-3">
                      {isEn ? "Collection Mode" : "Modalidad Cobro"}
                    </th>
                    <th className="px-4 py-3">
                      {isEn ? "Operational Status" : "Estatus Operativo"}
                    </th>
                    <th className="px-4 py-3 text-right">
                      {isEn ? "Governance Actions" : "Acciones de Gobernanza"}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {dirList.map((item) => {
                    const isSelected = item.id === org.id;
                    const itemStatus = item.status || (isSelected ? org.status : "ACTIVE");
                    const itemPaused =
                      item.isBookingPaused !== undefined
                        ? item.isBookingPaused
                        : isSelected
                        ? Boolean(org.isBookingPaused)
                        : false;
                    const itemActive = itemStatus === "ACTIVE";
                    const itemMode =
                      item.paymentCollectionMode ||
                      (isSelected ? org.paymentCollectionMode : "PLATFORM_CUSTODY");
                    const rawItemRate =
                      item.commissionRate ??
                      (isSelected ? org.commissionRate : 0.05);
                    const itemPct =
                      rawItemRate > 1 || rawItemRate === 0
                        ? Math.round(rawItemRate * 10) / 10
                        : Math.round(rawItemRate * 100);
                    const itemCurr =
                      item.referenceCurrencyCode ||
                      (isSelected ? org.referenceCurrencyCode : "USD");
                    const itemVenuesCount =
                      item.venuesCount !== undefined
                        ? item.venuesCount
                        : venues.filter((v) => v.organizationId === item.id).length;

                    return (
                      <tr
                        key={item.id}
                        className={`transition-colors ${
                          isSelected ? "bg-accent/10" : "hover:bg-muted/40"
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div className="font-bold text-foreground">
                            {item.tradeName}
                          </div>
                          <div className="font-mono text-[11px] text-muted-foreground">
                            {item.rif || "—"}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-semibold text-foreground">
                          🏟️ {itemVenuesCount}{" "}
                          {itemVenuesCount === 1
                            ? isEn
                              ? "venue"
                              : "sede"
                            : isEn
                              ? "venues"
                              : "sedes"}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-bold text-foreground">{itemCurr}</span>
                          <span className="mx-1 text-muted-foreground">•</span>
                          <span className="font-semibold text-link">{itemPct}% fee</span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${
                              itemMode === "ALLY_DIRECT"
                                ? "border-blue-500/40 bg-blue-500/15 text-blue-500"
                                : "border-emerald-500/40 bg-emerald-500/15 text-emerald-500"
                            }`}
                          >
                            {itemMode === "ALLY_DIRECT"
                              ? isEn
                                ? "📲 Direct Collection"
                                : "📲 Cobro Directo"
                              : isEn
                                ? "🏦 YoReservo Custody"
                                : "🏦 Custodia YoReservo"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {itemActive ? (
                              <span className="badge badge-available text-[10px]">
                                {isEn ? "ACTIVE" : "ACTIVA"}
                              </span>
                            ) : (
                              <span className="badge badge-cancelled text-[10px]">
                                {isEn ? "INACTIVE" : "INACTIVA"}
                              </span>
                            )}
                            {itemPaused && (
                              <span className="rounded-full border border-amber-500/40 bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-500">
                                {isEn ? "BOOKINGS PAUSED" : "RESERVAS PAUSADAS"}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex flex-wrap items-center justify-end gap-1.5">
                            <button
                              type="button"
                              disabled={pendingOrgActionId !== null}
                              onClick={() => handleSelectOrganization(item.id)}
                              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-bold transition-all cursor-pointer disabled:opacity-60 ${
                                isSelected
                                  ? "border-accent bg-accent text-accent-foreground"
                                  : "border-border bg-surface text-foreground hover:bg-muted"
                              }`}
                            >
                              {pendingOrgActionId === `select:${item.id}` && (
                                <Spinner className="size-3.5" />
                              )}
                              {isSelected
                                ? isEn
                                  ? "✓ Selected"
                                  : "✓ Seleccionada"
                                : isEn
                                  ? "Inspect"
                                  : "Inspeccionar"}
                            </button>
                            <button
                              type="button"
                              disabled={pendingOrgActionId !== null}
                              onClick={() =>
                                handleUpdateOrgStatus(item.id, {
                                  isBookingPaused: !itemPaused,
                                })
                              }
                              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1 text-[11px] font-semibold text-foreground hover:bg-muted cursor-pointer disabled:opacity-60"
                            >
                              {pendingOrgActionId === `pause:${item.id}` && (
                                <Spinner className="size-3.5" />
                              )}
                              {itemPaused
                                ? isEn
                                  ? "▶ Resume"
                                  : "▶ Reanudar"
                                : isEn
                                  ? "⏸ Pause"
                                  : "⏸ Pausar"}
                            </button>
                            <button
                              type="button"
                              disabled={pendingOrgActionId !== null}
                              onClick={() =>
                                handleUpdateOrgStatus(item.id, {
                                  status: itemActive ? "INACTIVE" : "ACTIVE",
                                })
                              }
                              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-bold cursor-pointer disabled:opacity-60 ${
                                itemActive
                                  ? "border-rose-500/30 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20"
                                  : "border-emerald-500/30 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
                              }`}
                            >
                              {pendingOrgActionId === `status:${item.id}` && (
                                <Spinner className="size-3.5" />
                              )}
                              {itemActive
                                ? isEn
                                  ? "Deactivate"
                                  : "Desactivar"
                                : isEn
                                  ? "Activate"
                                  : "Activar"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* Organization Master Card */}
      <OrgMasterCard
        organization={org}
        bcvRate={bcvRate}
        bcvEurRate={bcvEurRate}
        onOpenEditModal={() => setIsOrgModalOpen(true)}
        onQuickSwitchMode={handleQuickSwitchMode}
        onToggleBookingPause={(nextPaused) =>
          handleUpdateOrgStatus(org.id, { isBookingPaused: nextPaused })
        }
        onToggleStatus={(nextStatus) =>
          handleUpdateOrgStatus(org.id, { status: nextStatus })
        }
        userRole={userRole}
      />

      {/* Ally Organization Accepted Payment Methods (ALLY_DIRECT) */}
      <PaymentMethodsConfigCard
        scope="ORGANIZATION"
        organization={org}
        initialMethods={org.paymentMethodConfigs}
        userRole={userRole}
        onSaved={(updatedMethods) =>
          setOrg((prev) => ({
            ...prev,
            paymentMethodConfigs: updatedMethods,
          }))
        }
        onToast={showToast}
      />

      {/* Associated Venues Summary Card */}
      <section className="px-5 pt-6">
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-card">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="m-0 text-base font-bold text-foreground">
                🏟️ {t("orgVenuesSummaryTitle")} ({displayedVenues.length})
              </h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {t("orgVenuesSummarySubtitle")}
              </p>
            </div>
            {canManageFacilities && (
              <Link
                href={ROUTES.venues}
                className="text-xs font-bold text-link hover:underline"
              >
                {t("orgBtnManageVenues")}
              </Link>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {displayedVenues.map((venue) => {
              const isActive = venue.status === "ACTIVE";
              return (
                <div
                  key={venue.id}
                  className="flex flex-col justify-between rounded-xl border border-border bg-muted/40 p-3.5"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-sm font-bold text-foreground">
                        {venue.name}
                      </div>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          isActive
                            ? "bg-status-available-bg text-status-available-fg border border-status-available-border"
                            : "bg-amber-500/15 text-amber-500 border border-amber-500/30"
                        }`}
                      >
                        {isActive ? tVenues("activeInApp") : tVenues("inAudit")}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      📍 {venue.address || tVenues("defaultLocation")}
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-border/70 pt-2.5 text-xs text-muted-foreground">
                    <span>
                      ⚽ <strong className="text-foreground">{venue.spacesCount}</strong>{" "}
                      {tVenues("courts").toLowerCase()}
                    </span>
                    {canManageFacilities && (
                      <Link
                        href={`${ROUTES.spaces}?venueId=${venue.id}`}
                        className="font-semibold text-link hover:underline"
                      >
                        {tVenues("btnManageCourts")} →
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Organization Edit Modal */}
      <OrgEditModal
        isOpen={isOrgModalOpen}
        onClose={() => setIsOrgModalOpen(false)}
        organization={org}
        onSuccess={handleOrgSaved}
        userRole={userRole}
      />

      {/* Organization Create Modal (PLATFORM_ADMIN) */}
      <CreateOrganizationModal
        isOpen={isCreateOrgModalOpen}
        onClose={() => setIsCreateOrgModalOpen(false)}
        onSuccess={handleOrgCreated}
      />
    </div>
  );
}

