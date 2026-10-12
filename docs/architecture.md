# Architecture

Feature-Sliced Design on top of the Next.js App Router (skill: `.agents/skills/feature-sliced-design`).

```
app/            Next.js routes only (thin re-exports of pages)
src/
  _app/         styles, fonts, providers, layouts (app layer)
  _pages/       one slice per screen (composition only)
  features/     user-facing actions (login, approve-payment, ...)
  shared/
    api/        backend client (server-only)        [placeholder]
    auth/       session, roles, guards              [placeholder]
    config/     site, routes, roles, server env
    i18n/       next-intl setup, localized-text helpers
    lib/        cn, money, app-error, theme, ...
    ui/         design-system components
locales/        es + en JSON copy
docs/           this folder
```

Import direction: `app → _pages → features → shared`. `_pages` is named with an underscore because `pages/` is reserved by Next.js.

## Foundation vs. modules

This repo ships **configuration only**: toolchain, tokens, i18n, theme, shared UI, skills and rules. The placeholder home page (`app/page.tsx`) only proves the foundation works.
Modules are built in the order defined by `backoffice_modules.md`:

| # | Module                                  | Routes (`ROUTES`)                                   |
| - | --------------------------------------- | --------------------------------------------------- |
| 1 | Authentication, invitation, access      | `login`, `recoverPassword`, `setPassword`           |
| 2 | Operations hub (multi-court agenda)     | `agenda`                                            |
| 3 | Finance & treasury                      | `paymentsInbox`, `exchangeRate`                     |
| 4 | Venues, courts & schedules              | `venues`, `spaces`, `schedules`                     |
| 5 | Master catalogs & RBAC users            | `catalogs`, `users`                                 |
| 6 | Bookings ledger & check-in              | `reservations`                                      |
| 7 | Ally settlements                        | `settlements`                                       |
| 8 | Role-adaptive dashboard                 | `dashboard`                                         |
| 9 | Self-service profile                    | `profile`                                           |

Planned shared pieces for Module 1: `shared/api` (backend client), `shared/auth` (session cookies, role guards), `proxy.ts` (route protection) and the authenticated app shell in `_app/layouts`.

## Backend access (BFF)

The browser never calls the API directly. Server Components/Actions talk to `API_BASE_URL` using a server-only client and an HTTP-only session cookie. The pattern is identical to the Client app: see `../poc-yoreservo-client-web-app/docs/auth.md` and `docs/server-side.md`.

## Roles (RBAC)

`ADMIN`, `ALLY`, `ACCOUNTING`, `VALIDATOR` (see [`roles.ts`](../src/shared/config/roles.ts)); they mirror the backend `UserRole`. Navigation and screens adapt per role.

## Next.js configuration notes

- Port **3001** (`npm run dev` / `npm start`); the Client app uses 3000.
- Tailwind v4 is wired through the `@tailwindcss/turbopack` loader (see `next.config.ts`).
- `cacheComponents` and `partialPrefetching` are **disabled**: the locale cookie is read in the root layout and the panel is fully authenticated/dynamic, so the Cache Components build fails (`cookies()` outside `<Suspense>`). Re-enable only with a Suspense-based shell + `use cache` strategy.
- `images.remotePatterns` is derived from `ASSETS_BASE_URL`.
- Environment variables: see `.env.example`. Server env is validated with zod in `shared/config/server-env.ts`.
- Before using any Next.js API, read `node_modules/next/dist/docs/` (see `AGENTS.md`).