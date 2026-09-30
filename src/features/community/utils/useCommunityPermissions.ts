import { useAuthStore } from '../../auth/store/auth.store'
import type { ForumPost, ForumTopic } from '../types/community.types'

// La API exige, además del permiso, ser autor o tener forum.community.manage-any.
export function useCommunityPermissions() {
  useAuthStore((state) => state.currentApplicationPermissions)
  const userId = useAuthStore((state) => state.user?.workspace_user_id)
  const has = useAuthStore((state) => state.hasPermission)
  const manageAny = has('forum.community.manage-any')
  const isMine = (authorId: number) => userId != null && String(authorId) === String(userId)
  const ownsTopic = (topic: ForumTopic) => manageAny || isMine(topic.forum_topic_workspace_user_id)
  const ownsPost = (post: ForumPost) => manageAny || isMine(post.forum_post_workspace_user_id)

  return {
    userId,
    isMine,
    canCreateTopic: has('forum.community.create'),
    canReply: (topic: ForumTopic) => has('forum.community.reply') && topic.forum_topic_status === 'open',
    canReact: has('forum.community.react'),
    canEditTopic: (topic: ForumTopic) => has('forum.community.update') && ownsTopic(topic),
    canDeleteTopic: (topic: ForumTopic) => has('forum.community.delete') && ownsTopic(topic),
    canAccept: (topic: ForumTopic) => has('forum.community.accept_answer') && ownsTopic(topic),
    canEditPost: (post: ForumPost) => has('forum.community.update') && ownsPost(post),
    canDeletePost: (post: ForumPost) => has('forum.community.delete') && ownsPost(post),
    // Las categorías del foro solo las gestiona quien tiene manage-any.
    canCreateCategory: manageAny && has('forum.community.create'),
    canUpdateCategory: manageAny && has('forum.community.update'),
  }
}
