# Multi-Tenancy — Step-by-Step Execution

Companion to [multi-tenancy-plan.md](multi-tenancy-plan.md). That document is the
*design*; this one is the *order of work*. Each step lists the files it touches,
what "done" means, and where a commit belongs.

Legend: **[C]** = commit point · **[V]** = verify before moving on.

---

# Milestone 1 — Foundation (backend core)

*Nothing user-visible ships here. At the end, tenancy works but there is only one
organization.*

### Step 1 — Branch + config

- Create branch `tenancy` off `moduleBuilder`.
- `back/config/permission.php`: `'teams' => true`,
  `'team_foreign_key' => 'organization_id'`.
- New `back/config/tenancy.php` — two arrays: `central_tables` and
  `tenant_tables`, filled in from §4.6 of the plan. Nothing reads it yet; it is
  the Phase 6 input and the single source of truth for classification.

**[V]** `php artisan config:clear` inside `elara_backend`; app still boots.
**[C]** `chore(tenancy): enable spatie teams + tenancy config`

---

### Step 2 — Organizations schema

New migration `create_organizations_table`:

- `organizations` per plan §4.1 (`parent_id`, `tenant_id`, `code`, `status`,
  `settings`, `db_name`, `db_host`, soft deletes).
- `organization_user` pivot per §4.2.
- `users.last_organization_id` (separate migration or same file).

`app/Models/Organization.php`:

- `parent()`, `children()`, `tenant()`, `users()` relations.
- `scopeTenants()` (= `whereNull('parent_id')`).
- `created` event assigning `tenant_id = id` for roots, **inside the transaction**
  (it cannot be done in `creating` — no id yet).
- `isTenant()`, `isBranch()` helpers.

`app/Models/User.php`: `organizations()` belongsToMany, `lastOrganization()`.

**[V]** `php artisan migrate:fresh --seed` runs clean.
**[C]** `feat(tenancy): organizations, memberships, hierarchy`

---

### Step 3 — Spatie teams migration + backfill

New migration (do **not** edit the original permission migration):

1. `organization_id` nullable on `roles`, `model_has_roles`, `model_has_permissions`;
2. recreate composite primary keys on both pivots to include it;
3. `roles` unique index → `(name, guard_name, organization_id)`;
4. **backfill** existing `model_has_*` rows to the default organization;
5. role *definitions* keep `organization_id = NULL` (= global catalogue).

Seeders: `DatabaseSeeder` creates a default tenant ("Default Organization") and
makes every existing user a member; `ModuleSeeder`'s role/permission grants pass
an explicit team id (or `null` for global roles).

**[V]** `migrate:fresh --seed` then a tinker check: no `model_has_roles` row has
a null `organization_id` except intentional global grants. Existing login still
returns the same permissions.
**[C]** `feat(tenancy): per-organization role assignments`

---

### Step 4 — Organization context

`app/Tenancy/OrganizationContext.php` with the API from plan §5.1 (`set`, `id`,
`tenantId`, `organization`, `has`, `runWithout`, `runFor`). `set()` also calls
`PermissionRegistrar::setPermissionsTeamId()` and forgets the permission cache.

Register as `scoped()` in `AppServiceProvider`.
`app/Exceptions/TenantContextMissingException.php` + mapping in
`bootstrap/app.php` and a `ResponseMessage` constant.

**[V]** Unit test: `runFor()` sets and restores the previous context, including
on exception.
**[C]** `feat(tenancy): request-scoped organization context`

---

### Step 5 — Middleware

`app/Http/Middleware/ResolveOrganization.php` per plan §5.2 — header →
`last_organization_id` → sole membership; membership check; org **and tenant**
active check; `409 NO_ORGANIZATION_SELECTED` when nothing resolves.

`bootstrap/app.php`: alias `'organization'`, appended to the auto-loaded module
route group.

**[V]** ⚠️ **The load-bearing assumption.** Write a test proving group middleware
runs *before* the route-level `permission:` guard — i.e. a request with a valid
org header passes an existing `permission:gender.view` route with a per-org role,
with **no edits to any file in `routes/modules/`**. If this fails, everything
downstream changes, so do not proceed until it is green.
**[C]** `feat(tenancy): resolve active organization per request`

---

### Step 6 — Scoping trait

`app/Models/Concerns/BelongsToOrganization.php` per plan §5.3: global scope on
`organization_id` only; `creating` stamps **both** `organization_id` and
`tenant_id`; fail-closed when context is missing in an HTTP request;
`withoutOrganizationScope()` escape hatch. Comment the write-but-never-read
asymmetry of `tenant_id`.

Apply to the first real table as a pilot: migration adding `tenant_id` +
`organization_id` to `global_setting_records`, and the trait on its model.

**[V]** Two branches of one tenant; records created under branch A are invisible
under branch B. Sibling isolation, not just cross-tenant.
**[C]** `feat(tenancy): organization scoping trait`

---

### Step 7 — Leak vectors

Work the checklist in plan §5.4:

- `HasFiles` → `tenant/{tenantId}/org/{orgId}/…`; `files` gets both columns
  (nullable for central-owned files such as avatars).
- `TenantAware` job base class capturing + restoring the org id.
- Cache keys prefixed with the org id.
- Audit every `unique` rule in `app/Http/Requests/**` on tenant tables.
- Grep for `insert(` / `upsert(` in services — they bypass model events.

**[V]** Upload an avatar and a record file; confirm both land under the right path.
**[C]** `fix(tenancy): close file, job and cache leak vectors`

---

# Milestone 2 — Organizations API + UI

*End state: you can create branches, assign users with roles, and switch orgs.*

### Step 8 — Organizations module (backend)

Standard module shape: `OrganizationController`, `OrganizationService`,
`Store/UpdateOrganizationRequest`, `OrganizationResource`,
`routes/modules/OrganizationApi.php` — endpoints per plan §6.1.

Service owns the invariants: parent must be a root (two-level cap), `tenant_id`
derived server-side and immutable, membership requires ≥1 role, no hard delete
with children or data.

`ModuleSeeder`: sidebar entry under **Management** + `organization.*` permissions.

**[V]** Creating a child under a child returns 422. `tenant_id` sent by the
client is ignored.
**[C]** `feat(organizations): CRUD, hierarchy, membership`

---

### Step 9 — Switch + auth payload

- `POST /api/organizations/switch` — validate membership, persist
  `last_organization_id`, return the **full** refreshed auth payload.
- `AuthUserResource`: `organizations[]`, `active_organization`, and
  roles/permissions **for the active org only**.
- Fix the unauthenticated `500 Route [login] not defined` → clean 401.

**[V]** Same user, two branches, different roles → `/api/user` returns different
permission arrays after switching.
**[C]** `feat(organizations): switching + org-aware auth payload`

---

### Step 10 — Frontend plumbing

- `orgSlice` (`organizations`, `activeOrganizationId`, `activeTenantId`,
  `switchOrganization`).
- `apiClient.ts`: request interceptor attaching `X-Organization-Id`; response
  interceptor mapping `409` → switcher modal, `403 ORGANIZATION_FORBIDDEN` →
  forced re-select.
- On switch: refresh auth state, then `queryClient.clear()`.
- Add the org id to every query key in `src/modules/**/queries.ts`.

**[V]** Switch orgs with the network tab open — no stale list renders, header
present on every request.
**[C]** `feat(web): organization context plumbing`

---

### Step 11 — Frontend screens

- Org switcher in the topbar, **grouped by tenant** (flat for single-tenant users).
- Organizations page: tenant → branches tree, create/edit, activate/deactivate.
- Users module: per-org role matrix (rows = tenant's orgs, columns = roles)
  replacing the flat role picker.

**[V]** Click through the whole flow in the browser at `localhost:5173`.
**[C]** `feat(web): organization switcher, tree page, role matrix`

---

# Milestone 3 — Generator

### Step 12 — Module Builder stubs

Per plan §8: `modules.is_tenant_scoped` column + Module Builder checkbox;
migration stub emits both columns and the composite index; model stub adds the
trait; request stub scopes `unique`; test stub includes the isolation case;
frontend stub keys include the org id. Service stub stays unchanged — that is the
proof the design holds.

**[V]** Generate a throwaway module, create rows in two branches, confirm
isolation, then `php artisan module:rollback` (or the existing rollback path).
**[C]** `feat(module-builder): generate organization-scoped modules`

**Do not generate any new module before this step lands.**

---

# Milestone 4 — Tests + migration of existing modules

### Step 13 — Isolation suite

`tests/Feature/OrganizationScopingTest.php` with every case in plan §9, plus
`TestCase` helpers `actingAsInOrg()` and `tenantWithBranches()`.

**[C]** `test(tenancy): cross-organization isolation suite`

### Step 14 — Retrofit remaining tenant tables

For each table classified as tenant in `config/tenancy.php` and not yet done:
migration adding both columns (backfilled to the default org), trait on the model,
isolation test. One commit per module keeps the diff reviewable.

**[V]** Full `php artisan test` green; `config/tenancy.php` and reality agree.
**[C]** `feat(tenancy): scope <module> to organization` ×N

---

# Milestone 5 — Later

### Step 15 — Database per tenant

Only when a customer actually requires it. Split migrations into
`database/migrations/tenant`, drop the cross-database FK constraints (plan §10
rule 1), adopt `stancl/tenancy` in multi-database mode keyed on
`organizations.db_name`, and migrate a tenant with
`SELECT … WHERE tenant_id = X` per tenant table.

---

## Decisions still needed (do not block Milestone 1)

Needed by **Step 8**:

- Who creates tenants vs branches? (proposal: Super Admin / tenant admin)
- Is a user allowed to span tenants? (proposal: no, Super Admin excepted)

Needed by **Step 14**:

- `global_setting_records` tenant-scoped, definitions shared? (proposal: yes)
- Do user avatars keep `organization_id = null`? (proposal: yes)
