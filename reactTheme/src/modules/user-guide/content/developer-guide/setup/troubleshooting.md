# Setup Troubleshooting

Problems you'll most likely hit while getting the environment running. For
runtime/app bugs, see [../troubleshooting/common-issues.md](../troubleshooting/common-issues.md).

## Docker Desktop won't start / `docker` can't connect

`docker` CLI responds but commands fail with `... dockerDesktopLinuxEngine: The
system cannot find the file specified`. The **engine** isn't running (the CLI is
separate). Start Docker Desktop and wait ~1 min for the engine; it may need a
first-run WSL2 setup you must click through.

## Port already in use (3306 / 5173 / 8000)

Laragon or another local MySQL often holds **3306**. MySQL is published on
**3307** here to avoid that. If 5173/8000 are taken, stop whatever native
`vite`/`php artisan serve` is running before `docker compose up`.

## Login fails with "Session store not set on request" (500)

Sanctum only starts the session for requests whose `Origin` is in
`SANCTUM_STATEFUL_DOMAINS`. A login from a non-listed origin (e.g. `127.0.0.1:5173`
when only `localhost:5173` is configured) throws this. Use a stateful origin, or
add yours to `SANCTUM_STATEFUL_DOMAINS`. (A real browser from the configured
origin works — this usually only bites manual/API testing.)

## `localhost:5173` shows "tenant not found" (500)

`localhost` is a **tenant** domain, and a fresh DB has no tenant yet. Run
`php artisan migrate:fresh --seed` — `DefaultTenantSeeder` provisions the
`localhost` tenant. If it fails, see the next item.

## Tenant creation fails: `Access denied … CREATE DATABASE`

The DB user can't create databases. Set `DB_USERNAME=root` in `back/.env`
(local dev), then `php artisan config:clear`. This value has reverted before, so
check it first when provisioning breaks.

## Module Builder: "Store/Routes file missing … /var/www/reactTheme/…"

The backend container needs the `./reactTheme:/var/www/reactTheme` volume mount
(so the generator can scaffold frontend files). If the container was created
before that mount was added, `restart` won't apply it — **recreate** it:

```bash
docker compose up -d backend
```

## Frontend changes don't hot-reload

On Docker + Windows, bind-mount file events don't reach the container, so Vite's
watcher misses edits. `vite.config.js` enables `server.watch.usePolling`. If it's
off or the container is stale, edits won't HMR — restart the frontend container.

## New sidebar item doesn't appear

The sidebar caches the module tree in `localStorage`. After seeding a new
`modules` row, hard-reload (`Ctrl+Shift+R`) or clear the cache:

```js
localStorage.removeItem('elara.modules-tree'); location.reload()
```

## Migration/seed fails: `Table 'elara.users' doesn't exist`

The central DB is missing core tables — usually because they were moved into
`database/migrations/tenant/` only. Central needs its own copy of the core auth
+ app migrations. Confirm the required tables exist in `database/migrations/`
(not just `tenant/`).

## Composer is very slow in the container

Normal for first installs. Let it finish (it can take minutes). Don't run a
second `composer require` concurrently — parallel Composer corrupts the lock. If
a package installs but its class "is not found", run
`docker compose exec backend composer dump-autoload`.
