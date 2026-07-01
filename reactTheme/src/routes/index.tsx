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
const usersRoute = createRoute({ getParentRoute: () => adminLayoutRoute, path: '/users', component: UsersPage })
const rolesRoute = createRoute({ getParentRoute: () => adminLayoutRoute, path: '/roles', component: RolesPage })
const permissionsRoute = createRoute({ getParentRoute: () => adminLayoutRoute, path: '/permissions', component: PermissionsPage })
const modulesRoute = createRoute({ getParentRoute: () => adminLayoutRoute, path: '/modules', component: ModulesPage })
const moduleBuilderRoute = createRoute({ getParentRoute: () => adminLayoutRoute, path: '/module-builder', component: ModuleBuilderPage })
const profileRoute = createRoute({ getParentRoute: () => adminLayoutRoute, path: '/profile', component: ProfilePage })
const reportsRoute = createRoute({ getParentRoute: () => adminLayoutRoute, path: '/reports', component: ReportsPage })
const ApplicationTypesPage = lazy(() => import('../modules/applicationtypes/pages/ApplicationTypesPage'))
const applicationTypesRoute = createRoute({ getParentRoute: () => adminLayoutRoute, path: '/applicationtypes', component: ApplicationTypesPage })
const CountriesPage = lazy(() => import('../modules/countries/pages/CountriesPage'))
const countriesRoute = createRoute({ getParentRoute: () => adminLayoutRoute, path: '/countries', component: CountriesPage })
const CitiesPage = lazy(() => import('../modules/cities/pages/CitiesPage'))
const citiesRoute = createRoute({ getParentRoute: () => adminLayoutRoute, path: '/cities', component: CitiesPage })
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
