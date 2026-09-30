import { Image } from 'ucebul_mui'
import type { ForumLessonResource } from '../types/lesson.types'
import { useResourceBlob } from '../utils/useResourceBlob'
import ResourceLoadState from './ResourceLoadState'

export default function ImageViewer({ resource }: { resource: ForumLessonResource }) {
  const { url, loading, error, progress, reload } = useResourceBlob(resource.forum_lesson_resource_id)
  if (!url) return <ResourceLoadState loading={loading} error={error} progress={progress} onRetry={reload} />
  return <div className="image-viewer"><Image src={url} alt={resource.forum_lesson_resource_title} /></div>
}
