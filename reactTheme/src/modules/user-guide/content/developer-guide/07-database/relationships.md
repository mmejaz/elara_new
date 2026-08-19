# Database — Relationships

> **Status:** Current · **Last updated:** 2026-08-13 · **Owner:** Engineering

Foreign keys and the Eloquent relations that express them. Only relationships
that **actually exist** in the models are listed.

## Tenancy

- `Domain.tenant_id` → `Tenant` (belongsTo). `Tenant hasMany Domain`.

## Organizations

- `Organization.parent_id` → `Organization` (self, hierarchy). `parent()` / `children()`.
- `organization_user` pivot: `Organization belongsToMany User`, `User belongsToMany Organization`.
- Helper: `Organization::ancestorIdsOf($id)` walks the parent chain (used by department scoping).

## Departments (hierarchical **and** organization-scoped)

- `Department.parent_id` → `Department` (self; `nullOnDelete` — deleting a parent
  makes children top-level). `parent()` / `children()`.
- `Department.organization_id` → `Organization` (nullable; **null = shared /
  tenant-wide**). `organization()`.
- Scope `Department::scopeAvailableTo($organizationId)` returns an org's own
  departments + shared (null) + those owned by ancestor organizations. Passing
  `null` returns everything (management view).

## Files (polymorphic)

- `File.fileable_type` / `fileable_id` → any model using the `HasFiles` trait
  (e.g. `User` for avatars). `File.uploaded_by` → `User`.

## Modules (sidebar tree)

- `Module.parent_id` → `Module` (self; groups → items → sub-items). Drives
  `GET /api/modules/tree`.

## Access control (spatie)

- `User` ↔ `Role` and `User`/`Role` ↔ `Permission` via `model_has_roles`,
  `model_has_permissions`, `role_has_permissions`. Rows are per **guard**
  (`web`, `sanctum`).

> **Cross-database note:** in the DB-per-tenant model, relationships never cross
> the central/tenant boundary — a tenant's rows reference only rows in the same
> tenant database. `organization_id` on a tenant's departments points at that
> tenant DB's `organizations` table.
