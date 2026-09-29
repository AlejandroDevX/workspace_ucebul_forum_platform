import { forumApi, type ApiResponse } from '../../../lib/api'
import type { PageParams, Paginated } from '../../../lib/pagination'
import type { ForumCourseCategory, ForumCourseCategoryPayload } from '../types/course.types'

export async function listCourseCategories(params: PageParams, signal?: AbortSignal) {
  const { data } = await forumApi.get<Paginated<ForumCourseCategory>>('/forum/course-categories', { params, signal })
  return data
}

// Para selects: recorre todas las páginas con el máximo permitido (100).
export async function listAllCourseCategories(signal?: AbortSignal) {
  const categories: ForumCourseCategory[] = []
  for (let page = 1; ; page += 1) {
    const result = await listCourseCategories({ page, per_page: 100 }, signal)
    categories.push(...result.data)
    if (page >= result.meta.last_page) return categories
  }
}

export async function createCourseCategory(payload: ForumCourseCategoryPayload) {
  const { data } = await forumApi.post<ApiResponse<ForumCourseCategory>>('/forum/course-categories', payload)
  return data.data
}

export async function updateCourseCategory(categoryId: number, payload: Partial<ForumCourseCategoryPayload>) {
  const { data } = await forumApi.put<ApiResponse<ForumCourseCategory>>(`/forum/course-categories/${categoryId}`, payload)
  return data.data
}
