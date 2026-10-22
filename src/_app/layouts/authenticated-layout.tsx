"use client";

import { useState, type ReactNode } from "react";
import type { SessionUser } from "@/shared/auth";
import { TimeFormatProvider } from "@/shared/lib";
import { VenueProvider } from "@/features/venues/context/venue-context";
import { AppHeader } from "./app-header";
import { AppSidebar } from "./app-sidebar";

export interface AuthenticatedLayoutProps {
  user: SessionUser;
  children: ReactNode;
}

export function AuthenticatedLayout({
  user,
  children,
}: AuthenticatedLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <TimeFormatProvider>
      <VenueProvider user={user}>
        <div className="relative flex h-screen w-full overflow-hidden bg-background">
          {/* Dynamic RBAC Sidebar */}
          <AppSidebar
            user={user}
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
          />

          {/* Main Workspace Frame */}
          <div className="relative flex flex-1 flex-col overflow-hidden">
            <AppHeader
              user={user}
              onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
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

