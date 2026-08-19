# Frontend Architecture

React 19 SPA in `reactTheme/`, built with Vite. TypeScript throughout.

## Stack

| Concern | Library |
|---|---|
| UI kit | Ant Design 6 (`antd`, `@ant-design/icons`, `@ant-design/charts`) |
| Styling | Tailwind CSS 4 (`@tailwindcss/vite`) |
| Server state | TanStack Query 5 (`@tanstack/react-query`) |
| Client/UI state | Redux Toolkit + react-redux |
| Routing | TanStack Router (`@tanstack/react-router`) |
| HTTP | axios (cookie + XSRF) |
| Tests | Vitest + Testing Library; Cypress for e2e |

## Folder structure

```
reactTheme/src/
├── app/            # App root + providers
├── components/     # Shared UI (DataTable, PageHeader, AuthGuard, SidebarContent…)
├── config/         # navigation, iconRegistry
├── hooks/          # useModuleTree, useModules…
├── layouts/        # AdminLayout, AuthLayout
├── modules/<name>/ # a feature: pages/, components/, queries.ts, types.ts, <name>Slice.ts
├── routes/index.tsx# TanStack Router route tree
├── services/       # apiClient (axios), queryClient
├── store/          # Redux store + slices + typed hooks
└── utils/          # toast, formErrors, color…
```

### Anatomy of a module

Each feature under `modules/<name>/` follows the same shape:

- `types.ts` — the entity interface(s).
- `queries.ts` — TanStack Query hooks (`useThings`, `useCreateThing`, …) calling `apiClient`.
- `pages/<Name>Page.tsx` — the list page (DataTable + PageHeader + drawers).
- `components/Add<Name>Drawer.tsx`, `Edit<Name>Drawer.tsx` — create/edit forms.
- `<name>Slice.ts` — Redux slice for local UI state (drawer open, editing record).

## Data flow

- **Server data** → TanStack Query (`queries.ts`), keyed by `['<resource>', params]`.
  Mutations invalidate the matching keys so lists refresh.
- **UI/client state** (drawers, current org, theme) → Redux slices, accessed via
  typed `useAppSelector` / `useAppDispatch`.
- **HTTP** → `services/apiClient.ts` (axios) with `withCredentials` + XSRF. The
  base URL is derived per environment; a CSRF cookie is fetched before mutating.

## The server-side table

`components/DataTable.tsx` + the `useServerTable(pageSize, placeholder)` hook
drive **server-side** pagination/search/sort. A page does:

```tsx
const table = useServerTable(15, 'Search…')
const { data, isFetching } = useThings(table.params)
<DataTable dataSource={data?.data} loading={isFetching}
  server={{ total: data?.meta.total, page: table.page, pageSize: table.pageSize, onChange: table.onChange }} />
```

## The sidebar (DB-driven)

The menu is **not** hardcoded. `useModuleTree()` fetches `GET /api/modules/tree`
(built from the `modules` table) and `SidebarContent` renders it, resolving icon
names through `config/iconRegistry.ts`. The tree is **cached in `localStorage`**
(`elara.modules-tree`) so it paints instantly on reload without a flash; it
background-refetches to stay current. Adding a nav item = seeding a `modules`
row (see [../development/adding-module.md](../development/adding-module.md)).

> If a newly seeded module doesn't appear, hard-reload to bust the localStorage
> cache: `localStorage.removeItem('elara.modules-tree')`.

## Auth on the client

`components/AuthGuard.tsx` gates the admin layout: it calls `fetchUser`
(`store/authSlice`), shows a preloader while checking, and redirects to `/login`
if unauthenticated. Login/logout live in `authSlice` and hit the Sanctum
endpoints; roles/permissions from the auth payload drive permission gating.

## Dev server notes

Vite runs on `:5173`. In Docker on Windows, file-change events don't cross the
bind mount, so `vite.config.js` enables `server.watch.usePolling` for HMR. Vite
also restricts hosts — `allowedHosts` must include tenant domains you browse to.
