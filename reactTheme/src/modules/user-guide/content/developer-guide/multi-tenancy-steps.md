# Multi-Tenancy — Step-by-Step Execution

Companion to [multi-tenancy-plan.md](multi-tenancy-plan.md) — that is the
*design*, this is the *order of work*. Each step lists what it touches, what
"done" means, and where a commit belongs.

Legend: **[V]** verify before moving on · **[C]** commit point

---

# Milestone 0 — Tenancy layer

*End state: two tenants on two subdomains, two databases, one codebase. No
organizations yet.*

### Step 1 — Local domains (do this first, everything else depends on it)

`localhost` cannot share cookies across subdomains, so development moves to
`lvh.me` (resolves `*.lvh.me → 127.0.0.1`, no setup).

- `docker/nginx/default.conf`: `server_name *.lvh.me lvh.me;`
- `reactTheme/vite.config.ts`: `server.host: true`,
  `allowedHosts: ['.lvh.me']`, explicit `hmr.host`
- `back/.env`: `APP_URL=http://lvh.me:8000`, `SESSION_DOMAIN=.lvh.me`,
  `SANCTUM_STATEFUL_DOMAINS=*.lvh.me:5173`
- `reactTheme/src/services/apiClient.ts`: derive `baseURL` from
  `window.location.hostname` instead of `VITE_API_BASE_URL`

**[V]** `http://acme.lvh.me:5173` loads the SPA and logs in against
`http://acme.lvh.me:8000/api` (still single-database — only the URLs changed).
**[C]** `chore: move local development to wildcard lvh.me domains`

---

### Step 2 — Install the package

`composer require stancl/tenancy` · `php artisan tenancy:install` ·
register `App\Providers\TenancyServiceProvider` in `bootstrap/providers.php`.

- `app/Models/Tenant.php` — extends the package model,
  `use HasDatabase, HasDomains`; `name`/`status` columns via an added migration.
- `config/tenancy.php`: `tenant_model`, `central_domains => ['lvh.me']`.

**[V]** `php artisan migrate` creates `tenants` + `domains` in the central DB.
**[C]** `feat(tenancy): install stancl/tenancy, tenant model`

---

### Step 3 — Split migrations

Move everything except `tenants`/`domains` into `database/migrations/tenant/`:
users, sessions, cache, jobs, personal_access_tokens, permission tables, modules,
lookups, global settings, files.

**[V]** `migrate:fresh` on the central DB creates *only* the package tables.
**[C]** `refactor(tenancy): split central and tenant migrations`

---

### Step 4 — Routes + bootstrappers

- `config/tenancy.php`: enable the **Database, Cache, Queue and Filesystem**
  bootstrappers. All three of session/cache/queue are `database` in this project,
  so skipping these is a real leak, not a theoretical one.
- `bootstrap/app.php`: the existing `routes/modules/*.php` auto-loader gains
  `InitializeTenancyByDomain` + `PreventAccessFromCentralDomains` on its group.

**[V]** Same route file, two tenants, two databases — no edits inside
`routes/modules/`.
**[C]** `feat(tenancy): tenant routes and bootstrappers`

---

### Step 5 — Provisioning command

`php artisan tenant:create {slug} {name} {admin-email}` → tenant + domain rows →
database creation → `tenants:migrate` → seed roles/permissions/modules/lookups →
(root organization comes in Milestone 1) → first admin user.

Failure after `CREATE DATABASE` must clean up, or the retry must be safe.

**[V]** Create `acme` and `beta`; log in on both; data created in one is absent
in the other.
**[C]** `feat(tenancy): tenant provisioning command`

---

### Step 6 — `EnsureUserBelongsToTenant` ⚠️

**The security gate of this milestone.** The session cookie is scoped to
`.lvh.me` and is sent to every tenant subdomain
([issue #653](https://github.com/stancl/tenancy/issues/653)).

- Store the tenant id in the session at login.
- Middleware after tenancy init: session tenant ≠ resolved tenant → invalidate
  session, 401.

**[V]** Log in to `acme`, then request `beta.lvh.me:8000/api/user` with the same
cookie jar → 401, **not** 200. Automated test, not a manual check.
**[C]** `feat(tenancy): reject cross-tenant session reuse`

**Do not continue until this test is green.**

---

# Milestone 1 — Organization layer (inside each tenant DB)

### Step 7 — Schema

Tenant migrations: `organizations` (root + branches, two-level cap),
`organization_user`, `users.last_organization_id`. `Organization` model with
`parent()`, `children()`, `users()`, `isRoot()`.

**[C]** `feat(organizations): schema and model`

### Step 8 — Spatie teams

`config/permission.php`: `teams => true`, `team_foreign_key => organization_id`.
Since tenant databases are created fresh, this is a **plain migration edit — no
backfill**. Seeders pass an explicit team id (`null` for global role definitions).

**[V]** No `model_has_roles` row has a null `organization_id` after seeding,
except intentional global grants.
**[C]** `feat(organizations): per-organization role assignments`

### Step 9 — Context + middleware

`app/Tenancy/OrganizationContext.php` (scoped singleton; `set()` also sets
spatie's team id and flushes the permission cache) and
`ResolveOrganization` per plan §7.2, registered on the tenant route group.

**[V]** ⚠️ Prove group middleware runs **before** the route-level `permission:`
guard — a request with a valid org header passes an existing
`permission:gender.view` route with **no edits to any file in `routes/modules/`**.
If this fails, the design downstream changes.
**[C]** `feat(organizations): request-scoped organization context`

### Step 10 — Scoping trait + pilot

`BelongsToOrganization` (global scope, auto-stamp, fail-closed,
`withoutOrganizationScope()`), applied to `global_setting_records` as the pilot.

**[V]** Two branches of one tenant: records created under Branch A are invisible
under Branch B. **Sibling** isolation — cross-tenant isolation would pass even
with a broken scope.
**[C]** `feat(organizations): scoping trait`

### Step 11 — Leak vectors

Organization restoration in queued jobs (tenancy restores the tenant, not the
org), `HasFiles` → `org/{id}/…` on the tenant disk, org-prefixed cache keys,
audit every `unique` rule, grep for `insert(`/`upsert(` in services.

**[C]** `fix(organizations): close job, file and cache leak vectors`

---

# Milestone 2 — API + UI

### Step 12 — Organizations module

Standard module shape (controller/service/requests/resource/route file).
Service owns the invariants: one root per tenant, parent must be the root, root
undeletable, membership requires ≥1 role. `ModuleSeeder`: sidebar entry +
`organization.*` permissions. Provisioning (Step 5) now also creates the root org.

**[C]** `feat(organizations): CRUD and membership API`

### Step 13 — Switch + auth payload

`POST /api/organizations/switch`; `AuthUserResource` returns `organizations[]`,
`active_organization`, and per-active-org roles/permissions. Fix the
unauthenticated `500 Route [login] not defined` → 401.

**[V]** Same user, two branches, different roles → different permission arrays.
**[C]** `feat(organizations): switching and org-aware auth payload`

### Step 14 — Frontend plumbing

`orgSlice`; `X-Organization-Id` request interceptor; response interceptor for
`409` (switcher) and `403 ORGANIZATION_FORBIDDEN` (forced re-select); org id in
every query key; `queryClient.clear()` on switch.

**[C]** `feat(web): organization context plumbing`

### Step 15 — Screens

Topbar org switcher, organizations tree page, per-org role matrix in Users.

**[C]** `feat(web): organization switcher, tree page, role matrix`

---

# Milestone 3 — Module Builder

### Step 16 — Generator stubs

`modules.is_tenant_scoped` flag + Module Builder checkbox; migration stub writes
into `database/migrations/tenant/` with `organization_id`; model stub adds the
trait; request stub scopes `unique`; test stub includes the isolation case;
frontend stub keys include the org id; generation triggers `tenants:migrate`.
The **service stub stays unchanged** — that is the proof the design holds.

**[V]** Generate a module, confirm it exists and isolates correctly in **both**
tenants, then roll back.
**[C]** `feat(module-builder): tenant-aware, organization-scoped generation`

**Do not generate any new module before this step lands.**

---

# Milestone 4 — Tests + retrofit

### Step 17 — Isolation suite

`tests/Feature/TenantIsolationTest.php` — cross-tenant session reuse, jobs, cache,
files.
`tests/Feature/OrganizationScopingTest.php` — sibling-branch isolation, 404 (not
403) for another org's record, auto-stamped `organization_id`, switching changes
the list, non-member 403, two-level cap, same user with different roles per
branch, Super Admin still global.

Helpers: `actingAsInOrg()`, `tenantWithBranches()`.
**[C]** `test: tenant and organization isolation suites`

### Step 18 — Retrofit remaining modules

Per module: `organization_id` migration, trait, isolation test. One commit each.

**[V]** Full `php artisan test` green; `npm test` green.
**[C]** `feat(organizations): scope <module>` ×N

---

## Decisions still needed

Needed by **Step 5**: landlord panel — commands only (recommended) or a central
UI with `central_admins`? · first-admin invitation/password-reset flow.

Needed by **Step 12**: who may create branches — root-org admin only?

Needed by **Step 18**: `global_setting_records` org-scoped while definitions stay
tenant-wide (proposal: yes) · do avatars stay `organization_id = null`?

---

## Ordering rationale

Milestone 0 before everything: the tenant boundary changes where every table
lives, so building the organization layer first would mean moving all of it
afterwards. Step 1 before Step 2 because cookie-domain problems on `localhost`
masquerade as tenancy bugs and cost hours. Steps 6 and 9 are hard gates — one is
the security boundary, the other the assumption the whole middleware design rests
on.
