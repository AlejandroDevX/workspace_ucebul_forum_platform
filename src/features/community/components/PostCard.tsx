import { useState } from 'react'
import { Badge, Button, Card, CardBody, Dialog, Spinner } from 'ucebul_mui'
import { toApiError } from '../../../lib/api-error'
import { deletePost, listAllReplies } from '../api/post.service'
import type { ForumPost, ForumTopic } from '../types/community.types'
import { authorLabel, formatDateTime, mergePosts, wasEdited } from '../utils/community-format'
import { useCommunityPermissions } from '../utils/useCommunityPermissions'
import AcceptedAnswerBadge from './AcceptedAnswerBadge'
import ReactionButtons from './ReactionButtons'
import ReplyForm from './ReplyForm'
import ContentVisibilityButton from '../../moderation/components/ContentVisibilityButton'
import ReportButton from '../../moderation/components/ReportButton'

// A partir de este nivel las respuestas ya no se indentan (evita anidamiento excesivo en móvil).
const MAX_INDENT_DEPTH = 2

interface Props {
  post: ForumPost
  topic: ForumTopic
  depth?: number
  onChange: (post: ForumPost) => void
  onDeleted: (postId: number) => void
  onAccept: (postId: number) => Promise<void>
}

export default function PostCard({ post, topic, depth = 0, onChange, onDeleted, onAccept }: Props) {
  const permissions = useCommunityPermissions()
  const [mode, setMode] = useState<'view' | 'reply' | 'edit'>('view')
  const [replies, setReplies] = useState<ForumPost[] | null>(null)
  const [showReplies, setShowReplies] = useState(false)
  const [loadingReplies, setLoadingReplies] = useState(false)
  const [busy, setBusy] = useState<'delete' | 'accept' | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const id = post.forum_post_id
  const accepted = topic.forum_topic_accepted_post_id === id
  const repliesCount = post.forum_post_replies_count ?? 0
  const mine = permissions.isMine(post.forum_post_workspace_user_id)

  async function loadReplies() {
    setLoadingReplies(true)
    setError(null)
    try {
      const loaded = await listAllReplies(topic.forum_topic_id, id)
      setReplies(loaded)
      setShowReplies(true)
      return loaded
    } catch (failure) {
      setError(`No se pudieron cargar las respuestas: ${toApiError(failure).message}`)
      return null
    } finally {
      setLoadingReplies(false)
    }
  }

  async function onReplySaved(reply: ForumPost) {
    setMode('view')
    onChange({ ...post, forum_post_replies_count: repliesCount + 1 })
    // Si aún no se cargaron las hijas, se cargan desde la API (ya incluyen la nueva respuesta).
    if (replies === null) await loadReplies()
    else {
      setReplies(mergePosts(replies, [reply]))
      setShowReplies(true)
    }
  }

  async function remove() {
    setConfirmDelete(false)
    setBusy('delete')
    setError(null)
    try {
      await deletePost(id)
      onDeleted(id)
    } catch (failure) {
      setError(toApiError(failure).message)
      setBusy(null)
    }
  }

  async function accept() {
    setBusy('accept')
    setError(null)
    try {
      await onAccept(id)
    } catch (failure) {
      setError(toApiError(failure).message)
    } finally {
      setBusy(null)
    }
  }

  const canAccept = permissions.canAccept(topic) && !accepted && post.forum_post_status === 'published' && topic.forum_topic_status !== 'hidden'

  return (
    <li className={`post-item post-item--depth-${Math.min(depth, MAX_INDENT_DEPTH)}`} id={`post-${id}`}>
      <Card className={`post-card ${accepted ? 'post-card--accepted' : ''} ${mine ? 'post-card--mine' : ''}`}>
        <CardBody>
          <header className="post-card__header">
            <span className="post-card__author">{authorLabel(post.forum_post_workspace_user_id, permissions.isMine, post.forum_post_workspace_user)}</span>
            <time dateTime={post.forum_post_created_at}>{formatDateTime(post.forum_post_created_at)}</time>
            {wasEdited(post.forum_post_created_at, post.forum_post_updated_at) && <span className="muted">(editada)</span>}
            {accepted && <AcceptedAnswerBadge />}
            {post.forum_post_status === 'hidden' && <Badge variant="warning">Oculta por moderación</Badge>}
          </header>

          {mode === 'edit'
            ? <ReplyForm topicId={topic.forum_topic_id} post={post} label="Editar respuesta" submitLabel="Guardar cambios"
                onSaved={(saved) => { onChange({ ...post, ...saved }); setMode('view') }} onCancel={() => setMode('view')} />
            : <div className="post-card__body">{post.forum_post_body}</div>}

          {mode !== 'edit' && <footer className="post-card__footer">
            <ReactionButtons post={post} canReact={permissions.canReact} onChange={onChange} />
            <div className="post-card__actions">
              {permissions.canReply(topic) && <Button size="sm" variant="default" aria-expanded={mode === 'reply'}
                onClick={() => setMode(mode === 'reply' ? 'view' : 'reply')}>Responder</Button>}
              {canAccept && <Button size="sm" variant="primary--outline" loading={busy === 'accept'} disabled={busy !== null}
                onClick={() => void accept()}>{topic.forum_topic_accepted_post_id ? 'Aceptar esta en su lugar' : 'Aceptar como solución'}</Button>}
              {permissions.canEditPost(post) && <Button size="sm" variant="default" disabled={busy !== null} onClick={() => setMode('edit')}>Editar</Button>}
              {permissions.canDeletePost(post) && <Button size="sm" variant="danger--outline" loading={busy === 'delete'} disabled={busy !== null}
                onClick={() => setConfirmDelete(true)}>Eliminar</Button>}
              {!mine && <ReportButton target={{ kind: 'post', id }} />}
              <ContentVisibilityButton kind="post" id={id} hidden={post.forum_post_status === 'hidden'}
                onChanged={(changed) => onChange({ ...post, ...changed })} />
            </div>
          </footer>}
          {error && <p className="auth-error" role="alert">{error}</p>}

          {mode === 'reply' && <ReplyForm topicId={topic.forum_topic_id} parentId={id}
            label={`Responder a ${authorLabel(post.forum_post_workspace_user_id, permissions.isMine, post.forum_post_workspace_user)}`}
            onSaved={(reply) => void onReplySaved(reply)} onCancel={() => setMode('view')} />}
        </CardBody>
      </Card>

      {repliesCount > 0 && !showReplies && <Button size="sm" variant="default" className="post-replies-toggle" disabled={loadingReplies}
        aria-expanded={false} onClick={() => replies ? setShowReplies(true) : void loadReplies()}>
        {loadingReplies ? <Spinner size="sm" label="Cargando respuestas…" /> : repliesCount === 1 ? 'Ver 1 respuesta' : `Ver ${repliesCount} respuestas`}
      </Button>}
      {showReplies && replies && replies.length > 0 && <>
        <ol className="post-replies">
          {replies.map((reply) => <PostCard key={reply.forum_post_id} post={reply} topic={topic} depth={depth + 1} onAccept={onAccept}
            onChange={(updated) => setReplies((current) => current?.map((item) => item.forum_post_id === updated.forum_post_id ? updated : item) ?? null)}
            onDeleted={(deletedId) => {
              setReplies((current) => current?.filter((item) => item.forum_post_id !== deletedId) ?? null)
              onChange({ ...post, forum_post_replies_count: Math.max(0, repliesCount - 1) })
            }} />)}
        </ol>
        <Button size="sm" variant="default" className="post-replies-toggle" aria-expanded onClick={() => setShowReplies(false)}>Ocultar respuestas</Button>
      </>}

      <Dialog open={confirmDelete} typeDialog="danger" titleDialog="Eliminar respuesta"
        textDialog="Se eliminará esta respuesta y también las respuestas que dependen de ella."
        buttonCancelDialog="Cancelar" buttonConfirmDialog="Eliminar"
        onCancelDialog={() => setConfirmDelete(false)} callbackDialog={() => void remove()} />
    </li>
  )
}
