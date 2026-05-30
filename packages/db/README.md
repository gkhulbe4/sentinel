# @sentinel/db

The **schema authority** for Sentinel. Prisma defines the Postgres schema and
owns migrations; the Rust services read/write the same tables via `sqlx`
(using committed offline metadata in `.sqlx/` so Docker builds need no live DB).

- `prisma/schema.prisma` — models (User, WatchRule, Alert). _(Phase 1)_
- generated Prisma client + typed `db` export for the Node API. _(Phase 1)_

Scripts (root): `pnpm db:migrate`, `pnpm db:studio`.
Populated in Phase 1.
