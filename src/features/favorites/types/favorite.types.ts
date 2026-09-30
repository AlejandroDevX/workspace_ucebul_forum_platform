import type { ForumTopic } from '../../community/types/community.types'
import type { ForumCourse } from '../../courses/types/course.types'

export interface ForumCourseFavorite {
  forum_course_favorite_id: number
  forum_course_favorite_course_id: number
  forum_course_favorite_workspace_user_id: number
  forum_course_favorite_created_at: string | null
  // Curso con category; el listado solo incluye destinos visibles y no eliminados.
  course: ForumCourse | null
}

export interface ForumTopicFavorite {
  forum_topic_favorite_id: number
  forum_topic_favorite_topic_id: number
  forum_topic_favorite_workspace_user_id: number
  forum_topic_favorite_created_at: string | null
  // Tema con category y course; sin conteo de respuestas ni accepted_post.
  topic: ForumTopic | null
}

export type FavoriteKind = 'course' | 'topic'
