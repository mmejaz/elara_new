# Database — Overview

> **Status:** Current · **Last updated:** 2026-08-13 · **Owner:** Engineering

Elara runs **one central database plus one database per tenant** (MySQL 8). This
page indexes the database docs; see [../architecture/database.md](../architecture/database.md)
for the central-vs-tenant split and migration/seeding strategy.

- [tables.md](tables.md) — table-by-table reference (central & tenant).
- [relationships.md](relationships.md) — foreign keys and Eloquent relations.
- [erd.md](erd.md) — entity-relationship diagrams.

## Conventions

- **Keys:** auto-increment `id` (bigint unsigned) on app tables; the `tenants`
  table uses a **string id** (e.g. `local`) that also becomes the tenant DB
  suffix (`tenantlocal`).
- **Timestamps:** `created_at` / `updated_at` on all app tables.
- **Soft deletes:** used on `modules` (and any model with `SoftDeletes`); most
  lookup tables hard-delete.
- **Natural keys:** lookup tables key on `name` (no `code`/`slug` columns);
  uniqueness is enforced in FormRequests (`unique:<table>,name`). *Recommendation:
  add DB-level `unique(name)` for defence in depth.*
- **Tenant virtual columns:** the `tenants` table stores most attributes (name,
  status, admin_email, department_mode, …) in a single `data` JSON column
  (Stancl's virtual-column pattern); `id`, `created_at`, `updated_at` are real
  columns.
