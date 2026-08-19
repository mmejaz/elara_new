# FAQ

> **Status:** Current · **Last updated:** 2026-08-13 · **Owner:** Engineering

**How do I run the backend?**
It runs in Docker: `docker compose up -d`. The API is served by nginx on
`http://localhost:8000`.

**How do I run the frontend?**
The `frontend` container runs Vite automatically on `http://localhost:5173`.
`docker compose logs -f frontend` to watch it.

**How do I reset the database?**
`docker compose exec backend php artisan migrate:fresh --seed`. This rebuilds the
central DB and re-provisions the default `localhost` tenant.

**How do I create an admin user?**
The seeders create the central admin (`ADMIN_EMAIL` / default `test@test.com`).
Each tenant's first admin comes from the tenant creation wizard. To make an
existing user a Super Admin, assign the role for both guards (see
[../08-authentication-authorization/roles.md](../08-authentication-authorization/roles.md)).

**Where are the logs?**
Backend: `back/storage/logs/laravel.log`
(`docker compose exec backend sh -c "tail -n 40 storage/logs/laravel.log"`).
Frontend: browser console + `docker compose logs -f frontend`.

**How do I clear cache/config?**
`docker compose exec backend php artisan config:clear` (and `cache:clear`,
`route:clear` as needed). Do this after editing `.env`.

**How do I restart the queue worker?**
`docker compose exec backend php artisan queue:work --tries=1`. Needed for
interactive tenant provisioning (the default-tenant seed provisions synchronously).

**How do I create a permission?**
Permissions come from modules — mark the module `resourceful` in `ModuleSeeder`
and re-seed. See [../08-authentication-authorization/permissions.md](../08-authentication-authorization/permissions.md).

**Why doesn't my new sidebar item show up?**
The menu is cached in `localStorage`. Hard-reload, or
`localStorage.removeItem('elara.modules-tree'); location.reload()`.

**Why does `localhost:5173` say "tenant not found"?**
`localhost` is a tenant domain; a fresh DB has no tenant until the seed provisions
it. Run `migrate:fresh --seed`.

**Tenant creation fails with "Access denied … CREATE DATABASE" — why?**
The DB user can't create databases. Set `DB_USERNAME=root` locally and
`config:clear`.

**What's the difference between `localhost` and `127.0.0.1`?**
`localhost` = the default **tenant** (the app). `127.0.0.1` = the **central**
console (manage tenants/orgs). They're different contexts with different databases.

**How do I deploy / rollback?**
See [../19-deployment](../19-deployment) (deployment) and the rollback doc.
Production infra specifics are environment-dependent.

**Is there CI/CD?**
Not currently — there's no pipeline configured (`no .github`).
