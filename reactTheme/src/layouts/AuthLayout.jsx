import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import Preloader from '../components/Preloader'

// Minimal shell for unauthenticated pages (login, forgot password).
function AuthLayout() {
  return (
    <Suspense fallback={<Preloader fullscreen />}>
      <Outlet />
    </Suspense>
  )
}

export default AuthLayout
