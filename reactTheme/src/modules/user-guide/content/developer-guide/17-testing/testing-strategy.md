# Testing Strategy

> **Status:** Current · **Last updated:** 2026-08-13 · **Owner:** Engineering

## What exists

- **Backend:** PHPUnit 12 feature tests under `back/tests/Feature` (~20 files),
  plus `TestCase`, `TenantTestCase`, `bootstrap.php`. Strong coverage of the API
  and, notably, **tenant isolation**.
- **Frontend:** Vitest + Testing Library configured; Cypress for e2e (`npm run e2e`).

## Test pyramid (as implemented)

```
        e2e (Cypress)            ← configured, few flows
   feature / API (PHPUnit)       ← the bulk of real coverage
 unit (PHPUnit / Vitest)         ← lighter
```

The team's emphasis is **feature/API tests** that exercise a full request through
routing, tenancy, auth, validation, and the service layer — the highest-value
tests for this architecture.

## Running tests

```bash
# Backend
docker compose exec backend php artisan test
docker compose exec backend php artisan test --filter=TenantIsolationTest

# Frontend
docker compose exec frontend npm run test        # watch
docker compose exec frontend npm run test:run     # once
docker compose exec frontend npm run e2e          # Cypress e2e
```

## Multi-tenant testing

`TenantTestCase` boots tenant context so tests can assert isolation. This is the
most important safety net in a DB-per-tenant app — `TenantIsolationTest` and
`TenantSessionIsolationTest` guard against data/session leakage across tenants.

## Pre-release testing checklist

- [ ] `php artisan test` green (backend)
- [ ] `npm run test:run` green (frontend)
- [ ] `migrate:fresh --seed` completes and the app logs in
- [ ] Tenant isolation tests pass
- [ ] Create a tenant end-to-end; confirm its DB is provisioned + isolated
- [ ] Auth: login/logout, permission-gated endpoint returns 403 for a user without it
- [ ] No new Pint violations (`./vendor/bin/pint --test`)
- [ ] Frontend typecheck clean (`npm run typecheck`)

See [backend-testing.md](backend-testing.md) for the test inventory.
