# Permissions

> **Status:** Current · **Last updated:** 2026-08-13 · **Owner:** Engineering

**80 distinct permissions** (each duplicated across the `web` and `sanctum`
guards). They are **derived from modules**, not hand-written.

## Naming

`Module::permissionNames()` derives names from the module name via `Str::snake`:

```
<module_snake>.<action>   e.g. user.view, department.create, organization.delete
```

Default actions: `view`, `create`, `edit`, `delete`, `export`.

- **Module name** → the permission prefix (e.g. name "Organization" → `organization.*`).
- **Route guards** must match: `->middleware('permission:organization.view')`.

So the permission prefix (singular, from the name) and the route slug (often
plural, e.g. `/organizations`) can differ — keep the **name** consistent with the
API's `permission:` middleware.

## How they're created

`ModuleSeeder` walks the module tree; for each `'resourceful' => true` module it
creates the CRUD permissions **for both guards** and grants them to the `Admin`
role:

```php
foreach (['web', 'sanctum'] as $guard) {
    foreach ($module->permissionNames() as $name) {
        Permission::firstOrCreate(['name' => $name, 'guard_name' => $guard]);
    }
}
$admin->givePermissionTo($module->permissionNames());
```

`Super Admin` needs none of these (it bypasses via `Gate::before`).

## Direct permissions

Beyond role-based grants, a user can hold **direct** permissions
(`model_has_permissions`). The Profile → Access tab shows a user's roles (with
their permissions) and any directly-assigned permissions
(`getDirectPermissions()`).

## Adding a permission

Permissions come from modules, so the normal path is:

1. Ensure the module is `resourceful` in `ModuleSeeder`.
2. Re-seed `ModuleSeeder` (idempotent) → permissions created for both guards +
   granted to Admin.
3. Guard the route: `->middleware('permission:foo.action')`.

For a one-off permission not tied to a module, create it in `RolePermissionSeeder`
for both guards and grant it to the appropriate role. See
[../25-common-development-tasks/adding-permission.md](../25-common-development-tasks/adding-permission.md)
(planned) or [../development/adding-module.md](../development/adding-module.md).
