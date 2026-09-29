import { Button, Spinner } from 'ucebul_mui'
import type { ApiError } from '../../../lib/api-error'

// Estados compartidos de los visores mientras se descarga el archivo privado.
export default function ResourceLoadState({ loading, progress, error, onRetry }: {
  loading: boolean
  progress: number | null
  error: ApiError | null
  onRetry: () => void
}) {
  if (loading) {
    return <div className="resource-viewer__state">
      <Spinner label="Cargando recurso…" />
      <span>{progress !== null ? `Cargando… ${progress}%` : 'Cargando…'}</span>
    </div>
  }
  if (error) {
    const message = error.status === 403
      ? 'No tienes acceso a este recurso. Puede que necesites inscribirte en el curso.'
      : error.status === 404 ? 'El archivo de este recurso no está disponible.' : error.message
    return <div className="auth-error load-error" role="alert"><p>{message}</p>
      <Button size="sm" onClick={onRetry}>Reintentar</Button></div>
  }
  return null
}
