import type { ForumCoursePayload } from '../types/course.types'

export const COVER_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const COVER_MAX_BYTES = 5120 * 1024

const nullableText = (value: unknown) => {
  const text = typeof value === 'string' ? value.trim() : ''
  return text ? text : null
}

// Convierte los valores de Form (indexados por name) al DTO que espera Laravel.
export function toCoursePayload(values: Record<string, unknown>, slug: string, level: string | number): ForumCoursePayload {
  const duration = String(values.forum_course_duration_minutes ?? '').trim()
  return {
    forum_course_category_id: Number(values.forum_course_category_id),
    forum_course_title: String(values.forum_course_title ?? '').trim(),
    forum_course_slug: slug.trim(),
    forum_course_summary: nullableText(values.forum_course_summary),
    forum_course_description: nullableText(values.forum_course_description),
    forum_course_level: level === '' ? null : String(level),
    forum_course_duration_minutes: duration ? Number(duration) : 0,
  }
}

export function coverProblem(file: File) {
  if (!COVER_TYPES.includes(file.type)) return 'La portada debe ser una imagen JPG, PNG o WebP.'
  if (file.size > COVER_MAX_BYTES) return 'La portada no puede superar 5 MB.'
  return null
}
