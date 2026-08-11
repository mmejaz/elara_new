# Cypress E2E

End-to-end tests that drive the React SPA in a real browser. Because the SPA
talks to the Laravel API, these specs exercise the **full stack** (React →
Sanctum session auth → MySQL), not just the frontend.

## Prerequisites

Both apps must be running and the DB seeded:

- Frontend (Vite): http://localhost:5173 — `npm run dev`
- Backend (Laravel): http://localhost:8000 — via `docker compose up` from the repo root
- Seeded central admin: `test@test.com` / `password123` (DatabaseSeeder defaults)

## Run

```bash
# Interactive runner (pick specs, watch them run)
npm run cypress:open

# Headless, assumes servers are already up
npm run cypress:run

# One-shot: boots the Vite dev server, waits for it, runs specs, tears down.
# The Laravel backend still needs to be up separately.
npm run e2e
```

## Config

`cypress.config.ts` holds `baseUrl` (:5173) and an `env` block:

| env var         | default              | meaning                                  |
| --------------- | -------------------- | ---------------------------------------- |
| `apiUrl`        | `http://localhost:8000` | backend origin, no `/api` suffix       |
| `adminEmail`    | `test@test.com`      | seeded central admin                     |
| `adminPassword` | `password123`        | seeded central admin password            |

Override any of them per run with the `CYPRESS_` prefix, e.g.
`CYPRESS_adminPassword=secret npm run cypress:run`.

## Custom commands

- `cy.login(email?, password?, host?)` — authenticate through the Sanctum API
  (CSRF cookie + `POST /api/login`) without touching the UI. Fastest way to set
  up an authenticated state. Pass `host` (e.g. `acme.localhost`) to log in to a
  **tenant** instead of the central app.
- `cy.loginByForm(email?, password?)` — fill and submit the real `/login` form.
  Use only when the login UI itself is under test.
- `cy.deleteTenantsByPrefix(prefix)` — delete every tenant whose id starts with
  `prefix`, via the API. Keeps the tenant spec idempotent by sweeping orphans
  left by an earlier failed run.
- `cy.waitForTenantProvisioned(token)` — poll until a tenant's database exists.
  Required before deleting: `CreateDatabase` is queued (async) but
  `DeleteDatabase` runs synchronously, so deleting an un-provisioned tenant 500s.

## Specs

- `auth.cy.ts` — login page, route guard, bad-credentials, form + programmatic login.
- `tenants.cy.ts` — full tenant-module lifecycle on the central host: create via
  the drawer → verify in list → suspend → reactivate → wait for provisioning →
  delete (drops the DB). Self-cleaning; leaves no tenant or database behind.
- `module-builder.cy.ts` — the code-generator screen: page, create-drawer
  validation, the fields/preview that change per module type, and creating a
  **Group / Section** (a DB row only — deliberately never a *Resourceful*
  module, which scaffolds real CRUD files with no undo). The group is verified
  over the API and hard-deleted afterwards via the `db:deleteModulesByPrefix`
  task (there is no delete endpoint), which shells into the `elara_db` container
  — so this spec's cleanup needs docker reachable on the host.

## Multi-tenancy

Tenants are reached at `<tenant>.localhost:5173` and hit
`<tenant>.localhost:8000`. `localhost` is the shared super-domain, so Cypress
can navigate between central and tenant hosts. To test a tenant, the tenant DB
must already be provisioned (`php artisan tenants:seed`), then:

```ts
cy.login('admin@acme.com', 'Password1!', 'acme.localhost')
cy.visit('http://acme.localhost:5173/dashboard')
```
