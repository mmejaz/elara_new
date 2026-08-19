# Adding a Module

A "module" is a CRUD resource that shows up in the sidebar and has a full-stack
implementation. There are two ways to add one.

## Option A — Module Builder (fastest)

The **Module Builder** (central app, `/module-builder`) generates the whole
stack from a form: migration, model, service, controller, FormRequests, resource,
`routes/modules/<Module>Api.php`, plus the React page, drawers, `queries.ts`,
`types.ts`, and route registration.

Requirements:

- It writes frontend files into the backend container at `/var/www/reactTheme`,
  which needs the `./reactTheme:/var/www/reactTheme` volume mount. If generation
  fails its pre-flight check ("Store/Routes file missing"), recreate the backend:
  `docker compose up -d backend`.
- It's **central-only** (a tenant using it would edit the shared frontend source).

After generating, run the new migration and re-seed the module row if needed,
then hard-reload to refresh the sidebar cache.

## Option B — By hand (when you need control)

Mirror an existing simple module (e.g. `Designation` or `Department`). Steps:

### Backend

1. **Migration** — `back/database/migrations/..._create_things_table.php`. Decide
   central vs tenant (put it in `database/migrations/tenant/` too if tenants need
   it). Lookup tables are typically `id, name, timestamps`.
2. **Model** — `app/Models/Thing.php` with `#[Fillable([...])]` and any relations.
3. **Requests** — `Store/UpdateThingRequest` (`rules()` + `authorize()`).
4. **Resource** — `ThingResource` (output shape).
5. **Service** — `ThingService` (`paginate`, `create`, `update`, `delete`).
6. **Controller** — thin `ThingController` delegating to the service.
7. **Routes** — `routes/modules/ThingApi.php` (auto-loaded), guarded by
   `permission:thing.view` etc.

### Seed the sidebar entry + permissions

Add the module to `ModuleSeeder`'s tree (under the right group) with `name`,
`slug` (matching the route path), `icon` (registered in `iconRegistry.ts`), and
`'resourceful' => true` to auto-create its CRUD permissions:

```php
['name' => 'Thing', 'slug' => 'things', 'icon' => 'AppstoreOutlined', 'resourceful' => true],
```

Then: `php artisan db:seed --class=ModuleSeeder` (idempotent).

> The **module name** drives permission names (`Str::snake` → `thing.view`, …),
> and the **slug** drives the route (`/things`). Keep them consistent with the API
> and the frontend route.

### Frontend

Under `reactTheme/src/modules/things/`:

1. `types.ts` — the `Thing` interface.
2. `queries.ts` — `useThings`, `useCreateThing`, `useUpdateThing`, `useDeleteThing`.
3. `pages/ThingsPage.tsx` — `DataTable` + `useServerTable` + drawers.
4. `components/AddThingDrawer.tsx`, `EditThingDrawer.tsx`.
5. `<name>Slice.ts` — drawer/edit UI state (optional; some modules use local state).
6. Register the route in `routes/index.tsx` (add a `createRoute` and include it in
   the tree). Add `beforeLoad: centralOnly` if the module is central-only.

### Verify

- API: `php artisan route:list --path=api/things` shows the routes.
- Sidebar: hard-reload; the item appears under its group.
- Permissions: the Admin role has `thing.*`; Super Admin bypasses.

See [../architecture/backend.md](../architecture/backend.md) and
[../architecture/frontend.md](../architecture/frontend.md) for the conventions
each file follows.
