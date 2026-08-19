# Backend Directory Structure

> **Status:** Current · **Last updated:** 2026-08-13 · **Owner:** Engineering

The Laravel API lives in `back/`. This maps the real tree and what belongs where.

## Top level (`back/`)

```
back/
├── app/            # application code (see below)
├── bootstrap/      # app.php (routing, middleware, exceptions), providers.php, cache/
├── config/         # config files (tenancy.php, central.php, permission.php, …)
├── database/       # migrations, seeders, factories
├── routes/         # api.php, web.php, console.php, tenant.php, modules/
├── resources/      # views/assets (minimal — API-first)
├── storage/        # logs, framework cache, tenant file storage
├── stubs/          # Module Builder / generator stubs
├── tests/          # PHPUnit feature + unit tests
├── public/         # web root (index.php)
├── artisan         # CLI entry
├── composer.json   # PHP dependencies
├── phpunit.xml     # test config
├── Dockerfile      # backend container (php-fpm)
└── *_GUIDE.md      # in-repo notes (BACKEND_GUIDE, LOGGING_GUIDE)
```

## `app/`

```
app/
├── Console/        # Artisan commands (Commands/) + scheduling
├── Constants/      # ResponseMessage (user-facing strings)
├── Helpers/        # ApiResponse (the standard JSON envelope)
├── Http/           # Controllers, Middleware, Requests, Resources
├── Jobs/           # queued jobs
├── Models/         # Eloquent models
├── Providers/      # AppServiceProvider, TenancyServiceProvider
├── Rules/          # custom validation rules
├── Services/       # business logic (one per module)
└── Support/        # helpers/value objects (e.g. DepartmentMode)
```

### `Http/`

```
Http/
├── Controllers/    # 18 thin controllers (delegate to Services)
├── Middleware/     # tenancy, central guard, security headers, …
├── Requests/       # FormRequests, grouped per module:
│   ├── ApplicationType/  Auth/  City/  Country/  Department/
│   ├── Designation/  DocumentType/  Gender/  GlobalSetting/
│   ├── LeaveType/  Module/  Organization/  Permission/
│   └── Profile/  Role/  Tenant/  User/
└── Resources/      # API Resources (JSON output shapes)
```

### `Models/`

`ApplicationType`, `City`, `Country`, `Department`, `Designation`,
`DocumentType`, `File`, `Gender`, `GlobalSetting`, `GlobalSettingField`,
`GlobalSettingRecord`, `LeaveType`, `Module`, `Organization`, `Tenant`, `User`.

### `Services/` (18)

One service per module — holds business logic and transactions (controllers stay
thin). E.g. `DepartmentService`, `TenantService`, `UserService`, …

### `Jobs/`, `Rules/`, `Support/`, `Console/`

- **Jobs:** `ClearTenantAdminPassword` (wipes the plaintext admin password from a
  tenant's `data` after provisioning).
- **Rules:** `AssignableRole` (custom role-assignment validation).
- **Support:** `DepartmentMode` (`shared` / `scoped` / `flexible` value object).
- **Console/Commands:** `CreateTenant`, `PruneCentralModules`.

> **Not present:** `app/Events`, `app/Listeners`, `app/Notifications`,
> `app/Policies` — the app doesn't use those Laravel features (authorization is
> spatie + FormRequests, not model policies).

## `routes/`

```
routes/
├── api.php          # central API + bootstraps the module auto-loader
├── tenant.php       # tenant-context routes
├── web.php          # minimal (API-first)
├── console.php      # console-only (scheduling; only the default `inspire`)
└── modules/         # 15 auto-loaded {Module}Api.php files (one per module)
```

`routes/modules/*.php` are auto-loaded (see
[../architecture/backend.md](../architecture/backend.md)) — dropping a new
`FooApi.php` makes its routes live.

## `database/`

```
database/
├── migrations/          # CENTRAL migrations (php artisan migrate)
│   └── tenant/          # TENANT migrations (php artisan tenants:migrate)
├── seeders/             # DatabaseSeeder + per-module seeders
└── factories/           # model factories (tests)
```

See [../architecture/database.md](../architecture/database.md) for the
central-vs-tenant split.

## Where to put a new thing

| Adding… | Put it in |
|---|---|
| A CRUD resource | model, `Http/Requests/<Module>/`, `Http/Resources/`, `Services/`, `Http/Controllers/`, `routes/modules/<Module>Api.php` |
| Business logic | `app/Services/` (never in a controller) |
| A validation rule | `app/Rules/` |
| A queued job | `app/Jobs/` |
| An Artisan command | `app/Console/Commands/` |
| A migration | `database/migrations/` (and `/tenant` if tenants need it) |
| A config value | `config/` |

See [../development/adding-module.md](../development/adding-module.md) for the
full walkthrough.
