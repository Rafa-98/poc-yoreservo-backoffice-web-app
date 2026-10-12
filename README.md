# YoReservo — Backoffice Web App

Operations panel for YoReservo staff (platform admins, venue allies, accounting and validators): agenda, bookings, treasury, venues, users and settlements.

> **Status:** project foundation only (toolchain, design system, i18n, theme, skills, rules). No module is implemented yet; the home page is a placeholder. Module order and screen blueprints: `../poc-yoreservo-templates/backoffice-ui-designs/backoffice_modules.md`.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS v4 · next-intl · TanStack Query · react-hook-form + zod · lucide-react.

## Getting started

```bash
cp .env.example .env.local   # adjust API_BASE_URL if needed
npm install
npm run dev                   # http://localhost:3001
```

| Script              | Purpose                                      |
| ------------------- | -------------------------------------------- |
| `npm run dev`       | Dev server on **port 3001**                  |
| `npm run build`     | Production build                             |
| `npm start`         | Production server on port 3001               |
| `npm run lint`      | ESLint                                       |
| `npm run typecheck` | Route types + `tsc --noEmit`                 |
| `npm run i18n:check`| Verifies `es`/`en` locale key parity         |

## Environment

See [`.env.example`](.env.example): `API_BASE_URL` (backend, default `http://localhost:4000`), `BUSINESS_TIME_ZONE`, `ASSETS_BASE_URL` (uploaded images host).

## Structure

```
app/          routes only
src/_app/     styles, fonts, providers, layouts
src/_pages/   screen compositions
src/features/ user actions
src/shared/   api, auth, config, i18n, lib, ui
locales/      es + en copy
docs/         architecture & design system
.agents/      rules and skills for AI agents
```

## Documentation

- [Architecture](docs/architecture.md) — FSD layers, module→route map, BFF, roles.
- [Design system](docs/design-system.md) — tokens, typography, layout, components, i18n and theme.
- Design source: `../poc-yoreservo-templates/backoffice-ui-designs` (`STYLE_GUIDE.md`, prototypes, `claude_comments.md`).
- Sibling app: `../poc-yoreservo-client-web-app` (port 3000) shares the same architecture.

## Conventions

- Spanish is the default language, English has full parity (`/locales`). No hardcoded UI text.
- Semantic color tokens only; light and dark themes are mandatory on every screen.
- Code, comments and docs are written in English.