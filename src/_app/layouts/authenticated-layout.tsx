"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { SessionUser } from "@/shared/auth";
import { TimeFormatProvider } from "@/shared/lib";
import { VenueProvider } from "@/features/venues/context/venue-context";
import { AppHeader } from "./app-header";
import { AppSidebar } from "./app-sidebar";

const SIDEBAR_PINNED_STORAGE_KEY = "yoreservo:sidebar-pinned-v2";

export interface AuthenticatedLayoutProps {
  user: SessionUser;
  children: ReactNode;
}

export function AuthenticatedLayout({
  user,
  children,
}: AuthenticatedLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarPinned, setIsSidebarPinned] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(SIDEBAR_PINNED_STORAGE_KEY);
      if (stored === "true") {
        setIsSidebarPinned(true);
      } else {
        setIsSidebarPinned(false);
      }
    } catch {
      // Ignore storage access errors
    }
  }, []);

  const handleToggleSidebarPinned = () => {
    setIsSidebarPinned((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(SIDEBAR_PINNED_STORAGE_KEY, String(next));
      } catch {
        // Ignore storage access errors
      }
      return next;
    });
  };

  return (
    <TimeFormatProvider>
      <VenueProvider user={user}>
        <div className="relative flex h-screen w-full overflow-hidden bg-background">
          {/* Dynamic RBAC Sidebar */}
          <AppSidebar
            user={user}
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            isPinned={isSidebarPinned}
            onTogglePinned={handleToggleSidebarPinned}
          />

          {/* Main Workspace Frame */}
          <div className="relative flex flex-1 flex-col overflow-hidden">
            <AppHeader
              user={user}
              onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
              isSidebarPinned={isSidebarPinned}
              onToggleSidebarPinned={handleToggleSidebarPinned}
            />

            <main className="relative flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
              <div className="mx-auto max-w-7xl">{children}</div>
            </main>
          </div>
        </div>
      </VenueProvider>
    </TimeFormatProvider>
  );
}

