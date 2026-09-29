import { forumApi, type ApiResponse } from '../../../lib/api'
import type { PageParams, Paginated } from '../../../lib/pagination'
import type { CourseProgressWithLessons, CourseProgressWithNext, ForumEnrollment, LessonProgressWithCourse } from '../types/learning.types'

// La identidad sale del token: ningún endpoint recibe workspace_user_id.

export async function listMyCourses(params: PageParams, signal?: AbortSignal) {
  const { data } = await forumApi.get<Paginated<ForumEnrollment>>('/forum/my-courses', { params, signal })
  return data
}

export async function listAllMyCourses(signal?: AbortSignal) {
  const enrollments: ForumEnrollment[] = []
  for (let page = 1; ; page += 1) {
    const result = await listMyCourses({ page, per_page: 100 }, signal)
    enrollments.push(...result.data)
    if (page >= result.meta.last_page) return enrollments
  }
}

export async function enrollInCourse(courseId: number) {
  const { data } = await forumApi.post<ApiResponse<ForumEnrollment>>(`/forum/courses/${courseId}/enroll`)
  return data.data
}

// 403 significa "sin inscripción": es un estado esperado de la pantalla, no un error global.
export async function getCourseProgress(courseId: number, signal?: AbortSignal) {
  const { data } = await forumApi.get<ApiResponse<CourseProgressWithLessons>>(`/forum/courses/${courseId}/progress`, { signal, silentStatuses: [403] })
  return data.data
}

export async function getContinueLesson(courseId: number, signal?: AbortSignal) {
  const { data } = await forumApi.get<ApiResponse<CourseProgressWithNext>>(`/forum/courses/${courseId}/continue`, { signal })
  return data.data
}

export async function saveLessonPosition(lessonId: number, seconds: number) {
  const { data } = await forumApi.put<ApiResponse<LessonProgressWithCourse>>(`/forum/lessons/${lessonId}/progress`, {
    forum_lesson_progress_last_position_seconds: Math.max(0, Math.floor(seconds)),
  })
  return data.data
}

export async function completeLesson(lessonId: number) {
  const { data } = await forumApi.post<ApiResponse<LessonProgressWithCourse>>(`/forum/lessons/${lessonId}/complete`)
  return data.data
}
