# Elara Frontend — Complete Developer Guide

This is the single reference for the **Elara admin frontend** (`reactTheme/`). Read
it top-to-bottom and you'll understand how the whole app is wired: routing, auth,
state, data fetching, the DB-driven sidebar, and how to add your own feature module.

---

## 1. Tech stack

| Concern | Tool |
|---|---|
| Language | **TypeScript** (strict-ish; `strictNullChecks` on) |
| Build/dev server | **Vite** |
| UI library | **Ant Design v6** (`antd`) |
| Styling | **Tailwind CSS v4** + antd tokens |
| Routing | **TanStack Router** (code-based route tree) |
| Server state (API data) | **TanStack Query** (`@tanstack/react-query`) |
| Client/UI state | **Redux Toolkit** |
| HTTP | **axios** (cookie-based Sanctum auth) |
| Testing | **Vitest** + React Testing Library |

**Golden rule of state:**
> **Server data → TanStack Query. UI/global state → Redux. Never fetch API data into Redux.**

---

## 2. Getting started

```bash
npm install
npm run dev          # start Vite dev server (http://localhost:5173)
npm run build        # production build
npm run typecheck    # tsc --noEmit (no emit, just type-check)
npm run lint         # eslint
npm test             # vitest watch mode
npm run test:run     # vitest single run
npm run test:coverage
```

### Environment variables (`.env`)
```
VITE_API_BASE_URL=http://localhost:8000/api   # axios baseURL
VITE_BACKEND_URL=http://localhost:8000        # used for the CSRF cookie call
VITE_APP_NAME=Elara
```
Typed in `src/vite-env.d.ts`, so `import.meta.env.VITE_API_BASE_URL` is type-safe.

---

## 3. Directory structure

```
src/
├── main.tsx                # entry: mounts <AppProviders><App/></AppProviders>
├── app/
│   ├── App.tsx             # <RouterProvider router={router} />
│   └── providers.tsx       # Redux + Query + AntD theme + ToastHost providers
├── routes/
│   └── index.tsx           # TanStack Router route TREE (the single router)
├── layouts/
│   ├── AdminLayout.tsx     # sidebar + header + <Outlet/> (protected pages)
│   └── AuthLayout.tsx      # bare shell for login / forgot-password
├── components/             # shared, cross-feature components
│   ├── AuthGuard.tsx       # gate: redirects to /login if not authenticated
│   ├── SidebarContent.tsx  # the sidebar menu (DB-driven)
│   ├── PageHeader.tsx, StatCard.tsx, Preloader.tsx,
│   ├── ErrorBoundary.tsx, NotFoundPage.tsx, SettingsDrawer.tsx
├── config/
│   ├── navigation.tsx      # static menu FALLBACK + buildMenuItems() helpers
│   └── iconRegistry.ts     # maps icon name string -> AntD icon component
├── hooks/
│   ├── useModuleTree.ts    # sidebar tree query (/modules/tree)
│   └── useModules.ts       # module-management queries (list, create, visibility)
├── services/
│   ├── apiClient.ts        # the axios instance (+ initCsrf)
│   └── queryClient.ts      # the TanStack QueryClient (shared defaults)
├── store/                  # app-GLOBAL Redux only
│   ├── index.ts            # configureStore + RootState/AppDispatch types
│   ├── hooks.ts            # useAppDispatch / useAppSelector (typed)
│   ├── authSlice.ts        # current user / auth state (+ login/logout thunks)
│   └── uiSlice.ts          # theme, sidebar collapse, layout settings
├── types/
│   ├── api.ts              # ApiResponse<T>, ApiError
│   └── models.ts           # User, Role, Permission, Module, ...
├── utils/
│   ├── toast.ts            # toast (center) + notify (top-left) helpers
│   ├── formErrors.ts       # map Laravel validation errors onto AntD forms
│   └── color.ts            # color helpers for theming/charts
├── test/
│   ├── setup.ts            # jsdom mocks + jest-dom matchers
│   └── test-utils.tsx      # renderWithProviders() for component tests
└── modules/<feature>/      # SELF-CONTAINED feature modules (see §11)
    ├── pages/<Feature>Page.tsx
    ├── components/Add<X>Drawer.tsx, Edit<X>Drawer.tsx
    ├── queries.ts          # TanStack Query hooks for this feature
    ├── <feature>Slice.ts   # Redux UI slice (drawer open/close, editing row)
    └── types.ts            # entity type (generated modules)
```

### Two kinds of state live in two places
- **`store/`** holds only **app-global** slices: `authSlice` (who is logged in) and
  `uiSlice` (theme/layout). These are cross-cutting.
- **Each feature module owns its own slice** co-located in `modules/<feature>/`.
  A feature is therefore self-contained: page + components + queries + slice + types.

### Path alias
`@/` maps to `src/` (configured in both `vite.config.js` and `tsconfig.json`):
```ts
import { toast } from '@/utils/toast'   // == ../../utils/toast
```

---

## 4. Application bootstrap (how it starts)

```
main.tsx
 └── <AppProviders>                     (app/providers.tsx)
      ├── <Provider store={store}>            Redux
      ├── <QueryClientProvider>               TanStack Query
      └── <ThemeProvider> (AntD ConfigProvider from uiSlice)
           └── <AntApp>                        AntD context (message/notification/modal)
                ├── <ToastHost/>               captures toast API (see §10)
                └── <App/>                     app/App.tsx
                     └── <RouterProvider>      TanStack Router (routes/index.tsx)
```

`providers.tsx` bridges the Redux `ui` slice into AntD's theme tokens, so changing a
color in Settings re-themes the whole app from one place.

---

## 5. Routing (TanStack Router)

Routing is **code-based** and lives entirely in `routes/index.tsx`.

### The route tree
```
rootRoute
├── authLayoutRoute   (id:'auth', component: AuthLayout)   — public
│    ├── /login
│    └── /forgot-password
└── adminLayoutRoute  (id:'admin', component: <AuthGuard><AdminLayout/></AuthGuard>)
     ├── /            → redirect to /dashboard   (beforeLoad)
     ├── /dashboard, /users, /roles, /permissions, /modules, /module-builder, ...
     └── $            → NotFoundPage (catch-all, renders INSIDE the layout)
```

- **Layout routes** (`id` + no `path`) wrap children with a shared component and an
  `<Outlet/>`. `AuthLayout`/`AdminLayout` each wrap their `<Outlet/>` in `<Suspense>`
  so lazy pages show a `<Preloader/>` while loading.
- **Every page is lazy-loaded** (`lazy(() => import(...))`) → one JS chunk per route.
- The **catch-all `$` route** under the admin layout means an unknown URL renders the
  404 *inside* the sidebar/header chrome (not a bare white screen).

### Navigating in code
TanStack uses an object API (not a bare string):
```ts
import { useNavigate } from '@tanstack/react-router'
const navigate = useNavigate()
navigate({ to: '/users' })
navigate({ to: '/login', replace: true })
```

### Adding a route manually
1. `const StudentsPage = lazy(() => import('../modules/students/pages/StudentsPage'))`
2. `const studentsRoute = createRoute({ getParentRoute: () => adminLayoutRoute, path: '/students', component: StudentsPage })`
3. Add `studentsRoute` to the `adminLayoutRoute.addChildren([...])` array.

> The Module Builder does exactly this automatically at the `// __MODULE_ROUTE_DEFS__`
> and `// __MODULE_ROUTES__` markers — don't remove those comments.

---

## 6. Authentication flow (Sanctum, cookie-based)

There are **no tokens in JS**. Auth is a session cookie set by Laravel Sanctum.

### Login sequence
```
1. GET  {VITE_BACKEND_URL}/sanctum/csrf-cookie   → sets XSRF-TOKEN cookie   (initCsrf)
2. POST /api/login {email,password}              → sets session cookie
3. Response { data: { user, roles, permissions } } stored in authSlice
```

`apiClient` is configured with `withCredentials: true` (send cookies) and
`withXSRFToken: true` (echo the XSRF cookie as a header) — so every request is
authenticated automatically once logged in.

### The guard
`AuthGuard` wraps the admin layout:
```
if (!checked)           → dispatch(fetchUser()); show <Preloader/>
if (!isAuthenticated)   → <Navigate to="/login" />
else                    → render children (the AdminLayout)
```
`fetchUser()` calls `GET /api/user`; on a fresh page load it re-hydrates the current
user from the session cookie. `checked` flips to `true` after that call so the guard
only runs once.

### Logout
`dispatch(logout())` → `POST /api/logout` → clears the auth slice → redirect to `/login`.

---

## 7. Redux Toolkit (client / UI state)

### The store
`store/index.ts` combines reducers and exports the types:
```ts
export const store = configureStore({
  reducer: { auth, ui, users, roles, permissions, moduleBuilder /* + generated */ },
})
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
```

### Always use the TYPED hooks
```ts
import { useAppDispatch, useAppSelector } from '@/store/hooks'

const dispatch = useAppDispatch()
const primaryColor = useAppSelector((s) => s.ui.primaryColor)   // fully typed
```
Never import `useDispatch`/`useSelector` from `react-redux` directly — the typed
versions give you `RootState` autocompletion.

### What belongs in Redux?
Only **UI/ephemeral state**:
- Is a drawer open? Which row is being edited?
- Theme mode, primary color, sidebar collapsed (in `uiSlice`).
- Current user identity (in `authSlice`).

A typical **feature slice** (e.g. `modules/users/usersSlice.ts`) is just drawer state:
```ts
interface UsersUiState { addDrawerOpen: boolean; editDrawerOpen: boolean; editingUser: User | null }
const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    openAddDrawer, closeAddDrawer,
    openEditDrawer: (s, a: PayloadAction<User>) => { s.editingUser = a.payload; s.editDrawerOpen = true },
    closeEditDrawer,
  },
})
```

> Server data (the list of users, roles, etc.) is **NOT** in Redux — it's in TanStack
> Query (§8).

---

## 8. TanStack Query (server state)

All API data is fetched and cached with TanStack Query. Never store fetched lists in
Redux — Query handles caching, loading/error states, and refetching.

### The shared client
`services/queryClient.ts` sets sensible admin-panel defaults (no refetch on window
focus, 5-min stale time).

### Query hooks live per feature
`modules/users/queries.ts`:
```ts
export function useUsers() {
  return useQuery({ queryKey: ['users'], queryFn: fetchUsers })
}
export function useCreateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (values) => apiClient.post('/users', values),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),  // refetch list
  })
}
```

### Query keys = cache identity
- `['users']`, `['roles']`, `['permissions-list']`, `['modules-tree']`, `['modules-list']`
- After a create/update/delete mutation, **invalidate the relevant key(s)** in
  `onSuccess` so the UI refreshes automatically.
- Cross-cutting example: creating a module invalidates **both** `['modules-list']`
  (the builder table) and `['modules-tree']` (the sidebar).

### In a component
```ts
const { data: users = [], isLoading } = useUsers()
const create = useCreateUser()

create.mutate(values, {
  onSuccess: () => notify.success('User created'),
  onError:  (e) => { if (!applyServerErrors(e, form)) toast.error(serverMessage(e)) },
})
```

---

## 9. The request flow (end-to-end)

```
Component
  │  calls a query/mutation hook (modules/<feature>/queries.ts)
  ▼
apiClient (axios)  ──►  Laravel API  (/api/...)
  │  withCredentials + XSRF header (auth), baseURL = VITE_API_BASE_URL
  ▼
Response envelope (EVERY endpoint):
  { success, message, data, errors }
  │
  ├─ success → hook returns `data.data`  (the payload)
  └─ error   → axios throws; caught in the mutation's onError
                 ├─ applyServerErrors(error, form)  → maps 422 field errors onto the AntD form
                 └─ serverMessage(error)            → the top-level message for a toast
```

### The response envelope (`types/api.ts`)
The backend **always** returns the same shape (success and error alike):
```ts
interface ApiResponse<T> { success: boolean; message: string; data: T; errors: Record<string,string[]> | null }
```
So list hooks read `data.data`, and error handling reads `error.response.data.errors` /
`.message` — uniformly, for every endpoint.

### Field-level validation errors (`utils/formErrors.ts`)
```ts
onError: (error) => {
  if (!applyServerErrors(error, form)) {          // sets errors under each AntD Form.Item
    toast.error(serverMessage(error, 'Fallback')) // otherwise a general toast
  }
}
```

---

## 10. Notifications (`utils/toast.ts`)

Two flavors, both callable from **anywhere** (even outside React, e.g. query callbacks):

```ts
import { toast, notify } from '@/utils/toast'

toast.success('Saved')          // lightweight banner, top-center
toast.error('Something failed')
notify.success('User created', 'The account is ready.')  // corner card, TOP-LEFT
```

Convention: **data successfully inserted → `notify.success` (top-left)**; everything
else (updates, quick confirmations, errors) → `toast`.

**How it works:** `<ToastHost/>` (mounted in `providers.tsx` inside `<AntApp>`) captures
AntD's context-aware `message`/`notification` API into a module ref, so the plain
`toast`/`notify` objects work app-wide and stay theme-aware.

---

## 11. The sidebar — how it works (DB-driven)

The sidebar is **not hardcoded**. It renders from the database so the Module Builder
can add menu entries live.

```
Backend `modules` table
   │  GET /api/modules/tree   (nested, visible-only, ordered)
   ▼
useModuleTree()               (hooks/useModuleTree.ts)  — cached under ['modules-tree']
   │
   ▼
buildMenuItems(tree)          (config/navigation.tsx)
   │  maps DB nodes → AntD <Menu> items; resolves icon strings via iconRegistry
   ▼
SidebarContent.tsx  → <Menu items={...} />
```

### Key pieces
- **`hooks/useModuleTree.ts`** — fetches `/modules/tree` (open to any authenticated
  user). Cached; invalidated when a module is created or toggled active/inactive.
- **`config/iconRegistry.ts`** — the DB stores an icon *name string* (e.g.
  `"TeamOutlined"`), because you can't store a React component in a DB. The registry
  maps that string to the actual AntD icon component.
- **`config/navigation.tsx`**
  - `buildMenuItems(tree)` — turns the DB tree into AntD menu items (groups → menu
    groups, items → links, items-with-children → sub-menus).
  - `buildSearchableItems(tree)` — flat list for the header quick-search.
  - `menuItems` / `searchableItems` — a **static fallback** used only while the tree is
    loading or if the request fails.
- **`SidebarContent.tsx`** — `const items = tree?.length ? buildMenuItems(tree) : staticMenuItems`.
  Clicking an item calls `navigate({ to: key })`.

### Active/Inactive
The **Managed Modules** page (`/modules`) lists the full module list (including hidden
ones) and toggles `is_visible` via `useSetModuleVisibility()`. Turning a module off
removes it from `/modules/tree` → it disappears from the sidebar; the management page
still shows it so you can re-enable it.

---

## 12. Anatomy of a feature module (the standard pattern)

Every feature (`users`, `roles`, `permissions`, and every generated module) follows the
**identical shape**. Using **Users** as the reference:

```
modules/users/
├── pages/UsersPage.tsx            # list page: table + toolbar + renders the drawers
├── components/
│   ├── AddUserDrawer.tsx          # create form (AntD Drawer)
│   └── EditUserDrawer.tsx         # edit form (prefilled from Redux `editingUser`)
├── queries.ts                     # useUsers / useCreateUser / useUpdateUser / useDeleteUser
└── usersSlice.ts                  # drawer open/close + editing row (Redux UI state)
```

### How the pieces talk
```
UsersPage
  ├── useUsers()                      → table data (TanStack Query)
  ├── dispatch(openAddDrawer())       → opens AddUserDrawer (Redux)
  ├── dispatch(openEditDrawer(row))   → opens EditUserDrawer with that row (Redux)
  └── useDeleteUser().mutate(id)      → delete + invalidate ['users']

AddUserDrawer
  ├── useAppSelector(s => s.users.addDrawerOpen)   → is it open?
  ├── useCreateUser()                              → submit
  └── on success: notify.success(...) + closeAddDrawer()
```

Redux = "is the drawer open / which row am I editing". Query = "the actual data".
That separation is the core mental model of the whole app.

---

## 13. Permissions on the frontend

- Permissions use the convention **`module.action`** (e.g. `users.view`,
  `users.create`, `user_info.view_data`).
- **Enforcement is on the backend** (route middleware). The frontend simply gets a
  `403` (mapped into the standard envelope) if the user lacks a permission — handled
  by the normal error path.
- **Super Admin** bypasses all checks; **Admin** is granted a module's permissions
  automatically when it's generated.

---

## 14. Adding a new feature module

### Option A — the Module Builder (recommended)
Go to **Module Builder** (`/module-builder`) → Create Module → choose *Resourceful
(CRUD)*. The generator writes the entire module for you (TypeScript frontend + Laravel
backend + permissions + route + sidebar entry). Nothing to wire by hand.

### Option B — by hand (to understand the pattern)
Create `modules/students/`:
1. **`types.ts`** — `export interface Student { id: number; name: string; created_at: string }`
2. **`queries.ts`** — `useStudents`, `useCreateStudent`, `useUpdateStudent`, `useDeleteStudent`
   (copy `modules/users/queries.ts`, swap the endpoint + query key).
3. **`studentsSlice.ts`** — drawer state (copy `usersSlice.ts`).
4. **Register the reducer** in `store/index.ts`:
   `import studentsReducer from '../modules/students/studentsSlice'` → add `students: studentsReducer`.
5. **`pages/StudentsPage.tsx`** + **`components/AddStudentDrawer.tsx` / `EditStudentDrawer.tsx`**
   (copy the Users equivalents).
6. **Add the route** in `routes/index.tsx` (see §5).
7. Ensure a matching sidebar entry exists (create the module row via the builder, or seed it).

---

## 15. Testing (Vitest + Testing Library)

- Config lives in `vite.config.js` under `test`; setup in `src/test/setup.ts`
  (jest-dom matchers + jsdom mocks AntD needs: `matchMedia`, `ResizeObserver`).
- **`src/test/test-utils.tsx`** exports `renderWithProviders(ui, { preloadedState })`
  — renders a component inside the full provider stack (Redux + Query + AntD) with an
  optional seeded store.

### Pattern
```tsx
import { renderWithProviders, screen } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'

vi.mock('../queries', () => ({
  useRoles: () => ({ data: ['Admin'], isLoading: false }),
  useCreateUser: () => ({ mutate: vi.fn(), isPending: false }),
}))

renderWithProviders(<AddUserDrawer />, {
  preloadedState: { users: { addDrawerOpen: true, editDrawerOpen: false, editingUser: null } },
})
expect(screen.getByText('Add New User')).toBeInTheDocument()
```

Run: `npm run test:run` (single), `npm run test:coverage` (v8 coverage).

---

## 16. Theming & UI

- **AntD** is the component library; its theme tokens (colors, radius, font) are driven
  by the Redux `uiSlice` via `providers.tsx` → change once, re-theme everywhere.
- **Tailwind v4** is available for layout/utility classes (`flex`, `gap-3`, `w-full`).
  Use Tailwind for layout, AntD for components.
- The **Settings drawer** (`components/SettingsDrawer.tsx`) lets a user change theme
  mode, primary color, radius, font scale, sidebar behavior — all persisted to
  `localStorage` (see the `store.subscribe` in `store/index.ts`).

---

## 17. Conventions & gotchas (read this)

- **Typed hooks only:** import `useAppDispatch`/`useAppSelector` from `@/store/hooks`,
  never from `react-redux`.
- **Server data → Query, UI state → Redux.** Don't put fetched lists in Redux.
- **List hooks return `data.data`** because of the response envelope.
- **Mutations must `invalidateQueries`** the right key(s) in `onSuccess`, or the UI
  won't refresh.
- **Navigation is object-form:** `navigate({ to: '/x' })`, not `navigate('/x')`.
- **AntD Drawer width:** use `size={480}` (a number), NOT the deprecated `width` prop.
- **Unused code is a build error** (`noUnusedLocals`/`noUnusedParameters` are on) — keep
  imports clean.
- **Don't delete the `// __MODULE_*__` marker comments** in `store/index.ts` and
  `routes/index.tsx` — the Module Builder injects generated code at them.
- **Toasts:** insert success → `notify.success` (top-left); everything else → `toast`.
- Run `npm run typecheck` before pushing — it catches everything the dev server's
  esbuild (which strips types) does not.

---

## 18. Quick map: "where do I change X?"

| I want to… | Go to |
|---|---|
| Add a page/route | `routes/index.tsx` |
| Add API data fetching | `modules/<feature>/queries.ts` |
| Add drawer open/close state | `modules/<feature>/<feature>Slice.ts` |
| Change the axios/base config | `services/apiClient.ts` |
| Change global auth state | `store/authSlice.ts` |
| Change theme/layout state | `store/uiSlice.ts` |
| Add a sidebar icon | `config/iconRegistry.ts` |
| Change how the sidebar renders | `components/SidebarContent.tsx` + `config/navigation.tsx` |
| Change the header/topbar | `layouts/AdminLayout.tsx` |
| Add a shared type | `types/models.ts` (or module-local `types.ts`) |
| Add a toast/notification | `utils/toast.ts` (call site: `notify`/`toast`) |
| Add a shared component | `components/` |

---

*This guide reflects the current architecture. When you add a big new capability
(e.g. a workflow engine), add a short section here so the next developer stays oriented.*
