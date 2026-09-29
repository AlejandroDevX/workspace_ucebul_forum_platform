import { useEffect, useState } from 'react'
import { useRequest } from '../../../lib/useRequest'
import { fetchLessonResource } from '../api/lesson-resource.service'

// Descarga un recurso privado con Bearer y expone una URL blob: temporal que se revoca al desmontar.
export function useResourceBlob(resourceId: number) {
  const [progress, setProgress] = useState<number | null>(null)
  const request = useRequest(`resource-${resourceId}`, (signal) => fetchLessonResource(resourceId, { signal, onProgress: setProgress }))
  const [objectUrl, setObjectUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!request.data) return
    const url = URL.createObjectURL(request.data)
    // Se publica la URL después de crearla; la limpieza la revoca cuando cambia el Blob o al desmontar.
    queueMicrotask(() => setObjectUrl(url))
    return () => {
      URL.revokeObjectURL(url)
      setObjectUrl(null)
    }
  }, [request.data])

  return { url: objectUrl, loading: request.loading || (Boolean(request.data) && !objectUrl), error: request.error, progress, reload: request.reload }
}
