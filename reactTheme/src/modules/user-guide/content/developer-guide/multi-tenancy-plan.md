# Elara — Multi-Tenancy Plan (stancl/tenancy v3, database per tenant)

Status: proposed · Target branch: `tenancy` (off `moduleBuilder`)
Package: [tenancyforlaravel.com/docs/v3](https://tenancyforlaravel.com/docs/v3/introduction/) · `stancl/tenancy` ^3.10 (supports Laravel 13)

## 1. Goal

Each **tenant** is a customer with its **own subdomain** (`acme.elara.com`) and its
**own MySQL database**, served by a single Laravel application and a single React
build. Inside a tenant, the customer has a **root organization and any number of
child organizations** (branches); business data is partitioned per child
organization, while modules, roles, permissions and lookups are shared across
that tenant's organizations.

### Agreed decisions

| Question | Decision |
|---|---|
| Tenant isolation | **Database per tenant**, via `stancl/tenancy` multi-database mode |
| Tenant URL | **Logical subdomain** — `InitializeTenancyByDomain`, one wildcard DNS record + one wildcard certificate, no per-tenant infrastructure |
| Deployment | **One codebase, one deployment, one React build** for all tenants |
| Inside a tenant | Root organization + child organizations, **two levels** |
| Data visibility | **Only the selected organization.** No cross-organization roll-up, no cross-tenant anything |
| Users | Live **in the tenant database**. A user belongs to one tenant, may belong to several of its organizations |
| Roles | Definitions shared within the tenant; **assignments per organization** (spatie teams, `team_foreign_key = organization_id`) |
| Lookups & modules | Shared within a tenant; **seeded into each tenant database at provisioning** |

### The two boundaries — keep them distinct

- **The database is the tenant boundary.** Resolved from the hostname by the
  package. Nothing in application code filters by tenant, ever.
- **`organization_id` is the read boundary** *inside* a tenant database. Resolved
  from a request header, applied by a global Eloquent scope.

`stancl/tenancy` solves the first boundary completely and the second not at all.
Roughly a third of this plan is the package; the rest is the organization layer
we build on top.

### Non-goals

- Cross-tenant anything: shared users, aggregated reporting, global search.
- Custom full domains per tenant (`acme.com`). The same `domains` table supports
  them later; it only adds per-domain TLS automation.
- Organizations nested more than two levels deep.

---

## 2. Architecture

```
                    ┌──────────────────────── central DB ─────────┐
  elara.com   ────▶ │  tenants · domains · (central admins)        │
  (landlord)        └─────────────────────────────────────────────┘

  acme.elara.com ─▶ InitializeTenancyByDomain ─▶ ┌── tenant DB: acme ──────────┐
                                                 │ organizations (root+branches)│
  beta.elara.com ─▶ InitializeTenancyByDomain ─▶ │ users · organization_user    │
                                                 │ roles · permissions (teams)  │
                                                 │ modules · lookups            │
                                                 │ business tables + org_id     │
                                                 └──────────────────────────────┘
```

Per request: nginx accepts the wildcard host → tenancy middleware resolves the
tenant from `Host` and switches the DB connection (plus cache, queue, filesystem
via bootstrappers) → **`EnsureUserBelongsToTenant`** → `ResolveOrganization` sets
the active organization and spatie's team id → controllers and services run
unchanged. Neither boundary is visible to feature code.

**Golden rule:** tenancy is invisible to feature code. A service that mentions
`organization_id` — let alone a tenant — is a bug in the design.

---

## 3. What changes in the current codebase

| Area | File(s) | Change |
|---|---|---|
| Routing | `bootstrap/app.php` | Module route files move into the **tenant** route group with tenancy + org middleware |
| Migrations | `database/migrations/` | Split: central (tenants, domains) vs `migrations/tenant/` (everything else) |
| Session/cache/queue | `.env` — all three are `database` today | Move into the tenant DB via bootstrappers; `SESSION_DOMAIN` becomes `.elara.test` |
| Auth | `AuthService`, `AuthUserResource` | Return organizations + active org; per-org roles/permissions |
| Files | `HasFiles` | Per-tenant disk via the filesystem bootstrapper, then `org/{id}/…` inside it |
| Permissions | `config/permission.php` | `teams => true`, `team_foreign_key => organization_id` |
| Generator | `ModuleGeneratorService` | Emit into `migrations/tenant/`, add `organization_id`, run `tenants:migrate` |
| Frontend | `apiClient.ts`, `.env` | API base URL derived from `window.location.hostname` at **runtime**, not baked at build |
| Nginx | `docker/nginx/default.conf` | `server_name` wildcard |
| Vite | `vite.config.ts` | `host: true` + `allowedHosts` for the wildcard, HMR host fix |

---

## 4. Central database

Deliberately tiny — everything else belongs to a tenant.

| Table | Purpose |
|---|---|
| `tenants` | package table; `id` (slug, e.g. `acme`), `data` json, timestamps |
| `domains` | package table; `domain` (`acme.elara.com`), `tenant_id` |
| `central_admins` *(optional)* | login for the landlord panel that provisions tenants |

`App\Models\Tenant` extends the package's model with `HasDatabase, HasDomains`,
and stores display fields (`name`, `status`, `plan`) in the `data` column or in
dedicated columns via a custom migration.

**Open item:** is the landlord panel a UI (needing `central_admins` + central
routes + a separate frontend entry) or artisan commands only? Commands-only is
recommended for v1 — see §12.

---

## 5. Tenant database schema

### 5.1 `organizations`

```
id
parent_id   nullable self FK, restrictOnDelete   // null => root organization
name
code        unique
status      active|inactive
settings    json nullable
timestamps, softDeletes
```

No `tenant_id` column — the database *is* the tenant. The root organization row
is created during provisioning and mirrors the tenant's name.

Invariants (enforced in `OrganizationService`, asserted by tests):
1. Exactly one root (`parent_id IS NULL`) per tenant database.
2. A child's parent must be the root — **no third level**.
3. The root cannot be deleted.

### 5.2 `organization_user`

`organization_id` + `user_id`, unique pair. **A membership must carry at least
one role in that organization** — enforced in the service, never by callers.

### 5.3 `users`

Standard Laravel users table, now **inside the tenant database**, plus
`last_organization_id` to remember the switcher choice. Cross-tenant users are
impossible by construction, which removes an entire class of problem.

### 5.4 Roles & permissions

`config/permission.php`: `'teams' => true`,
`'team_foreign_key' => 'organization_id'`. The team is the **child
organization** — that is what lets one user be Admin in one branch and Viewer in
another. Role *definitions* are seeded with `organization_id = NULL` (global
within the tenant); only assignment rows carry an organization.

Because these tables are created fresh per tenant, there is **no backfill
migration** — a real saving compared with retrofitting tenancy later.

### 5.5 Business tables

```php
$table->foreignId('organization_id')->constrained()->cascadeOnDelete();
$table->index('organization_id');
```

Composite unique keys must be prefixed with `organization_id`, so Branch B can
reuse a code Branch A already took.

### 5.6 Shared-within-tenant tables

`modules`, `genders`, `countries`, `cities`, `application_types`,
`global_settings`, `global_setting_fields` — no `organization_id`, seeded into
every tenant database at provisioning.

Consequence worth stating plainly: these are now **per-tenant copies**, not one
global catalogue. Adding a country means a seeder change plus
`php artisan tenants:seed`. In exchange, a tenant can diverge (different modules
enabled, its own lookup values) — which is usually what customers want.

`global_setting_records` keeps `organization_id` — the *definition* of a setting
is tenant-wide, its *value* is per organization.

---

## 6. Tenancy layer (the package)

### 6.1 Install & configure

`composer require stancl/tenancy` → `php artisan tenancy:install` → register
`App\Providers\TenancyServiceProvider` in `bootstrap/providers.php` →
`'tenant_model' => App\Models\Tenant::class` → `central_domains` =
`['elara.test']` locally.

### 6.2 Bootstrappers

Enable in `config/tenancy.php`: **Database** (required), **Cache**, **Queue**,
**Filesystem**. All three of `SESSION_DRIVER`, `CACHE_STORE` and
`QUEUE_CONNECTION` are `database` in this project today, so without the Cache and
Queue bootstrappers those tables would be read from whichever database happened
to be connected — a real leak, not a theoretical one.

### 6.3 Routes

Tenant routes get `InitializeTenancyByDomain` + `PreventAccessFromCentralDomains`.
The existing auto-loader in `bootstrap/app.php` (which globs
`routes/modules/*.php`) keeps working — it just gains the tenancy middleware in
its group, ahead of `ResolveOrganization` and the route-level `permission:` guards.

### 6.4 `EnsureUserBelongsToTenant` — mandatory

The session cookie is scoped to `.elara.test` and is therefore **sent to every
tenant subdomain**. This is [issue #653](https://github.com/stancl/tenancy/issues/653):
an authenticated user reaching another tenant's data. Users living in the tenant
database makes it much harder to exploit (the id would have to match a user in the
other tenant's DB), but "harder" is not "closed".

Middleware, immediately after tenancy initialization: assert the session's tenant
id matches the resolved tenant; otherwise invalidate the session and 401. Store
the tenant id in the session at login. **This is the single most important
security control in the plan** and needs its own test.

### 6.5 Provisioning

`php artisan tenant:create {slug} {name} {admin-email}`:

1. create the tenant + domain rows (the package creates the database);
2. `tenants:migrate` for that tenant;
3. seed roles, permissions, modules, lookups;
4. create the root organization;
5. create the first admin user and assign the Admin role in the root org;
6. print the URL and a password-setup link.

Idempotent and transactional as far as MySQL allows — a failure after
`CREATE DATABASE` must clean up, or the retry must be safe.

---

## 7. Organization layer (built by us)

### 7.1 `OrganizationContext`

Request-scoped singleton: `set()`, `id()`, `organization()`, `has()`,
`runWithout()`, `runFor()`. `set()` also calls
`PermissionRegistrar::setPermissionsTeamId()` and forgets the permission cache,
so authorization and data scoping can never disagree.

### 7.2 `ResolveOrganization` middleware

Runs after tenancy init and after `auth:sanctum`, **before** `permission:` guards:

1. `X-Organization-Id` header → `users.last_organization_id` → sole membership;
2. membership check → else `403 ORGANIZATION_FORBIDDEN`;
3. organization active → else `403`;
4. `OrganizationContext::set()`;
5. nothing resolvable → `409 NO_ORGANIZATION_SELECTED` so the SPA shows the
   switcher instead of logging the user out.

Registered in the tenant route group. **Group middleware runs before route
middleware**, so every existing `permission:*` guard resolves against the right
organization with zero edits to `routes/modules/*.php`. Load-bearing assumption —
proved by a test, not assumed.

### 7.3 `BelongsToOrganization` trait

Global scope on `organization_id` + auto-stamp on create. **Fails closed**: no
context inside an HTTP request throws rather than returning every row.
`withoutOrganizationScope()` is the explicit, greppable escape hatch.

### 7.4 Leak checklist

| Vector | Fix |
|---|---|
| Queued jobs | Tenancy's queue bootstrapper restores the tenant; **the organization must be restored by us** — capture it in the constructor, `runFor()` in `handle()` |
| Route-model binding | Runs inside the global scope, so a foreign id 404s — verify, don't assume |
| Files | Tenant disk from the filesystem bootstrapper, then `org/{id}/…` |
| `unique` validation rules | `Rule::unique(...)->where('organization_id', $orgId)` |
| Bulk `insert()`/`upsert()` | Bypasses model events — banned in tenant services |
| Permission cache | Flushed on organization switch |

---

## 8. API surface

```
POST   /api/login                                  (tenant subdomain)
GET    /api/user
POST   /api/organizations/switch  { organization_id }
GET    /api/organizations         index / tree
POST   /api/organizations         create branch (parent = root)
PUT    /api/organizations/{organization}
DELETE /api/organizations/{organization}
POST   /api/organizations/{organization}/users     attach user + roles
DELETE /api/organizations/{organization}/users/{user}
```

`AuthUserResource` returns `organizations[]`, `active_organization`, and
roles/permissions **for the active organization only** — so a switch must return
the full refreshed payload; the client cannot reuse what it has.

Also fix here: an unauthenticated API call currently returns
`500 Route [login] not defined` instead of a clean 401.

---

## 9. Frontend

One build, served on every subdomain.

1. **Runtime API base URL.** `VITE_API_BASE_URL=http://localhost:8000/api` is
   baked at build time and must go: derive it from `window.location.hostname`
   (`http://${host}:8000/api` in dev, `https://${host}/api` in prod). This is the
   change that makes one build work for all tenants.
2. **Cookies.** `SESSION_DOMAIN=.elara.test`,
   `SANCTUM_STATEFUL_DOMAINS=*.elara.test:5173`. Cookies ignore ports, so the
   `:5173` frontend and `:8000` API share them as long as the registrable domain
   matches — meaning `localhost` must be replaced by `lvh.me` or `elara.test` in
   local development.
3. **`orgSlice`** + `X-Organization-Id` request interceptor; response interceptor
   maps `409` to the switcher and `403 ORGANIZATION_FORBIDDEN` to a forced
   re-select.
4. **On switch:** refresh auth state, then `queryClient.clear()`. Every query key
   is prefixed with the organization id as a second line of defence.
5. **Screens:** org switcher in the topbar, organizations tree page, per-org role
   matrix in the Users module.

---

## 10. Infrastructure & local development

- **DNS:** `lvh.me` (or `*.localhost`) locally; `*.elara.com` A record in prod.
- **TLS:** one wildcard certificate via DNS-01. Custom domains would need
  on-demand issuance — out of scope.
- **nginx:** `server_name *.elara.test elara.test;` in
  [docker/nginx/default.conf](docker/nginx/default.conf).
- **Vite:** `server.host: true`, `allowedHosts: ['.lvh.me']`, and an explicit HMR
  host — the current `host: 'localhost'` rejects subdomain requests.
- **Deploy:** every release runs `php artisan tenants:migrate`. Migrations must be
  safe to re-run and safe to run partially — a failure at tenant 7 of 20 leaves
  the estate on two schema versions.
- **Backups:** per-database. `mysqldump --all-databases` is not a per-tenant
  restore story.

---

## 11. Risks

| Risk | Mitigation |
|---|---|
| Cross-tenant session reuse via the wildcard cookie | `EnsureUserBelongsToTenant` + dedicated test; tenant id in the session at login |
| Cache/queue/session tables read from the wrong database | Enable Cache + Queue bootstrappers; test a job and a cached value under two tenants |
| A query bypasses the organization scope | Fail-closed trait; sibling-branch isolation tests per module |
| Generated modules land in the central migrations directory | Phase 4 generator work before any new module is built |
| Partial `tenants:migrate` after deploy | Idempotent migrations, per-tenant version reporting, run before traffic |
| Role assigned outside HTTP lands with `organization_id = null` (silent global grant) | All assignment funnelled through the service; test asserting no stray null-team rows |
| Local dev breaks on `localhost` (no cookie sharing across subdomains) | Switch dev URLs to `lvh.me` early, in Milestone 0 |
| A future feature needs cross-tenant data | Accept now that it is expensive — this is the architecture's one hard limit |

---

## 12. Open items

- Landlord panel: artisan commands only (recommended for v1), or a central UI
  with `central_admins`?
- Local domain: `lvh.me` (zero setup) vs `elara.test` (needs `/etc/hosts` or
  dnsmasq)? `lvh.me` recommended.
- Do tenants ever need different module sets, or is the module tree identical
  everywhere and simply copied?
- Password reset / invitation email flow for the first tenant admin.

---

## 13. Sequencing

| Milestone | Contents |
|---|---|
| **0** | Package install, central DB, subdomain routing, bootstrappers, `EnsureUserBelongsToTenant`, provisioning command, nginx/Vite/DNS |
| **1** | Organization layer inside the tenant DB: schema, context, middleware, trait, leak checklist |
| **2** | Organizations API + frontend switcher, tree page, per-org role matrix |
| **3** | Module Builder generator: tenant migrations + organization scoping |
| **4** | Isolation test suite (cross-tenant **and** cross-organization) + retrofit of existing modules |

Step-by-step execution: [multi-tenancy-steps.md](multi-tenancy-steps.md).
