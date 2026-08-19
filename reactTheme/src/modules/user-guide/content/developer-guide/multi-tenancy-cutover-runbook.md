# Multi-Tenancy Cutover Runbook — Domain Identification

Status: **ready to execute** · Companion to [multi-tenancy-stancl-guide.md](multi-tenancy-stancl-guide.md)
Branch: `tenancy` · Identification: **domain/subdomain** (locked decision)

> This is the step-by-step for turning the current single-tenant app into
> Stancl **database-per-tenant, domain-identified** tenancy. The **foundation is
> already done** (see §0). The rest is **destructive** — it takes the current
> `localhost` login offline until a tenant exists and is reachable by its domain.
> Run it deliberately, on the `tenancy` branch, with a DB backup taken first.

---

## 0. Already done (foundation — non-destructive, app still works)

- ✅ `stancl/tenancy` v3.10 installed (verified compatible with Laravel 13.8).
- ✅ `php artisan tenancy:install` scaffold: `config/tenancy.php`,
  `app/Providers/TenancyServiceProvider.php`, `routes/tenant.php`,
  `database/migrations/tenant/` (empty).
- ✅ `TenancyServiceProvider` registered in `bootstrap/providers.php`.
- ✅ Central `tenants` + `domains` tables migrated into the current DB.
- ✅ App still boots; `localhost` login returns 200 (Stancl is dormant because
  `localhost`/`127.0.0.1` are `central_domains` and no tenant domains exist).

Everything below is **not yet done**. Take a DB dump before starting:
`docker compose exec -T db mysqldump -u root -psecret elara > backup-precutover.sql`

---

## Part A — Local domain infrastructure (do this first; it's the part that's easy to get wrong)

Domain identification means the browser must reach `school1.example.test` and the
app must see that `Host`. Locally we use the `.test`/`.localhost` TLD.

### A1. Choose a base domain and central host

- Central app: `app.elara.test`
- Tenants: `<tenant>.elara.test` (e.g. `school1.elara.test`)

### A2. hosts entries (Windows: `C:\Windows\System32\drivers\etc\hosts`, run as admin)

```
127.0.0.1  app.elara.test
127.0.0.1  school1.elara.test
127.0.0.1  school2.elara.test
```

> Wildcards aren't supported in `hosts`. For many tenants use **Acrylic DNS**
> (Windows) or **dnsmasq** to resolve `*.elara.test → 127.0.0.1`. Add tenants to
> `hosts` one-by-one only for a quick demo.

### A3. nginx — serve the backend for the apex **and** all subdomains

Edit `docker/nginx/default.conf`:

```nginx
server {
    listen 80;
    server_name app.elara.test *.elara.test;   # <— apex + wildcard
    index index.php index.html;
    root /var/www/html/public;

    location / { try_files $uri $uri/ /index.php?$query_string; }
    location ~ \.php$ {
        fastcgi_pass backend:9000;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }
    location ~ /\.ht { deny all; }
}
```

`docker compose restart nginx`. Backend is now reachable at
`http://app.elara.test:8000` and `http://school1.elara.test:8000`.

### A4. Frontend per-origin

The SPA must be served from the same origin it talks to. For the demo, run Vite
bound to the tenant host and point its API base at the same host:

- `reactTheme/.env`: `VITE_API_BASE_URL` and `VITE_BACKEND_URL` derive from
  `window.location.origin` instead of a hardcoded `localhost:8000` (see Part G).
- Vite `server.allowedHosts` must include `.elara.test` (Vite blocks unknown hosts):
  ```js
  // vite.config.js → server
  allowedHosts: ['.elara.test'],
  ```
- Access the SPA at `http://school1.elara.test:5173` (add `:5173` hosts/nginx as
  needed, or reverse-proxy the SPA too).

> **Production:** wildcard DNS `*.elara.com`, wildcard TLS cert, one nginx vhost.
> Same shape, real certs.

---

## Part B — DB connections & privileges

### B1. Central connection needs `CREATE DATABASE`

Stancl's `CreateDatabase` job runs `CREATE DATABASE tenant<id>` over the **central
connection**. `elara_user` only has rights on the `elara` schema, so **point the
central connection at a privileged user** (root in local Docker).

`back/.env`:
```
DB_CONNECTION=mysql
DB_HOST=db
DB_PORT=3306
DB_DATABASE=elara            # central schema (tenants, domains, central users, plans)
DB_USERNAME=root             # needs CREATE/DROP DATABASE for provisioning
DB_PASSWORD=secret
CENTRAL_DOMAIN=app.elara.test
```

> Production: a dedicated **provisioning** user with `CREATE/DROP DATABASE`, used
> only by the create/delete-tenant jobs, and a lower-priv user for request traffic.
> Stancl supports separate connections for this.

### B2. Tenant template connection

`config/tenancy.php` default `template_tenant_connection => null` reuses the
central connection as the template (swapping the DB name per tenant) — fine for
local. Confirm `database.prefix => 'tenant'` (tenant DBs become `tenant<uuid>`).

### B3. Session/cache drivers for isolation

`back/.env`:
```
SESSION_DRIVER=database      # sessions land in each tenant DB → isolated
CACHE_STORE=database         # CacheTenancyBootstrapper prefixes per tenant
QUEUE_CONNECTION=database
SESSION_DOMAIN=null          # host-only cookies → per-subdomain isolation (see guide §4)
```

---

## Part C — Split migrations (the core move)

Move every app/business migration into `database/migrations/tenant/`. **Only the
two Stancl migrations stay central.** Use `git mv` so history is preserved.

**Stay in `database/migrations/` (central):**
```
2019_09_15_000010_create_tenants_table.php
2019_09_15_000020_create_domains_table.php
```

**Move to `database/migrations/tenant/`:**
```
0001_01_01_000000_create_users_table.php            (users + password_reset + sessions)
0001_01_01_000001_create_cache_table.php
0001_01_01_000002_create_jobs_table.php
2026_06_29_143013_create_personal_access_tokens_table.php
2026_06_29_151724_create_permission_tables.php
2026_06_30_123351_create_modules_table.php
2026_07_01_151704_create_application_types_table.php
2026_07_01_151948_create_countries_table.php
2026_07_01_152334_create_cities_table.php
2026_07_01_163007_create_genders_table.php
2026_07_15_000000_add_avatar_to_users_table.php
2026_07_15_110000_create_global_settings_table.php
2026_07_15_120000_create_global_setting_fields_and_records.php
2026_07_15_130000_create_files_table.php
2026_07_22_000000_add_profile_fields_to_users_table.php
```

```powershell
# from back/
git mv database/migrations/0001_01_01_000000_create_users_table.php database/migrations/tenant/
# ...repeat for each file above...
```

> **Judgement call — shared lookups & modules.** In database-per-tenant, `modules`,
> `genders`, `countries`, `cities`, `application_types` are **duplicated per tenant**
> (seeded identically into each tenant DB). If you truly want them *shared* across
> all tenants, that's a hybrid (central `modules`, tenant business data) — which is
> closer to `multi-tenancy-plan.md`. Decide before running. Default here: duplicate
> per tenant (simplest, fully isolated).

### C1. Central users for Super Admins

Central now has **no** `users` table (it moved). Super Admins that manage tenants
need their own table. Add a **new central migration**
`database/migrations/2026_07_23_000000_create_central_users_table.php` with a
`central_users` table (id, name, email, password, timestamps), and a
`App\Models\CentralUser` model + a `central` auth guard in `config/auth.php`.
Keep the two User models/guards distinct so a tenant token can never authenticate
centrally.

---

## Part D — Tenant & Domain models with wizard columns

Create app models so the wizard fields are real, queryable columns.

`app/Models/Tenant.php`:
```php
namespace App\Models;

use Stancl\Tenancy\Database\Models\Tenant as BaseTenant;
use Stancl\Tenancy\Contracts\TenantWithDatabase;
use Stancl\Tenancy\Database\Concerns\HasDatabase;
use Stancl\Tenancy\Database\Concerns\HasDomains;

class Tenant extends BaseTenant implements TenantWithDatabase
{
    use HasDatabase, HasDomains;

    // Promote these out of the JSON `data` column into real columns
    // (add them to the create_tenants migration as nullable columns).
    public static function getCustomColumns(): array
    {
        return ['id', 'name', 'status', 'email', 'phone', 'timezone',
                'currency', 'language', 'logo_path'];
    }
}
```

Add those columns to `2019_09_15_000010_create_tenants_table.php` (central).
Point `config/tenancy.php` `tenant_model => App\Models\Tenant::class` and
`domain_model => App\Models\Domain::class` (a thin subclass of Stancl's `Domain`).

---

## Part E — Provisioning pipeline (create DB + migrate + seed first admin)

### E1. Enable seeding in the pipeline

`app/Providers/TenancyServiceProvider.php` → `TenantCreated` pipeline: uncomment
`Jobs\SeedDatabase::class` after `MigrateDatabase`, and set `->shouldBeQueued(true)`
for production.

`config/tenancy.php`:
```php
'seeder_parameters' => ['--class' => 'Database\\Seeders\\TenantDatabaseSeeder'],
'migration_parameters' => ['--path' => 'database/migrations/tenant', '--realpath' => false],
```

### E2. Tenant seeder — roles, permissions, first admin

`database/seeders/TenantDatabaseSeeder.php` (runs **inside** the tenant DB):
```php
public function run(): void
{
    $this->call(RolePermissionSeeder::class);   // your existing seeder, teams OFF
    $this->call(ModuleSeeder::class);
    $this->call(GlobalSettingSeeder::class);

    $admin = \App\Models\User::create([
        'name'     => tenant('admin_name')  ?? 'Administrator',
        'email'    => tenant('admin_email'),
        'password' => tenant('admin_password'),  // hashed by cast
    ]);
    $admin->assignRole('Super Admin');
}
```

> **Turn spatie teams OFF** (`config/permission.php` `'teams' => false`). Teams is
> for the *central row-level* plan; here isolation is the separate DB.

---

## Part F — Routes cutover

- **`routes/api.php` (central)** — keep only tenant management + central auth:
  `POST/GET/PUT/DELETE /api/tenants`, `suspend`/`activate`, `plans`, central login.
- **`routes/tenant.php`** — move the whole current app API here, wrapped in the
  domain middleware:
  ```php
  Route::middleware([
      'api',
      InitializeTenancyByDomain::class,
      PreventAccessFromCentralDomains::class,
  ])->prefix('api')->group(function () {
      // login, logout, /user, /profile*  (your current AuthController routes)
      // require base_path('routes/modules/'.$f) for each module file
  });
  ```
  The existing `routes/modules/{Module}Api.php` auto-loader in `bootstrap/app.php`
  should be moved to load **inside** this tenant group instead of the central group.

---

## Part G — Sanctum / CORS / frontend for subdomains

- `config/cors.php`: `'supports_credentials' => true`, and
  `'allowed_origins_patterns' => ['#^http://[a-z0-9-]+\.elara\.test(:\d+)?$#']`,
  `paths` include `api/*` and `sanctum/csrf-cookie`.
- `SANCTUM_STATEFUL_DOMAINS`: can't wildcard. Add a tiny provider that pushes the
  current request `Host` into `config(['sanctum.stateful' => [...]])` before
  Sanctum's middleware, OR list demo domains explicitly for now.
- Frontend `apiClient.ts`: derive base URL from origin —
  `baseURL: `${window.location.origin.replace(':5173', ':8000')}/api`` (or serve
  SPA and API on one origin behind nginx). Drop the hardcoded `VITE_*` hosts.

---

## Part H — Central tenant-management module (the wizard backend)

Standard module shape, **central** (no tenancy init):
`TenantController`, `TenantService`, `Store/UpdateTenantRequest`, `TenantResource`,
`CreateTenantData` DTO. `TenantService::create()` (guide §7.2) wraps
`Tenant::create()` + `$tenant->domains()->create()` in a central transaction; the
`TenantCreated` pipeline provisions the DB. Wizard payload → tenant columns +
`admin_email`/`admin_password` (consumed by the seeder, then cleared from `data`).

Lifecycle endpoints (guide §8): `suspend`, `activate`, `archive` (soft delete),
`restore`, hard `delete` (drops DB via `DeleteDatabase` job).

---

## Part I — Migrate the existing single tenant's data

Your current `elara` DB holds one real dataset. To preserve it:

1. Create the first tenant + domain:
   ```php
   $t = Tenant::create(['id' => 'demo', 'name' => 'Demo School', 'status' => 'active']);
   $t->domains()->create(['domain' => 'school1.elara.test']);
   ```
   The pipeline creates `tenantdemo`, migrates it, seeds it.
2. Copy the old rows into the tenant DB, per table:
   `INSERT INTO tenantdemo.users SELECT * FROM elara.users;` … for each moved table.
   (Or `mysqldump elara <tables> | mysql tenantdemo`.) Skip the central-only tables.
3. Drop the moved tables from `elara` once verified — central keeps only
   `tenants`, `domains`, `central_users`, plans.

---

## Part J — Verification checklist

- [ ] `php artisan migrate` (central) creates only tenants/domains/central_users.
- [ ] `php artisan tenants:migrate` builds a full app schema in each tenant DB.
- [ ] Creating a tenant provisions DB + runs migrations + seeds admin (check
      `SHOW DATABASES LIKE 'tenant%'`).
- [ ] `http://school1.elara.test:8000/api/login` authenticates against the **tenant**
      users; the same creds fail on `school2`.
- [ ] `app.elara.test` cannot hit tenant routes (`PreventAccessFromCentralDomains`).
- [ ] Uploads land under `storage/tenant<id>/…`; no cross-tenant leak.
- [ ] A queued job dispatched in school1 runs against school1's DB.
- [ ] `tests/Feature/TenantIsolationTest.php` green (two tenants, no cross-read).

---

## Rollback

Everything is on the `tenancy` branch and additive until Part C. To abandon:
```
git checkout moduleBuilder          # back to the working single-tenant app
docker compose exec backend composer remove stancl/tenancy
# restore DB if Part C+ ran: mysql -u root -psecret elara < backup-precutover.sql
```
Because the foundation (§0) is non-destructive, you can sit on it indefinitely —
Stancl stays dormant while `localhost` remains a central domain.

---

## Sequencing when you're ready

A → B → C (+C1) → D → E → F → G → H, then I to bring your data across, then J.
Parts A–B and H are independent and can be prepped early; C is the destructive
line — nothing before it breaks the current app.
