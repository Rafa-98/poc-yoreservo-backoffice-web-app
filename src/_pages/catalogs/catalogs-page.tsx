"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { CatalogsSubnav } from "@/features/catalogs/ui/catalogs-subnav";
import { TaxonomyTree } from "@/features/catalogs/ui/taxonomy-tree";
import { SurfacesTable } from "@/features/catalogs/ui/surfaces-table";
import { AmenitiesGrid } from "@/features/catalogs/ui/amenities-grid";
import { ActivityModal } from "@/features/catalogs/ui/activity-modal";
import { CategoryModal } from "@/features/catalogs/ui/category-modal";
import { SurfaceModal } from "@/features/catalogs/ui/surface-modal";
import { AmenityModal } from "@/features/catalogs/ui/amenity-modal";
import {
  getAmenitiesAction,
  getSurfacesAction,
  getTaxonomyAction,
} from "@/features/catalogs/actions/catalogs-actions";
import type {
  ActivityItem,
  ActivityTypeItem,
  AmenityItem,
  SurfaceItem,
} from "@/features/catalogs/model/types";

interface CatalogsPageProps {
  initialTaxonomy: ActivityTypeItem[];
  initialSurfaces: SurfaceItem[];
  initialAmenities: AmenityItem[];
}

export function CatalogsPage({
  initialTaxonomy,
  initialSurfaces,
  initialAmenities,
}: CatalogsPageProps) {
  const t = useTranslations("catalogs");

  const [activeTab, setActiveTab] = useState<"sports" | "surfaces" | "amenities">("sports");

  const [taxonomy, setTaxonomy] = useState<ActivityTypeItem[]>(initialTaxonomy);
  const [surfaces, setSurfaces] = useState<SurfaceItem[]>(initialSurfaces);
  const [amenities, setAmenities] = useState<AmenityItem[]>(initialAmenities);

  // Modal states
  const [activityTypeIdForSport, setActivityTypeIdForSport] = useState<string | null>(null);
  const [activityForCategory, setActivityForCategory] = useState<ActivityItem | null>(null);
  const [isSurfaceModalOpen, setIsSurfaceModalOpen] = useState(false);
  const [isAmenityModalOpen, setIsAmenityModalOpen] = useState(false);

  async function refreshTaxonomy() {
    const res = await getTaxonomyAction();
    if (res.ok && res.data) {
      setTaxonomy(res.data);
    }
  }

  async function refreshSurfaces() {
    const res = await getSurfacesAction();
    if (res.ok && res.data) {
      setSurfaces(res.data);
    }
  }

  async function refreshAmenities() {
    const res = await getAmenitiesAction();
    if (res.ok && res.data) {
      setAmenities(res.data);
    }
  }

  return (
    <div className="space-y-0">
      {/* TOP HEADER */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border bg-surface px-6 py-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-bold text-foreground">
              {t("title")}
            </h1>
            <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-bold text-emerald-400">
              {t("badge")}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>
      </header>

      {/* SUBNAV TABS */}
      <CatalogsSubnav
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        surfacesCount={surfaces.length}
        amenitiesCount={amenities.length}
      />

      {/* MAIN CONTENT AREA */}
      <main className="p-6">
        {activeTab === "sports" && (
          <TaxonomyTree
            taxonomy={taxonomy}
            onAddSport={(typeId) => setActivityTypeIdForSport(typeId)}
            onAddCategory={(activity) => setActivityForCategory(activity)}
          />
        )}

        {activeTab === "surfaces" && (
          <SurfacesTable
            surfaces={surfaces}
            onAddSurface={() => setIsSurfaceModalOpen(true)}
            onEditSurface={() => setIsSurfaceModalOpen(true)}
          />
        )}

        {activeTab === "amenities" && (
          <AmenitiesGrid
            amenities={amenities}
            onAddAmenity={() => setIsAmenityModalOpen(true)}
          />
        )}
      </main>

      {/* MODALS */}
      <ActivityModal
        isOpen={!!activityTypeIdForSport}
        activityTypeId={activityTypeIdForSport || ""}
        onClose={() => setActivityTypeIdForSport(null)}
        onSuccess={() => {
          setActivityTypeIdForSport(null);
          refreshTaxonomy();
        }}
      />

      <CategoryModal
        isOpen={!!activityForCategory}
        activity={activityForCategory}
        onClose={() => setActivityForCategory(null)}
        onSuccess={() => {
          setActivityForCategory(null);
          refreshTaxonomy();
        }}
      />

      <SurfaceModal
        isOpen={isSurfaceModalOpen}
        onClose={() => setIsSurfaceModalOpen(false)}
        onSuccess={() => {
          setIsSurfaceModalOpen(false);
          refreshSurfaces();
        }}
      />

      <AmenityModal
        isOpen={isAmenityModalOpen}
        onClose={() => setIsAmenityModalOpen(false)}
        onSuccess={() => {
          setIsAmenityModalOpen(false);
          refreshAmenities();
        }}
      />
    </div>
  );
}
