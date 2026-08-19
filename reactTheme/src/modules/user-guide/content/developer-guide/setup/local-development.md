# Local Development

Everything runs in Docker Compose. You need **Docker Desktop** running.

## Services

| Service | Container | Port | Purpose |
|---|---|---|---|
| backend | `elara_backend` | (9000 internal) | Laravel / php-fpm |
| nginx | `elara_nginx` | **8000** | API + serves the backend |
| frontend | `elara_frontend` | **5173** | Vite dev server (React) |
| db | `elara_db` | **3307**→3306 | MySQL 8 |
| phpmyadmin | `elara_phpmyadmin` | **8080** | DB browser |

> MySQL is published on **3307** on the host (to avoid clashing with a local
> MySQL/Laragon on 3306). Inside Docker, services still talk to `db:3306`.

## First-time setup

```bash
# 1. Build & start everything
docker compose up -d --build

# 2. Backend dependencies + app key
docker compose exec backend composer install
docker compose exec backend php artisan key:generate

# 3. Build the database (central) + provision the default tenant
docker compose exec backend php artisan migrate:fresh --seed
```

The frontend container installs its own deps and runs `vite` automatically. If
you ever need to (re)install them:

```bash
docker compose exec frontend npm install
docker compose restart frontend
```

## Accessing the app

- **App (default tenant):** http://localhost:5173 — login `test@test.com` / `password123`
- **Central console:** `127.0.0.1` is the central domain (see notes below)
- **phpMyAdmin:** http://localhost:8080 (server `db`, user `root`, password `secret`)

### Central vs tenant hosts (important)

This app is multi-tenant by **domain**:

- `localhost` is a **tenant** domain — the SPA at `localhost:5173` logs into the
  default `local` tenant.
- `127.0.0.1` is the **central** domain — for managing tenants/organizations.

After `migrate:fresh --seed`, the `DefaultTenantSeeder` provisions the `localhost`
tenant so the SPA works immediately. Without it, `localhost` would 500 with
"tenant not found".

## Everyday commands

```bash
# Rebuild DB from scratch (drops everything, re-seeds, re-provisions localhost tenant)
docker compose exec backend php artisan migrate:fresh --seed

# Re-seed only (idempotent — no duplicates)
docker compose exec backend php artisan db:seed

# Run a seeder standalone
docker compose exec backend php artisan db:seed --class=ModuleSeeder

# Tenant migrations / seeding across all tenants
docker compose exec backend php artisan tenants:migrate
docker compose exec backend php artisan tenants:seed

# Tinker, logs, routes
docker compose exec backend php artisan tinker
docker compose exec backend php artisan route:list --path=api
docker compose logs -f frontend
```

## The queue worker (for tenant provisioning)

Creating a tenant from the UI provisions its database via a **queued** pipeline.
A worker must be running to process it:

```bash
docker compose exec backend php artisan queue:work --tries=1
```

(The default-tenant seeding runs provisioning synchronously, so it doesn't need
the worker — but interactive tenant creation does.)

## DB connection user

`back/.env` uses `DB_USERNAME=root` locally, because provisioning a tenant runs
`CREATE DATABASE`, which needs elevated privileges. If tenant creation fails with
`Access denied … CREATE DATABASE`, check this value (it has reverted before).

See [environment.md](environment.md) for all env vars and
[troubleshooting.md](troubleshooting.md) for common setup problems.
