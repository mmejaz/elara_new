# Glossary

> **Status:** Current · **Last updated:** 2026-08-13 · **Owner:** Engineering

Terms used across Elara's code and docs.

| Term | Definition |
|---|---|
| **Central app / central DB** | The context served on `127.0.0.1`; the `elara` database. Manages tenants, organizations, and shared master data. |
| **Tenant** | An isolated customer workspace with its **own database** (`tenant<id>`), reached via its own domain (e.g. `localhost`). Modeled by Stancl's `Tenant`. |
| **Domain** | A hostname mapped to a tenant (in the `domains` table). The request's domain selects the tenant. |
| **Provisioning** | Creating a tenant's database and seeding it: `CreateDatabase → MigrateDatabase → SeedDatabase` (Stancl's `TenantCreated` pipeline). |
| **Central domain** | A host in `config('tenancy.central_domains')` (e.g. `127.0.0.1`) that is **not** a tenant — tenancy is a no-op there. |
| **Bootstrapper** | A Stancl class that makes a Laravel subsystem (DB, cache, filesystem, queue) tenant-aware when tenancy initializes. |
| **Module** | A row in the `modules` table that drives a sidebar item; may be a `group` or an `item`. `resourceful` modules get CRUD permissions. |
| **Module Builder** | The generator (central, `/module-builder`) that scaffolds a full-stack CRUD module (backend + React). |
| **Module tree** | The nested `modules` structure returned by `GET /api/modules/tree`, rendered as the sidebar and cached in `localStorage`. |
| **Resourceful module** | A module flagged to auto-generate `view/create/edit/delete/export` permissions. |
| **Guard** | A spatie/Laravel auth guard. Roles/permissions exist for both `web` and `sanctum`; the SPA authenticates under `sanctum`. |
| **Super Admin** | The role with a `Gate::before` bypass over all permission checks. |
| **ApiResponse** | The standard JSON envelope helper (`success`, `message`, `data`, `errors`). |
| **FormRequest** | A Laravel request class holding validation `rules()` and `authorize()`. |
| **Service** | The class that holds a module's business logic and transactions (controllers stay thin). |
| **Resource** | An API Resource that defines a model's JSON output shape. |
| **DataTable / useServerTable** | The frontend pair driving server-side paginated/searchable/sortable tables. |
| **department_mode** | A per-tenant setting (`shared` / `scoped` / `flexible`, `App\Support\DepartmentMode`) controlling how departments relate to organizations. |
| **Shared department** | A department with `organization_id = null` — usable tenant-wide, not owned by one organization. |
| **Lookup / master data** | Reference tables (genders, countries, departments, designations, …) seeded with defaults. |
| **Central-only module** | A module (`tenants`, `module-builder`) that must never appear inside a tenant (`config/central.php`). |
