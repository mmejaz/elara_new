# Backend Testing

> **Status:** Current · **Last updated:** 2026-08-13 · **Owner:** Engineering

PHPUnit 12 feature tests in `back/tests/Feature`. Base classes: `TestCase`
(central) and `TenantTestCase` (boots tenant context); `bootstrap.php` sets up the
test environment.

## Test inventory (real)

| Test | Covers |
|---|---|
| `AuthFlowTest` | Login / logout / current user, CSRF/session flow |
| `UserApiTest` | Users CRUD + validation |
| `RoleApiTest`, `PermissionApiTest` | RBAC CRUD |
| `PermissionConsistencyTest` | Permissions align across guards/modules |
| `ProfileApiTest`, `ProfileAuthorizationTest` | Profile update, password, settings, access; authorization |
| `ModuleManagementApiTest` | Modules listing/visibility |
| `ModuleGeneratorTest` | The Module Builder generator |
| `GenderApiTest`, `CountryApiTest`, `CityApiTest`, `ApplicationTypeApiTest` | Lookup CRUD |
| `GlobalSettingApiTest` | Global settings (fields/records) |
| `TenantApiTest` | Tenant management (central) |
| `TenantIsolationTest` | Data isolation across tenants (critical) |
| `TenantSessionIsolationTest` | Session isolation across tenants |
| `LoggingTest` | Error/logging behavior |

## Conventions

- **Feature-first:** tests hit real routes with the full middleware stack, so they
  exercise tenancy + auth + validation + service together.
- **Isolation matters most:** when adding a tenant-scoped feature, add an isolation
  assertion (create rows in two tenants; confirm each sees only its own).
- **Auth in tests:** authenticate as a seeded user/role; assert 403 for a user
  lacking the required permission.

## Running a focused test

```bash
docker compose exec backend php artisan test --filter=TenantIsolationTest
docker compose exec backend php artisan test tests/Feature/UserApiTest.php
```

## Not currently implemented

- **Coverage reporting / CI gating** — no coverage threshold enforced (no CI).
  *Recommendation: wire `--coverage` into a CI pipeline when one is added.*
- **Unit tests** are sparse relative to feature tests — acceptable for this
  service-layer architecture, but pure algorithmic code (e.g. hierarchy scopes)
  is a good unit-test candidate.
