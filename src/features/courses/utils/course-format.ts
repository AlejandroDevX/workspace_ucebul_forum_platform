import type { FormOption } from 'ucebul_mui'
import type { ForumCourse, ForumCourseStatus } from '../types/course.types'

// forum_course_level es texto libre (máx. 50); el formulario ofrece estos valores.
export const COURSE_LEVELS = ['Básico', 'Intermedio', 'Avanzado'] as const

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
export const MAX_DURATION_MINUTES = 4_294_967_295

export const STATUS_LABELS: Record<ForumCourseStatus, string> = {
  draft: 'Borrador',
  published: 'Publicado',
  archived: 'Archivado',
}

export const STATUS_VARIANTS: Record<ForumCourseStatus, 'default' | 'success' | 'warning'> = {
  draft: 'warning',
  published: 'success',
  archived: 'default',
}

export function levelOptions(current?: string | null): FormOption[] {
  const levels: string[] = [...COURSE_LEVELS]
  if (current && !levels.includes(current)) levels.push(current)
  return levels.map((level) => ({ label: level, value: level }))
}

export function slugify(value: string, maxLength = 190) {
  return value
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, maxLength)
    .replace(/-+$/g, '')
}

export function formatDuration(minutes: number) {
  if (!minutes) return 'Duración por definir'
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (!hours) return `${rest} min`
  return rest ? `${hours} h ${rest} min` : `${hours} h`
}

export function formatDate(value: string | null) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function categoryName(course: ForumCourse) {
  return course.category?.forum_course_category_name ?? null
}
