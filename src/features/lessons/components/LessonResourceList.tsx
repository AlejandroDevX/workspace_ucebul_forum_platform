import { type ReactNode, useState } from 'react'
import { Badge, Button, DataIcons, Dialog } from 'ucebul_mui'
import { toApiError } from '../../../lib/api-error'
import { deleteLessonResource, fetchLessonResource } from '../api/lesson-resource.service'
import type { ForumLessonResource, ForumLessonResourceType } from '../types/lesson.types'
import { downloadName, formatBytes, RESOURCE_RULES } from '../utils/resource-rules'
import ImageViewer from './ImageViewer'
import PdfViewer from './PdfViewer'
import VideoPlayer, { type VideoTracking } from './VideoPlayer'

const ICONS: Record<ForumLessonResourceType, ReactNode> = {
  video: DataIcons.global.desktopOutline,
  pdf: DataIcons.global.pdfIcon,
  image: DataIcons.global.photoOutline,
  file: DataIcons.navigation.documentText,
}

const VIEWABLE: ForumLessonResourceType[] = ['video', 'pdf', 'image']

interface Props {
  resources: ForumLessonResource[]
  canDelete?: boolean
  onDeleted?: (resourceId: number) => void
  // El primer video se abre al entrar a la lección.
  autoOpenVideo?: boolean
  // Seguimiento de posición para el video principal de la lección.
  videoTracking?: VideoTracking
}

export default function LessonResourceList({ resources, canDelete = false, onDeleted, autoOpenVideo = false, videoTracking }: Props) {
  const sorted = [...resources].sort((a, b) => a.forum_lesson_resource_position - b.forum_lesson_resource_position)
  const firstVideo = autoOpenVideo ? sorted.find((resource) => resource.forum_lesson_resource_type === 'video') : undefined
  const [open, setOpen] = useState<number | null>(firstVideo?.forum_lesson_resource_id ?? null)
  const [busy, setBusy] = useState<number | null>(null)
  const [confirm, setConfirm] = useState<ForumLessonResource | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function openFile(resource: ForumLessonResource, download: boolean) {
    setBusy(resource.forum_lesson_resource_id)
    setError(null)
    try {
      const blob = await fetchLessonResource(resource.forum_lesson_resource_id, { download })
      const url = URL.createObjectURL(blob)
      if (download) {
        const link = document.createElement('a')
        link.href = url
        link.download = downloadName(resource.forum_lesson_resource_title, resource.forum_lesson_resource_mime_type)
        link.click()
      } else if (!window.open(url, '_blank')) {
        setError('El navegador bloqueó la pestaña nueva. Permite las ventanas emergentes para este sitio e inténtalo de nuevo.')
      }
      setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch (failure) {
      const parsed = toApiError(failure)
      setError(parsed.status === 403 ? 'No tienes permiso para abrir o descargar este recurso.' : parsed.message)
    } finally {
      setBusy(null)
    }
  }

  async function remove(resource: ForumLessonResource) {
    setConfirm(null)
    setBusy(resource.forum_lesson_resource_id)
    setError(null)
    try {
      await deleteLessonResource(resource.forum_lesson_resource_id)
      if (open === resource.forum_lesson_resource_id) setOpen(null)
      onDeleted?.(resource.forum_lesson_resource_id)
    } catch (failure) {
      setError(toApiError(failure).message)
    } finally {
      setBusy(null)
    }
  }

  if (sorted.length === 0) return null

  return (
    <div className="resource-list">
      {error && <p className="auth-error" role="alert">{error}</p>}
      <ul>
        {sorted.map((resource) => {
          const id = resource.forum_lesson_resource_id
          const type = resource.forum_lesson_resource_type
          const viewable = VIEWABLE.includes(type)
          const isOpen = open === id
          return (
            <li key={id} className={isOpen ? 'is-open' : ''}>
              <div className="resource-list__row">
                <span className="resource-list__icon" aria-hidden="true">{ICONS[type]}</span>
                <div className="resource-list__info">
                  <strong>{resource.forum_lesson_resource_title}</strong>
                  <span className="muted">{RESOURCE_RULES[type]?.label ?? type} · {formatBytes(resource.forum_lesson_resource_size_bytes)}</span>
                </div>
                {resource.forum_lesson_resource_is_downloadable && <Badge variant="success" className="resource-list__badge">Descargable</Badge>}
                <div className="resource-list__actions">
                  {viewable && <Button size="sm" variant={isOpen ? 'primary' : 'primary--outline'} aria-expanded={isOpen}
                    onClick={() => setOpen(isOpen ? null : id)}>{isOpen ? 'Ocultar' : type === 'video' ? 'Reproducir' : 'Ver'}</Button>}
                  {!viewable && <Button size="sm" variant="primary--outline" loading={busy === id} disabled={busy !== null}
                    onClick={() => void openFile(resource, false)}>Abrir</Button>}
                  {resource.forum_lesson_resource_is_downloadable && <Button size="sm" variant="default" disabled={busy !== null}
                    onClick={() => void openFile(resource, true)}>Descargar</Button>}
                  {canDelete && <Button size="sm" variant="danger--outline" loading={busy === id} disabled={busy !== null}
                    onClick={() => setConfirm(resource)}>Eliminar</Button>}
                </div>
              </div>
              {isOpen && <div className="resource-viewer">
                {type === 'video' && <VideoPlayer resource={resource} tracking={videoTracking?.resourceId === id ? videoTracking : undefined} />}
                {type === 'pdf' && <PdfViewer resource={resource} />}
                {type === 'image' && <ImageViewer resource={resource} />}
              </div>}
            </li>
          )
        })}
      </ul>
      <Dialog open={confirm !== null} typeDialog="danger" titleDialog="Eliminar recurso"
        textDialog={`¿Eliminar «${confirm?.forum_lesson_resource_title ?? ''}»? El archivo se borrará definitivamente.`}
        buttonCancelDialog="Cancelar" buttonConfirmDialog="Eliminar"
        onCancelDialog={() => setConfirm(null)} callbackDialog={() => { if (confirm) void remove(confirm) }} />
    </div>
  )
}
