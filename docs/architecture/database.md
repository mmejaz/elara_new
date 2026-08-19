# Database Architecture

MySQL 8, with **one central database plus one database per tenant**.

## Central vs tenant

| Central DB (`elara`, on `127.0.0.1`) | Each tenant DB (`tenant<id>`) |
|---|---|
| `tenants`, `domains` (Stancl) | `users`, `sessions`, `personal_access_tokens` |
| `organizations` (+ hierarchy, `organization_user`) | `roles`, `permissions`, `model_has_*`, `role_has_permissions` |
| shared HR master data: `departments`, `designations`, `leave_types`, `document_types` | `modules` (sidebar) |
| central auth stack (`users`, `roles`, `modules`, …) so Super Admins can log in | lookups: `genders`, `countries`, `cities`, `application_types` |
| `central_cache`, `agent_conversations` | `global_settings` (+ fields/records), `files` |
| | business tables for that customer |

> **Why some tables appear in both:** a few tables (e.g. `departments`,
> `organizations`, and the core auth/app tables) exist in *both* the central and
> tenant schemas. Each database is physically separate, so the same table name in
> two databases is two independent tables. This is intentional — central needs
> its own auth + master data, and each tenant needs a full app.

## Migration folders

```
back/database/migrations/          # CENTRAL — run by `php artisan migrate`
back/database/migrations/tenant/   # TENANT  — run by `php artisan tenants:migrate`
```

- `php artisan migrate` / `migrate:fresh` builds the **central** DB.
- `php artisan tenants:migrate` runs `migrations/tenant/*` against **every**
  tenant DB. Stancl's provisioning pipeline runs it for a new tenant
  automatically (path set in `config/tenancy.php` → `migration_parameters`).
- Laravel's default migrator is **non-recursive**, so the `tenant/` subfolder is
  ignored by the central `migrate` — the two sets don't collide.

**When you add a migration**, decide which schema it belongs to. If a table must
exist in both central and tenant DBs, the file lives in **both** folders.

## Seeding

`DatabaseSeeder` is the central entry point (`php artisan db:seed`):

1. Admin `User` (`firstOrCreate` by email — idempotent).
2. `RolePermissionSeeder`, `ModuleSeeder`, `GlobalSettingSeeder`.
3. `OrganizationSeeder` — the one default Organization.
4. `ReferenceDataSeeder` — lookups (genders, countries, departments, designations, leave types, document types).
5. `DefaultTenantSeeder` — provisions the default `localhost` tenant (its own DB + admin), synchronously and idempotently.

`TenantDatabaseSeeder` runs **inside** each tenant DB (roles, permissions,
modules, lookups, first admin). Every seeder is **idempotent** (`firstOrCreate` /
`updateOrCreate` by a natural key like name/slug), so re-running never
duplicates. See [../../docs/multi-tenancy-cutover-runbook.md](../multi-tenancy-cutover-runbook.md)
for the DB-per-tenant cutover detail.

## Selected relationships

- **Organizations** form a hierarchy (`parent_id`); users belong to organizations
  via `organization_user`.
- **Departments** are hierarchical (`parent_id`, self-referencing, `nullOnDelete`)
  **and** organization-scoped (`organization_id`, nullable = shared). A
  `scopeAvailableTo(orgId)` returns an org's own + shared + ancestor departments.
- **Files** are polymorphic (`fileable_*`) via the `HasFiles` trait (e.g. user
  avatars); stored per-tenant on disk.
- **Modules** are a self-referencing tree (`parent_id`) that drives the sidebar.

## Connections & privileges

- The central connection (`config('tenancy.database.central_connection')`, i.e.
  `mysql`) is used to `CREATE DATABASE tenant<id>` during provisioning, so its DB
  user needs `CREATE/DROP DATABASE`. **Local dev uses `root`.** Production should
  use a dedicated, narrowly-scoped provisioning user.
- Lookup tables use `name` as the natural key (no `code`/`slug` columns).
  Uniqueness is enforced at the app layer (`unique:<table>,name` in FormRequests);
  DB-level unique constraints are a recommended hardening (not yet applied).
