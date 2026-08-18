# Backend Architecture

Laravel 13 API. No Blade UI — it serves JSON to the React SPA.

## Layering

```
Request → Route (routes/modules/*Api.php)
        → Middleware (tenancy → auth:sanctum → permission/role)
        → FormRequest (validation + authorization)
        → Controller (thin)
        → Service (business logic, transactions)
        → Model (Eloquent)
        → Resource (output shape)
        → ApiResponse (standard envelope)
```

- **Controllers are thin** — they validate via a FormRequest, delegate to a
  Service, and wrap the result in `ApiResponse`.
- **Services** hold business logic and own DB transactions.
- **API Resources** define the JSON shape returned to the client.

### The response envelope

Every endpoint returns the same shape via `App\Helpers\ApiResponse`:

```json
{ "success": true, "message": "...", "data": {...}, "errors": null }
```

`ApiResponse::success()`, `::paginated()`, and `::error()` are the three
builders. Framework exceptions (validation, auth, not-found, throttle, tenant
not found) are normalized into the same envelope in `bootstrap/app.php`
(`withExceptions`), so client handling is uniform.

## Module route auto-loading

`bootstrap/app.php` globs `routes/modules/*.php` and loads each under the `api`
middleware + `/api` prefix. **Dropping a new `FooApi.php` file makes its routes
live** — no central registration. The Module Builder relies on this.

```php
foreach (glob(base_path('routes/modules/*.php')) as $moduleRoutes) {
    Route::middleware('api')->prefix('api')->group($moduleRoutes);
}
```

## Conventions

- **Fillable via attribute:** models use `#[Fillable([...])]` (PHP attribute),
  not a `$fillable` property. Example: `#[Fillable(['name', 'parent_id'])]`.
- **FormRequest per action:** `Store*Request`, `Update*Request`, each with
  `rules()` and `authorize()` (permission/role check).
- **Permission naming:** derived from the module name via `Str::snake`. A module
  named "Organization" → `organization.view/create/edit/delete/export`. Routes
  guard with `->middleware('permission:organization.view')`.
- **Constants:** user-facing strings live in `App\Constants\ResponseMessage`.

## Authentication

Sanctum **cookie/session** auth (SPA-first), not tokens. Flow: SPA calls
`GET /sanctum/csrf-cookie`, then `POST /api/login`; the session cookie carries
auth on subsequent requests. See [../api/authentication.md](../api/authentication.md).

Authorization uses **spatie/laravel-permission**. Roles/permissions exist for
both the `web` and `sanctum` guards (the SPA runs on `sanctum`); seeders create
both. `Super Admin` gets a `Gate::before` bypass over every check.

## Multi-tenancy (Stancl Tenancy v3)

- **Identification:** a custom `InitializeTenancyIfTenantDomain` middleware is
  prepended to the `web` and `api` groups. On a **central** domain
  (`config('tenancy.central_domains')`, e.g. `127.0.0.1`) it's a no-op; on a
  tenant domain it resolves the tenant from the `domains` table and initializes
  tenancy (swapping DB/cache/filesystem/queue).
- **Provisioning:** creating a tenant fires Stancl's `TenantCreated` pipeline
  (`CreateDatabase` → `MigrateDatabase` → `SeedDatabase`). It's queued in normal
  operation; the default-tenant seeder runs it synchronously.
- **Central vs tenant middleware:** the `central` alias
  (`PreventAccessFromTenantDomains`) keeps central-only routes (tenant
  management, module builder) off tenant domains.
- **Tenant DB names:** `tenant` + id (e.g. tenant id `local` → DB `tenantlocal`).

See [database.md](database.md) for how migrations and tables are split.

## Notable packages

- `laravel/sanctum` — cookie auth.
- `spatie/laravel-permission` — roles/permissions (teams **off**).
- `stancl/tenancy` — database-per-tenant.
- `laravel/mcp`, `laravel/ai` — AI/agent tooling (installed; wiring in progress).

## Testing

PHPUnit 12 (`php artisan test`), Laravel Pint for style. Factories under
`database/factories`.
