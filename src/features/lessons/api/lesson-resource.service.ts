import axios from 'axios'
import { forumApi, type ApiResponse } from '../../../lib/api'
import type { ForumLessonResource, ForumLessonResourceUpload } from '../types/lesson.types'

// multipart/form-data; los archivos grandes (video hasta 100 MiB) no usan el timeout global.
export async function uploadLessonResource(lessonId: number, upload: ForumLessonResourceUpload, onProgress?: (percent: number) => void) {
  const body = new FormData()
  body.append('forum_lesson_resource_type', upload.forum_lesson_resource_type)
  body.append('forum_lesson_resource_title', upload.forum_lesson_resource_title)
  body.append('forum_lesson_resource_is_downloadable', upload.forum_lesson_resource_is_downloadable ? '1' : '0')
  body.append('file', upload.file)
  const { data } = await forumApi.post<ApiResponse<ForumLessonResource>>(`/forum/lessons/${lessonId}/resources`, body, {
    timeout: 0,
    onUploadProgress: (event) => { if (event.total) onProgress?.(Math.round((event.loaded / event.total) * 100)) },
  })
  return data.data
}

export async function deleteLessonResource(resourceId: number) {
  await forumApi.delete(`/forum/lesson-resources/${resourceId}`)
}

// Los recursos son privados: se leen con Bearer mediante el endpoint autorizado y se muestran como Blob.
export async function fetchLessonResource(resourceId: number, options: { download?: boolean; signal?: AbortSignal; onProgress?: (percent: number) => void } = {}) {
  try {
    const { data } = await forumApi.get<Blob>(`/forum/lesson-resources/${resourceId}`, {
      params: { download: options.download ? 1 : 0 },
      responseType: 'blob',
      headers: { Accept: '*/*' },
      timeout: 0,
      silentStatuses: [403],
      signal: options.signal,
      onDownloadProgress: (event) => { if (event.total) options.onProgress?.(Math.round((event.loaded / event.total) * 100)) },
    })
    return data
  } catch (error) {
    // Con responseType blob, el JSON de error llega como Blob: se convierte para leer message.
    if (axios.isAxiosError(error) && error.response?.data instanceof Blob) {
      try { error.response.data = JSON.parse(await error.response.data.text()) } catch { error.response.data = null }
    }
    throw error
  }
}
