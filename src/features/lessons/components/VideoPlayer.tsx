import type { SyntheticEvent } from 'react'
import type { ForumLessonResource } from '../types/lesson.types'
import { useResourceBlob } from '../utils/useResourceBlob'
import ResourceLoadState from './ResourceLoadState'

type VideoEvent = (event: SyntheticEvent<HTMLVideoElement>) => void

export interface VideoTracking {
  resourceId: number
  // Última posición confirmada por la API, en segundos.
  startAt: number
  handlers: { onTimeUpdate: VideoEvent; onPause: VideoEvent; onEnded: VideoEvent }
}

export default function VideoPlayer({ resource, tracking }: { resource: ForumLessonResource; tracking?: VideoTracking }) {
  const { url, loading, error, progress, reload } = useResourceBlob(resource.forum_lesson_resource_id)
  if (!url) return <ResourceLoadState loading={loading} error={error} progress={progress} onRetry={reload} />

  function resume(event: SyntheticEvent<HTMLVideoElement>) {
    const video = event.currentTarget
    // Retoma donde quedó, salvo que esté a punto de terminar.
    if (tracking && tracking.startAt > 0 && tracking.startAt < video.duration - 5) video.currentTime = tracking.startAt
  }

  return (
    <video className="video-player" controls preload="metadata" src={url}
      controlsList={resource.forum_lesson_resource_is_downloadable ? undefined : 'nodownload'}
      aria-label={resource.forum_lesson_resource_title}
      onLoadedMetadata={resume} {...tracking?.handlers}>
      Tu navegador no puede reproducir este video.
    </video>
  )
}
