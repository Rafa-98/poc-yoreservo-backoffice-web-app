"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { ROUTES } from "@/shared/config";

interface VenuesSubnavProps {
  venuesCount?: number;
  spacesCount?: number;
  onOpenOrgModal?: () => void;
}

export function VenuesSubnav({
  venuesCount = 2,
  spacesCount = 4,
  onOpenOrgModal,
}: VenuesSubnavProps) {
  const pathname = usePathname();
  const t = useTranslations("venues.subnav");

  const isVenues = pathname === ROUTES.venues;
  const isSpaces = pathname === ROUTES.spaces;
  const isSchedules = pathname === ROUTES.schedules;

  return (
    <nav
      style={{
        padding: "16px 20px 0",
        display: "flex",
        gap: "10px",
        borderBottom: "1px solid var(--border-subtle)",
        background: "var(--bg-surface)",
        overflowX: "auto",
      }}
      aria-label="Venues sub-navigation"
    >
      {onOpenOrgModal && (
        <button
          type="button"
          className="btn btn-outline"
          onClick={onOpenOrgModal}
          style={{
            border: "none",
            color: "var(--text-muted)",
            fontWeight: 500,
            whiteSpace: "nowrap",
          }}
          id="btn-subnav-org"
        >
          🏢 <span>{t("org")}</span>
        </button>
      )}

      <Link
        href={ROUTES.venues}
        prefetch={false}
        className="btn btn-outline"
        id="btn-subnav-venues"
        style={{
          border: isVenues ? "none" : "none",
          borderBottom: isVenues ? "3px solid var(--brand-lime)" : "3px solid transparent",
          borderRadius: "8px 8px 0 0",
          background: "transparent",
          fontWeight: isVenues ? 700 : 500,
          color: isVenues ? "var(--text-main)" : "var(--text-muted)",
          whiteSpace: "nowrap",
        }}
      >
        🏟️ <span>{t("venues", { count: venuesCount })}</span>
      </Link>

      <Link
        href={ROUTES.spaces}
        prefetch={false}
        className="btn btn-outline"
        id="btn-subnav-spaces"
        style={{
          border: isSpaces ? "none" : "none",
          borderBottom: isSpaces ? "3px solid var(--brand-lime)" : "3px solid transparent",
          borderRadius: "8px 8px 0 0",
          background: "transparent",
          fontWeight: isSpaces ? 700 : 500,
          color: isSpaces ? "var(--text-main)" : "var(--text-muted)",
          whiteSpace: "nowrap",
        }}
      >
        ⚽ <span>{t("spaces", { count: spacesCount })}</span>
      </Link>

      <Link
        href={ROUTES.schedules}
        prefetch={false}
        className="btn btn-outline"
        id="btn-subnav-schedules"
        style={{
          border: isSchedules ? "none" : "none",
          borderBottom: isSchedules ? "3px solid var(--brand-lime)" : "3px solid transparent",
          borderRadius: "8px 8px 0 0",
          background: "transparent",
          fontWeight: isSchedules ? 700 : 500,
          color: isSchedules ? "var(--text-main)" : "var(--text-muted)",
          whiteSpace: "nowrap",
        }}
      >
        🕒 <span>{t("schedules")}</span>
      </Link>
    </nav>
  );
}
