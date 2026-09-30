import { forumApi, type ApiResponse } from '../../../lib/api'
import type { Paginated } from '../../../lib/pagination'
import type { ForumPost, ForumPostPayload, ForumReaction, ForumReactionType } from '../types/community.types'

// Sin parent lista solo respuestas raíz; con parent, las hijas directas.
export async function listPosts(topicId: number, params: { page?: number; per_page?: number; forum_post_parent_id?: number }, signal?: AbortSignal) {
  const { data } = await forumApi.get<Paginated<ForumPost>>(`/forum/topics/${topicId}/posts`, { params, signal })
  return data
}

export async function listAllReplies(topicId: number, parentId: number, signal?: AbortSignal) {
  const replies: ForumPost[] = []
  for (let page = 1; ; page += 1) {
    const result = await listPosts(topicId, { page, per_page: 100, forum_post_parent_id: parentId }, signal)
    replies.push(...result.data)
    if (page >= result.meta.last_page) return replies
  }
}

export async function createPost(topicId: number, payload: ForumPostPayload) {
  const { data } = await forumApi.post<ApiResponse<ForumPost>>(`/forum/topics/${topicId}/posts`, payload)
  return data.data
}

export async function updatePost(postId: number, payload: Partial<ForumPostPayload>) {
  const { data } = await forumApi.put<ApiResponse<ForumPost>>(`/forum/posts/${postId}`, payload)
  return data.data
}

export async function deletePost(postId: number) {
  await forumApi.delete(`/forum/posts/${postId}`)
}

// Una reacción por usuario y respuesta: repetir cambia el tipo.
export async function reactToPost(postId: number, type: ForumReactionType) {
  const { data } = await forumApi.post<ApiResponse<ForumReaction>>(`/forum/posts/${postId}/reaction`, { forum_reaction_type: type })
  return data.data
}

export async function removeReaction(postId: number) {
  await forumApi.delete(`/forum/posts/${postId}/reaction`)
}
