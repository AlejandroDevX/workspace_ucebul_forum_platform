import { forumApi, type ApiResponse } from '../../../lib/api'
import type { Paginated } from '../../../lib/pagination'
import type { ForumTopic, ForumTopicPayload, TopicFilters, TopicSearchFilters } from '../types/community.types'

export async function listTopics(filters: TopicFilters, signal?: AbortSignal) {
  const { data } = await forumApi.get<Paginated<ForumTopic>>('/forum/topics', { params: filters, signal })
  return data
}

// Coincidencia parcial en título o cuerpo, con filtros exactos de categoría y curso.
export async function searchTopics(filters: TopicSearchFilters, signal?: AbortSignal) {
  const { data } = await forumApi.get<Paginated<ForumTopic>>('/forum/search/topics', { params: filters, signal })
  return data
}

export async function getTopic(topicId: number, signal?: AbortSignal) {
  const { data } = await forumApi.get<ApiResponse<ForumTopic>>(`/forum/topics/${topicId}`, { signal })
  return data.data
}

export async function createTopic(payload: ForumTopicPayload) {
  const { data } = await forumApi.post<ApiResponse<ForumTopic>>('/forum/topics', payload)
  return data.data
}

export async function updateTopic(topicId: number, payload: Partial<ForumTopicPayload>) {
  const { data } = await forumApi.put<ApiResponse<ForumTopic>>(`/forum/topics/${topicId}`, payload)
  return data.data
}

export async function deleteTopic(topicId: number) {
  await forumApi.delete(`/forum/topics/${topicId}`)
}

export async function acceptAnswer(topicId: number, postId: number) {
  const { data } = await forumApi.post<ApiResponse<ForumTopic>>(`/forum/topics/${topicId}/accept-answer`, { forum_post_id: postId })
  return data.data
}

export async function closeTopic(topicId: number) {
  const { data } = await forumApi.post<ApiResponse<ForumTopic>>(`/forum/topics/${topicId}/close`)
  return data.data
}

export async function reopenTopic(topicId: number) {
  const { data } = await forumApi.post<ApiResponse<ForumTopic>>(`/forum/topics/${topicId}/reopen`)
  return data.data
}
