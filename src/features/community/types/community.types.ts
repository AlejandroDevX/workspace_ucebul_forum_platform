import type { WorkspaceUserSummary } from '../../../lib/workspace-user'

export interface ForumCategory {
  forum_category_id: number
  forum_category_name: string
  forum_category_slug: string
  forum_category_description: string | null
  forum_category_is_active: boolean
  forum_category_created_at: string
  forum_category_updated_at: string
}

export type ForumTopicStatus = 'open' | 'closed' | 'hidden'
export type ForumPostStatus = 'published' | 'hidden'
export type ForumReactionType = 'upvote' | 'downvote'

export interface ForumReaction {
  forum_reaction_id: number
  forum_reaction_post_id: number
  forum_reaction_workspace_user_id: number
  forum_reaction_type: ForumReactionType
  forum_reaction_created_at: string
  forum_reaction_updated_at: string
}

export interface ForumPost {
  forum_post_id: number
  forum_post_topic_id: number
  forum_post_parent_id: number | null
  forum_post_workspace_user_id: number
  forum_post_workspace_user?: WorkspaceUserSummary | null
  forum_post_body: string
  forum_post_status: ForumPostStatus
  forum_post_created_at: string
  forum_post_updated_at: string
  // Presentes en listados, creación y edición; no en accepted_post.
  forum_post_replies_count?: number
  forum_post_upvotes_count?: number
  forum_post_downvotes_count?: number
  user_reaction?: ForumReaction | null
}

export interface ForumTopicCourse {
  forum_course_id: number
  forum_course_title: string
  forum_course_slug: string
}

export interface ForumTopic {
  forum_topic_id: number
  forum_topic_category_id: number
  forum_topic_course_id: number | null
  forum_topic_workspace_user_id: number
  forum_topic_workspace_user?: WorkspaceUserSummary | null
  forum_topic_title: string
  forum_topic_body: string
  forum_topic_status: ForumTopicStatus
  forum_topic_accepted_post_id: number | null
  forum_topic_created_at: string
  forum_topic_updated_at: string
  category?: ForumCategory
  course?: ForumTopicCourse | null
  forum_topic_posts_count?: number
  // Solo en el detalle y en las transiciones del tema.
  accepted_post?: ForumPost | null
}

// La identidad del autor sale del token: nunca se envía workspace_user_id.
export interface ForumTopicPayload {
  forum_topic_category_id: number
  forum_topic_course_id: number | null
  forum_topic_title: string
  forum_topic_body: string
}

export interface ForumPostPayload {
  forum_post_body: string
  forum_post_parent_id?: number | null
}

export interface ForumCategoryPayload {
  forum_category_name: string
  forum_category_slug: string
  forum_category_description: string | null
  forum_category_is_active: boolean
}

export interface TopicFilters {
  page?: number
  per_page?: number
  forum_topic_category_id?: number
  forum_topic_course_id?: number
  forum_topic_status?: ForumTopicStatus
}

// GET /forum/search/topics: sin filtro de estado; search vacío se omite.
export interface TopicSearchFilters {
  page?: number
  per_page?: number
  search?: string
  forum_topic_category_id?: number
  forum_topic_course_id?: number
}
