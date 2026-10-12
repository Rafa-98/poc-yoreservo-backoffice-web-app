import { getTranslations } from "next-intl/server";
import {
  Button,
  LanguageSwitcher,
  Logo,
  OPERATIONAL_STATUSES,
  StatusBadge,
  ThemeToggle,
} from "@/shared/ui";

/**
 * Foundation placeholder: proves tokens, fonts, i18n and theming work.
 * It is NOT a module screen — the Auth module replaces the root route.
 */
export async function HomePage() {
  const t = await getTranslations("home");

  return (
    <main className="relative grid min-h-dvh place-items-center px-6 py-12">
      <div className="absolute right-4 top-4 flex items-center gap-2 sm:right-6 sm:top-6">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>

      <section className="flex w-full max-w-xl animate-fade-up flex-col items-center gap-6 rounded-3xl border border-border bg-surface p-8 text-center shadow-card sm:p-12">
        <Logo />
        <p className="text-sm font-semibold uppercase tracking-widest text-link">
          {t("eyebrow")}
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight text-balance sm:text-4xl">
          {t("title")}
        </h1>
        <p className="text-pretty text-muted-foreground">{t("description")}</p>

        <div className="flex flex-col items-center gap-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-faint-foreground">
            {t("statusesLabel")}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {OPERATIONAL_STATUSES.map((status) => (
              <StatusBadge key={status} status={status} />
            ))}
          </div>
        </div>

        <Button size="lg">{t("primaryAction")}</Button>
      </section>
    </main>
  );
}