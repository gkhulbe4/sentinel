# web

Next.js (App Router) frontend for Sentinel: landing, auth, live dashboard,
watchlist manager, and alert history.

- Tailwind v4 (CSS-first via `@import "tailwindcss";`) + shadcn/ui _(Phase 9)_.
- TanStack Query for REST; a `useLiveAlerts` WebSocket hook + virtualized feed
  (`@tanstack/react-virtual`) for the dashboard _(Phase 9)_.
- Consumes shared types/helpers from `@sentinel/shared`.

## Run

```bash
pnpm --filter web dev   # http://localhost:3000
```

Env: copy `.env.example` → `.env.local`. See the table in the root README.
