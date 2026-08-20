import { useEffect, useRef, type ReactNode } from 'react'
import { Navigate } from '@tanstack/react-router'
import { fetchUser } from '../store/authSlice'
import Preloader from './Preloader'
import { useAppDispatch, useAppSelector } from '../store/hooks'

function AuthGuard({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch()
  const { isAuthenticated, checked } = useAppSelector((state) => state.auth)
  // Guards against a double fetch: React StrictMode invokes effects twice in dev,
  // and `checked` is still false on the second run, so a bare `if (!checked)`
  // dispatches /user twice. The ref persists across the double-invoke.
  const fetchStarted = useRef(false)

  useEffect(() => {
    if (!checked && !fetchStarted.current) {
      fetchStarted.current = true
      dispatch(fetchUser())
    }
  }, [checked, dispatch])

  if (!checked) {
    return <Preloader fullscreen />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default AuthGuard
