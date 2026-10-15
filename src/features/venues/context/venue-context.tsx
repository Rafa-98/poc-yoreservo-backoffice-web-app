"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import type { SessionUser } from "@/shared/auth";
import { getVenuesListAction } from "@/features/venues/actions/venues-actions";
import type { VenueItem } from "@/features/venues/model/types";

export interface VenueContextValue {
  venues: VenueItem[];
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

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : null;
}

function setCookie(name: string, value: string, days = 365): void {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; expires=${expires}; SameSite=Lax`;
}

export interface VenueProviderProps {
  user: SessionUser;
  initialVenues?: VenueItem[];
  children: ReactNode;
}

export function VenueProvider({
  user,
  initialVenues = [],
  children,
}: VenueProviderProps) {
  const [venues, setVenues] = useState<VenueItem[]>(initialVenues);
  const [isLoading, setIsLoading] = useState(initialVenues.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isManagedLocked =
    user.role === "ALLY_VALIDATOR" && Boolean(user.managedVenueId);

  // Initialize active venue ID
  const [activeVenueId, setActiveVenueIdState] = useState<string>(() => {
    if (isManagedLocked && user.managedVenueId) {
      return user.managedVenueId;
    }
    const savedCookie = getCookie(COOKIE_NAME);
    return savedCookie || "ALL";
  });

  const fetchVenues = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getVenuesListAction();
      if (res.ok) {
        setVenues(Array.isArray(res.data) ? res.data : []);
      } else {
        setError(res.error?.code || "Failed to load venues");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error fetching venues");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialVenues.length === 0) {
      fetchVenues();
    }
  }, [fetchVenues, initialVenues.length]);

  // If user is locked to a venue, keep it synced
  useEffect(() => {
    if (isManagedLocked && user.managedVenueId) {
      setActiveVenueIdState(user.managedVenueId);
      setCookie(COOKIE_NAME, user.managedVenueId);
    }
  }, [isManagedLocked, user.managedVenueId]);

  const setActiveVenueId = useCallback(
    (newVenueId: string) => {
      if (isManagedLocked && user.managedVenueId) {
        return; // Locked for validator
      }
      startTransition(() => {
        setActiveVenueIdState(newVenueId);
        setCookie(COOKIE_NAME, newVenueId);
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("yoreservo:venue-change", {
              detail: { venueId: newVenueId },
            })
          );
        }
      });
    },
    [isManagedLocked, user.managedVenueId]
  );

  const activeVenue =
    activeVenueId === "ALL"
      ? null
      : venues.find((v) => v.id === activeVenueId) || null;

  return (
    <VenueContext.Provider
      value={{
        venues,
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

export function useActiveVenue(): VenueContextValue {
  const context = useContext(VenueContext);
  if (!context) {
    throw new Error("useActiveVenue must be used within a VenueProvider");
  }
  return context;
}
