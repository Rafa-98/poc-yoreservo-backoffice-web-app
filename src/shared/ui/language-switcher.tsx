"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import { Check, Globe } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/shared/lib";
import { LOCALES, setLocaleAction, type AppLocale } from "@/shared/i18n";

/**
 * Language picker (dropdown). Available on every screen next to the theme
 * toggle. Choosing a language stores it in a cookie through a Server Action;
 * Next.js then re-renders the current route in place.
 */
export function LanguageSwitcher({ className }: { className?: string }) {
  const t = useTranslations();
  const activeLocale = useLocale() as AppLocale;
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const selectLocale = (locale: AppLocale) => {
    setOpen(false);
    if (locale === activeLocale) return;
    startTransition(async () => {
      await setLocaleAction(locale);
    });
  };

  const label = t("common.language.label");

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label={label}
        title={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-busy={isPending || undefined}
        className={cn(
          "inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-xl border border-border bg-surface px-2.5 text-xs font-bold text-foreground shadow-2xs transition-all",
          "hover:border-border-strong hover:bg-muted active:scale-95",
          isPending && "opacity-70",
        )}
      >
        <Globe aria-hidden="true" className="size-3.5 text-muted-foreground" />
        <span aria-hidden="true" className="uppercase">
          {activeLocale}
        </span>
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label={label}
          className="absolute right-0 top-full z-50 mt-2 w-44 animate-fade-in overflow-hidden rounded-2xl border border-border bg-surface p-1.5 shadow-card"
        >
          {LOCALES.map((locale) => {
            const selected = locale === activeLocale;
            return (
              <button
                key={locale}
                type="button"
                role="menuitemradio"
                aria-checked={selected}
                lang={locale}
                onClick={() => selectLocale(locale)}
                className={cn(
                  "flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted",
                  selected ? "font-semibold text-link" : "text-foreground",
                )}
              >
                <span>{t(`common.language.${locale}`)}</span>
                {selected ? (
                  <Check aria-hidden="true" className="size-4" />
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
