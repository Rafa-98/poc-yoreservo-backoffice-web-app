# Design system

Visual source of truth: `../poc-yoreservo-templates/backoffice-ui-designs/STYLE_GUIDE.md` (prototypes + palette).
This document describes how that design is expressed in code. Tokens live in
[`src/_app/styles/globals.css`](../src/_app/styles/globals.css).

## Golden rules

1. **Semantic tokens only.** Never raw colors in components. `dark:` is only for non-tokenized details (e.g. icon transitions).
2. **One lime CTA per view.** `Button variant="primary"` (`bg-accent`) is the single main action.
3. **Links use `text-link`.** Never use `primary` or `sidebar*` tokens as text color (they are dark surfaces).
4. **Mobile first.** `< 768px` base → tablet `md` (icon rail) → desktop `lg` (full sidebar, dense agenda).
5. **Dual theme.** Light "Daylight Executive Canvas" and dark "Nocturnal Executive Cockpit" via `data-theme`; persisted in `localStorage` as `yoreservo_theme`.
6. **Zero hardcoded text.** Copy lives in `/locales/{es,en}`; Spanish is the default.
7. Every screen exposes `LanguageSwitcher` and `ThemeToggle`.

## Palette (Tailwind utility → token)

| Utility                                   | Light      | Dark       | Use |
| ----------------------------------------- | ---------- | ---------- | --- |
| `bg-background`                           | `#F8FAF7`  | `#0B100B`  | Canvas |
| `bg-surface` / `bg-surface-hover`         | `#FFFFFF`  | `#131A12`  | Cards, tables, modals |
| `bg-muted`                                | `#EBEFE7`  | `#1A2319`  | Subtle fills, hover |
| `bg-sidebar*` / `text-sidebar-foreground*`| `#121811`  | `#080C07`  | Sidebar frame only |
| `text-foreground`                         | `#141A13`  | `#F4F6F2`  | Body text |
| `text-muted-foreground`                   | `#5C6659`  | `#9EAAA8`  | Secondary text |
| `text-faint-foreground`                   | `#8E998B`  | `#7E8D7B`  | Captions, placeholders |
| `border-border` / `-medium` / `-strong`   | `#E2E6DF` / `#CAD0C5` / `#A8B1A2` | `#202A1F` / `#2C392B` / `#3D4D3B` | Dividers, inputs, emphasis |
| `bg-accent text-accent-foreground`        | `#C6F23B` on `#121811` | same | Primary CTA, active state |
| `bg-primary text-primary-foreground`      | `#1F290F`  | `#1F2D1C`  | Dark forest surfaces |
| `text-link`                               | `#183C15`  | `#C6F23B`  | Links, secondary CTAs |
| `ring-ring`                               | `#6F8F1A`  | `#C6F23B`  | Focus ring |

### Operational statuses

`available`, `hold`, `confirmed`, `completed`, `cancelled`, `blocked` — each has
`status-<name>-{bg,fg,border}` tokens. Render them with `<StatusBadge status="…" />`; labels come from `status.operational.*`.
`destructive*`, `success*` and `warning*` are aliases of cancelled / available / hold.

## Typography

- `font-display` → **Outfit**: headings and brand.
- `font-sans` → **Inter**: data, inputs, badges, tables.
- Fonts load with `next/font` in [`src/_app/fonts`](../src/_app/fonts/index.ts).

## Layout

| Breakpoint        | Navigation                              |
| ----------------- | --------------------------------------- |
| `< 768px`         | Bottom bar + slide-in drawer            |
| `768px – 1023px`  | Icon rail (`--sidebar-width-rail` 4.5rem) |
| `≥ 1024px`        | Full sidebar (`--sidebar-width` 16rem)  |

The shell itself is built with the Auth/Dashboard modules (`src/_app/layouts`).

## Shared components (`@/shared/ui`)

`Alert`, `Button` (+`buttonVariants`), `LanguageSwitcher`, `Logo`, `Spinner`, `StatusBadge`, `StatusScreen`, `ThemeToggle`.
Form fields, tables, modals, drawers, etc. are added when the first module that needs them is built.
Use `react-hook-form` + `zod` for forms, `lucide-react` for icons, `cva` + `cn` for variants.

## i18n and theme

- `next-intl` with a `NEXT_LOCALE` cookie (no URL prefix). JSON files in `/locales/<lang>/<namespace>.json`, registered in [`messages.ts`](../src/shared/i18n/messages.ts). `en` is type-checked against `es`.
- `npm run i18n:check` enforces key parity.
- Theme: `themeInitScript` (in `<head>`) sets `data-theme` before hydration; `ThemeProvider` keeps it in sync with the system when the user has no stored choice.