import { type ReactNode, useEffect } from 'react'
import { Button, Spinner } from 'ucebul_mui'
import { useAuthStore } from '../store/auth.store'

export default function SessionBoundary({ children }: { children: ReactNode }) {
  const status = useAuthStore((state) => state.status)
  const isBootstrapping = useAuthStore((state) => state.isBootstrapping)
  const error = useAuthStore((state) => state.error)
  const initializeSession = useAuthStore((state) => state.initializeSession)
  const logout = useAuthStore((state) => state.logout)

  useEffect(() => { void initializeSession() }, [initializeSession])

  if (isBootstrapping || status === 'idle' || status === 'logging-out') {
    return <main className="session-screen" aria-live="polite"><Spinner label={status === 'logging-out' ? 'Cerrando sesión…' : 'Verificando tu sesión…'} /></main>
  }
  if (status === 'error') {
    return <main className="session-screen"><h1>No pudimos verificar tu acceso</h1>
      <p role="alert">{error?.message}</p>
      <div className="auth-actions"><Button onClick={() => void initializeSession()}>Reintentar</Button>
        <Button variant="secondary--outline" onClick={() => void logout()}>Cerrar sesión</Button></div>
    </main>
  }
  return children
}
