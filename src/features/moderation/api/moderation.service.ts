import { forumApi, type ApiResponse } from '../../../lib/api'
import type { ForumPost, ForumTopic } from '../../community/types/community.types'

// forum.moderation.manage; no exige autoría. Tema: open/closed → hidden y hidden → open.
export async function hideTopic(topicId: number) {
  const { data } = await forumApi.post<ApiResponse<ForumTopic>>(`/forum/topics/${topicId}/hide`)
  return data.data
}

export async function restoreTopic(topicId: number) {
  const { data } = await forumApi.post<ApiResponse<ForumTopic>>(`/forum/topics/${topicId}/restore`)
  return data.data
}

// Respuesta: published → hidden y hidden → published. Devuelve campos básicos, sin conteos ni user_reaction.
export async function hidePost(postId: number) {
  const { data } = await forumApi.post<ApiResponse<ForumPost>>(`/forum/posts/${postId}/hide`)
  return data.data
}

export async function restorePost(postId: number) {
  const { data } = await forumApi.post<ApiResponse<ForumPost>>(`/forum/posts/${postId}/restore`)
  return data.data
}
