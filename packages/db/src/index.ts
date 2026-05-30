// Prisma owns the Postgres schema + migrations (the schema authority that
// Rust's sqlx reads against). Phase 1 adds `schema.prisma`, the generated
// client, the first migration, and a typed `db` export used by the Node API.
export const DB_PLACEHOLDER = true;
