import { useEffect } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Button, DataIcons } from 'ucebul_mui'
import { useAuthStore } from '../features/auth/store/auth.store'

export default function UnauthorizedPage() {
  const token = useAuthStore((state) => state.token)
  const status = useAuthStore((state) => state.status)
  const error = useAuthStore((state) => state.error)
  const logout = useAuthStore((state) => state.logout)

  useEffect(() => { document.title = 'Acceso denegado | Foro técnico UCEBUL' }, [])

  if (status === 'anonymous') return <Navigate to="/login" replace />

  return <section className="session-screen">
    <span className="feature-icon" aria-hidden="true">{DataIcons.forms.user}</span>
    <h1>Acceso denegado</h1>
    <p role="alert">{error?.status === 403 ? error.message : 'Tu cuenta no tiene los permisos necesarios para ver esta página.'}</p>
    <p>Contacta al administrador de tu organización para revisar tu acceso a Foro Técnico.</p>
    <div className="auth-actions">
      {status === 'authenticated' && <Link className="text-link" to="/dashboard">Volver al inicio</Link>}
      {token ? <Button onClick={() => void logout()}>Cerrar sesión</Button> : <Link className="text-link" to="/login">Iniciar sesión</Link>}
    </div>
  </section>
}
