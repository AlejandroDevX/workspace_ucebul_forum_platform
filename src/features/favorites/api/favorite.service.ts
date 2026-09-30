import axios from 'axios'
import { forumApi, type ApiResponse } from '../../../lib/api'
import type { PageParams, Paginated } from '../../../lib/pagination'
import type { FavoriteKind, ForumCourseFavorite, ForumTopicFavorite } from '../types/favorite.types'

// Las rutas usan el ID del destino (curso o tema), no el ID del favorito. La identidad sale del token.
const PATHS: Record<FavoriteKind, string> = { course: '/forum/favorites/courses', topic: '/forum/favorites/topics' }

export async function listCourseFavorites(params: PageParams, signal?: AbortSignal) {
  const { data } = await forumApi.get<Paginated<ForumCourseFavorite>>(PATHS.course, { params, signal })
  return data
}

export async function listTopicFavorites(params: PageParams, signal?: AbortSignal) {
  const { data } = await forumApi.get<Paginated<ForumTopicFavorite>>(PATHS.topic, { params, signal })
  return data
}

// No existe un endpoint «¿es favorito?»: se recorren todas las páginas (máx. 100) y se guardan los IDs de destino.
export async function listFavoriteTargetIds(kind: FavoriteKind, signal?: AbortSignal) {
  const ids: number[] = []
  for (let page = 1; ; page += 1) {
    if (kind === 'course') {
      const result = await listCourseFavorites({ page, per_page: 100 }, signal)
      ids.push(...result.data.map((favorite) => favorite.forum_course_favorite_course_id))
      if (page >= result.meta.last_page) return ids
    } else {
      const result = await listTopicFavorites({ page, per_page: 100 }, signal)
      ids.push(...result.data.map((favorite) => favorite.forum_topic_favorite_topic_id))
      if (page >= result.meta.last_page) return ids
    }
  }
}

// 201 al crear, 200 si ya existía: en ambos casos devuelve el favorito.
export async function addCourseFavorite(courseId: number) {
  const { data } = await forumApi.post<ApiResponse<ForumCourseFavorite>>(`${PATHS.course}/${courseId}`)
  return data.data
}

export async function addTopicFavorite(topicId: number) {
  const { data } = await forumApi.post<ApiResponse<ForumTopicFavorite>>(`${PATHS.topic}/${topicId}`)
  return data.data
}

// 200 con data null. 404 = el favorito ya no existía: el resultado final es el mismo.
async function removeFavorite(kind: FavoriteKind, targetId: number) {
  try {
    await forumApi.delete(`${PATHS[kind]}/${targetId}`)
  } catch (failure) {
    if (!(axios.isAxiosError(failure) && failure.response?.status === 404)) throw failure
  }
}

export const removeCourseFavorite = (courseId: number) => removeFavorite('course', courseId)
export const removeTopicFavorite = (topicId: number) => removeFavorite('topic', topicId)
