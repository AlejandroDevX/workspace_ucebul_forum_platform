import { forumApi, type ApiResponse } from '../../../lib/api'
import type { PageParams, Paginated } from '../../../lib/pagination'
import type { ForumCategory, ForumCategoryPayload } from '../types/community.types'

export async function listForumCategories(params: PageParams, signal?: AbortSignal) {
  const { data } = await forumApi.get<Paginated<ForumCategory>>('/forum/categories', { params, signal })
  return data
}

export async function listAllForumCategories(signal?: AbortSignal) {
  const categories: ForumCategory[] = []
  for (let page = 1; ; page += 1) {
    const result = await listForumCategories({ page, per_page: 100 }, signal)
    categories.push(...result.data)
    if (page >= result.meta.last_page) return categories
  }
}

// Crear y editar exigen además forum.community.manage-any.
export async function createForumCategory(payload: ForumCategoryPayload) {
  const { data } = await forumApi.post<ApiResponse<ForumCategory>>('/forum/categories', payload)
  return data.data
}

export async function updateForumCategory(categoryId: number, payload: Partial<ForumCategoryPayload>) {
  const { data } = await forumApi.put<ApiResponse<ForumCategory>>(`/forum/categories/${categoryId}`, payload)
  return data.data
}
