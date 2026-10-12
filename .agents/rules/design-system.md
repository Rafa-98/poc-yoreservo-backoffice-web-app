---
trigger: always_on
---

# YoReservo Backoffice — mandatory UI standards

- Read and follow `docs/design-system.md` for **every** new view. The visual source of truth is `../poc-yoreservo-templates/backoffice-ui-designs/STYLE_GUIDE.md`.
- Use only semantic color tokens (`bg-surface`, `text-muted-foreground`, `bg-status-confirmed-bg`...); never raw colors/hex in components, and never `dark:` for colors that are already tokenized.
- **One lime CTA per view**: `Button variant="primary"` (`bg-accent`) is the single main action; everything else is `secondary`, `dark`, `ghost` or `destructive`.
- **Text Link Contrast Rule**: never use `primary` or `sidebar*` tokens as text/link color. Links, secondary CTAs and inline tags use `text-link`.
- **Typography**: `font-display` (Outfit) for headings and brand; `font-sans` (Inter) for data, inputs, badges and tables.
- **Mobile first**: base styles target `< 768px` (staff/validators on smartphones). Tablet (`md`) uses the icon rail, desktop (`lg`) the full sidebar and dense multi-court agenda.
- **Dual theme is mandatory**: every screen, card, table, modal, drawer and input must work in light and dark (`data-theme`), persisted under the `yoreservo_theme` key.
- **Zero hardcoded text**: all copy goes in `/locales/es` and `/locales/en` (Spanish is the default, full English parity checked by `npm run i18n:check`). Zod and Server Actions emit keys/codes, not text. Catalog data from the API is `{ es, en }` and is rendered with `useLocalizedText`.
- Every screen must expose the `LanguageSwitcher` and `ThemeToggle`.
- Operational statuses render through `StatusBadge` (never re-style them ad hoc).
- Code, identifiers and enums in English.
- **Visual verification**: after creating or modifying a screen, run it (`npm run dev`, port 3001) and use `browser_subagent` to check light/dark, ES/EN and the interactive controls at mobile, tablet and desktop widths.