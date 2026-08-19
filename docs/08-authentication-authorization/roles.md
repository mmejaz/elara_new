# Roles

> **Status:** Current · **Last updated:** 2026-08-13 · **Owner:** Engineering

Seeded by `RolePermissionSeeder`. Each role exists for **both** the `web` and
`sanctum` guards (so 5 role names → 10 rows).

| Role | Intent | Permissions |
|---|---|---|
| **Super Admin** | Platform operator / tenant owner | **All** — via `Gate::before` bypass (holds no explicit permissions) |
| **Admin** | Full application admin | Granted every module permission by the seeders |
| **Teacher** | Domain role (education context) | Subset — assigned as the app's domain evolves |
| **Student** | Domain role | Subset |
| **Parent** | Domain role | Subset |

> `Super Admin` and `Admin` are the actively-used roles today. `Teacher` /
> `Student` / `Parent` are seeded domain roles reflecting the app's education
> lineage; their permission sets are minimal until those modules are built.

## How roles are assigned

- **Central admin / tenant owner:** the seeders assign `Super Admin` (both
  guards). Tenant provisioning assigns the tenant's first admin the `Admin` role
  (Super Admin's `Gate::before` is reserved for the operator).
- **Programmatically:** assign for both guards so the SPA (sanctum) sees it:
  ```php
  $user->syncRoles(
      Role::where('name', 'Super Admin')->whereIn('guard_name', ['web','sanctum'])->get()
  );
  ```

## Adding a role

1. Add it in `RolePermissionSeeder` (create for both guards; grant permissions).
2. Re-seed: `php artisan db:seed --class=RolePermissionSeeder` (idempotent).
3. Grant it via the Roles UI (`/roles`) or the API.

There is a custom validation rule `App\Rules\AssignableRole` used where role
assignment is validated.
