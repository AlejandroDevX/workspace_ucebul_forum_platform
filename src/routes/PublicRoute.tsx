import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '../features/auth/store/auth.store'

export default function PublicRoute() {
  const status = useAuthStore((state) => state.status)
  const { state } = useLocation()
  const from: unknown = state?.from
  const destination = typeof from === 'string' && from.startsWith('/')
    && !from.startsWith('//') && !from.startsWith('/login') && !from.startsWith('/unauthorized') ? from : '/dashboard'
  if (status === 'authenticated') return <Navigate to={destination} replace />
  if (status === 'unauthorized') return <Navigate to="/unauthorized" replace />
  return <Outlet />
}
