import { DataIcons } from 'ucebul_mui'
import type { ForumLessonResource } from '../types/lesson.types'
import { useResourceBlob } from '../utils/useResourceBlob'
import ResourceLoadState from './ResourceLoadState'

export default function PdfViewer({ resource }: { resource: ForumLessonResource }) {
  const { url, loading, error, progress, reload } = useResourceBlob(resource.forum_lesson_resource_id)
  if (!url) return <ResourceLoadState loading={loading} error={error} progress={progress} onRetry={reload} />
  return (
    <div className="pdf-viewer">
      <iframe src={url} title={`PDF: ${resource.forum_lesson_resource_title}`} />
      <a className="text-link" href={url} target="_blank" rel="noopener">
        Abrir en una pestaña nueva <span aria-hidden="true">{DataIcons.global.externalLinkOutline}</span>
      </a>
    </div>
  )
}
