# Elara — Multi-Tenant / Multi-Organization Plan

Status: proposed · Target branch: `moduleBuilder` (or a fresh `tenancy` branch)

## 1. Goal

A **tenant** is a customer. Each tenant is a **root organization** that owns one
or more **child organizations** (branches, campuses, departments). Modules,
roles, permissions and lookups are defined once and shared by everyone; the
*business data* is partitioned per child organization. A user may belong to
several organizations and may hold **different roles in each**. The application
must later be able to move to **one database per tenant** without rewriting
controllers, services or the frontend.

### Agreed decisions

| Question | Decision |
|---|---|
| What is a tenant? | **The root organization** (`parent_id = null`). No separate `tenants` table — one hierarchy, one concept. |
| Hierarchy depth | **Two levels**: tenant → child organizations. A child cannot have children. |
| What does a user see? | **Only the currently selected organization.** No cross-org or tenant-wide roll-up. To see a sibling's data they switch into it. |
| Can a user belong to many orgs? | **Yes** — many-to-many, with an org switcher after login. |
| Roles | **Definitions global, assignments per organization.** Same role catalogue everywhere; a user can be Admin in Branch A and Viewer in Branch B. |
| Lookups (genders, countries, cities, application types) | **Shared globally.** No org column. |
| Modules / sidebar | **Shared globally.** Visibility is driven by permissions, which are now per-org. |
| Future database split | **One database per tenant**, containing every child organization's rows, still separated by `organization_id` inside it. |

### The two boundaries — keep them distinct

- **`organization_id` is the read boundary.** Every query, today and after the
  database split, is filtered by the *selected* organization.
- **`tenant_id` is the infrastructure boundary.** It decides which database the
  rows eventually live in, and nothing else. It never narrows a query on its own.

Conflating these is the single most likely way this design goes wrong.

### Non-goals (for now)

- Cross-organization or tenant-wide reporting and aggregation.
- Per-organization custom role definitions.
- Organizations nested more than two levels deep.
- Separate databases — Phase 6 only *prepares* for it.

---

## 2. Architecture in one paragraph

Phase 1 is **row-level tenancy in a single database**. Every tenant-owned table
gets an `organization_id` (the read boundary) and a denormalized `tenant_id`
(the future database boundary). A request-scoped `OrganizationContext` holds the
active organization and its tenant, resolved by middleware from an
`X-Organization-Id` header and validated against the user's memberships. A
`BelongsToOrganization` trait adds a global Eloquent scope on `organization_id`
and auto-stamps both columns on create, so **no service, controller or query
ever mentions either column by hand**. Spatie's teams feature scopes role
assignments to the same organization id, so the existing `permission:gender.view`
route guards keep working untouched. Because all tenancy lives in exactly two
places (the middleware and the trait), moving to database-per-tenant later means
changing those two places, not the app — and because `tenant_id` is already on
every row, extracting a tenant's data is one `WHERE` clause.

The golden rule: **tenancy is invisible to feature code.** The day a developer
writes `->where('organization_id', ...)` in a service is the day the design
starts to rot.

---

## 3. Current codebase — what this touches

| Area | File(s) | Impact |
|---|---|---|
| Route bootstrap | `back/bootstrap/app.php` | Add middleware alias + append `organization` to the module route group |
| Auth | `AuthService`, `AuthController`, `AuthUserResource` | Return org list (grouped by tenant) + active org; permissions become per-org |
| Models | `app/Models/*.php` | Tenant models `use BelongsToOrganization` |
| Files | `app/Models/Concerns/HasFiles.php` | Store under a tenant/org-prefixed path |
| Permissions | `config/permission.php`, `ModuleSeeder`, `DatabaseSeeder` | Enable teams; seeders must pass a team id |
| Generator | `app/Services/ModuleGeneratorService.php` (~750 lines of stubs) | Emit org-scoped migrations/models — **must not be skipped** |
| Frontend | `src/services/apiClient.ts`, `src/store/`, layouts, all `queries.ts` | Header interceptor, org slice, switcher, cache keys |

Existing conventions this plan follows: service layer per module, `ApiResponse`
envelope, `routes/modules/{Module}Api.php` auto-loaded by `bootstrap/app.php`,
FormRequest validation, resources for output, feature tests shaped like
`tests/Feature/GenderApiTest.php`.

---

## 4. Phase 0 — Data model

### 4.1 `organizations`

```
id
parent_id      nullable, self FK, restrictOnDelete   // null  => this row is a tenant
tenant_id      self FK, restrictOnDelete             // root org id; for a root, its own id
name
code           unique per tenant: unique(tenant_id, code)
status         enum active|inactive, default active
settings       json nullable                         // per-org config (branding, etc.)
db_name        nullable  ─┐ tenant rows only; reserved for Phase 6, unused now
db_host        nullable  ─┘
timestamps, softDeletes
```

Adjacency list (same shape as `modules.parent_id`), capped at two levels, plus a
denormalized `tenant_id` so "which database does this row belong to" and "give me
this tenant's organizations" are both O(1) with no recursion.

**Invariants**, enforced in `OrganizationService` and asserted by tests:

1. `parent_id = null` ⟺ `tenant_id = id` (a root is its own tenant).
2. `parent_id != null` ⟹ the parent must itself be a root — **no third level**.
3. `tenant_id` is immutable. Re-parenting an organization across tenants is not
   supported (it would mean moving rows between databases in Phase 6).

For a root org, `tenant_id` can only be set after the id exists — set it in a
`created` model event inside the same transaction, not in `creating`.

### 4.2 `organization_user`

```
organization_id  FK cascadeOnDelete
user_id          FK cascadeOnDelete
unique(organization_id, user_id)
timestamps
```

Membership is the switcher list. **Invariant: a membership must carry at least
one role in that organization**, enforced in `OrganizationService`, never by
callers.

**Recommended constraint: a user's memberships must all belong to one tenant**
(Super Admin excepted). Users stay in the central database in Phase 6, so a
cross-tenant user is technically possible — but it means one person's data lives
in two databases, which breaks tenant export, tenant deletion and any future
per-tenant GDPR request. Enforce it now; relaxing it later is easy, tightening it
later is not. See open items (§13).

### 4.3 `users`

```
+ last_organization_id  nullable FK nullOnDelete    // remembers the switcher choice
```

No `tenant_id` on users — it is derivable from their memberships, and duplicating
it invites the two to disagree.

### 4.4 Spatie teams migration

`config/permission.php`: `'teams' => true`, `'team_foreign_key' => 'organization_id'`.

The team is the **child organization**, not the tenant — that is what gives a
user different roles per branch.

The permission tables already exist (`2026_06_29_151724_create_permission_tables`),
so a **new** migration must:

1. add nullable `organization_id` to `roles`, `model_has_roles`, `model_has_permissions`;
2. drop and recreate the composite primary keys on the two pivot tables to include it;
3. adjust the unique index on `roles` to `(name, guard_name, organization_id)`;
4. **backfill existing assignment rows** to the default organization — leaving
   them `null` would silently turn them into global grants;
5. leave `roles.organization_id = NULL` for all role definitions (null = global
   role, available in every org — this is exactly the "shared catalogue" we want).

> Do not edit the original permission migration. Existing environments (including
> the running Docker DB) must migrate forward.

### 4.5 Tenant-owned tables

Every current and future business table gets **both** columns:

```php
$table->foreignId('tenant_id')->constrained('organizations')->cascadeOnDelete();
$table->foreignId('organization_id')->constrained()->cascadeOnDelete();
$table->index(['tenant_id', 'organization_id']);
```

- Only `organization_id` is filtered at read time (the global scope).
- `tenant_id` exists so Phase 6's extraction is `WHERE tenant_id = X` per table,
  and so a scoping bug leaks *within one customer* instead of across customers.
  It is cheap insurance: one integer column, stamped automatically.

**Every composite unique key must be prefixed with `organization_id`**
(e.g. `unique(['organization_id', 'code'])`) — otherwise Branch B cannot reuse a
code that Branch A already took.

### 4.6 Classification of existing tables

| Table | Scope |
|---|---|
| `organizations`, `organization_user` | central (they *define* the boundary) |
| `users`, `roles`, `permissions`, `model_has_*` | central (assignments carry org) |
| `modules` | central (shared sidebar) |
| `genders`, `countries`, `cities`, `application_types` | central (shared lookups) |
| `global_settings`, `global_setting_fields` | central — the *definition* of a setting is generic |
| `global_setting_records` | **tenant** — the *value* is per organization |
| `files` | **tenant** (nullable org for central-owned files such as user avatars) |
| future generated modules | tenant by default |

---

## 5. Phase 1 — Tenant context (the core)

### 5.1 `app/Tenancy/OrganizationContext.php`

Request-scoped singleton (`$this->app->scoped(...)` in `AppServiceProvider`).

```php
public function set(Organization $org): void;   // also sets spatie's team id
public function id(): ?int;                     // active ORGANIZATION id  → read boundary
public function tenantId(): ?int;               // its tenant id           → infra boundary
public function organization(): ?Organization;
public function has(): bool;
public function runWithout(callable $fn): mixed;            // explicit, auditable bypass
public function runFor(int $orgId, callable $fn): mixed;    // jobs, console, seeders
```

`set()` calls `app(PermissionRegistrar::class)->setPermissionsTeamId($org->id)`
and forgets the cached permissions, so authorization and data scoping can never
disagree. `tenantId()` reads the org's denormalized column — no extra query.

### 5.2 `app/Http/Middleware/ResolveOrganization.php`

Runs after `auth:sanctum`, **before** any `permission:` route middleware.

1. Read `X-Organization-Id`; fall back to `users.last_organization_id`; then to
   the user's single membership if they have exactly one.
2. Verify membership via `organization_user` → else `403 ORGANIZATION_FORBIDDEN`.
3. Verify the org **and its tenant** are `active` → else `403`. Deactivating a
   tenant must lock out all of its branches in one action.
4. `OrganizationContext::set()`.
5. No resolvable organization → `409 NO_ORGANIZATION_SELECTED` so the SPA knows
   to show the switcher rather than logging the user out.

Registration in `bootstrap/app.php`: alias `'organization'`, and append it to
the auto-loaded module route group. **Group middleware runs before route
middleware**, so every existing `permission:*` guard resolves against the right
organization with zero route-file edits. (Load-bearing assumption — verified by
a test in step 1, not taken on trust.)

Add matching `ResponseMessage` constants and exception mappings so these errors
come back in the standard `ApiResponse` envelope.

### 5.3 `app/Models/Concerns/BelongsToOrganization.php`

```php
protected static function bootBelongsToOrganization(): void
{
    static::addGlobalScope('organization', fn (Builder $q) => /* where organization_id = context id */);
    static::creating(function (Model $m) { /* stamp organization_id AND tenant_id from context */ });
}
public function organization(): BelongsTo;
public function tenant(): BelongsTo;
public function scopeWithoutOrganizationScope(Builder $q): Builder;   // explicit opt-out
```

The scope filters on `organization_id` only. `tenant_id` is written, never read —
that asymmetry is deliberate and worth a comment in the trait, because the next
developer will otherwise "helpfully" add it to the scope.

**Fail closed.** If there is no context and we are inside an HTTP request, throw
`TenantContextMissingException` instead of returning every row. In console
context, require an explicit `runFor()`/`runWithout()`.

### 5.4 Leak checklist (the parts people forget)

| Vector | Fix |
|---|---|
| Queued jobs | Capture `organization_id` in the constructor; re-enter with `runFor()` in `handle()`. A `TenantAware` job base class. |
| Route-model binding | Implicit binding runs *inside* the global scope, so a foreign id 404s — verify with a test, do not assume. |
| File storage | `HasFiles` writes to `tenant/{tenantId}/org/{orgId}/…`; both columns stamped on the `files` row. |
| Caches | Every cache key gets an org prefix; spatie's permission cache is flushed on switch. |
| Broadcasting / notifications | Include org id in channel names when added. |
| `unique` validation rules | Must be scoped: `Rule::unique(...)->where('organization_id', $orgId)`. |
| Bulk `insert()` / `upsert()` | Bypasses model events — never use in tenant services, or stamp both columns manually. |

---

## 6. Phase 2 — API surface

### 6.1 Organizations module

Following the standard module shape: `OrganizationController`, `OrganizationService`,
`Store/UpdateOrganizationRequest`, `OrganizationResource`, `routes/modules/OrganizationApi.php`.

```
GET    /api/tenants                    root organizations (Super Admin)
GET    /api/organizations              index (paginated, search/sort)
GET    /api/organizations/tree         tenant → children, like modules/tree
POST   /api/organizations              create; parent_id null = new tenant
PUT    /api/organizations/{organization}
DELETE /api/organizations/{organization}
POST   /api/organizations/{organization}/users     attach user + roles for that org
DELETE /api/organizations/{organization}/users/{user}
```

Validation on create: `parent_id` must reference a **root** organization
(enforces the two-level cap), and `tenant_id` is derived server-side — never
accepted from the client.

Permissions `organization.view|create|edit|delete`, seeded via `ModuleSeeder`
alongside a new sidebar entry under **Management**. These routes are *not*
org-scoped themselves — they are administered above the tenant boundary, so they
are gated by role instead: creating a **tenant** is Super Admin only; creating a
**child organization** may be delegated to that tenant's admin (see §13).

Deletion rule: an organization with children or with data cannot be hard-deleted;
soft delete + `status = inactive` instead. Deleting a tenant is an operational
procedure, not a button.

### 6.2 Switching

```
POST /api/organizations/switch   { organization_id }
```

Validates membership, persists `users.last_organization_id`, returns the **full
refreshed auth payload** — because roles and permissions differ per org, the
client cannot reuse what it already has.

### 6.3 Auth payload

`AuthUserResource` gains:

```json
{
  "organizations": [
    { "id": 1, "name": "Acme Group",   "parent_id": null, "tenant_id": 1 },
    { "id": 2, "name": "Lahore Branch","parent_id": 1,    "tenant_id": 1 }
  ],
  "active_organization": { "id": 2, "name": "Lahore Branch", "tenant_id": 1 },
  "roles":       ["Manager"],       // in the ACTIVE organization only
  "permissions": ["gender.view"]    // in the ACTIVE organization only
}
```

Also fix, while here: an unauthenticated API call currently returns
`500 Route [login] not defined` instead of a clean 401.

### 6.4 User management

Assigning a user now means **org + roles together**. The user edit screen becomes
a per-org role matrix (rows = the tenant's organizations, columns = roles) rather
than a flat role picker. `UserService` must set the team id before every
`assignRole`/`syncRoles` — wrap it so no code path calls spatie directly.

---

## 7. Phase 3 — Frontend

1. **`orgSlice`** — `organizations[]`, `activeOrganizationId`, `activeTenantId`,
   `switchOrganization` thunk.
2. **`apiClient.ts`** — request interceptor attaches `X-Organization-Id` from the
   store; response interceptor maps `409 NO_ORGANIZATION_SELECTED` to the
   switcher modal and `403 ORGANIZATION_FORBIDDEN` to a forced re-select.
3. **Org switcher** in the topbar, **grouped by tenant** (tenant as the group
   header, its children indented beneath). For the common single-tenant user this
   renders as a flat list. On switch: dispatch the API call, replace
   `roles`/`permissions` in `authSlice`, then `queryClient.clear()` — stale cached
   lists from the previous org must never render.
4. **Query keys** — prefix every key with the active org id
   (`['org', orgId, 'genders', params]`) as a second line of defence.
5. **Permission gates** — any `hasPermission()` helper reads from the refreshed
   auth state. A stale permission array is the one failure mode that shows
   buttons the API then rejects.
6. **Pages** — Organizations tree page (tenant → branches, create/edit) and the
   per-org role matrix in the Users module.

---

## 8. Phase 4 — Module Builder (mandatory, not optional)

`ModuleGeneratorService` writes every future module. If its stubs are not
updated, each new module silently leaks data across organizations.

- `modules` table: `+ is_tenant_scoped` boolean, default `true`; exposed as a
  checkbox in the Module Builder UI (uncheck for shared lookups).
- Migration stub: emit `tenant_id` + `organization_id` FKs and the composite index.
- Model stub: `use BelongsToOrganization` when tenant-scoped.
- Service stub: unchanged — the global scope does the work. This is the proof
  that the design is right.
- Request stub: `unique` rules scoped by organization.
- Test stub: include the cross-org isolation case.
- Frontend stub: query keys include the org id.

---

## 9. Phase 5 — Tests

Extend the `GenderApiTest` shape. New `tests/Feature/OrganizationScopingTest.php`:

- index returns only the active org's rows — including a **sibling branch of the
  same tenant**, which is the case a `tenant_id`-only filter would wrongly pass;
- reading/updating/deleting another org's record returns **404, not 403** (do not
  leak existence);
- create auto-stamps both `organization_id` and the correct `tenant_id` — no
  client control over either;
- switching orgs changes the visible list;
- a non-member sending another org's header gets 403;
- deactivating a tenant locks out all of its child organizations;
- creating a child under a child is rejected (two-level cap);
- **same user, two orgs, different roles** → 200 creating in Branch A, 403 in Branch B;
- `/api/user` permission array changes after switching;
- a queued job runs under the org it was dispatched from;
- Super Admin (`Gate::before`) still bypasses gates, and remains global.

`TestCase` helpers: `actingAsInOrg(User $u, Organization $o, array $roles)` and a
`tenantWithBranches(int $n)` factory helper.

---

## 10. Phase 6 — Database-per-tenant readiness

Not built now. The target shape:

- **One database per tenant**, holding every child organization's rows. Inside it,
  `organization_id` keeps doing exactly what it does today — so the read path
  never changes.
- **One central database** for `organizations`, `organization_user`, `users`,
  `roles`, `permissions`, `model_has_*`, `modules` and the shared lookups.
- `organizations.db_name` / `db_host` (already in the schema) drive connection
  routing for tenant rows.

Three rules followed **from day one** make it cheap:

1. **No DB-level foreign keys from tenant tables to central tables**
   (`users`, lookups, and `organizations` itself). Those constraints break the
   moment tenant tables live in another database. Store the id, validate with an
   `exists` rule in the FormRequest. FKs *within* the tenant set are fine.
   → This means the `tenant_id`/`organization_id` FK constraints in §4.5 are
   dropped as part of the Phase 6 migration; they are useful integrity guards
   until then.
2. **Split migrations** — `database/migrations` (central) vs
   `database/migrations/tenant`, with the classification kept in
   `config/tenancy.php`. That config is precisely the input Phase 6 needs, and it
   is what the `is_tenant_scoped` flag from Phase 4 feeds.
3. **Storage through a per-tenant disk resolver**, never a hardcoded path.

When the switch happens: adopt `stancl/tenancy` in multi-database mode with a
shared central connection. `organizations` where `parent_id IS NULL` becomes the
tenant model using the `db_name` column already present; `ResolveOrganization`
gains a tenancy-initialization step keyed on `tenantId()`; the
`BelongsToOrganization` scope keeps running unchanged inside the tenant database.
Migrating an existing customer is `SELECT … WHERE tenant_id = X` per tenant table.
`roles`/`model_has_roles` stay central, so per-org roles cost nothing extra here.
**Controllers, services and the entire frontend stay untouched.**

---

## 11. Risks

| Risk | Mitigation |
|---|---|
| Someone "optimizes" the global scope to filter on `tenant_id` | Sibling-branch isolation test (§9, first case) fails loudly; comment in the trait |
| A query bypasses the global scope and leaks data | Fail-closed trait; isolation tests per module; ban raw `organization_id` filters in review |
| Spatie teams is a global switch — it changes `assignRole` everywhere | Audit seeders + console commands; funnel all assignment through the service layer |
| Role assignment outside HTTP lands with `organization_id = null` (a silent global grant) | Guard in the service; a test asserting no null-team assignment rows exist after seeding |
| Existing role assignments have no org | Backfill migration to the default organization; verified by a post-migration assertion |
| A third hierarchy level sneaks in via the API | Validation rule + test; `tenant_id` denormalization silently assumes depth 2 |
| `tenant_id` drifts out of sync with `parent_id` | Set it in one place (model event), make it immutable, assert the invariant in tests |
| Frontend renders stale org data after a switch | `queryClient.clear()` + org-prefixed query keys + refreshed permissions |
| Generated modules skip tenancy | Phase 4 before any new module is generated |

## 12. Sequencing

| Step | Contents | Rough size |
|---|---|---|
| 1 | Phase 0 + 1 — migrations, context, middleware, trait, leak checklist | 1–2 days |
| 2 | Phase 2 + 3 — organizations API, switcher, org pages, per-org role matrix | 2–3 days |
| 3 | Phase 4 — generator stubs | 0.5 day |
| 4 | Phase 5 — isolation test suite | 1 day |
| 5 | Phase 6 — only when separate databases are actually required | — |

Steps 1 and 2 are worth landing as one reviewable vertical slice: a plan you can
click through beats a plan you can only read.

## 13. Open items

- **Who may create what?** Proposal: Super Admin creates tenants; a tenant's
  admin (`organization.create` in the root org) creates that tenant's branches.
- **Cross-tenant users** — recommended constraint is one tenant per user (§4.2).
  Confirm no real scenario needs otherwise (e.g. a shared consultant).
- Confirm `global_setting_records` is tenant-scoped while field definitions stay
  shared (recommended above).
- Decide whether user avatars (central `files` rows) keep `organization_id = null`.
