import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../features/auth/store/auth.store'

// Usar dentro de PrivateRoute cuando se hayan definido los slugs del módulo.
export default function PermissionRoute({ permissions, mode = 'all' }: {
  permissions: readonly string[]
  mode?: 'all' | 'any'
}) {
  const allowed = useAuthStore((state) => permissions.length > 0 && (mode === 'any'
    ? state.hasAnyPermission(permissions)
    : permissions.every((slug) => state.hasPermission(slug))))
  return allowed ? <Outlet /> : <Navigate to="/unauthorized" replace />
}
