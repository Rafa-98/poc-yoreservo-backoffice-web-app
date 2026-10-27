"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { SessionUser } from "@/shared/auth";
import {
  getOrganizationAction,
  getVenuesListAction,
} from "@/features/venues/actions/venues-actions";
import {
  deriveOrganizationsFromVenues,
  type DerivedOrganizationOption,
  type OrganizationSummaryItem,
  type VenueItem,
} from "@/features/venues/model/types";

export interface VenueContextValue {
  venues: VenueItem[];
  scopedVenues: VenueItem[];
  organizations: DerivedOrganizationOption[];
  isPlatformRole: boolean;
  activeOrganizationId: string;
  activeOrganization: DerivedOrganizationOption | null;
  setActiveOrganizationId: (organizationId: string) => void;
  activeVenueId: string;
  activeVenue: VenueItem | null;
  setActiveVenueId: (venueId: string) => void;
  isLoading: boolean;
  isPending: boolean;
  error: string | null;
  isManagedLocked: boolean;
  refetchVenues: () => Promise<void>;
}

const VenueContext = createContext<VenueContextValue | null>(null);

const COOKIE_NAME = "yoreservo_active_venue";
const ORG_COOKIE_NAME = "yoreservo_active_org";

function setCookie(name: string, value: string, days = 365): void {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; expires=${expires}; SameSite=Lax`;
}

export interface VenueProviderProps {
  user: SessionUser;
  initialVenues?: VenueItem[];
  initialOrganizations?: OrganizationSummaryItem[];
  initialActiveOrganizationId?: string;
  initialActiveVenueId?: string;
  children: ReactNode;
}

export function VenueProvider({
  user,
  initialVenues = [],
  initialOrganizations = [],
  initialActiveOrganizationId,
  initialActiveVenueId,
  children,
}: VenueProviderProps) {
  const [venues, setVenues] = useState<VenueItem[]>(initialVenues);
  const [extraOrganizations, setExtraOrganizations] =
    useState<OrganizationSummaryItem[]>(initialOrganizations);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isPending = false;

  const isPlatformRole =
    user.role === "PLATFORM_ADMIN" || user.role === "PLATFORM_ACCOUNTING";
  const isManagedLocked =
    user.role === "ALLY_VALIDATOR" && Boolean(user.managedVenueId);

  const organizations = useMemo(
    () => deriveOrganizationsFromVenues(venues, extraOrganizations),
    [venues, extraOrganizations],
  );

  // Initialize active organization ID deterministically (defaults to first active org for platform roles)
  const [activeOrganizationId, setActiveOrganizationIdState] = useState<string>(
    () => {
      if (!isPlatformRole) {
        return venues[0]?.organizationId || "ALL";
      }
      if (initialActiveOrganizationId) {
        return initialActiveOrganizationId;
      }
      const derived = deriveOrganizationsFromVenues(
        initialVenues,
        initialOrganizations,
      );
      return derived[0]?.id || "ALL";
    },
  );

  // Initialize active venue ID deterministically from SSR cookie/lock for hydration parity
  const [activeVenueId, setActiveVenueIdState] = useState<string>(
    isManagedLocked && user.managedVenueId
      ? user.managedVenueId
      : initialActiveVenueId || "ALL",
  );

  const fetchVenues = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [res, orgsRes] = await Promise.all([
        getVenuesListAction(),
        isPlatformRole ? getOrganizationAction() : Promise.resolve(null),
      ]);
      if (res.ok) {
        setVenues(Array.isArray(res.data) ? res.data : []);
      } else {
        setError(res.error?.code || "Failed to load venues");
      }
      if (orgsRes && orgsRes.ok && Array.isArray(orgsRes.data?.organizations)) {
        setExtraOrganizations(orgsRes.data.organizations);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error fetching venues");
    } finally {
      setIsLoading(false);
    }
  }, [isPlatformRole]);

  useEffect(() => {
    if (initialVenues.length > 0) {
      setVenues(initialVenues);
    }
  }, [initialVenues]);

  useEffect(() => {
    if (initialOrganizations.length > 0) {
      setExtraOrganizations(initialOrganizations);
    }
  }, [initialOrganizations]);

  const setActiveOrganizationId = useCallback(
    (newOrgId: string) => {
      if (isManagedLocked) return;
      setActiveOrganizationIdState(newOrgId);
      setCookie(ORG_COOKIE_NAME, newOrgId);

      // When changing organization, reset activeVenueId to "ALL" (all venues of that org)
      // unless the currently selected venue belongs to the new organization
      setActiveVenueIdState((prevVenueId) => {
        if (prevVenueId === "ALL") return "ALL";
        const match = venues.find((v) => v.id === prevVenueId);
        if (newOrgId !== "ALL" && match?.organizationId !== newOrgId) {
          setCookie(COOKIE_NAME, "ALL");
          return "ALL";
        }
        return prevVenueId;
      });

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("yoreservo:organization-change", {
            detail: { organizationId: newOrgId },
          }),
        );
      }
    },
    [isManagedLocked, venues],
  );

  const setActiveVenueId = useCallback(
    (newVenueId: string) => {
      if (isManagedLocked && user.managedVenueId) {
        return; // Locked for validator
      }
      setActiveVenueIdState(newVenueId);
      setCookie(COOKIE_NAME, newVenueId);

      // If a specific venue is chosen and its org differs from activeOrganizationId (when not ALL), sync org
      if (isPlatformRole && newVenueId !== "ALL") {
        const foundVenue = venues.find((v) => v.id === newVenueId);
        if (
          foundVenue?.organizationId &&
          activeOrganizationId !== "ALL" &&
          foundVenue.organizationId !== activeOrganizationId
        ) {
          setActiveOrganizationIdState(foundVenue.organizationId);
          setCookie(ORG_COOKIE_NAME, foundVenue.organizationId);
        }
      }

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("yoreservo:venue-change", {
            detail: { venueId: newVenueId },
          }),
        );
      }
    },
    [isManagedLocked, user.managedVenueId, isPlatformRole, venues, activeOrganizationId],
  );

  const scopedVenues = useMemo(() => {
    if (!isPlatformRole || !activeOrganizationId || activeOrganizationId === "ALL") {
      return venues;
    }
    return venues.filter((v) => v.organizationId === activeOrganizationId);
  }, [isPlatformRole, activeOrganizationId, venues]);

  const activeOrganization =
    activeOrganizationId === "ALL"
      ? null
      : organizations.find((o) => o.id === activeOrganizationId) || null;

  const activeVenue =
    activeVenueId === "ALL"
      ? null
      : venues.find((v) => v.id === activeVenueId) || null;

  return (
    <VenueContext.Provider
      value={{
        venues,
        scopedVenues,
        organizations,
        isPlatformRole,
        activeOrganizationId,
        activeOrganization,
        setActiveOrganizationId,
        activeVenueId,
        activeVenue,
        setActiveVenueId,
        isLoading,
        isPending,
        error,
        isManagedLocked,
        refetchVenues: fetchVenues,
      }}
    >
      {children}
    </VenueContext.Provider>
  );
}

const FALLBACK_VENUE_CONTEXT: VenueContextValue = {
  venues: [],
  scopedVenues: [],
  organizations: [],
  isPlatformRole: false,
  activeOrganizationId: "ALL",
  activeOrganization: null,
  setActiveOrganizationId: () => {},
  activeVenueId: "ALL",
  activeVenue: null,
  setActiveVenueId: () => {},
  isLoading: false,
  isPending: false,
  error: null,
  isManagedLocked: false,
  refetchVenues: async () => {},
};

export function useActiveVenue(): VenueContextValue {
  const context = useContext(VenueContext);
  return context ?? FALLBACK_VENUE_CONTEXT;
}
