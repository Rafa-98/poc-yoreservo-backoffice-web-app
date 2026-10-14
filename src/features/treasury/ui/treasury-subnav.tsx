"use client";

import React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ROUTES } from "@/shared/config";

interface TreasurySubnavProps {
  currentTab: "payments" | "rate" | "settlements";
}

export function TreasurySubnav({ currentTab }: TreasurySubnavProps) {
  const t = useTranslations("treasury.subnav");

  const tabs = [
    {
      id: "payments",
      label: t("payments"),
      href: ROUTES.paymentsInbox,
      icon: "💳",
    },
    {
      id: "rate",
      label: t("rate"),
      href: ROUTES.exchangeRate,
      icon: "📈",
    },
    {
      id: "settlements",
      label: t("settlements"),
      href: ROUTES.settlements,
      icon: "🏛️",
    },
  ];

  return (
    <nav className="flex items-center gap-2 border-b border-border bg-surface px-6">
      {tabs.map((tab) => {
        const isActive = currentTab === tab.id;
        return (
          <Link
            key={tab.id}
            href={tab.href}
            className={`flex items-center gap-2 border-b-2 py-3 px-4 text-xs font-bold transition-all ${
              isActive
                ? "border-accent text-foreground"
                : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
