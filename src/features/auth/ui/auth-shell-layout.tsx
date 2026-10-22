"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { Check, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { APP_VERSION } from "@/shared/config";
import { ThemeToggle } from "@/shared/ui/theme-toggle";
import { LanguageSwitcher } from "@/shared/ui/language-switcher";

export interface AuthShellLayoutProps {
  children: ReactNode;
  bgImageSrc?: string;
  badgeText?: string;
  subtitle?: string;
  heading?: string;
  description?: string;
  features?: readonly string[];
  bannerCard?: ReactNode;
}

export function AuthShellLayout({
  children,
  bgImageSrc = "/pitch-aerial.jpg",
  badgeText,
  subtitle,
  heading,
  description,
  features,
  bannerCard,
}: AuthShellLayoutProps) {
  const t = useTranslations("auth");

  const effectiveBadgeText = badgeText ?? t("portalBadge");
  const effectiveSubtitle = subtitle ?? t("brandSubtitle");
  const effectiveHeading = heading ?? t("brandHeading");
  const effectiveDescription = description ?? t("brandDescription");
  const defaultFeatures = [t("feat1"), t("feat2"), t("feat3")];
  const effectiveFeatures = features ?? defaultFeatures;

  return (
    <div className="flex min-h-screen w-full flex-col lg:flex-row bg-background text-foreground">
      {/* LEFT BRANDING PANE (DESKTOP) */}
      <div className="relative hidden w-full lg:flex lg:w-1/2 flex-col justify-between p-12 overflow-hidden bg-primary text-white">
        {/* Background Image & Overlay */}
        <div className="absolute inset-0 z-0">
          <Image
            src={bgImageSrc}
            alt="Sports complex"
            fill
            className="object-cover object-center opacity-30"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#080C07] via-[#0F1A0E]/80 to-[#121811]/90" />
        </div>

        {/* Brand Header */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative h-9 w-32">
              <Image
                src="/yoreservo-logo-transparent.png"
                alt="YoReservo"
                fill
                className="object-contain brightness-0 invert"
                priority
              />
            </div>
            <span className="rounded-md border border-accent/30 bg-accent/15 px-2.5 py-1 font-display text-[11px] font-bold uppercase tracking-wider text-accent">
              {effectiveBadgeText}
            </span>
          </div>
        </div>

        {/* Center Hero Copy */}
        <div className="relative z-10 my-auto max-w-lg">
          <span className="mb-3 inline-block font-display text-xs font-bold uppercase tracking-widest text-accent">
            {effectiveSubtitle}
          </span>
          <h1 className="mb-5 font-display text-3xl xl:text-4xl font-extrabold leading-tight text-white">
            {effectiveHeading}
          </h1>
          <p className="mb-8 text-sm xl:text-base leading-relaxed text-[#A2ADA0]">
            {effectiveDescription}
          </p>

          {bannerCard ? (
            <div className="mb-6">{bannerCard}</div>
          ) : (
            <div className="flex flex-col gap-3.5">
              {effectiveFeatures.map((feat, idx) => (
                <div key={idx} className="flex items-center gap-3 text-sm text-white/95">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-accent/20 text-accent">
                    <Check className="size-4 stroke-[2.5]" />
                  </div>
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-6 text-xs text-[#A2ADA0]">
          <span>{t("brandFooter")}</span>
          <span className="font-mono text-[11px] text-accent/80">
            {t("brandVersion", { version: APP_VERSION })}
          </span>
        </div>
      </div>

      {/* RIGHT FORM PANE */}
      <div className="flex flex-1 flex-col justify-between p-6 sm:p-10 lg:p-12 xl:p-16">
        {/* Top Controls Bar */}
        <div className="flex items-center justify-between pb-6">
          <div className="flex items-center gap-2 lg:hidden">
            <div className="relative h-7 w-24">
              <Image
                src="/yoreservo-logo.png"
                alt="YoReservo"
                fill
                className="object-contain"
              />
            </div>
            <span className="rounded bg-accent/20 px-2 py-0.5 text-[10px] font-bold uppercase text-accent-foreground">
              {effectiveBadgeText}
            </span>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <ThemeToggle />
            <LanguageSwitcher />
          </div>
        </div>

        {/* Center Content Card */}
        <div className="mx-auto w-full max-w-md my-auto py-4">{children}</div>

        {/* Bottom Security Footer */}
        <div className="pt-6 text-center text-xs text-muted-foreground">
          <div className="inline-flex items-center gap-1.5">
            <ShieldCheck className="size-3.5 text-accent" />
            <span>{t("footerSecurity")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
