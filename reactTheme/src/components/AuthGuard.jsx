import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Navigate, useLocation } from 'react-router-dom'
import { fetchUser } from '../store/authSlice'
import Preloader from './Preloader'

function AuthGuard({ children }) {
  const dispatch = useDispatch()
  const location = useLocation()
  const { isAuthenticated, checked } = useSelector((state) => state.auth)

  useEffect(() => {
    if (!checked) {
      dispatch(fetchUser())
    }
  }, [checked, dispatch])

  if (!checked) {
    return <Preloader fullscreen />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}

export default AuthGuard
