# Permissions

> **Status:** Current · **Last updated:** 2026-08-19 · **Owner:** Engineering

**80 distinct permissions**, each created for **both** the `web` and `sanctum`
guards (→ 160 rows). They come from **two** sources.

## Two sources

| Source | Count | Actions | For |
|---|---|---|---|
| **`ModuleSeeder`** (derived from resourceful modules) | 65 | `view, create, edit, delete, export` | the real CRUD modules |
| **`RolePermissionSeeder`** (hand-written matrix) | 15 | varies | domain roles (education lineage) |

- **Module-derived (65)** = 13 resourceful modules × 5 actions. Names come from
  `Module::permissionNames()`.
- **Matrix (15)** = `students.*`, `teachers.*`, `attendance.*` (4 each),
  `reports.{view,export}`, `dashboard.view`. These have **no backend routes
  yet** — they exist so the `Teacher` / `Student` / `Parent` roles have something
  to hold. (`users.*`, `roles.*`, `permissions.*` also appear in the matrix but
  are a subset of the module-derived set, so they add nothing.)

## Naming

`Module::permissionNames()` derives names from the **module name** via `Str::snake`:

```
<module_snake>.<action>   e.g. department.create, organization.delete
```

Note the naming is **mixed** — it follows the module name, not the URL:

- `Users` / `Roles` / `Permissions` → **plural** (`users.view`, `roles.edit`).
- Everything else → **singular** (`organization.view`, `department.create`,
  `application_type.edit`).

So the permission prefix and the route slug can differ (e.g. slug
`/organizations`, permission `organization.view`). **The route middleware must
match the permission name** — always check `permissionNames()`, not the URL.

## How they're created

`ModuleSeeder` walks the module tree; for each `'resourceful' => true` module it
creates the CRUD permissions **for both guards** and grants them to `Admin`:

```php
foreach (['web', 'sanctum'] as $guard) {
    foreach ($module->permissionNames() as $name) {
        Permission::firstOrCreate(['name' => $name, 'guard_name' => $guard]);
    }
}
$admin->givePermissionTo($names); // ← see the guard note below
```

`Super Admin` and `Admin` are both synced to **every** permission (both guards)
by `RolePermissionSeeder`; `Super Admin` also bypasses via `Gate::before`, so it
needs none explicitly.

## Enforcement (which permissions actually gate a route)

Every resourceful module enforces `permission:` middleware **per route**
(`view` on GET, `create` on POST, `edit` on PUT, `delete` on DELETE). Verified
across all 15 `routes/modules/*Api.php` files. Two deliberate exceptions:

- `ModuleApi` (sidebar tree) — `auth:sanctum` only; every user needs the menu.
- `TenantApi` — `['central', 'auth:sanctum', 'role:Super Admin']` (role-gated,
  not permission-gated).

### Defined but **not** enforced (dead permissions)

These exist in the DB but no route uses them:

- **`*.export` (all 13 modules)** — created by `permissionNames()` but no export
  endpoint exists anywhere.
- **`roles.delete`, `permissions.delete`** — `RoleApi` / `PermissionApi` expose
  no DELETE route (roles/permissions aren't deletable via the API).
- **Matrix domain permissions** (`students.*`, `teachers.*`, `attendance.*`,
  `reports.*`) — no controllers/routes yet.

> **Nothing is missing to *add*** for current features — coverage of the live
> CRUD modules is complete. The gaps are the reverse: a handful of permissions
> are defined ahead of the features that will use them.

## Direct permissions

Beyond role grants, a user can hold **direct** permissions
(`model_has_permissions`). Profile → Access shows a user's roles (with their
permissions) and any directly-assigned ones (`getDirectPermissions()`).

## Adding a permission

Permissions come from modules, so the normal path is:

1. Ensure the module is `resourceful` in `ModuleSeeder`.
2. Re-seed `ModuleSeeder` (idempotent) → permissions created for both guards.
3. Guard the route: `->middleware('permission:foo.action')` — matching the
   `permissionNames()` output, not the URL slug.

For a one-off permission not tied to a module, add it to the
`RolePermissionSeeder` matrix (both guards) and grant it to the right role.

## Review notes / recommendations

1. **Align `ModuleSeeder`'s Admin grant to both guards.** It does
   `$admin = Role::firstOrCreate(['name' => 'Admin'])` (default `web` guard) then
   `$admin->givePermissionTo($names)`, so module permissions are attached to
   `Admin` under **web only**. `RolePermissionSeeder` already re-syncs `Admin` to
   everything for both guards *before* these exist, so today it's saved by run
   order — but the grant itself is asymmetric with the app's dual-guard rule.
   Loop `['web','sanctum']` in `grantPermissions()` for robustness.
2. **Decide `*.export`:** either wire an export endpoint behind
   `permission:<module>.export`, or drop `export` from `permissionNames()` so the
   permission list reflects real capabilities.
3. **`roles.delete` / `permissions.delete`** are unreachable — remove or add the
   DELETE routes if deletion is intended.
