# Environment Configuration

Two `.env` files: `back/.env` (Laravel) and `reactTheme/.env` (Vite). Copy from
the `.env.example` next to each.

## Backend — `back/.env`

### App & database

```
APP_NAME=Elara
APP_ENV=local
APP_KEY=base64:...        # php artisan key:generate
APP_DEBUG=true
APP_URL=http://localhost:8000

DB_CONNECTION=mysql
DB_HOST=db                # the compose service name
DB_PORT=3306              # internal port (host maps 3307)
DB_DATABASE=elara         # central database
DB_USERNAME=root          # LOCAL: root, so provisioning can CREATE DATABASE
DB_PASSWORD=secret

SESSION_DRIVER=database
CACHE_STORE=database
QUEUE_CONNECTION=database
```

> **`DB_USERNAME=root` for local dev** is deliberate: creating a tenant runs
> `CREATE DATABASE tenant<id>`, which needs global privileges. In production, use
> a dedicated provisioning user with only `CREATE/DROP DATABASE` for that job.

### Auth / sessions / tenancy (the subtle part)

```
SESSION_DOMAIN=                       # host-only cookies → per-host isolation
SANCTUM_STATEFUL_DOMAINS=localhost:5173,*.localhost:5173
```

- **`SANCTUM_STATEFUL_DOMAINS`** — the SPA origins Sanctum treats as first-party
  (session auth instead of tokens). Only these origins can do cookie login.
  Currently `localhost:5173` and its subdomains. **`127.0.0.1:5173` is not
  listed**, so central browser login needs it added if you want that.
- **`SESSION_DOMAIN` empty** = host-only cookies, so each host/subdomain gets its
  own session — the safe default for per-tenant isolation.
- **Central domains** are configured in `config/tenancy.php`:
  ```php
  'central_domains' => ['127.0.0.1'],   // everything else is a tenant domain
  ```

### Admin seed defaults (optional overrides)

```
ADMIN_NAME="Super Admin"
ADMIN_EMAIL=test@test.com
ADMIN_PASSWORD=password123
```

The seeders read these; production should set real values so the known dev
password never ships.

## Frontend — `reactTheme/.env`

```
VITE_API_BASE_URL=http://localhost:8000/api    # axios base URL
VITE_BACKEND_URL=http://localhost:8000         # for the CSRF cookie call
```

> The CSRF init needs **`VITE_BACKEND_URL`** — if it's missing, the sanctum
> cookie request goes to `undefined/sanctum/csrf-cookie` and login silently fails.

## Config gotchas

- After changing `.env`, clear config: `docker compose exec backend php artisan config:clear`.
- `config/tenancy.php` controls `central_domains`, tenant DB prefix, the
  migration/seeder used for provisioning, and the tenancy bootstrappers.
- `config/central.php` lists central-only module slugs (`tenants`,
  `module-builder`) that never appear inside a tenant.
