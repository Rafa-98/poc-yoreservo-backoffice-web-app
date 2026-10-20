"use client";

import { Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/shared/lib";
import { useTheme } from "@/shared/lib/theme";

/** Light / dark switch. Icons swap with CSS so there is no hydration flicker. */
export function ThemeToggle({ className }: { className?: string }) {
  const t = useTranslations();
  const { theme, toggleTheme } = useTheme();
  const label =
    theme === "dark" ? t("common.theme.toLight") : t("common.theme.toDark");

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className={cn(
        "relative grid size-9 shrink-0 place-items-center overflow-hidden rounded-xl border border-border bg-surface text-foreground shadow-2xs transition-all",
        "hover:bg-muted active:scale-95",
        className,
      )}
    >
      <Moon
        aria-hidden="true"
        className="absolute size-4 rotate-0 scale-100 transition-all duration-300 dark:-rotate-90 dark:scale-0"
      />
      <Sun
        aria-hidden="true"
        className="absolute size-4 rotate-90 scale-0 transition-all duration-300 dark:rotate-0 dark:scale-100"
      />
    </button>
  );
}
