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
  venuesCount = 0,
  spacesCount = 0,
  onOpenOrgModal,
}: VenuesSubnavProps) {
  const pathname = usePathname();
  const t = useTranslations("venues.subnav");

  const isVenues = pathname === ROUTES.venues;
  const isSpaces = pathname === ROUTES.spaces;
  const isSchedules = pathname === ROUTES.schedules;

  return (
    <nav
      className="flex gap-2.5 overflow-x-auto border-b border-border bg-surface px-5 pt-4"
      aria-label={t("ariaLabel")}
    >
      {onOpenOrgModal && (
        <button
          type="button"
          className="btn btn-outline whitespace-nowrap border-none font-medium text-muted-foreground"
          onClick={onOpenOrgModal}
          id="btn-subnav-org"
        >
          🏢 <span>{t("org")}</span>
        </button>
      )}

      <Link
        href={ROUTES.venues}
        prefetch={false}
        className={`btn btn-outline whitespace-nowrap rounded-t-lg rounded-b-none border-t-0 border-x-0 border-b-[3px] bg-transparent ${
          isVenues
            ? "border-b-accent font-bold text-foreground"
            : "border-b-transparent font-medium text-muted-foreground"
        }`}
        id="btn-subnav-venues"
      >
        🏟️ <span>{t("venues", { count: venuesCount })}</span>
      </Link>

      <Link
        href={ROUTES.spaces}
        prefetch={false}
        className={`btn btn-outline whitespace-nowrap rounded-t-lg rounded-b-none border-t-0 border-x-0 border-b-[3px] bg-transparent ${
          isSpaces
            ? "border-b-accent font-bold text-foreground"
            : "border-b-transparent font-medium text-muted-foreground"
        }`}
        id="btn-subnav-spaces"
      >
        ⚽ <span>{t("spaces", { count: spacesCount })}</span>
      </Link>

      <Link
        href={ROUTES.schedules}
        prefetch={false}
        className={`btn btn-outline whitespace-nowrap rounded-t-lg rounded-b-none border-t-0 border-x-0 border-b-[3px] bg-transparent ${
          isSchedules
            ? "border-b-accent font-bold text-foreground"
            : "border-b-transparent font-medium text-muted-foreground"
        }`}
        id="btn-subnav-schedules"
      >
        🕒 <span>{t("schedules")}</span>
      </Link>
    </nav>
  );
}
