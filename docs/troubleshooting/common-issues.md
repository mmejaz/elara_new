# Common Issues

Runtime/application problems and their fixes. For environment/Docker setup, see
[../setup/troubleshooting.md](../setup/troubleshooting.md).

## Auth & sessions

**"Session store not set on request" (500) on login.** Sanctum only starts the
session for origins in `SANCTUM_STATEFUL_DOMAINS`. Log in from a listed origin
(`localhost:5173`), or add yours. Central (`127.0.0.1:5173`) isn't stateful by
default.

**API returns 401 right after login.** The CSRF cookie wasn't fetched, or the
request lacks credentials. The client must `GET /sanctum/csrf-cookie` first and
send `withCredentials` + the `X-XSRF-TOKEN` header. Check `VITE_BACKEND_URL` is
set (the CSRF call uses it).

**403 on a permission-gated endpoint for a valid user.** The permission likely
exists only for the `web` guard, but the SPA uses `sanctum`. Seed permissions for
**both** guards. Symptom during tenant provisioning: roles created under the
wrong guard (see below).

## Tenancy & provisioning

**Tenant seeding fails: "no permission named X for guard sanctum".** Provisioning
was run **inside** a Sanctum HTTP request, so spatie created roles under the
`sanctum` guard while permissions were `web` — a mismatch. Run provisioning in a
**queue worker** (console context → default `web` guard). This is why the create
pipeline is queued; ensure a worker is running:
`php artisan queue:work --tries=1`.

**"Tenant could not be identified on domain localhost".** `localhost` is a tenant
domain but no tenant with that domain exists (e.g. after `migrate:fresh`). Run
the seed so `DefaultTenantSeeder` provisions it.

**`Access denied … CREATE DATABASE`.** The DB connection user lacks privileges.
Local dev: `DB_USERNAME=root`. Production: a scoped provisioning user.

**A created tenant is half-provisioned.** The pipeline failed partway (often the
guard issue above, or a migration error). Delete the tenant (drops its DB) and
recreate once the root cause is fixed. Check `failed_jobs` and `storage/logs`.

## Frontend

**A newly seeded sidebar item doesn't show.** The module tree is cached in
`localStorage` (`elara.modules-tree`) to avoid a reload flash. Hard-reload, or
`localStorage.removeItem('elara.modules-tree'); location.reload()`.

**Ant Design deprecation warning: `Alert message is deprecated, use title`.**
AntD 6 renamed the prop. Use `title` on `<Alert>`.

**Edits don't hot-reload.** Vite's file watcher misses bind-mount changes on
Docker+Windows; `usePolling` must be enabled in `vite.config.js`. Restart the
frontend container if stale.

## Database & seeding

**Duplicate lookup rows.** Shouldn't happen — seeders use `firstOrCreate` /
`updateOrCreate` by natural key. If you see duplicates, a code path inserted
directly, bypassing the seeder. Lookups have no DB-level unique constraint yet
(app-layer only).

**`migrate:fresh` wiped my tenant.** Expected — `migrate:fresh` rebuilds the
**central** DB and the seed re-provisions the default `localhost` tenant. Other
tenants' databases are separate and not dropped by central `migrate:fresh`, but
their central `tenants`/`domains` rows are — recreate them if needed.

## Module Builder

**"Frontend wiring validation failed … Store/Routes file missing."** The backend
container lacks the `./reactTheme` mount. Recreate it: `docker compose up -d backend`.

## When stuck

- Backend errors: `docker compose exec backend sh -c "tail -n 40 storage/logs/laravel.log"`.
- Frontend errors: browser devtools console + `docker compose logs -f frontend`.
- Confirm routes: `php artisan route:list --path=api`.
- Confirm config after `.env` edits: `php artisan config:clear`.
