import type { ForumLesson, ForumLessonPayload } from '../types/lesson.types'

// Convierte los valores de Form (indexados por name) al DTO que espera Laravel.
export function toLessonPayload(values: Record<string, unknown>, slug: string, isPreview: boolean): ForumLessonPayload {
  const body = typeof values.forum_lesson_body === 'string' ? values.forum_lesson_body.trim() : ''
  const duration = String(values.forum_lesson_duration_minutes ?? '').trim()
  return {
    forum_lesson_title: String(values.forum_lesson_title ?? '').trim(),
    forum_lesson_slug: slug.trim(),
    forum_lesson_body: body || null,
    forum_lesson_duration_minutes: duration ? Number(duration) : 0,
    forum_lesson_is_preview: isPreview,
  }
}

export function sortLessons(lessons: ForumLesson[]) {
  return [...lessons].sort((a, b) => a.forum_lesson_position - b.forum_lesson_position || a.forum_lesson_id - b.forum_lesson_id)
}

// IDs de todas las lecciones con `lessonId` movida a la posición `position` (base 1).
export function moveLesson(ids: number[], lessonId: number, position: number) {
  const rest = ids.filter((id) => id !== lessonId)
  const index = Math.min(Math.max(position - 1, 0), rest.length)
  return [...rest.slice(0, index), lessonId, ...rest.slice(index)]
}
