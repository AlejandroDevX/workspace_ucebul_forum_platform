import type { ForumTopic, ForumTopicPayload } from '../types/community.types'

// PUT parcial: la API valida categoría activa y curso visible solo si se envían.
export function changedFields(topic: ForumTopic, payload: ForumTopicPayload): Partial<ForumTopicPayload> {
  const changes: Partial<ForumTopicPayload> = {}
  if (payload.forum_topic_title !== topic.forum_topic_title) changes.forum_topic_title = payload.forum_topic_title
  if (payload.forum_topic_body !== topic.forum_topic_body) changes.forum_topic_body = payload.forum_topic_body
  if (payload.forum_topic_category_id !== topic.forum_topic_category_id) changes.forum_topic_category_id = payload.forum_topic_category_id
  if (payload.forum_topic_course_id !== topic.forum_topic_course_id) changes.forum_topic_course_id = payload.forum_topic_course_id
  return changes
}
