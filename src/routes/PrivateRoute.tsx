import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '../features/auth/store/auth.store'

export default function PrivateRoute() {
  const status = useAuthStore((state) => state.status)
  const location = useLocation()
  if (status === 'unauthorized') return <Navigate to="/unauthorized" replace />
  if (status !== 'authenticated') {
    return <Navigate to="/login" state={{ from: location.pathname + location.search + location.hash }} replace />
  }
  return <Outlet />
}
