import { useEffect, type ReactNode } from 'react'
import { Navigate } from '@tanstack/react-router'
import { fetchUser } from '../store/authSlice'
import Preloader from './Preloader'
import { useAppDispatch, useAppSelector } from '../store/hooks'

function AuthGuard({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch()
  const { isAuthenticated, checked } = useAppSelector((state) => state.auth)

  useEffect(() => {
    if (!checked) {
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
