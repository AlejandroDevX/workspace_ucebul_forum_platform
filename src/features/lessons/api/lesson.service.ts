import { forumApi, type ApiResponse } from '../../../lib/api'
import type { PageParams, Paginated } from '../../../lib/pagination'
import type { ForumLesson, ForumLessonPayload } from '../types/lesson.types'

export async function listCourseLessons(courseId: number, params: PageParams, signal?: AbortSignal) {
  const { data } = await forumApi.get<Paginated<ForumLesson>>(`/forum/courses/${courseId}/lessons`, { params, signal })
  return data
}

// La navegación y el reordenamiento necesitan todas las lecciones: recorre las páginas con el máximo (100).
export async function listAllCourseLessons(courseId: number, signal?: AbortSignal) {
  const lessons: ForumLesson[] = []
  for (let page = 1; ; page += 1) {
    const result = await listCourseLessons(courseId, { page, per_page: 100 }, signal)
    lessons.push(...result.data)
    if (page >= result.meta.last_page) return lessons
  }
}

export async function getLesson(lessonId: number, signal?: AbortSignal) {
  // 403 = lección reservada a inscritos; la página muestra su propio aviso.
  const { data } = await forumApi.get<ApiResponse<ForumLesson>>(`/forum/lessons/${lessonId}`, { signal, silentStatuses: [403] })
  return data.data
}

export async function createLesson(courseId: number, payload: ForumLessonPayload) {
  const { data } = await forumApi.post<ApiResponse<ForumLesson>>(`/forum/courses/${courseId}/lessons`, payload)
  return data.data
}

export async function updateLesson(lessonId: number, payload: Partial<ForumLessonPayload>) {
  const { data } = await forumApi.put<ApiResponse<ForumLesson>>(`/forum/lessons/${lessonId}`, payload)
  return data.data
}

export async function deleteLesson(lessonId: number) {
  await forumApi.delete(`/forum/lessons/${lessonId}`)
}

export async function publishLesson(lessonId: number) {
  const { data } = await forumApi.post<ApiResponse<ForumLesson>>(`/forum/lessons/${lessonId}/publish`)
  return data.data
}

// Debe enviar exactamente todos los IDs del curso, en el nuevo orden.
export async function reorderLessons(courseId: number, lessonIds: number[]) {
  const { data } = await forumApi.put<ApiResponse<ForumLesson[]>>(`/forum/courses/${courseId}/lessons/reorder`, { forum_lesson_ids: lessonIds })
  return data.data
}
