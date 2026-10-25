"use client";

import React, { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
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
  ActivityCategoryItem,
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
  const locale = useLocale();
  const isEn = locale.toLowerCase().startsWith("en");

  const [activeTab, setActiveTab] = useState<"sports" | "surfaces" | "amenities">("sports");

  const [taxonomy, setTaxonomy] = useState<ActivityTypeItem[]>(initialTaxonomy);
  const [surfaces, setSurfaces] = useState<SurfaceItem[]>(initialSurfaces);
  const [amenities, setAmenities] = useState<AmenityItem[]>(initialAmenities);

  // Modal states
  const [activityTypeIdForSport, setActivityTypeIdForSport] = useState<string | null>(null);
  const [editingActivity, setEditingActivity] = useState<ActivityItem | null>(null);
  const [activityForCategory, setActivityForCategory] = useState<ActivityItem | null>(null);
  const [editingCategory, setEditingCategory] = useState<ActivityCategoryItem | null>(null);
  const [isSurfaceModalOpen, setIsSurfaceModalOpen] = useState(false);
  const [editingSurface, setEditingSurface] = useState<SurfaceItem | null>(null);
  const [isAmenityModalOpen, setIsAmenityModalOpen] = useState(false);
  const [editingAmenity, setEditingAmenity] = useState<AmenityItem | null>(null);

  const sportsCount = taxonomy.reduce(
    (acc, tItem) => acc + (tItem.activities?.length || 0),
    0,
  );

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
        sportsCount={sportsCount}
        surfacesCount={surfaces.length}
        amenitiesCount={amenities.length}
      />

      {/* MAIN CONTENT AREA */}
      <main className="p-6">
        {activeTab === "sports" && (
          <TaxonomyTree
            taxonomy={taxonomy}
            onAddSport={(typeId) => {
              setEditingActivity(null);
              setActivityTypeIdForSport(typeId);
            }}
            onEditSport={(typeId, activity) => {
              setEditingActivity(activity);
              setActivityTypeIdForSport(typeId);
            }}
            onAddCategory={(activity) => {
              setEditingCategory(null);
              setActivityForCategory(activity);
            }}
            onEditCategory={(activity, category) => {
              setEditingCategory(category);
              setActivityForCategory(activity);
            }}
          />
        )}

        {activeTab === "surfaces" && (
          <SurfacesTable
            surfaces={surfaces}
            taxonomy={taxonomy}
            onAddSurface={() => {
              setEditingSurface(null);
              setIsSurfaceModalOpen(true);
            }}
            onEditSurface={(surface) => {
              setEditingSurface(surface);
              setIsSurfaceModalOpen(true);
            }}
          />
        )}

        {activeTab === "amenities" && (
          <AmenitiesGrid
            amenities={amenities}
            taxonomy={taxonomy}
            onAddAmenity={() => {
              setEditingAmenity(null);
              setIsAmenityModalOpen(true);
            }}
            onEditAmenity={(amenity) => {
              setEditingAmenity(amenity);
              setIsAmenityModalOpen(true);
            }}
          />
        )}
      </main>

      {/* MODALS */}
      <ActivityModal
        isOpen={!!activityTypeIdForSport}
        activityTypeId={activityTypeIdForSport || ""}
        initialActivity={editingActivity}
        onClose={() => {
          setActivityTypeIdForSport(null);
          setEditingActivity(null);
        }}
        onSuccess={() => {
          setActivityTypeIdForSport(null);
          setEditingActivity(null);
          refreshTaxonomy();
        }}
      />

      <CategoryModal
        isOpen={!!activityForCategory}
        activity={activityForCategory}
        initialCategory={editingCategory}
        onClose={() => {
          setActivityForCategory(null);
          setEditingCategory(null);
        }}
        onSuccess={() => {
          setActivityForCategory(null);
          setEditingCategory(null);
          refreshTaxonomy();
        }}
      />

      <SurfaceModal
        isOpen={isSurfaceModalOpen}
        initialData={editingSurface}
        taxonomy={taxonomy}
        onClose={() => {
          setIsSurfaceModalOpen(false);
          setEditingSurface(null);
        }}
        onSuccess={(savedSurface) => {
          if (savedSurface) {
            setSurfaces((prev) =>
              prev.some((s) => s.id === savedSurface.id)
                ? prev.map((s) => (s.id === savedSurface.id ? savedSurface : s))
                : [...prev, savedSurface],
            );
          }
          setIsSurfaceModalOpen(false);
          setEditingSurface(null);
          refreshSurfaces();
        }}
      />

      <AmenityModal
        isOpen={isAmenityModalOpen}
        initialData={editingAmenity}
        taxonomy={taxonomy}
        onClose={() => {
          setIsAmenityModalOpen(false);
          setEditingAmenity(null);
        }}
        onSuccess={(savedAmenity) => {
          if (savedAmenity) {
            setAmenities((prev) =>
              prev.some((a) => a.id === savedAmenity.id)
                ? prev.map((a) => (a.id === savedAmenity.id ? savedAmenity : a))
                : [...prev, savedAmenity],
            );
          }
          setIsAmenityModalOpen(false);
          setEditingAmenity(null);
          refreshAmenities();
        }}
      />
    </div>
  );
}
