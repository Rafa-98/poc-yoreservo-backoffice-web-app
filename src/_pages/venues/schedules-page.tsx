"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ROUTES } from "@/shared/config";
import { useTimeFormat } from "@/shared/lib/time-format";
import { useActiveVenue } from "@/features/venues/context/venue-context";
import {
  deriveOrganizationsFromVenues,
  type DaySchedule,
  type ShiftRange,
  type SpaceItem,
  type VenueItem,
  type WeeklyScheduleData,
  type WeeklySchedulesInput,
} from "@/features/venues/model/types";
import {
  getSpaceSchedulesAction,
  getSpacesAction,
  updateSpaceSchedulesAction,
} from "@/features/venues/actions/venues-actions";

interface SchedulesPageProps {
  initialVenues: VenueItem[];
  initialVenueId: string;
  initialSpaces: SpaceItem[];
  initialSpaceId: string;
  initialSchedules?: WeeklyScheduleData | null;
}

const ORDERED_DAYS = [1, 2, 3, 4, 5, 6, 0]; // Lun -> Dom

const DAY_LABELS_ES: Record<number, { full: string; short: string }> = {
  1: { full: "Lunes", short: "Lun" },
  2: { full: "Martes", short: "Mar" },
  3: { full: "Miércoles", short: "Mié" },
  4: { full: "Jueves", short: "Jue" },
  5: { full: "Viernes", short: "Vie" },
  6: { full: "Sábado", short: "Sáb" },
  0: { full: "Domingo", short: "Dom" },
};

const DAY_LABELS_EN: Record<number, { full: string; short: string }> = {
  1: { full: "Monday", short: "Mon" },
  2: { full: "Tuesday", short: "Tue" },
  3: { full: "Wednesday", short: "Wed" },
  4: { full: "Thursday", short: "Thu" },
  5: { full: "Friday", short: "Fri" },
  6: { full: "Saturday", short: "Sat" },
  0: { full: "Sunday", short: "Sun" },
};

const OPEN_HOUR_OPTIONS = Array.from(
  { length: 24 },
  (_, i) => `${String(i).padStart(2, "0")}:00`
);

const CLOSE_HOUR_OPTIONS = Array.from(
  { length: 24 },
  (_, i) => `${String(i + 1).padStart(2, "0")}:00`
);

export const EMPTY_DAYS: DaySchedule[] = ORDERED_DAYS.map((dayOfWeek) => ({
  dayOfWeek,
  isOpen: false,
  enabled: false,
  shifts: [],
  shift1: { openTime: "07:00", closeTime: "22:00", isEnabled: false },
  shift2: { openTime: "16:00", closeTime: "22:00", isEnabled: false },
}));

export function parseTimeHour(timeStr: string | undefined, isClose = false): number {
  if (!timeStr) return isClose ? 22 : 7;
  if (timeStr === "24:00" || (isClose && timeStr === "00:00")) return 24;
  const parts = timeStr.split(":");
  const h = parseInt(parts[0] || "0", 10);
  const m = parseInt(parts[1] || "0", 10);
  return h + m / 60;
}

function normalizeCloseTimeString(closeTime: string | undefined): string {
  if (!closeTime) return "22:00";
  if (closeTime === "00:00") return "24:00";
  return closeTime;
}

function buildDayWithShifts(dayOfWeek: number, isOpen: boolean, shifts: ShiftRange[]): DaySchedule {
  const cleanShifts: ShiftRange[] = isOpen
    ? shifts.map((s) => ({
        openTime: s.openTime || "07:00",
        closeTime: normalizeCloseTimeString(s.closeTime),
        isEnabled: true,
      }))
    : [];

  const s1 = cleanShifts[0] ?? {
    openTime: "07:00",
    closeTime: "22:00",
    isEnabled: isOpen,
  };
  const s2 = cleanShifts[1]
    ? { ...cleanShifts[1], isEnabled: true }
    : { openTime: "16:00", closeTime: "22:00", isEnabled: false };

  return {
    dayOfWeek,
    isOpen,
    enabled: isOpen,
    shifts: cleanShifts,
    shift1: s1,
    shift2: s2,
  };
}

function normalizeDays(
  rawDays: DaySchedule[] | undefined | null
): DaySchedule[] {
  if (!rawDays || rawDays.length === 0) {
    return EMPTY_DAYS.map((d) => ({
      ...d,
      shifts: [],
      shift1: { ...d.shift1 },
      shift2: d.shift2 ? { ...d.shift2 } : undefined,
    }));
  }

  const byDay = new Map<number, DaySchedule>();
  for (const d of rawDays) {
    const isOpen = Boolean(d.isOpen);
    let extractedShifts: ShiftRange[] = [];

    if (isOpen) {
      if (Array.isArray(d.shifts) && d.shifts.length > 0) {
        extractedShifts = d.shifts
          .filter((s) => s && s.isEnabled !== false)
          .map((s) => ({
            openTime: s.openTime || "07:00",
            closeTime: normalizeCloseTimeString(s.closeTime),
            isEnabled: true,
          }));
      } else {
        if (d.shift1 && d.shift1.isEnabled !== false) {
          extractedShifts.push({
            openTime: d.shift1.openTime || "07:00",
            closeTime: normalizeCloseTimeString(d.shift1.closeTime),
            isEnabled: true,
          });
        }
        if (d.shift2?.isEnabled) {
          extractedShifts.push({
            openTime: d.shift2.openTime || "15:00",
            closeTime: normalizeCloseTimeString(d.shift2.closeTime),
            isEnabled: true,
          });
        }
      }
      if (extractedShifts.length === 0) {
        extractedShifts = [{ openTime: "07:00", closeTime: "22:00", isEnabled: true }];
      }
    }

    byDay.set(d.dayOfWeek, buildDayWithShifts(d.dayOfWeek, isOpen, extractedShifts));
  }

  return ORDERED_DAYS.map(
    (dow) =>
      byDay.get(dow) ??
      buildDayWithShifts(dow, false, [])
  );
}

function getSpaceSportName(space: SpaceItem, isEn = false): string {
  const actName =
    typeof space.activityCategory?.activity?.name === "object"
      ? isEn
        ? space.activityCategory.activity.name.en ||
          space.activityCategory.activity.name.es
        : space.activityCategory.activity.name.es ||
          space.activityCategory.activity.name.en
      : space.activityCategory?.activity?.name;
  if (actName) return String(actName);

  const catName =
    typeof space.activityCategory?.name === "object"
      ? isEn
        ? space.activityCategory.name.en || space.activityCategory.name.es
        : space.activityCategory.name.es || space.activityCategory.name.en
      : space.activityCategory?.name;
  if (catName) {
    const lower = String(catName).toLowerCase();
    if (lower.includes("fútbol") || lower.includes("futbol") || lower.includes("futsal") || lower.includes("soccer")) return isEn ? "Soccer" : "Fútbol";
    if (lower.includes("pádel") || lower.includes("padel")) return isEn ? "Padel" : "Pádel";
    if (lower.includes("tenis") || lower.includes("tennis")) return isEn ? "Tennis" : "Tenis";
    if (lower.includes("baloncesto") || lower.includes("basket")) return isEn ? "Basketball" : "Baloncesto";
    if (lower.includes("voleibol") || lower.includes("voley") || lower.includes("volleyball")) return isEn ? "Volleyball" : "Voleibol";
    return String(catName);
  }
  return isEn ? "Sport" : "Deporte";
}

function getSpaceFormatLabel(space: SpaceItem, isEn = false): string {
  const catName =
    typeof space.activityCategory?.name === "object"
      ? isEn
        ? space.activityCategory.name.en || space.activityCategory.name.es
        : space.activityCategory.name.es || space.activityCategory.name.en
      : space.activityCategory?.name;
  if (catName) return String(catName);
  return getSpaceSportName(space, isEn);
}

function getSportEmoji(sportName: string): string {
  const s = sportName.toLowerCase();
  if (s.includes("fútbol") || s.includes("futbol") || s.includes("futsal") || s.includes("soccer")) return "⚽";
  if (s.includes("pickleball") || s.includes("ping") || s.includes("mesa") || s.includes("table")) return "🏓";
  if (s.includes("pádel") || s.includes("padel") || s.includes("tenis") || s.includes("tennis")) return "🎾";
  if (s.includes("baloncesto") || s.includes("basket")) return "🏀";
  if (s.includes("voleibol") || s.includes("voley") || s.includes("playa") || s.includes("volleyball") || s.includes("beach")) return "🏐";
  if (s.includes("bádminton") || s.includes("badminton")) return "🏸";
  if (s.includes("beisbol") || s.includes("béisbol") || s.includes("baseball")) return "⚾";
  return "🏟️";
}

function calcDayActiveHours(day: DaySchedule): number {
  if (!day.isOpen || !day.shifts || day.shifts.length === 0) return 0;
  return day.shifts.reduce((acc, s) => {
    const start = parseTimeHour(s.openTime, false);
    const end = parseTimeHour(s.closeTime, true);
    return acc + Math.max(0, end - start);
  }, 0);
}

function serializeDays(daysList: DaySchedule[]): string {
  return JSON.stringify(
    daysList.map((d) => ({
      dayOfWeek: d.dayOfWeek,
      isOpen: Boolean(d.isOpen),
      shifts: d.isOpen
        ? (d.shifts || []).map((s) => ({
            openTime: s.openTime,
            closeTime: normalizeCloseTimeString(s.closeTime),
          }))
        : [],
    }))
  );
}

export function SchedulesPage({
  initialVenues,
  initialVenueId,
  initialSpaces,
  initialSpaceId,
  initialSchedules,
}: SchedulesPageProps) {
  const locale = useLocale();
  const isEn = locale.toLowerCase().startsWith("en");
  const dayLabels = isEn ? DAY_LABELS_EN : DAY_LABELS_ES;
  const topT = useTranslations("venues.top");
  const schedT = useTranslations("venues.schedules");
  const { timeFormat, formatTime } = useTimeFormat();

  function formatCloseTimeLabel(h: string): string {
    if (h === "24:00" || h === "00:00") {
      return timeFormat === "12h" ? "12:00 AM" : "24:00";
    }
    return formatTime(h);
  }

  const {
    setActiveVenueId,
    activeOrganizationId: globalOrgId,
    setActiveOrganizationId: setGlobalOrgId,
    isPlatformRole,
  } = useActiveVenue();

  const [venues] = useState<VenueItem[]>(initialVenues);
  const organizations = useMemo(
    () => deriveOrganizationsFromVenues(venues),
    [venues],
  );
  const showOrganizationFilter = isPlatformRole || organizations.length > 1;
  const [spaces, setSpaces] = useState<SpaceItem[]>(initialSpaces);
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>(
    initialSpaceId || initialSpaces[0]?.id || ""
  );
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeSportFilter, setActiveSportFilter] = useState<string>("ALL");
  const [activeOrgFilter, setActiveOrgFilter] = useState<string>(
    globalOrgId || "ALL",
  );
  const [orgFilterQuery, setOrgFilterQuery] = useState<string>("");
  const [isOrgDropdownOpen, setIsOrgDropdownOpen] = useState<boolean>(false);
  const orgDropdownRef = useRef<HTMLDivElement | null>(null);
  const [activeVenueFilter, setActiveVenueFilter] = useState<string>("ALL");
  const [venueFilterQuery, setVenueFilterQuery] = useState<string>("");
  const [isVenueDropdownOpen, setIsVenueDropdownOpen] = useState<boolean>(false);
  const venueDropdownRef = useRef<HTMLDivElement | null>(null);
  const [cloneSourceSpaceId, setCloneSourceSpaceId] = useState<string>("");

  useEffect(() => {
    if (globalOrgId) {
      setActiveOrgFilter((prev) => (prev === globalOrgId ? prev : globalOrgId));
    }
  }, [globalOrgId]);

  const [alsoApplyToSameSport, setAlsoApplyToSameSport] = useState<boolean>(false);
  const [applyToAllVenueSpaces, setApplyToAllVenueSpaces] = useState<boolean>(false);

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState<boolean>(false);
  const [previewDayOfWeek, setPreviewDayOfWeek] = useState<number>(1); // Lunes default
  const [toast, setToast] = useState<{ message: string; isError: boolean } | null>(null);

  const [days, setDays] = useState<DaySchedule[]>(() =>
    normalizeDays(initialSchedules?.days)
  );
  const [savedDays, setSavedDays] = useState<DaySchedule[]>(() =>
    normalizeDays(initialSchedules?.days)
  );

  // Sync selected space, schedules, and venue filter when navigating with ?spaceId= / ?venueId=
  useEffect(() => {
    if (initialSpaceId) {
      setSelectedSpaceId(initialSpaceId);
    }
    const normalized = normalizeDays(initialSchedules?.days);
    setDays(normalized);
    setSavedDays(normalized);

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlSpaceId = params.get("spaceId");
      const urlVenueId = params.get("venueId");
      if (urlSpaceId || urlVenueId) {
        const matchedSp = initialSpaces.find(
          (s) => s.id === (urlSpaceId || initialSpaceId)
        );
        const targetVId = matchedSp?.venueId || urlVenueId || initialVenueId;
        if (targetVId) {
          setActiveVenueFilter(targetVId);
        }
      }
    }
  }, [initialSpaceId, initialVenueId, initialSchedules, initialSpaces]);

  const hasUnsavedChanges = useMemo(
    () => serializeDays(days) !== serializeDays(savedDays),
    [days, savedDays]
  );

  function handleDiscardChanges() {
    setDays(
      savedDays.map((d) =>
        buildDayWithShifts(
          d.dayOfWeek,
          d.isOpen,
          (d.shifts || []).map((s) => ({ ...s }))
        )
      )
    );
    setAlsoApplyToSameSport(false);
    setApplyToAllVenueSpaces(false);
    setCloneSourceSpaceId("");
  }

  // If initialSpaces only loaded a single venue (or was empty) and we have multiple venues, ensure we have all spaces
  useEffect(() => {
    let cancelled = false;
    async function ensureAllSpacesLoaded() {
      if (initialVenues.length > 1) {
        const distinctVenuesInSpaces = new Set(initialSpaces.map((s) => s.venueId));
        if (distinctVenuesInSpaces.size <= 1) {
          const allRes = await getSpacesAction("ALL");
          if (!cancelled && allRes.ok && allRes.data && allRes.data.length > 0) {
            setSpaces(allRes.data);
          }
        }
      }
    }
    ensureAllSpacesLoaded();
    return () => {
      cancelled = true;
    };
  }, [initialVenues.length, initialSpaces]);

  const selectedSpace = useMemo(
    () => spaces.find((s) => s.id === selectedSpaceId) || spaces[0] || null,
    [spaces, selectedSpaceId]
  );

  const selectedVenue = useMemo(() => {
    const vId = selectedSpace?.venueId || initialVenueId;
    return venues.find((v) => v.id === vId) || venues[0] || null;
  }, [selectedSpace, initialVenueId, venues]);

  // Close searchable org and venue dropdowns on outside click
  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (
        orgDropdownRef.current &&
        !orgDropdownRef.current.contains(e.target as Node)
      ) {
        setIsOrgDropdownOpen(false);
        setOrgFilterQuery("");
      }
      if (
        venueDropdownRef.current &&
        !venueDropdownRef.current.contains(e.target as Node)
      ) {
        setIsVenueDropdownOpen(false);
        setVenueFilterQuery("");
      }
    }
    if (isOrgDropdownOpen || isVenueDropdownOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOrgDropdownOpen, isVenueDropdownOpen]);

  const orgScopedVenues = useMemo(() => {
    if (
      !showOrganizationFilter ||
      !activeOrgFilter ||
      activeOrgFilter === "ALL"
    ) {
      return venues;
    }
    return venues.filter((v) => v.organizationId === activeOrgFilter);
  }, [venues, showOrganizationFilter, activeOrgFilter]);

  const orgScopedVenueIdSet = useMemo(
    () => new Set(orgScopedVenues.map((v) => v.id)),
    [orgScopedVenues],
  );

  const orgScopedSpaces = useMemo(() => {
    if (
      !showOrganizationFilter ||
      !activeOrgFilter ||
      activeOrgFilter === "ALL"
    ) {
      return spaces;
    }
    return spaces.filter((sp) => orgScopedVenueIdSet.has(sp.venueId));
  }, [spaces, showOrganizationFilter, activeOrgFilter, orgScopedVenueIdSet]);

  const filteredOrgOptions = useMemo(() => {
    const q = orgFilterQuery.trim().toLowerCase();
    if (!q) return organizations;
    return organizations.filter(
      (org) =>
        org.tradeName.toLowerCase().includes(q) ||
        (org.legalName && org.legalName.toLowerCase().includes(q)) ||
        (org.rif && org.rif.toLowerCase().includes(q)),
    );
  }, [organizations, orgFilterQuery]);

  const activeOrgFilterName = useMemo(() => {
    if (!activeOrgFilter || activeOrgFilter === "ALL") {
      return isEn
        ? `All organizations (${organizations.length})`
        : `Todas las organizaciones (${organizations.length})`;
    }
    const found = organizations.find((o) => o.id === activeOrgFilter);
    if (!found) {
      return isEn
        ? `All organizations (${organizations.length})`
        : `Todas las organizaciones (${organizations.length})`;
    }
    const sedesLabel =
      found.venuesCount === 1
        ? isEn
          ? "1 venue"
          : "1 sede"
        : isEn
          ? `${found.venuesCount} venues`
          : `${found.venuesCount} sedes`;
    return `${found.tradeName} (${sedesLabel})`;
  }, [activeOrgFilter, organizations, isEn]);

  // All distinct venues represented in orgScopedVenues or orgScopedSpaces
  const selectableVenues = useMemo(() => {
    const map = new Map<string, { id: string; name: string; count: number }>();
    for (const v of orgScopedVenues) {
      map.set(v.id, { id: v.id, name: v.name, count: 0 });
    }
    for (const sp of orgScopedSpaces) {
      const vId = sp.venueId || "default";
      const vName =
        sp.venueName ||
        sp.venue?.name ||
        venues.find((v) => v.id === sp.venueId)?.name ||
        (isEn ? "Main Venue" : "Sede Principal");
      const existing = map.get(vId);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(vId, { id: vId, name: vName, count: 1 });
      }
    }
    return Array.from(map.values()).filter(
      (v) => v.count > 0 || orgScopedVenues.length > 0,
    );
  }, [orgScopedVenues, orgScopedSpaces, venues, isEn]);

  const filteredVenueOptions = useMemo(() => {
    const q = venueFilterQuery.trim().toLowerCase();
    if (!q) return selectableVenues;
    return selectableVenues.filter((v) => v.name.toLowerCase().includes(q));
  }, [selectableVenues, venueFilterQuery]);

  const activeVenueFilterName = useMemo(() => {
    const totalLabel =
      orgScopedSpaces.length === 1
        ? isEn
          ? "1 court"
          : "1 cancha"
        : isEn
          ? `${orgScopedSpaces.length} courts`
          : `${orgScopedSpaces.length} canchas`;
    if (activeVenueFilter === "ALL")
      return isEn
        ? `All venues (${totalLabel})`
        : `Todas las sedes (${totalLabel})`;
    const found = selectableVenues.find((v) => v.id === activeVenueFilter);
    if (!found)
      return isEn
        ? `All venues (${totalLabel})`
        : `Todas las sedes (${totalLabel})`;
    const countLabel =
      found.count === 1
        ? isEn
          ? "1 court"
          : "1 cancha"
        : isEn
          ? `${found.count} courts`
          : `${found.count} canchas`;
    return `${found.name} (${countLabel})`;
  }, [activeVenueFilter, selectableVenues, orgScopedSpaces.length, isEn]);

  // Distinct sports across spaces (respecting org + venue filter) for the filter pills
  const availableSports = useMemo(() => {
    const map = new Map<string, string>();
    for (const sp of orgScopedSpaces) {
      if (activeVenueFilter !== "ALL" && sp.venueId !== activeVenueFilter) {
        continue;
      }
      const sport = getSpaceSportName(sp, isEn);
      if (!map.has(sport)) {
        map.set(sport, getSportEmoji(sport));
      }
    }
    return Array.from(map.entries()).map(([name, emoji]) => ({ name, emoji }));
  }, [orgScopedSpaces, activeVenueFilter, isEn]);

  // If the selected venue changes and the active sport filter is not available in that venue, reset to ALL
  useEffect(() => {
    if (
      activeSportFilter !== "ALL" &&
      !availableSports.some((s) => s.name === activeSportFilter)
    ) {
      setActiveSportFilter("ALL");
    }
  }, [availableSports, activeSportFilter]);

  // Filtered spaces grouped by venue
  const filteredSpaces = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return orgScopedSpaces.filter((sp) => {
      const sport = getSpaceSportName(sp, isEn);
      const format = getSpaceFormatLabel(sp, isEn);
      const vName =
        sp.venueName ||
        sp.venue?.name ||
        venues.find((v) => v.id === sp.venueId)?.name ||
        "";

      const matchesVenue =
        activeVenueFilter === "ALL" || sp.venueId === activeVenueFilter;
      const matchesSport =
        activeSportFilter === "ALL" || sport === activeSportFilter;
      const matchesQuery =
        !q ||
        sp.spaceNumber.toLowerCase().includes(q) ||
        vName.toLowerCase().includes(q) ||
        sport.toLowerCase().includes(q) ||
        format.toLowerCase().includes(q);

      return matchesVenue && matchesSport && matchesQuery;
    });
  }, [orgScopedSpaces, venues, activeVenueFilter, activeSportFilter, searchQuery, isEn]);

  const spacesGroupedByVenue = useMemo(() => {
    const groups = new Map<string, { venueId: string; venueName: string; items: SpaceItem[] }>();
    for (const sp of filteredSpaces) {
      const vId = sp.venueId || "default";
      const vName =
        sp.venueName ||
        sp.venue?.name ||
        venues.find((v) => v.id === sp.venueId)?.name ||
        (isEn ? "Main Venue" : "Sede Principal");
      const existing = groups.get(vId);
      if (existing) {
        existing.items.push(sp);
      } else {
        groups.set(vId, { venueId: vId, venueName: vName, items: [sp] });
      }
    }
    return Array.from(groups.values());
  }, [filteredSpaces, venues, isEn]);

  // Live KPI metrics for the currently edited space
  const openDaysCount = useMemo(
    () => days.filter((d) => d.isOpen && (d.shifts?.length ?? 0) > 0).length,
    [days]
  );

  const totalWeeklyHours = useMemo(
    () =>
      Math.round(
        days.reduce((acc, d) => acc + calcDayActiveHours(d), 0) * 10
      ) / 10,
    [days]
  );

  // Same-sport courts in the same venue count (for the replication checkbox)
  const sameSportSiblingsInVenue = useMemo(() => {
    if (!selectedSpace) return [];
    const currentSport = getSpaceSportName(selectedSpace, isEn);
    return spaces.filter(
      (s) =>
        s.venueId === selectedSpace.venueId &&
        s.id !== selectedSpace.id &&
        getSpaceSportName(s, isEn) === currentSport
    );
  }, [spaces, selectedSpace, isEn]);

  function showToast(message: string, isError = false) {
    setToast({ message, isError });
    setTimeout(() => setToast(null), 4200);
  }

  async function handleSelectSpace(spaceId: string) {
    if (!spaceId) return;
    setSelectedSpaceId(spaceId);
    setCloneSourceSpaceId("");
    setAlsoApplyToSameSport(false);
    setApplyToAllVenueSpaces(false);

    const targetSp = spaces.find((s) => s.id === spaceId);
    if (targetSp?.venueId && setActiveVenueId) {
      setActiveVenueId(targetSp.venueId);
    }

    if (typeof window !== "undefined" && targetSp) {
      const nextUrl = `${ROUTES.schedules}?venueId=${encodeURIComponent(
        targetSp.venueId
      )}&spaceId=${encodeURIComponent(targetSp.id)}`;
      window.history.replaceState(null, "", nextUrl);
    }

    setIsLoadingSchedules(true);
    try {
      const res = await getSpaceSchedulesAction(spaceId);
      if (!res.ok) {
        showToast(schedT("toastLoadError", { code: res.error.code }), true);
        const emptyNormalized = normalizeDays(null);
        setDays(emptyNormalized);
        setSavedDays(emptyNormalized);
        return;
      }
      const rawDays = Array.isArray(res.data)
        ? (res.data as unknown as DaySchedule[])
        : res.data?.days;
      const normalized = normalizeDays(rawDays);
      setDays(normalized);
      setSavedDays(normalized);
    } finally {
      setIsLoadingSchedules(false);
    }
  }

  // Toggle Day Open / Closed
  function handleToggleDayOpen(dayIndex: number) {
    setDays((prev) => {
      const next = [...prev];
      const current = next[dayIndex];
      const nextIsOpen = !current.isOpen;
      const nextShifts =
        nextIsOpen && (!current.shifts || current.shifts.length === 0)
          ? [{ openTime: "07:00", closeTime: "22:00", isEnabled: true }]
          : current.shifts || [];
      next[dayIndex] = buildDayWithShifts(
        current.dayOfWeek,
        nextIsOpen,
        nextShifts
      );
      return next;
    });
  }

  // Update a specific shift's openTime or closeTime with intelligent forward cascading
  function handleUpdateShiftTime(
    dayIndex: number,
    shiftIndex: number,
    field: "openTime" | "closeTime",
    value: string
  ) {
    setDays((prev) => {
      const next = [...prev];
      const current = next[dayIndex];
      const shiftsCopy = (current.shifts || []).map((s) => ({ ...s }));
      if (!shiftsCopy[shiftIndex]) return prev;

      shiftsCopy[shiftIndex] = {
        ...shiftsCopy[shiftIndex],
        [field]: value,
        isEnabled: true,
      };

      // Cascade forward so no shift has closeTime <= openTime or starts before previous shift's closeTime
      for (let i = 0; i < shiftsCopy.length; i++) {
        const remainingShiftsAfter = shiftsCopy.length - 1 - i;
        const maxOpenForThisShift = Math.max(0, 23 - remainingShiftsAfter);
        const maxCloseForThisShift = Math.max(1, 24 - remainingShiftsAfter);

        if (i > 0) {
          const prevCloseH = Math.floor(
            parseTimeHour(shiftsCopy[i - 1].closeTime, true)
          );
          const currOpenH = Math.floor(
            parseTimeHour(shiftsCopy[i].openTime, false)
          );
          if (currOpenH < prevCloseH) {
            const nextValidOpen = Math.min(maxOpenForThisShift, prevCloseH);
            shiftsCopy[i].openTime = `${String(nextValidOpen).padStart(2, "0")}:00`;
          }
        }

        let openH = Math.floor(parseTimeHour(shiftsCopy[i].openTime, false));
        if (openH > maxOpenForThisShift) {
          openH = maxOpenForThisShift;
          shiftsCopy[i].openTime = `${String(openH).padStart(2, "0")}:00`;
        }

        const closeH = Math.floor(parseTimeHour(shiftsCopy[i].closeTime, true));
        if (closeH <= openH) {
          const nextValidClose = Math.min(maxCloseForThisShift, openH + 1);
          shiftsCopy[i].closeTime = `${String(nextValidClose).padStart(2, "0")}:00`;
        } else if (closeH > maxCloseForThisShift) {
          shiftsCopy[i].closeTime = `${String(maxCloseForThisShift).padStart(2, "0")}:00`;
        }
      }

      next[dayIndex] = buildDayWithShifts(
        current.dayOfWeek,
        current.isOpen,
        shiftsCopy
      );
      return next;
    });
  }

  // Add a new shift (T2, T3, T4...) to a day with intelligent non-overlapping defaults
  function handleAddShiftToDay(dayIndex: number) {
    setDays((prev) => {
      const next = [...prev];
      const current = next[dayIndex];
      const shiftsCopy = (current.shifts || []).map((s) => ({ ...s }));

      if (shiftsCopy.length === 0) {
        shiftsCopy.push({ openTime: "07:00", closeTime: "22:00", isEnabled: true });
      } else {
        const lastIdx = shiftsCopy.length - 1;
        const last = shiftsCopy[lastIdx];
        const lastOpenH = Math.floor(parseTimeHour(last.openTime, false));
        const lastCloseH = Math.floor(parseTimeHour(last.closeTime, true));

        if (lastCloseH >= 20 && lastCloseH - lastOpenH >= 5) {
          // Split the last shift cleanly leaving a 2-hour recess (e.g. club reservation block)
          const firstPartDuration = Math.max(2, Math.floor((lastCloseH - lastOpenH - 2) / 2));
          const midCloseH = lastOpenH + firstPartDuration;
          const nextOpenH = Math.min(22, midCloseH + 2);
          const nextCloseH = Math.max(nextOpenH + 1, lastCloseH);

          shiftsCopy[lastIdx] = {
            ...last,
            closeTime: `${String(midCloseH).padStart(2, "0")}:00`,
            isEnabled: true,
          };
          shiftsCopy.push({
            openTime: `${String(nextOpenH).padStart(2, "0")}:00`,
            closeTime: `${String(nextCloseH).padStart(2, "0")}:00`,
            isEnabled: true,
          });
        } else if (lastCloseH < 23) {
          const nextOpenH = Math.min(23, lastCloseH + 1);
          const nextCloseH = Math.min(24, nextOpenH + 2);
          shiftsCopy.push({
            openTime: `${String(nextOpenH).padStart(2, "0")}:00`,
            closeTime: `${String(nextCloseH).padStart(2, "0")}:00`,
            isEnabled: true,
          });
        } else {
          // Even if the last shift ends at 23:00 or 24:00, shorten it slightly so the new shift fits
          const adjustedClose = Math.max(lastOpenH + 1, lastCloseH - 2);
          const nextOpenH = Math.min(23, adjustedClose + 1);
          shiftsCopy[lastIdx] = {
            ...last,
            closeTime: `${String(adjustedClose).padStart(2, "0")}:00`,
            isEnabled: true,
          };
          shiftsCopy.push({
            openTime: `${String(nextOpenH).padStart(2, "0")}:00`,
            closeTime: "24:00",
            isEnabled: true,
          });
        }
      }

      next[dayIndex] = buildDayWithShifts(current.dayOfWeek, true, shiftsCopy);
      return next;
    });
  }

  // Remove a specific shift (T2, T3...) from a day
  function handleRemoveShiftFromDay(dayIndex: number, shiftIndex: number) {
    setDays((prev) => {
      const next = [...prev];
      const current = next[dayIndex];
      const shiftsCopy = (current.shifts || []).filter((_, i) => i !== shiftIndex);

      if (shiftsCopy.length === 0) {
        next[dayIndex] = buildDayWithShifts(current.dayOfWeek, false, []);
      } else {
        next[dayIndex] = buildDayWithShifts(current.dayOfWeek, true, shiftsCopy);
      }
      return next;
    });
  }

  // Copy a specific day's shifts to Monday-Friday
  function handleCopyDayToWeekdays(sourceDayIndex: number) {
    const sourceDay = days[sourceDayIndex];
    if (!sourceDay) return;

    setDays((prev) =>
      prev.map((d) => {
        if ([1, 2, 3, 4, 5].includes(d.dayOfWeek)) {
          return buildDayWithShifts(
            d.dayOfWeek,
            sourceDay.isOpen,
            (sourceDay.shifts || []).map((s) => ({ ...s }))
          );
        }
        return d;
      })
    );

    const dayLabel = dayLabels[sourceDay.dayOfWeek]?.full || (isEn ? "day" : "día");
    showToast(
      isEn
        ? `📋 ${dayLabel} schedule applied to Monday–Friday`
        : `📋 Horario de ${dayLabel} aplicado a Lunes–Viernes`,
      false
    );
  }

  // Apply 1-click smart templates
  function handleApplyPreset(preset: "continuous" | "night" | "split" | "weekdays") {
    setDays(
      ORDERED_DAYS.map((dow) => {
        if (preset === "continuous") {
          return buildDayWithShifts(dow, true, [
            { openTime: "07:00", closeTime: "22:00", isEnabled: true },
          ]);
        }
        if (preset === "night") {
          return buildDayWithShifts(dow, true, [
            { openTime: "06:00", closeTime: "23:00", isEnabled: true },
          ]);
        }
        if (preset === "split") {
          return buildDayWithShifts(dow, true, [
            { openTime: "07:00", closeTime: "12:00", isEnabled: true },
            { openTime: "15:00", closeTime: "22:00", isEnabled: true },
          ]);
        }
        // weekdays: Lun-Vie 07-22, Sab 08-14, Dom cerrado
        if ([1, 2, 3, 4, 5].includes(dow)) {
          return buildDayWithShifts(dow, true, [
            { openTime: "07:00", closeTime: "22:00", isEnabled: true },
          ]);
        }
        if (dow === 6) {
          return buildDayWithShifts(dow, true, [
            { openTime: "08:00", closeTime: "14:00", isEnabled: true },
          ]);
        }
        return buildDayWithShifts(dow, false, []);
      })
    );
    showToast(schedT("toastTemplateApplied"), false);
  }

  // Clone schedule from another real space in the organization
  async function handleCloneFromSpace(sourceSpaceId: string) {
    setCloneSourceSpaceId(sourceSpaceId);
    if (!sourceSpaceId) return;

    const sourceSpace = spaces.find((s) => s.id === sourceSpaceId);
    setIsLoadingSchedules(true);
    try {
      const res = await getSpaceSchedulesAction(sourceSpaceId);
      if (!res.ok) {
        showToast(schedT("toastLoadError", { code: res.error.code }), true);
        return;
      }
      const rawDays = Array.isArray(res.data)
        ? (res.data as unknown as DaySchedule[])
        : res.data?.days;
      setDays(normalizeDays(rawDays));
      showToast(
        isEn
          ? `📥 Schedule copied from "${sourceSpace?.spaceNumber || "selected court"}"`
          : `📥 Horario copiado desde "${sourceSpace?.spaceNumber || "cancha seleccionada"}"`,
        false
      );
    } finally {
      setIsLoadingSchedules(false);
    }
  }

  // Validate shifts before saving
  function validateAllDays(): string | null {
    for (const day of days) {
      if (!day.isOpen) continue;
      const shifts = day.shifts || [];
      const dayLabel =
        dayLabels[day.dayOfWeek]?.full ||
        (isEn ? `Day ${day.dayOfWeek}` : `Día ${day.dayOfWeek}`);

      if (shifts.length === 0) {
        return isEn
          ? `${dayLabel}: Add at least one shift or mark the day as closed.`
          : `${dayLabel}: Agrega al menos un turno o marca el día como cerrado.`;
      }

      for (let i = 0; i < shifts.length; i++) {
        const s = shifts[i];
        const openH = parseTimeHour(s.openTime, false);
        const closeH = parseTimeHour(s.closeTime, true);
        if (openH >= closeH) {
          return isEn
            ? `${dayLabel} (Shift T${i + 1}): Opening time (${formatTime(s.openTime)}) must be earlier than closing time (${formatCloseTimeLabel(s.closeTime)}).`
            : `${dayLabel} (Turno T${i + 1}): La hora de apertura (${formatTime(s.openTime)}) debe ser anterior a la de cierre (${formatCloseTimeLabel(s.closeTime)}).`;
        }
      }

      const sorted = [...shifts].sort(
        (a, b) => parseTimeHour(a.openTime, false) - parseTimeHour(b.openTime, false)
      );
      for (let i = 1; i < sorted.length; i++) {
        const prevEnd = parseTimeHour(sorted[i - 1].closeTime, true);
        const currStart = parseTimeHour(sorted[i].openTime, false);
        if (prevEnd > currStart) {
          return isEn
            ? `${dayLabel}: Shifts ${formatTime(sorted[i - 1].openTime)}–${formatCloseTimeLabel(sorted[i - 1].closeTime)} and ${formatTime(sorted[i].openTime)}–${formatCloseTimeLabel(sorted[i].closeTime)} overlap.`
            : `${dayLabel}: Los turnos ${formatTime(sorted[i - 1].openTime)}–${formatCloseTimeLabel(sorted[i - 1].closeTime)} y ${formatTime(sorted[i].openTime)}–${formatCloseTimeLabel(sorted[i].closeTime)} se solapan.`;
        }
      }
    }
    return null;
  }

  async function handleSaveSchedules(enableSpaceAfterSave = false) {
    if (!selectedSpace) return;

    const validationError = validateAllDays();
    if (validationError) {
      showToast(validationError, true);
      return;
    }

    setIsSaving(true);

    const payload: WeeklySchedulesInput = {
      days: days.map((d) => {
        const sortedShifts = d.isOpen
          ? [...(d.shifts || [])].sort(
              (a, b) =>
                parseTimeHour(a.openTime, false) - parseTimeHour(b.openTime, false)
            )
          : [];
        return buildDayWithShifts(d.dayOfWeek, d.isOpen, sortedShifts);
      }),
      applyToAllVenueSpaces,
      alsoApplyToSameSportInVenue: alsoApplyToSameSport,
      enableSpace: enableSpaceAfterSave,
    };

    const res = await updateSpaceSchedulesAction(selectedSpace.id, payload);
    setIsSaving(false);

    if (res.ok) {
      const updatedIds: string[] = Array.isArray(res.data?.updatedSpaceIds)
        ? res.data.updatedSpaceIds
        : [selectedSpace.id];

      setSavedDays(payload.days);
      setDays(payload.days);
      setAlsoApplyToSameSport(false);
      setApplyToAllVenueSpaces(false);

      // Update local spaces state so the left rail reflects the new hours & enabled status immediately
      setSpaces((prev) =>
        prev.map((sp) => {
          if (updatedIds.includes(sp.id)) {
            return {
              ...sp,
              status: enableSpaceAfterSave ? "ENABLED" : sp.status,
              openDaysCount,
              weeklyHours: totalWeeklyHours,
            };
          }
          return sp;
        })
      );

      if (enableSpaceAfterSave) {
        showToast(
          isEn
            ? `🚀 Schedule saved and "${selectedSpace.spaceNumber}" enabled for bookings`
            : `🚀 Horario guardado y "${selectedSpace.spaceNumber}" habilitada para reservas`,
          false
        );
      } else if (applyToAllVenueSpaces || alsoApplyToSameSport) {
        showToast(
          schedT("toastSavedAll", { count: updatedIds.length }),
          false
        );
      } else {
        showToast(schedT("toastSavedSingle"), false);
      }
    } else {
      showToast(
        res.error?.code || schedT("toastSaveError", { code: "ERROR" }),
        true
      );
    }
  }

  const previewDay = useMemo(
    () => days.find((d) => d.dayOfWeek === previewDayOfWeek) || days[0],
    [days, previewDayOfWeek]
  );

  const selectedSportName = selectedSpace
    ? getSpaceSportName(selectedSpace, isEn)
    : isEn
      ? "Sport"
      : "Deporte";
  const selectedFormatLabel = selectedSpace
    ? getSpaceFormatLabel(selectedSpace, isEn)
    : "";
  const selectedSportEmoji = getSportEmoji(selectedSportName);
  const selectedVenueName =
    selectedSpace?.venueName ||
    selectedSpace?.venue?.name ||
    selectedVenue?.name ||
    topT("defaultVenueName");
  const heroImageUrl = selectedSpace?.imageUrl || selectedVenue?.imageUrl || null;
  const currencySymbol = selectedSpace?.currencyCode === "EUR" ? "€" : "$";

  return (
    <div className="schedules-page pb-12">
      {/* Top Page Title & Context */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold tracking-wider text-link uppercase">
              {topT("schedulesSubtitle", { venueName: selectedVenueName })}
            </span>
            <span className="badge badge-available text-[10px]">
              {isEn ? "Per-Court Setup" : "Configuración por Cancha"}
            </span>
          </div>
          <h1 className="mt-0.5 text-[22px] font-extrabold text-foreground">
            {topT("schedulesTitle")}
          </h1>
        </div>

        {selectedSpace && (
          <Link
            href={`${ROUTES.spaces}?venueId=${encodeURIComponent(selectedSpace.venueId)}`}
            className="btn btn-outline text-xs"
          >
            <span>⚙️</span>
            <span>{isEn ? "Go to Court Configurator" : "Ir a Configurador de Canchas"}</span>
          </Link>
        )}
      </div>

      {/* Toast Feedback Banner */}
      {toast && (
        <div className="mb-3 px-5">
          <div
            className={`flex items-center justify-between rounded-xl border px-4 py-3 text-[13.5px] font-semibold shadow-sm ${
              toast.isError
                ? "border-status-cancelled-border bg-status-cancelled-bg text-status-cancelled-fg"
                : "border-status-available-border bg-status-available-bg text-status-available-fg"
            }`}
          >
            <span>{toast.message}</span>
            <button
              type="button"
              onClick={() => setToast(null)}
              aria-label={isEn ? "Close notification" : "Cerrar notificación"}
              className="cursor-pointer border-none bg-transparent font-bold text-current"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Two-Column Space-First Workspace */}
      <div className="grid grid-cols-1 items-start gap-5 px-5 lg:grid-cols-[310px_minmax(0,1fr)]">
        {/* =====================================================================
            LEFT RAIL: STICKY SPACE SELECTOR GROUPED BY VENUE
            ===================================================================== */}
        <aside className="flex flex-col overflow-hidden rounded-[20px] border border-border bg-surface shadow-card lg:sticky lg:top-20 lg:max-h-[calc(100vh-100px)]">
          {/* Search, Searchable Venue Combobox & Sport Filter Header */}
          <div className="border-b border-border bg-muted/30 p-4">
            <div className="mb-2.5 flex items-center justify-between">
              <span className="text-xs font-extrabold tracking-wider text-muted-foreground uppercase">
                {isEn ? "1. Select Court" : "1. Seleccionar Cancha"}
              </span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-bold text-foreground">
                {filteredSpaces.length}{" "}
                {filteredSpaces.length === 1
                  ? isEn
                    ? "court"
                    : "cancha"
                  : isEn
                    ? "courts"
                    : "canchas"}
              </span>
            </div>

            {/* Cascading Organization Selector (Platform Roles) */}
            {showOrganizationFilter && (
              <div ref={orgDropdownRef} className="relative mb-2">
                <div
                  className={`flex items-center gap-1.5 rounded-xl border bg-surface px-2.5 py-1.5 transition-all ${
                    isOrgDropdownOpen
                      ? "border-accent ring-2 ring-accent/30"
                      : "border-border-medium hover:border-border-strong"
                  }`}
                >
                  <span className="shrink-0 text-xs">🏢</span>
                  <input
                    type="text"
                    value={isOrgDropdownOpen ? orgFilterQuery : activeOrgFilterName}
                    onFocus={() => {
                      setIsOrgDropdownOpen(true);
                      setOrgFilterQuery("");
                    }}
                    onChange={(e) => {
                      setIsOrgDropdownOpen(true);
                      setOrgFilterQuery(e.target.value);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") {
                        setIsOrgDropdownOpen(false);
                        setOrgFilterQuery("");
                      } else if (e.key === "Enter" && isOrgDropdownOpen) {
                        e.preventDefault();
                        if (filteredOrgOptions.length > 0) {
                          const firstOrg = filteredOrgOptions[0];
                          setActiveOrgFilter(firstOrg.id);
                          setGlobalOrgId?.(firstOrg.id);
                          setActiveVenueFilter("ALL");
                          setActiveSportFilter("ALL");
                          setIsOrgDropdownOpen(false);
                          setOrgFilterQuery("");
                          const orgVIds = new Set(firstOrg.venues.map((v) => v.id));
                          const firstSp = spaces.find((sp) => orgVIds.has(sp.venueId));
                          if (firstSp && !hasUnsavedChanges) {
                            void handleSelectSpace(firstSp.id);
                          }
                        }
                      }
                    }}
                    placeholder={isEn ? "Search organization or tax ID..." : "Buscar organización o RIF..."}
                    aria-label={isEn ? "Filter by organization" : "Filtrar por organización"}
                    className="w-full min-w-0 border-none bg-transparent text-[12.5px] font-bold text-foreground outline-none placeholder:font-normal placeholder:text-muted-foreground"
                  />
                  {activeOrgFilter !== "ALL" && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveOrgFilter("ALL");
                        setGlobalOrgId?.("ALL");
                        setActiveVenueFilter("ALL");
                        setOrgFilterQuery("");
                        setIsOrgDropdownOpen(false);
                      }}
                      title={isEn ? "View all organizations" : "Ver todas las organizaciones"}
                      className="cursor-pointer rounded-md border-none bg-muted px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground hover:text-foreground"
                    >
                      ✕
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setIsOrgDropdownOpen((prev) => !prev);
                      setOrgFilterQuery("");
                    }}
                    className="cursor-pointer border-none bg-transparent px-1 text-xs text-muted-foreground"
                    aria-label={isEn ? "Open organization list" : "Abrir lista de organizaciones"}
                  >
                    ▾
                  </button>
                </div>

                {isOrgDropdownOpen && (
                  <div className="absolute right-0 left-0 z-40 mt-1 max-h-60 overflow-y-auto rounded-xl border border-border-medium bg-surface p-1.5 shadow-xl">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveOrgFilter("ALL");
                        setGlobalOrgId?.("ALL");
                        setActiveVenueFilter("ALL");
                        setIsOrgDropdownOpen(false);
                        setOrgFilterQuery("");
                      }}
                      className={`flex w-full cursor-pointer items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs font-bold transition-colors ${
                        activeOrgFilter === "ALL"
                          ? "bg-accent/20 text-foreground"
                          : "text-foreground hover:bg-muted"
                      }`}
                    >
                      <span>🌐 {isEn ? "All organizations" : "Todas las organizaciones"}</span>
                      <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                        {organizations.length}{" "}
                        {isEn
                          ? organizations.length === 1
                            ? "ally"
                            : "allies"
                          : organizations.length === 1
                            ? "aliado"
                            : "aliados"}
                      </span>
                    </button>

                    {filteredOrgOptions.length === 0 ? (
                      <div className="px-3 py-3 text-center text-xs text-muted-foreground">
                        {isEn
                          ? `No organization found matching «${orgFilterQuery}»`
                          : `No se encontró organización con «${orgFilterQuery}»`}
                      </div>
                    ) : (
                      filteredOrgOptions.map((org) => {
                        const isSelectedOrg = activeOrgFilter === org.id;
                        return (
                          <button
                            key={org.id}
                            type="button"
                            onClick={() => {
                              setActiveOrgFilter(org.id);
                              setGlobalOrgId?.(org.id);
                              setActiveVenueFilter("ALL");
                              setActiveSportFilter("ALL");
                              setIsOrgDropdownOpen(false);
                              setOrgFilterQuery("");
                              const orgVIds = new Set(org.venues.map((v) => v.id));
                              const firstSp = spaces.find((sp) =>
                                orgVIds.has(sp.venueId),
                              );
                              if (firstSp && !hasUnsavedChanges) {
                                void handleSelectSpace(firstSp.id);
                              }
                            }}
                            className={`mt-0.5 flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold transition-colors ${
                              isSelectedOrg
                                ? "bg-accent/20 font-bold text-foreground"
                                : "text-foreground hover:bg-muted"
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="truncate font-bold text-foreground">
                                🏢 {org.tradeName}
                              </div>
                              {org.rif && (
                                <div className="truncate text-[10px] text-muted-foreground">
                                  {org.rif}
                                </div>
                              )}
                            </div>
                            <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                              {org.venuesCount}{" "}
                              {org.venuesCount === 1
                                ? isEn
                                  ? "venue"
                                  : "sede"
                                : isEn
                                  ? "venues"
                                  : "sedes"}{" "}
                              · {org.spacesCount}c
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Searchable Venue Selector (Typeahead Combobox) */}
            <div ref={venueDropdownRef} className="relative mb-2">
              <div
                className={`flex items-center gap-1.5 rounded-xl border bg-surface px-2.5 py-1.5 transition-all ${
                  isVenueDropdownOpen
                    ? "border-accent ring-2 ring-accent/30"
                    : "border-border-medium hover:border-border-strong"
                }`}
              >
                <span className="shrink-0 text-xs">📍</span>
                <input
                  type="text"
                  value={
                    isVenueDropdownOpen
                      ? venueFilterQuery
                      : activeVenueFilterName
                  }
                  onFocus={() => {
                    setIsVenueDropdownOpen(true);
                    setVenueFilterQuery("");
                  }}
                  onChange={(e) => {
                    setIsVenueDropdownOpen(true);
                    setVenueFilterQuery(e.target.value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setIsVenueDropdownOpen(false);
                      setVenueFilterQuery("");
                    } else if (e.key === "Enter" && isVenueDropdownOpen) {
                      e.preventDefault();
                      if (filteredVenueOptions.length > 0) {
                        const first = filteredVenueOptions[0];
                        setActiveVenueFilter(first.id);
                        setIsVenueDropdownOpen(false);
                        setVenueFilterQuery("");
                      }
                    }
                  }}
                  placeholder={isEn ? "Type or select venue..." : "Escribir o elegir sede..."}
                  aria-label={isEn ? "Filter by venue" : "Filtrar por sede"}
                  className="w-full min-w-0 border-none bg-transparent text-[12.5px] font-bold text-foreground outline-none placeholder:font-normal placeholder:text-muted-foreground"
                />
                {activeVenueFilter !== "ALL" && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveVenueFilter("ALL");
                      setVenueFilterQuery("");
                      setIsVenueDropdownOpen(false);
                    }}
                    title={isEn ? "View all venues" : "Ver todas las sedes"}
                    className="cursor-pointer rounded-md border-none bg-muted px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground hover:text-foreground"
                  >
                    ✕
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setIsVenueDropdownOpen((prev) => !prev);
                    setVenueFilterQuery("");
                  }}
                  className="cursor-pointer border-none bg-transparent px-1 text-xs text-muted-foreground"
                  aria-label={isEn ? "Open venue list" : "Abrir lista de sedes"}
                >
                  ▾
                </button>
              </div>

              {isVenueDropdownOpen && (
                <div className="absolute right-0 left-0 z-30 mt-1 max-h-56 overflow-y-auto rounded-xl border border-border-medium bg-surface p-1.5 shadow-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveVenueFilter("ALL");
                      setIsVenueDropdownOpen(false);
                      setVenueFilterQuery("");
                    }}
                    className={`flex w-full cursor-pointer items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs font-bold transition-colors ${
                      activeVenueFilter === "ALL"
                        ? "bg-accent/20 text-foreground"
                        : "text-foreground hover:bg-muted"
                    }`}
                  >
                    <span>🌐 {isEn ? "All venues" : "Todas las sedes"}</span>
                    <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                      {orgScopedSpaces.length === 1
                        ? isEn
                          ? "1 court"
                          : "1 cancha"
                        : isEn
                          ? `${orgScopedSpaces.length} courts`
                          : `${orgScopedSpaces.length} canchas`}
                    </span>
                  </button>

                  {filteredVenueOptions.length === 0 ? (
                    <div className="px-3 py-3 text-center text-xs text-muted-foreground">
                      {isEn
                        ? `No venue found matching «${venueFilterQuery}»`
                        : `No se encontró ninguna sede con «${venueFilterQuery}»`}
                    </div>
                  ) : (
                    filteredVenueOptions.map((v) => {
                      const isSelectedVenue = activeVenueFilter === v.id;
                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => {
                            setActiveVenueFilter(v.id);
                            setActiveSportFilter("ALL");
                            setIsVenueDropdownOpen(false);
                            setVenueFilterQuery("");
                            const firstInVenue = spaces.find(
                              (sp) => sp.venueId === v.id
                            );
                            if (
                              firstInVenue &&
                              selectedSpace?.venueId !== v.id &&
                              !hasUnsavedChanges
                            ) {
                              void handleSelectSpace(firstInVenue.id);
                            }
                          }}
                          className={`mt-0.5 flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold transition-colors ${
                            isSelectedVenue
                              ? "bg-accent/20 font-bold text-foreground"
                              : "text-foreground hover:bg-muted"
                          }`}
                        >
                          <span className="truncate">📍 {v.name}</span>
                          <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                            {v.count === 1
                              ? isEn
                                ? "1 court"
                                : "1 cancha"
                              : isEn
                                ? `${v.count} courts`
                                : `${v.count} canchas`}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isEn ? "🔍 Search court or sport..." : "🔍 Buscar cancha o deporte..."}
              className="input-field w-full px-3 py-2 text-[12.5px]"
            />

            {availableSports.length > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setActiveSportFilter("ALL")}
                  className={`cursor-pointer rounded-full border px-2.5 py-1 text-[11px] font-bold transition-all ${
                    activeSportFilter === "ALL"
                      ? "border-accent bg-accent text-accent-foreground"
                      : "border-border bg-surface text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {isEn ? "All" : "Todas"}
                </button>
                {availableSports.map((sp) => (
                  <button
                    key={sp.name}
                    type="button"
                    onClick={() => setActiveSportFilter(sp.name)}
                    className={`cursor-pointer rounded-full border px-2.5 py-1 text-[11px] font-bold transition-all ${
                      activeSportFilter === sp.name
                        ? "border-accent bg-accent text-accent-foreground"
                        : "border-border bg-surface text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {sp.emoji} {sp.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Scrollable Grouped Spaces List */}
          <div className="flex flex-1 flex-col gap-3.5 overflow-y-auto p-3">
            {spacesGroupedByVenue.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                {isEn
                  ? "No courts found matching that filter."
                  : "No se encontraron canchas con ese filtro."}
              </div>
            ) : (
              spacesGroupedByVenue.map((group) => (
                <div key={group.venueId}>
                  <div className="mb-1.5 flex items-center gap-1.5 px-2 text-[11px] font-extrabold tracking-wider text-muted-foreground uppercase">
                    <span>📍</span>
                    <span className="truncate">{group.venueName}</span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {group.items.map((sp) => {
                      const isSelected = sp.id === selectedSpace?.id;
                      const sportName = getSpaceSportName(sp, isEn);
                      const emoji = getSportEmoji(sportName);
                      const isEnabled = sp.status === "ENABLED";

                      const displayOpenDays = isSelected
                        ? openDaysCount
                        : sp.openDaysCount ?? 0;
                      const displayWeeklyHours = isSelected
                        ? totalWeeklyHours
                        : sp.weeklyHours ?? 0;

                      return (
                        <button
                          key={sp.id}
                          type="button"
                          onClick={() => handleSelectSpace(sp.id)}
                          className={` flex w-full cursor-pointer items-center gap-2.5 rounded-2xl border p-2.5 text-left transition-all ${
                            isSelected
                              ? "border-2 border-accent bg-accent/15 shadow-xs"
                              : "border-border bg-surface hover:border-border-medium hover:bg-muted/40"
                          }`}
                        >
                          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border bg-muted text-base">
                            {emoji}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1.5">
                              <span className="truncate text-[13px] font-bold text-foreground">
                                {sp.spaceNumber}
                              </span>
                              <span
                                className={`size-2 shrink-0 rounded-full ${
                                  isEnabled
                                    ? "bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.2)]"
                                    : "bg-amber-500 shadow-[0_0_0_3px_rgba(245,158,11,0.2)]"
                                }`}
                                title={
                                  isEnabled
                                    ? isEn
                                      ? "Enabled"
                                      : "Habilitada"
                                    : isEn
                                      ? "Disabled (Paused)"
                                      : "Deshabilitada (Pausada)"
                                }
                              />
                            </div>
                            <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                              <span className="truncate">{sportName}</span>
                              <span>•</span>
                              <span className="font-semibold text-foreground">
                                {sp.currencyCode === "EUR" ? "€" : "$"}
                                {Number(sp.pricePerHour).toFixed(0)}/h
                              </span>
                            </div>
                            <div
                              className={`mt-1 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-[10.5px] font-semibold ${
                                !isEnabled || displayOpenDays === 0
                                  ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              <span>
                                {!isEnabled
                                  ? isEn
                                    ? "⏸️ Disabled ·"
                                    : "⏸️ Deshabilitada ·"
                                  : "🕒"}
                              </span>
                              <span>
                                {displayOpenDays > 0
                                  ? `${displayOpenDays}d · ${displayWeeklyHours}${isEn ? "h/wk" : "h/sem"}`
                                  : isEn
                                    ? "No schedule"
                                    : "Sin horario"}
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* =====================================================================
            RIGHT MAIN WORKSPACE: SPACE SCHEDULE CONFIGURATOR
            ===================================================================== */}
        {!selectedSpace ? (
          <div className="rounded-[20px] border border-border bg-surface p-10 text-center">
            <div className="text-lg font-bold text-foreground">
              {isEn
                ? "No courts registered yet"
                : "No hay canchas registradas todavía"}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {isEn
                ? "Create a court first in the Court Configurator to define its shifts and schedules."
                : "Crea primero una cancha en el Configurador de Canchas para definir sus turnos y horarios."}
            </p>
            <Link
              href={ROUTES.spaces}
              className="btn btn-primary mt-4 inline-flex"
            >
              {isEn ? "+ Create Court" : "+ Crear Cancha"}
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* 1. ONBOARDING / PAUSED COURT BANNER */}
            {selectedSpace.status === "DISABLED" && (
              <div className="flex flex-wrap items-center justify-between gap-3.5 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-5 py-3.5">
                <div className="flex items-center gap-3.5">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-lg">
                    ⚡
                  </div>
                  <div>
                    <div className="text-sm font-extrabold text-foreground">
                      {isEn ? (
                        <>
                          Configure the schedule for{" "}
                          <span className="underline">
                            {selectedSpace.spaceNumber}
                          </span>{" "}
                          to enable it!
                        </>
                      ) : (
                        <>
                          ¡Configura el horario de{" "}
                          <span className="underline">
                            {selectedSpace.spaceNumber}
                          </span>{" "}
                          para habilitarla!
                        </>
                      )}
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {isEn ? (
                        <>
                          This court is currently{" "}
                          <strong>Disabled (Paused)</strong>. Set its daily
                          shifts and click{" "}
                          <strong>«Save Schedule &amp; Enable Court»</strong> to
                          activate it in the player app.
                        </>
                      ) : (
                        <>
                          Esta cancha está actualmente{" "}
                          <strong>Deshabilitada (Pausada)</strong>. Define sus
                          turnos por día y haz clic en{" "}
                          <strong>«Guardar Horario y Habilitar Cancha»</strong>{" "}
                          para activarla en la app de clientes.
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <span className="badge badge-hold shrink-0">
                  {isEn
                    ? "Step 2 of 2: Set Schedule"
                    : "Paso 2 de 2: Definir Horario"}
                </span>
              </div>
            )}

            {/* 2. ACTIVE SPACE HERO HEADER */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-[20px] border border-border bg-surface p-5 shadow-card">
              <div className="flex min-w-[260px] flex-1 items-center gap-4">
                {heroImageUrl ? (
                  <img
                    src={heroImageUrl}
                    alt={selectedSpace.spaceNumber}
                    className="h-18 w-24 shrink-0 rounded-2xl border border-border object-cover"
                  />
                ) : (
                  <div className="flex h-18 w-24 shrink-0 items-center justify-center rounded-2xl border border-border bg-muted text-3xl">
                    {selectedSportEmoji}
                  </div>
                )}

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-extrabold tracking-wider text-muted-foreground uppercase">
                      📍 {selectedVenueName}
                    </span>
                    {selectedSpace.status === "ENABLED" ? (
                      <span className="badge badge-available">
                        {isEn ? "🟢 Enabled in App" : "🟢 Habilitada en App"}
                      </span>
                    ) : (
                      <span className="badge badge-hold">
                        {isEn
                          ? "⏸️ Disabled (Paused)"
                          : "⏸️ Deshabilitada (Pausada)"}
                      </span>
                    )}
                  </div>

                  <h2 className="mt-0.5 text-xl font-extrabold text-foreground">
                    {selectedSpace.spaceNumber}
                  </h2>

                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-lg border border-border bg-muted px-2.5 py-1 text-xs font-semibold text-foreground">
                      {selectedSportEmoji} {selectedFormatLabel}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-lg border border-border bg-muted px-2.5 py-1 text-xs font-semibold text-foreground">
                      🌱{" "}
                      {selectedSpace.surfaceType ||
                        (isEn ? "Standard Surface" : "Superficie Estándar")}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-lg border border-border bg-muted px-2.5 py-1 text-xs font-semibold text-foreground">
                      💵 {currencySymbol}
                      {Number(selectedSpace.pricePerHour).toFixed(2)}{" "}
                      {isEn ? "/ hour" : "/ hora"}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-lg border border-border bg-muted px-2.5 py-1 text-xs font-semibold text-foreground">
                      {selectedSpace.isCovered
                        ? isEn
                          ? "🏠 Covered"
                          : "🏠 Techada"
                        : isEn
                          ? "☀️ Outdoor"
                          : "☀️ Exterior"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right KPI Summary Boxes */}
              <div className="flex items-center gap-3">
                <div className="min-w-[115px] rounded-2xl border border-border bg-muted/60 px-3.5 py-2.5 text-center">
                  <span className="block font-display text-lg font-extrabold text-foreground">
                    {openDaysCount} / 7 {isEn ? "days" : "días"}
                  </span>
                  <span className="text-[10.5px] font-bold tracking-wider text-muted-foreground uppercase">
                    {isEn ? "Open Days" : "Días Abiertos"}
                  </span>
                </div>
                <div className="min-w-[115px] rounded-2xl border border-border bg-muted/60 px-3.5 py-2.5 text-center">
                  <span className="block font-display text-lg font-extrabold text-link">
                    {totalWeeklyHours} hrs
                  </span>
                  <span className="text-[10.5px] font-bold tracking-wider text-muted-foreground uppercase">
                    {isEn ? "Weekly Total" : "Total Semanal"}
                  </span>
                </div>
              </div>
            </div>

            {/* 3. SMART PRESETS & CLONE BAR */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface px-4 py-3 shadow-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-extrabold tracking-wider text-muted-foreground uppercase">
                  {isEn ? "⚡ Quick Templates:" : "⚡ Plantillas Rápidas:"}
                </span>
                <button
                  type="button"
                  onClick={() => handleApplyPreset("continuous")}
                  className="cursor-pointer rounded-xl border border-border bg-muted/60 px-3 py-1.5 text-xs font-bold text-foreground transition-all hover:border-accent hover:bg-accent/20"
                >
                  ☀️ {isEn ? "Continuous" : "Continuo"} ({formatTime("07:00")} – {formatTime("22:00")})
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset("night")}
                  className="cursor-pointer rounded-xl border border-border bg-muted/60 px-3 py-1.5 text-xs font-bold text-foreground transition-all hover:border-accent hover:bg-accent/20"
                >
                  🌙 {isEn ? "Night" : "Nocturno"} ({formatTime("06:00")} – {formatTime("23:00")})
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset("split")}
                  className="cursor-pointer rounded-xl border border-border bg-muted/60 px-3 py-1.5 text-xs font-bold text-foreground transition-all hover:border-accent hover:bg-accent/20"
                >
                  ✂️{" "}
                  {isEn
                    ? `2 Shifts (${formatTime("07:00")}–${formatTime("12:00")} & ${formatTime("15:00")}–${formatTime("22:00")})`
                    : `2 Turnos (${formatTime("07:00")}–${formatTime("12:00")} y ${formatTime("15:00")}–${formatTime("22:00")})`}
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset("weekdays")}
                  className="cursor-pointer rounded-xl border border-border bg-muted/60 px-3 py-1.5 text-xs font-bold text-foreground transition-all hover:border-accent hover:bg-accent/20"
                >
                  🏢 {isEn ? "Mon–Fri + Sat Noon" : "Lun–Vie + Sáb Mediodía"}
                </button>
              </div>

              {spaces.length > 1 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-muted-foreground">
                    {isEn ? "📥 Copy from:" : "📥 Copiar de:"}
                  </span>
                  <select
                    value={cloneSourceSpaceId}
                    onChange={(e) => handleCloneFromSpace(e.target.value)}
                    disabled={isLoadingSchedules}
                    className="input-field form-select px-3 py-1.5 text-xs font-semibold"
                  >
                    <option value="">
                      {isEn
                        ? "Select another court..."
                        : "Seleccionar otra cancha..."}
                    </option>
                    {spaces
                      .filter((s) => s.id !== selectedSpace.id)
                      .map((s) => {
                        const sSport = getSpaceSportName(s, isEn);
                        const sEmoji = getSportEmoji(sSport);
                        const sVenue =
                          s.venueName ||
                          s.venue?.name ||
                          venues.find((v) => v.id === s.venueId)?.name ||
                          "";
                        return (
                          <option key={s.id} value={s.id}>
                            {sEmoji} {s.spaceNumber} ({sVenue})
                          </option>
                        );
                      })}
                  </select>
                </div>
              )}
            </div>

            {/* 4. COMPACT 7-DAY MULTI-SHIFT MATRIX */}
            <div className="overflow-hidden rounded-[20px] border border-border bg-surface shadow-card">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/30 px-5 py-3.5">
                <div>
                  <span className="text-[13px] font-extrabold text-foreground">
                    {isEn
                      ? "📅 Weekly Daily Shifts Matrix"
                      : "📅 Matriz Semanal de Turnos por Día"}
                  </span>
                  <span className="ml-2.5 text-xs text-muted-foreground">
                    {isEn
                      ? "Add as many shifts (T1, T2, T3...) as needed to accommodate fixed blocks, clubs, or maintenance"
                      : "Agrega tantos turnos (T1, T2, T3...) como necesites para adaptar bloqueos fijos, clubes o mantenimientos"}
                  </span>
                </div>
                <span className="text-[11px] font-bold text-muted-foreground">
                  {timeFormat === "12h"
                    ? isEn
                      ? "Visual timeline (12:00 AM → 12:00 AM)"
                      : "Línea de tiempo visual (12:00 AM → 12:00 AM)"
                    : isEn
                      ? "24h visual timeline (00:00 → 24:00)"
                      : "Línea de tiempo visual 24h (00:00 → 24:00)"}
                </span>
              </div>

              {isLoadingSchedules ? (
                <div className="py-12 text-center text-sm font-semibold text-muted-foreground">
                  {isEn
                    ? "⏳ Loading court schedules..."
                    : "⏳ Cargando horarios de la cancha..."}
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {days.map((day, dayIdx) => {
                    const dayInfo = dayLabels[day.dayOfWeek] || {
                      full: isEn
                        ? `Day ${day.dayOfWeek}`
                        : `Día ${day.dayOfWeek}`,
                      short: `D${day.dayOfWeek}`,
                    };
                    const shifts = day.shifts || [];
                    const dayHours = calcDayActiveHours(day);

                    return (
                      <div
                        key={day.dayOfWeek}
                        className={`grid grid-cols-1 items-center gap-4 px-5 py-3.5 transition-colors xl:grid-cols-[165px_minmax(0,1fr)_175px_auto] ${
                          day.isOpen
                            ? "bg-surface hover:bg-muted/20"
                            : "bg-muted/30 opacity-75"
                        }`}
                      >
                        {/* Col 1: Open/Closed Switch + Day Name */}
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            role="switch"
                            aria-checked={day.isOpen}
                            onClick={() => handleToggleDayOpen(dayIdx)}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
                              day.isOpen ? "bg-accent" : "bg-border-medium"
                            }`}
                          >
                            <span
                              className={`inline-block size-4.5 transform rounded-full transition-transform ${
                                day.isOpen
                                  ? "translate-x-5.5 bg-accent-foreground"
                                  : "translate-x-1 bg-white"
                              }`}
                            />
                          </button>
                          <div>
                            <div className="text-sm font-extrabold text-foreground">
                              {dayInfo.full}
                            </div>
                            <div className="text-[11px] font-semibold text-muted-foreground">
                              {day.isOpen
                                ? `${dayHours}h · ${shifts.length} ${
                                    shifts.length === 1
                                      ? isEn
                                        ? "shift"
                                        : "turno"
                                      : isEn
                                        ? "shifts"
                                        : "turnos"
                                  }`
                                : isEn
                                  ? "Closed"
                                  : "Cerrado"}
                            </div>
                          </div>
                        </div>

                        {/* Col 2: Unlimited Shifts (T1, T2, T3, T4...) */}
                        <div className="flex min-w-0 flex-wrap items-center gap-2">
                          {day.isOpen ? (
                            <>
                              {shifts.map((shift, sIdx) => {
                                const prevShift = sIdx > 0 ? shifts[sIdx - 1] : null;
                                const prevEndH = prevShift
                                  ? parseTimeHour(prevShift.closeTime, true)
                                  : 0;
                                const currStartH = parseTimeHour(shift.openTime, false);
                                const currEndH = parseTimeHour(shift.closeTime, true);
                                const isInvalidRange = currStartH >= currEndH;
                                const isOverlapping =
                                  prevShift !== null && prevEndH > currStartH;
                                const hasRecess =
                                  prevShift !== null && prevEndH < currStartH;

                                const remainingShiftsAfter =
                                  shifts.length - 1 - sIdx;
                                const maxOpenH = Math.max(
                                  0,
                                  23 - remainingShiftsAfter
                                );
                                const maxCloseH = Math.max(
                                  1,
                                  24 - remainingShiftsAfter
                                );

                                const validOpenOptions = OPEN_HOUR_OPTIONS.filter(
                                  (h) => {
                                    const hNum = parseTimeHour(h, false);
                                    const minH = sIdx === 0 ? 0 : prevEndH;
                                    return hNum >= minH && hNum <= maxOpenH;
                                  }
                                );

                                const validCloseOptions = CLOSE_HOUR_OPTIONS.filter(
                                  (h) => {
                                    const hNum = parseTimeHour(h, true);
                                    return hNum > currStartH && hNum <= maxCloseH;
                                  }
                                );

                                return (
                                  <React.Fragment key={sIdx}>
                                    {hasRecess && prevShift && (
                                      <span
                                        className="inline-flex items-center gap-1 rounded-lg bg-muted px-2 py-1 text-[11px] font-semibold text-muted-foreground"
                                        title={
                                          isEn
                                            ? "Break or fixed block between shifts"
                                            : "Receso o bloqueo fijo entre turnos"
                                        }
                                      >
                                        ☕ {isEn ? "Break" : "Receso"}{" "}
                                        {formatTime(prevShift.closeTime)}–
                                        {formatTime(shift.openTime)}
                                      </span>
                                    )}
                                    {isOverlapping && (
                                      <span className="inline-flex items-center gap-1 rounded-lg bg-status-cancelled-bg px-2 py-1 text-[11px] font-bold text-status-cancelled-fg">
                                        ⚠️ {isEn ? "Overlapping" : "Solapado"}
                                      </span>
                                    )}

                                    <div
                                      className={`inline-flex max-w-full items-center gap-1.5 rounded-xl border px-2.5 py-1 ${
                                        isInvalidRange || isOverlapping
                                          ? "border-status-cancelled-border bg-status-cancelled-bg/30"
                                          : sIdx % 2 === 1
                                          ? "border-accent/60 bg-accent/10"
                                          : "border-border-medium bg-muted/50"
                                      }`}
                                    >
                                      <span
                                        className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-extrabold uppercase ${
                                          sIdx % 2 === 1
                                            ? "bg-forest-900 text-accent dark:bg-accent dark:text-forest-950"
                                            : "bg-accent text-accent-foreground"
                                        }`}
                                      >
                                        T{sIdx + 1}
                                      </span>

                                      <select
                                        value={shift.openTime}
                                        onChange={(e) =>
                                          handleUpdateShiftTime(
                                            dayIdx,
                                            sIdx,
                                            "openTime",
                                            e.target.value
                                          )
                                        }
                                        aria-label={
                                          isEn
                                            ? `${dayInfo.full} Shift ${sIdx + 1} Open`
                                            : `${dayInfo.full} Turno ${sIdx + 1} Apertura`
                                        }
                                        className="w-auto cursor-pointer border-none bg-transparent py-0.5 font-mono text-[12.5px] font-bold text-foreground outline-none"
                                      >
                                        {validOpenOptions.map((h) => (
                                          <option
                                            key={h}
                                            value={h}
                                            className="bg-surface text-foreground"
                                          >
                                            {formatTime(h)}
                                          </option>
                                        ))}
                                      </select>

                                      <span className="shrink-0 text-xs text-muted-foreground">
                                        →
                                      </span>

                                      <select
                                        value={normalizeCloseTimeString(shift.closeTime)}
                                        onChange={(e) =>
                                          handleUpdateShiftTime(
                                            dayIdx,
                                            sIdx,
                                            "closeTime",
                                            e.target.value
                                          )
                                        }
                                        aria-label={
                                          isEn
                                            ? `${dayInfo.full} Shift ${sIdx + 1} Close`
                                            : `${dayInfo.full} Turno ${sIdx + 1} Cierre`
                                        }
                                        className="w-auto cursor-pointer border-none bg-transparent py-0.5 font-mono text-[12.5px] font-bold text-foreground outline-none"
                                      >
                                        {validCloseOptions.map((h) => (
                                          <option
                                            key={h}
                                            value={h}
                                            className="bg-surface text-foreground"
                                          >
                                            {formatCloseTimeLabel(h)}
                                          </option>
                                        ))}
                                      </select>

                                      {shifts.length > 1 && (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleRemoveShiftFromDay(dayIdx, sIdx)
                                          }
                                          title={
                                            isEn
                                              ? `Remove shift T${sIdx + 1}`
                                              : `Quitar turno T${sIdx + 1}`
                                          }
                                          className="ml-0.5 cursor-pointer rounded-md border-none bg-transparent px-1.5 py-0.5 text-xs font-bold text-muted-foreground transition-colors hover:bg-status-cancelled-bg hover:text-status-cancelled-fg"
                                        >
                                          ✕
                                        </button>
                                      )}
                                    </div>
                                  </React.Fragment>
                                );
                              })}

                              <button
                                type="button"
                                onClick={() => handleAddShiftToDay(dayIdx)}
                                className="inline-flex cursor-pointer items-center gap-1 rounded-xl border border-dashed border-border-medium bg-transparent px-2.5 py-1.5 text-[11.5px] font-bold text-muted-foreground transition-all hover:border-accent hover:bg-accent/15 hover:text-foreground"
                              >
                                <span>+</span>
                                <span>
                                  {isEn
                                    ? `Add Shift (T${shifts.length + 1})`
                                    : `Agregar Turno (T${shifts.length + 1})`}
                                </span>
                              </button>
                            </>
                          ) : (
                            <span className="text-xs font-semibold text-muted-foreground">
                              {isEn
                                ? "🔒 Court closed on this day — no slots available for booking"
                                : "🔒 Cancha cerrada este día — sin bloques disponibles para reservar"}
                            </span>
                          )}
                        </div>

                        {/* Col 3: 24-Hour Multi-Segment Visual Bar */}
                        <div className="flex flex-col gap-1">
                          <div className="relative h-3.5 overflow-hidden rounded-md border border-border bg-muted">
                            {day.isOpen &&
                              shifts.map((shift, sIdx) => {
                                const startH = parseTimeHour(shift.openTime, false);
                                const endH = parseTimeHour(shift.closeTime, true);
                                const leftPct = Math.max(
                                  0,
                                  Math.min(100, (startH / 24) * 100)
                                );
                                const widthPct = Math.max(
                                  0,
                                  Math.min(100 - leftPct, ((endH - startH) / 24) * 100)
                                );
                                return (
                                  <div
                                    key={sIdx}
                                    style={{
                                      left: `${leftPct}%`,
                                      width: `${widthPct}%`,
                                    }}
                                    title={`T${sIdx + 1}: ${formatTime(shift.openTime)} – ${formatCloseTimeLabel(shift.closeTime)}`}
                                    className={`absolute inset-y-0 rounded-xs ${
                                      sIdx % 2 === 1
                                        ? "bg-emerald-600 dark:bg-lime-500"
                                        : "bg-accent"
                                    }`}
                                  />
                                );
                              })}
                          </div>
                          <div className="flex justify-between font-mono text-[9.5px] text-muted-foreground">
                            <span>{timeFormat === "12h" ? "12a" : "00h"}</span>
                            <span>{timeFormat === "12h" ? "6a" : "06h"}</span>
                            <span>{timeFormat === "12h" ? "12p" : "12h"}</span>
                            <span>{timeFormat === "12h" ? "6p" : "18h"}</span>
                            <span>{timeFormat === "12h" ? "12a" : "24h"}</span>
                          </div>
                        </div>

                        {/* Col 4: Quick Copy to Weekdays */}
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleCopyDayToWeekdays(dayIdx)}
                            title={
                              isEn
                                ? `Copy ${dayInfo.full} schedule to Monday–Friday`
                                : `Copiar horario de ${dayInfo.full} a Lunes–Viernes`
                            }
                            className="cursor-pointer rounded-lg border border-border bg-surface px-2.5 py-1.5 text-[11px] font-bold whitespace-nowrap text-muted-foreground transition-all hover:border-accent hover:bg-accent/15 hover:text-foreground"
                          >
                            {isEn ? "📋 To Mon–Fri" : "📋 A Lun–Vie"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 5. LIVE CLIENT BOOKING SLOTS PREVIEW */}
            <div className="rounded-[20px] border border-border bg-surface p-5 shadow-card">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-[13px] font-extrabold text-foreground">
                    {isEn
                      ? "👁️ Bookable Slots Preview (Player App)"
                      : "👁️ Vista Previa de Bloques Reservables (App Clientes)"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {isEn ? (
                      <>
                        How players will see 1-hour slots for{" "}
                        <strong className="text-foreground">
                          {selectedSpace.spaceNumber}
                        </strong>{" "}
                        based on configured shifts:
                      </>
                    ) : (
                      <>
                        Así verán los jugadores los bloques de 1 hora para{" "}
                        <strong className="text-foreground">
                          {selectedSpace.spaceNumber}
                        </strong>{" "}
                        según los turnos configurados:
                      </>
                    )}
                  </div>
                </div>

                {/* Day selector pills for preview */}
                <div className="flex flex-wrap gap-1.5">
                  {ORDERED_DAYS.map((dow) => {
                    const label = dayLabels[dow]?.short || String(dow);
                    const isSelectedDay = previewDayOfWeek === dow;
                    return (
                      <button
                        key={dow}
                        type="button"
                        onClick={() => setPreviewDayOfWeek(dow)}
                        className={`cursor-pointer rounded-full border px-2.5 py-1 text-[11px] font-bold transition-all ${
                          isSelectedDay
                            ? "border-accent bg-accent text-accent-foreground"
                            : "border-border bg-surface text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-3.5 flex flex-wrap items-center gap-2">
                {!previewDay || !previewDay.isOpen || !previewDay.shifts?.length ? (
                  <span className="text-xs font-semibold text-muted-foreground">
                    {isEn
                      ? `🔒 Court closed on ${dayLabels[previewDayOfWeek]?.full || "selected days"}.`
                      : `🔒 Cancha cerrada los ${dayLabels[previewDayOfWeek]?.full || "días seleccionados"}.`}
                  </span>
                ) : (
                  previewDay.shifts.map((shift, sIdx) => {
                    const startH = Math.floor(parseTimeHour(shift.openTime, false));
                    const endH = Math.floor(parseTimeHour(shift.closeTime, true));
                    const prevShift =
                      sIdx > 0 ? previewDay.shifts?.[sIdx - 1] : null;
                    const hours: string[] = [];
                    for (let h = startH; h < endH; h++) {
                      hours.push(`${String(h).padStart(2, "0")}:00`);
                    }

                    return (
                      <React.Fragment key={sIdx}>
                        {prevShift && (
                          <span className="inline-flex items-center gap-1 rounded-xl border border-dashed border-border-medium bg-muted/60 px-2.5 py-1.5 text-xs font-bold text-muted-foreground">
                            ☕ {isEn ? "Break" : "Receso"}{" "}
                            {formatTime(prevShift.closeTime)}–
                            {formatTime(shift.openTime)}
                          </span>
                        )}
                        {hours.map((slot) => (
                          <span
                            key={`${sIdx}-${slot}`}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-accent/50 bg-accent/15 px-3 py-1.5 font-mono text-xs font-bold text-foreground"
                          >
                            <span>🟢</span>
                            <span>{formatTime(slot)}</span>
                            <span className="text-muted-foreground">·</span>
                            <span>
                              {currencySymbol}
                              {Number(selectedSpace.pricePerHour).toFixed(0)}
                            </span>
                          </span>
                        ))}
                      </React.Fragment>
                    );
                  })
                )}
              </div>
            </div>

            {/* 6. STICKY BOTTOM SAVE & ENABLE BAR (ONLY SHOWN WHEN CHANGES ARE DETECTED) */}
            {hasUnsavedChanges && (
              <div className="sticky bottom-4 z-20 flex flex-wrap items-center justify-between gap-4 rounded-2xl border-2 border-accent/60 bg-surface/95 px-5 py-3.5 shadow-xl backdrop-blur-md">
                <div className="flex flex-col gap-1.5">
                  {sameSportSiblingsInVenue.length > 0 && (
                    <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-foreground">
                      <input
                        type="checkbox"
                        checked={alsoApplyToSameSport}
                        onChange={(e) => {
                          setAlsoApplyToSameSport(e.target.checked);
                          if (e.target.checked) setApplyToAllVenueSpaces(false);
                        }}
                        className="size-4 accent-accent"
                      />
                      <span>
                        {isEn ? (
                          <>
                            Also replicate to other{" "}
                            <strong>{selectedSportName}</strong> courts at{" "}
                            <strong>{selectedVenueName}</strong> (+
                            {sameSportSiblingsInVenue.length})
                          </>
                        ) : (
                          <>
                            Replicar también a las demás canchas de{" "}
                            <strong>{selectedSportName}</strong> en{" "}
                            <strong>{selectedVenueName}</strong> (+
                            {sameSportSiblingsInVenue.length})
                          </>
                        )}
                      </span>
                    </label>
                  )}

                  <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground">
                    <input
                      type="checkbox"
                      checked={applyToAllVenueSpaces}
                      onChange={(e) => {
                        setApplyToAllVenueSpaces(e.target.checked);
                        if (e.target.checked) setAlsoApplyToSameSport(false);
                      }}
                      className="size-4 accent-accent"
                    />
                    <span>
                      {schedT("scopeVenueAll", { venueName: selectedVenueName })}
                    </span>
                  </label>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    disabled={isSaving || isLoadingSchedules}
                    onClick={handleDiscardChanges}
                    className="btn btn-outline text-xs"
                  >
                    {isEn ? "Discard changes" : "Descartar cambios"}
                  </button>

                  {selectedSpace.status === "DISABLED" ? (
                    <>
                      <button
                        type="button"
                        disabled={isSaving || isLoadingSchedules}
                        onClick={() => handleSaveSchedules(false)}
                        className="btn btn-outline text-xs"
                      >
                        {isEn
                          ? "💾 Save schedule only"
                          : "💾 Guardar solo horario"}
                      </button>
                      <button
                        type="button"
                        disabled={isSaving || isLoadingSchedules}
                        onClick={() => handleSaveSchedules(true)}
                        className="btn btn-primary text-xs font-extrabold"
                      >
                        {isSaving
                          ? isEn
                            ? "⏳ Saving..."
                            : "⏳ Guardando..."
                          : isEn
                            ? "🚀 Save Schedule & Enable Court"
                            : "🚀 Guardar Horario y Habilitar Cancha"}
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      disabled={isSaving || isLoadingSchedules}
                      onClick={() => handleSaveSchedules(false)}
                      className="btn btn-primary text-xs font-extrabold"
                    >
                      {isSaving
                        ? isEn
                          ? "⏳ Saving..."
                          : "⏳ Guardando..."
                        : `💾 ${schedT("btnSave")}`}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
