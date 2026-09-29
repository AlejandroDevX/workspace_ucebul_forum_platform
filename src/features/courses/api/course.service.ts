import { forumApi, type ApiResponse } from '../../../lib/api'
import type { PageParams, Paginated } from '../../../lib/pagination'
import type { CourseSearchFilters, ForumCourse, ForumCoursePayload } from '../types/course.types'

// Listado de gestión: incluye borradores propios o todos con forum.courses.manage-any.
export async function listCourses(params: PageParams, signal?: AbortSignal) {
  const { data } = await forumApi.get<Paginated<ForumCourse>>('/forum/courses', { params, signal })
  return data
}

// Catálogo: único listado de cursos con filtros de búsqueda, categoría y nivel.
export async function searchCourses(filters: CourseSearchFilters, signal?: AbortSignal) {
  const { data } = await forumApi.get<Paginated<ForumCourse>>('/forum/search/courses', { params: filters, signal })
  return data
}

export async function getCourse(courseId: number, signal?: AbortSignal) {
  const { data } = await forumApi.get<ApiResponse<ForumCourse>>(`/forum/courses/${courseId}`, { signal })
  return data.data
}

export async function createCourse(payload: ForumCoursePayload) {
  const { data } = await forumApi.post<ApiResponse<ForumCourse>>('/forum/courses', payload)
  return data.data
}

export async function updateCourse(courseId: number, payload: Partial<ForumCoursePayload>) {
  const { data } = await forumApi.put<ApiResponse<ForumCourse>>(`/forum/courses/${courseId}`, payload)
  return data.data
}

export async function deleteCourse(courseId: number) {
  await forumApi.delete(`/forum/courses/${courseId}`)
}

export async function publishCourse(courseId: number) {
  const { data } = await forumApi.post<ApiResponse<ForumCourse>>(`/forum/courses/${courseId}/publish`)
  return data.data
}

export async function archiveCourse(courseId: number) {
  const { data } = await forumApi.post<ApiResponse<ForumCourse>>(`/forum/courses/${courseId}/archive`)
  return data.data
}

// multipart/form-data con el campo `cover`; Axios calcula el boundary a partir del FormData.
export async function uploadCourseCover(courseId: number, cover: File) {
  const body = new FormData()
  body.append('cover', cover)
  const { data } = await forumApi.post<ApiResponse<ForumCourse>>(`/forum/courses/${courseId}/cover`, body)
  return data.data
}
