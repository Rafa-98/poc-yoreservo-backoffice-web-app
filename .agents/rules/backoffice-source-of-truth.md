---
trigger: always_on
---

# Backoffice source of truth

The Backoffice screens were designed as standalone prototypes in the sibling repo `../poc-yoreservo-templates/backoffice-ui-designs`. Before building a module, read:

- `STYLE_GUIDE.md` — palette (light/dark), typography, status colors, layout, responsive behavior.
- `BACKOFFICE_SPECIFICATIONS.md` — product scope, roles and screen behavior.
- `backoffice_modules.md` — module breakdown and delivery phases (maps to slices in `docs/architecture.md`).
- The module's HTML prototype (open it in Chrome) — it is the visual reference to reproduce with the project's design system, not code to copy.
- `claude_comments.md` — known design caveats (commission model, SpaceBlock, schema mismatches). Resolve them with the user before implementing the affected module.

Architecture follows Feature-Sliced Design (skill `feature-sliced-design`, `docs/architecture.md`). The authentication, session and backend-client patterns are the same as the Client app (`../poc-yoreservo-client-web-app/docs/auth.md`, `docs/server-side.md`): the browser never talks to the API directly.