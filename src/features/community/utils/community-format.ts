import { type WorkspaceUserSummary, workspaceUserName } from '../../../lib/workspace-user'
import type { ForumPost, ForumReaction } from '../types/community.types'

// El nombre llega de Workspace en el resumen del usuario; si falta, se muestra el ID.
export function authorLabel(authorId: number, isMine: (id: number) => boolean, summary?: WorkspaceUserSummary | null) {
  if (isMine(authorId)) return 'Tú'
  return workspaceUserName(summary) ?? `Usuario #${authorId}`
}

export function formatDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('es-CO', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function wasEdited(created: string, updated: string) {
  return new Date(updated).getTime() - new Date(created).getTime() > 60_000
}

// La API de reacciones devuelve solo la reacción confirmada, no los conteos. Los conteos se derivan
// del estado previo y del resultado confirmado (reacción nueva o null si se retiró).
export function applyReaction(post: ForumPost, confirmed: ForumReaction | null): ForumPost {
  const previous = post.user_reaction?.forum_reaction_type ?? null
  const next = confirmed?.forum_reaction_type ?? null
  let up = post.forum_post_upvotes_count ?? 0
  let down = post.forum_post_downvotes_count ?? 0
  if (previous === 'upvote') up -= 1
  if (previous === 'downvote') down -= 1
  if (next === 'upvote') up += 1
  if (next === 'downvote') down += 1
  return { ...post, user_reaction: confirmed, forum_post_upvotes_count: Math.max(0, up), forum_post_downvotes_count: Math.max(0, down) }
}

export function mergePosts(current: ForumPost[], incoming: ForumPost[]) {
  const seen = new Set(current.map((post) => post.forum_post_id))
  return [...current, ...incoming.filter((post) => !seen.has(post.forum_post_id))]
}
