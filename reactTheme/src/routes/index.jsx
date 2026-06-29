/* eslint-disable react-refresh/only-export-components -- route table maps paths to lazy-loaded pages, not a fast-refreshable component module */
import { lazy } from 'react'
import { Navigate, createBrowserRouter } from 'react-router-dom'
import AdminLayout from '../layouts/AdminLayout'
import AuthLayout from '../layouts/AuthLayout'
import AuthGuard from '../components/AuthGuard'

// Lazy-load every page so each route is its own chunk. Pages live inside their
// feature module (src/modules/<feature>/pages).
const LoginPage = lazy(() => import('../modules/auth/pages/LoginPage'))
const ForgotPasswordPage = lazy(
  () => import('../modules/auth/pages/ForgotPasswordPage'),
)
const DashboardPage = lazy(
  () => import('../modules/dashboard/pages/DashboardPage'),
)
const AnalyticsPage = lazy(
  () => import('../modules/analytics/pages/AnalyticsPage'),
)
const AttendancePage = lazy(
  () => import('../modules/attendance/pages/AttendancePage'),
)
const UsersPage = lazy(() => import('../modules/users/pages/UsersPage'))
const RolesPage = lazy(() => import('../modules/roles/pages/RolesPage'))
const PermissionsPage = lazy(
  () => import('../modules/permissions/pages/PermissionsPage'),
)
const ModulesPage = lazy(
  () => import('../modules/managed-modules/pages/ModulesPage'),
)
const ProfilePage = lazy(() => import('../modules/profile/pages/ProfilePage'))
const ReportsPage = lazy(() => import('../modules/reports/pages/ReportsPage'))
const NotFoundPage = lazy(() => import('../components/NotFoundPage'))

const router = createBrowserRouter([
  {
    // Public routes (no auth guard yet — login is a placeholder).
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
    ],
  },
  {
    path: '/',
    element: <AuthGuard><AdminLayout /></AuthGuard>,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'analytics', element: <AnalyticsPage /> },
      { path: 'attendance', element: <AttendancePage /> },
      { path: 'users', element: <UsersPage /> },
      { path: 'roles', element: <RolesPage /> },
      { path: 'permissions', element: <PermissionsPage /> },
      { path: 'modules', element: <ModulesPage /> },
      { path: 'profile', element: <ProfilePage /> },
      { path: 'reports', element: <ReportsPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])

export default router
