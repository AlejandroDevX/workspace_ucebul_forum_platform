import { useRequest } from '../../../lib/useRequest'
import { getCourseProgress } from '../api/learning.service'
import type { CourseProgressSummary, CourseProgressWithLessons, LessonProgressWithCourse } from '../types/learning.types'

export type EnrollmentStatus = 'idle' | 'loading' | 'enrolled' | 'not-enrolled' | 'unavailable' | 'error'

// No existe un endpoint "¿estoy inscrito?": el progreso responde 403 sin inscripción y 404 si el curso no está publicado.
export function useCourseEnrollment(courseId: number, enabled: boolean) {
  const request = useRequest(enabled ? `course-progress-${courseId}` : null, (signal) => getCourseProgress(courseId, signal))
  let status: EnrollmentStatus = 'idle'
  if (enabled) {
    if (request.loading) status = 'loading'
    else if (request.error?.status === 403) status = 'not-enrolled'
    else if (request.error?.status === 404) status = 'unavailable'
    else if (request.error) status = 'error'
    else if (request.data) status = 'enrolled'
    else status = 'loading'
  }

  // Aplica un resumen confirmado por la API (inscripción, avance o lección completada).
  function applySummary(summary: CourseProgressSummary, lessonProgress?: CourseProgressWithLessons['lessons'][number]['progress']) {
    request.setData((current) => {
      const base = current ?? { ...summary, lessons: [] }
      return {
        ...base,
        ...summary,
        lessons: lessonProgress
          ? base.lessons.map((lesson) => lesson.forum_lesson_id === lessonProgress.forum_lesson_progress_lesson_id ? { ...lesson, progress: lessonProgress } : lesson)
          : base.lessons,
      }
    })
  }

  return { status, progress: request.data, error: request.error, reload: request.reload, applySummary }
}

export function completedLessonIds(progress: CourseProgressWithLessons | undefined) {
  if (!progress) return undefined
  return new Set(progress.lessons.filter((lesson) => lesson.progress?.forum_lesson_progress_is_completed).map((lesson) => lesson.forum_lesson_id))
}

// Separa el progreso de la lección del resumen del curso que acompaña a la respuesta.
export function splitLessonProgress(result: LessonProgressWithCourse) {
  const { course, ...lessonProgress } = result
  return { course, lessonProgress }
}
