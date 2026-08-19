# Frontend Directory Structure

> **Status:** Current · **Last updated:** 2026-08-13 · **Owner:** Engineering

The React SPA lives in `reactTheme/`. This maps the real tree and what belongs
where.

## Top level (`reactTheme/`)

```
reactTheme/
├── public/               # static assets served as-is
├── src/                  # all application source (see below)
├── cypress/              # end-to-end tests (Cypress)
├── index.html            # Vite entry HTML
├── vite.config.js        # Vite config (dev server, HMR polling, aliases)
├── tsconfig.json         # TypeScript config
├── eslint.config.js      # ESLint flat config
├── cypress.config.ts     # Cypress config
├── package.json          # dependencies + scripts
├── Dockerfile            # frontend container (Vite dev server)
├── .env / .env.example   # VITE_API_BASE_URL, VITE_BACKEND_URL
└── FRONTEND_GUIDE.md      # in-repo notes
```

## `src/`

```
src/
├── app/          # App root + providers (query client, redux, antd, router)
├── assets/       # images and static imports (e.g. login background)
├── components/   # shared, cross-module UI
├── config/       # navigation, iconRegistry
├── hooks/        # shared hooks (useModuleTree, useModules)
├── layouts/      # AdminLayout, AuthLayout
├── modules/      # feature modules (one folder per feature)
├── pages/        # top-level pages not owned by a module
├── routes/       # TanStack Router route tree (index.tsx)
├── services/     # apiClient (axios), queryClient
├── store/        # Redux Toolkit store + slices
├── styles/       # global CSS (Tailwind entry)
├── test/         # test setup + helpers (Vitest)
├── types/        # shared TypeScript types (api, models)
└── utils/        # helpers (toast, formErrors, color, tenant)
```

### `components/` (shared UI)

`AuthGuard`, `DataTable`, `ErrorBoundary`, `NotFoundPage`,
`OrganizationSwitcher`, `PageHeader`, `Preloader`, `SettingsDrawer`,
`SidebarContent`, `StatCard`.

**Belongs here:** UI reused across ≥2 modules. **Doesn't belong here:**
feature-specific components (put those in `modules/<name>/components`).

### `store/` (client state)

`index.ts` (store), `hooks.ts` (typed `useAppSelector`/`useAppDispatch`),
`authSlice.ts`, `orgSlice.ts` (active organization), `uiSlice.ts` (theme, layout).

### `modules/` (features)

Each feature is a self-contained folder:

```
modules/<name>/
├── pages/<Name>Page.tsx           # list/detail pages
├── components/Add<Name>Drawer.tsx # create/edit forms
├── queries.ts                     # TanStack Query hooks
├── types.ts                       # entity interfaces
└── <name>Slice.ts                 # local UI state (optional)
```

Current modules:

```
analytics          designations       organizations      tenants
applicationtypes   documenttypes      permissions        user-guide
attendance         genders            profile            users
auth               globalsettings     reports
cities             leavetypes         roles
countries          managed-modules    dashboard
departments        module-builder
```

> `user-guide` is this documentation reader; `module-builder` scaffolds new
> modules. `analytics`, `attendance`, `reports`, `dashboard` are UI placeholders
> without a dedicated backend.

## Where to put a new thing

| Adding… | Put it in |
|---|---|
| A new feature (page + CRUD) | `src/modules/<name>/` (mirror an existing module) |
| A reusable component | `src/components/` |
| A shared hook | `src/hooks/` |
| A shared type | `src/types/` |
| A route | register it in `src/routes/index.tsx` |
| A Redux slice | `src/store/` (and register in `store/index.ts`) |
| Global styles | `src/styles/` |

See [../development/adding-module.md](../development/adding-module.md) for the
full new-module walkthrough.
