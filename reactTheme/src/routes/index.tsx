/* eslint-disable react-refresh/only-export-components -- route tree maps paths to lazy-loaded pages, not a fast-refreshable component module */
import { lazy } from 'react'
import {
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from '@tanstack/react-router'
import AdminLayout from '../layouts/AdminLayout'
import AuthLayout from '../layouts/AuthLayout'
import AuthGuard from '../components/AuthGuard'
import NotFoundPage from '../components/NotFoundPage'
import { validateTableSearch } from '../components/DataTable'
import { isCentralHost } from '../utils/tenant'

// Lazy-load every page so each route is its own chunk. Pages live inside their
// feature module (src/modules/<feature>/pages).
const LoginPage = lazy(() => import('../modules/auth/pages/LoginPage'))
const ForgotPasswordPage = lazy(() => import('../modules/auth/pages/ForgotPasswordPage'))
const DashboardPage = lazy(() => import('../modules/dashboard/pages/DashboardPage'))
const AnalyticsPage = lazy(() => import('../modules/analytics/pages/AnalyticsPage'))
const AttendancePage = lazy(() => import('../modules/attendance/pages/AttendancePage'))
const UsersPage = lazy(() => import('../modules/users/pages/UsersPage'))
const RolesPage = lazy(() => import('../modules/roles/pages/RolesPage'))
const PermissionsPage = lazy(() => import('../modules/permissions/pages/PermissionsPage'))
const ModulesPage = lazy(() => import('../modules/managed-modules/pages/ModulesPage'))
/**
 * Guards routes that only exist in the central app. The sidebar already omits
 * these inside a tenant (the API hides the modules), but that leaves a
 * hand-typed URL rendering a page whose every request 404s — this sends the
 * user somewhere useful instead. The real enforcement is the `central`
 * middleware on the backend; this is only for the address bar.
 */
const centralOnly = () => {
  if (!isCentralHost()) {
    throw redirect({ to: '/dashboard' })
  }
}

const ModuleBuilderPage = lazy(() => import('../modules/module-builder/pages/ModuleBuilderPage'))
const ProfilePage = lazy(() => import('../modules/profile/pages/ProfilePage'))
const ReportsPage = lazy(() => import('../modules/reports/pages/ReportsPage'))

const rootRoute = createRootRoute()

// ───────────────────────── public (auth) layout ─────────────────────────
const authLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'auth',
  component: AuthLayout,
})

const loginRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/login',
  component: LoginPage,
})

const forgotPasswordRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: '/forgot-password',
  component: ForgotPasswordPage,
})

// ───────────────────────── protected (admin) layout ─────────────────────
function GuardedAdminLayout() {
  return (
    <AuthGuard>
      <AdminLayout />
    </AuthGuard>
  )
}

const adminLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'admin',
  component: GuardedAdminLayout,
})

// Catch-all under the admin layout: unknown paths (e.g. a parent-menu link with
// no page yet) render the 404 *inside* the layout, keeping sidebar + header.
const notFoundRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '$',
  component: NotFoundPage,
})

const indexRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/dashboard' })
  },
})

const dashboardRoute = createRoute({ getParentRoute: () => adminLayoutRoute, path: '/dashboard', component: DashboardPage })
const analyticsRoute = createRoute({ getParentRoute: () => adminLayoutRoute, path: '/analytics', component: AnalyticsPage })
const attendanceRoute = createRoute({ getParentRoute: () => adminLayoutRoute, path: '/attendance', component: AttendancePage })
// Table params + deep-linkable drawer state (?add=true / ?edit=<id>). Shared by
// every list route that has Add/Edit drawers (users, roles, …).
const validateDrawerTableSearch = (raw: Record<string, unknown>) => {
  const out: Record<string, unknown> = { ...validateTableSearch(raw) }
  if (raw.add === true || raw.add === 'true') out.add = true
  const edit = typeof raw.edit === 'number'
    ? raw.edit
    : (typeof raw.edit === 'string' && /^\d+$/.test(raw.edit) ? Number(raw.edit) : undefined)
  if (edit) out.edit = edit
  return out
}
const usersRoute = createRoute({ getParentRoute: () => adminLayoutRoute, path: '/users', component: UsersPage, validateSearch: validateDrawerTableSearch })
const rolesRoute = createRoute({ getParentRoute: () => adminLayoutRoute, path: '/roles', component: RolesPage, validateSearch: validateDrawerTableSearch })
const permissionsRoute = createRoute({ getParentRoute: () => adminLayoutRoute, path: '/permissions', component: PermissionsPage, validateSearch: validateDrawerTableSearch })
const modulesRoute = createRoute({ getParentRoute: () => adminLayoutRoute, path: '/modules', component: ModulesPage, validateSearch: validateTableSearch })
const moduleBuilderRoute = createRoute({ getParentRoute: () => adminLayoutRoute, path: '/module-builder', component: ModuleBuilderPage, beforeLoad: centralOnly, validateSearch: validateDrawerTableSearch })
const profileRoute = createRoute({ getParentRoute: () => adminLayoutRoute, path: '/profile', component: ProfilePage })
const reportsRoute = createRoute({ getParentRoute: () => adminLayoutRoute, path: '/reports', component: ReportsPage })
const ApplicationTypesPage = lazy(() => import('../modules/applicationtypes/pages/ApplicationTypesPage'))
const applicationTypesRoute = createRoute({ getParentRoute: () => adminLayoutRoute, path: '/applicationtypes', component: ApplicationTypesPage, validateSearch: validateDrawerTableSearch })
const CountriesPage = lazy(() => import('../modules/countries/pages/CountriesPage'))
const countriesRoute = createRoute({ getParentRoute: () => adminLayoutRoute, path: '/countries', component: CountriesPage, validateSearch: validateDrawerTableSearch })
const CitiesPage = lazy(() => import('../modules/cities/pages/CitiesPage'))
const citiesRoute = createRoute({ getParentRoute: () => adminLayoutRoute, path: '/cities', component: CitiesPage, validateSearch: validateDrawerTableSearch })
const GendersPage = lazy(() => import('../modules/genders/pages/GendersPage'))
const gendersRoute = createRoute({ getParentRoute: () => adminLayoutRoute, path: '/genders', component: GendersPage, validateSearch: validateDrawerTableSearch })
const GlobalSettingsPage = lazy(() => import('../modules/globalsettings/pages/GlobalSettingsPage'))
const globalSettingsRoute = createRoute({ getParentRoute: () => adminLayoutRoute, path: '/globalsettings', component: GlobalSettingsPage, validateSearch: validateDrawerTableSearch })
const TenantsPage = lazy(() => import('../modules/tenants/pages/TenantsPage'))
const tenantsRoute = createRoute({ getParentRoute: () => adminLayoutRoute, path: '/tenants', component: TenantsPage, beforeLoad: centralOnly, validateSearch: validateDrawerTableSearch })
const DepartmentsPage = lazy(() => import('../modules/departments/pages/DepartmentsPage'))
const departmentsRoute = createRoute({ getParentRoute: () => adminLayoutRoute, path: '/departments', component: DepartmentsPage, validateSearch: validateDrawerTableSearch })
const DesignationsPage = lazy(() => import('../modules/designations/pages/DesignationsPage'))
const designationsRoute = createRoute({ getParentRoute: () => adminLayoutRoute, path: '/designations', component: DesignationsPage, validateSearch: validateDrawerTableSearch })
const LeaveTypesPage = lazy(() => import('../modules/leavetypes/pages/LeaveTypesPage'))
const leaveTypesRoute = createRoute({ getParentRoute: () => adminLayoutRoute, path: '/leavetypes', component: LeaveTypesPage, validateSearch: validateDrawerTableSearch })
const DocumentTypesPage = lazy(() => import('../modules/documenttypes/pages/DocumentTypesPage'))
const documentTypesRoute = createRoute({ getParentRoute: () => adminLayoutRoute, path: '/documenttypes', component: DocumentTypesPage, validateSearch: validateDrawerTableSearch })
const OrganizationsPage = lazy(() => import('../modules/organizations/pages/OrganizationsPage'))
const organizationsRoute = createRoute({ getParentRoute: () => adminLayoutRoute, path: '/organizations', component: OrganizationsPage, validateSearch: validateDrawerTableSearch })
const UserGuidePage = lazy(() => import('../modules/user-guide/pages/UserGuidePage'))
const userGuideRoute = createRoute({ getParentRoute: () => adminLayoutRoute, path: '/user-guide', component: UserGuidePage })
const DeveloperGuidePage = lazy(() => import('../modules/user-guide/pages/DeveloperGuidePage'))
const developerGuideRoute = createRoute({ getParentRoute: () => adminLayoutRoute, path: '/developer-guide', component: DeveloperGuidePage })
// __MODULE_ROUTE_DEFS__

const routeTree = rootRoute.addChildren([
  authLayoutRoute.addChildren([loginRoute, forgotPasswordRoute]),
  adminLayoutRoute.addChildren([
    indexRoute,
    dashboardRoute,
    analyticsRoute,
    attendanceRoute,
    usersRoute,
    rolesRoute,
    permissionsRoute,
    modulesRoute,
    moduleBuilderRoute,
    profileRoute,
    reportsRoute,
    applicationTypesRoute,
    countriesRoute,
    citiesRoute,
    gendersRoute,
    globalSettingsRoute,
    tenantsRoute,
    departmentsRoute,
    designationsRoute,
    leaveTypesRoute,
    documentTypesRoute,
    organizationsRoute,
    userGuideRoute,
    developerGuideRoute,
    // __MODULE_ROUTES__
    notFoundRoute,
  ]),
])

export const router = createRouter({
  routeTree,
  defaultNotFoundComponent: NotFoundPage,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

export default router
