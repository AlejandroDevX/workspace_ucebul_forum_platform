import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Badge, Button, Card, CardBody, DataIcons, Dialog, Empty, Spinner } from 'ucebul_mui'
import { toApiError } from '../../../lib/api-error'
import { useRequest } from '../../../lib/useRequest'
import { listPosts } from '../api/post.service'
import { acceptAnswer, closeTopic, deleteTopic, getTopic, reopenTopic } from '../api/topic.service'
import AcceptedAnswerBadge from '../components/AcceptedAnswerBadge'
import PostCard from '../components/PostCard'
import ReplyForm from '../components/ReplyForm'
import type { ForumPost, ForumTopic } from '../types/community.types'
import { authorLabel, formatDateTime, mergePosts, wasEdited } from '../utils/community-format'
import { useCommunityPermissions } from '../utils/useCommunityPermissions'
import ContentVisibilityButton from '../../moderation/components/ContentVisibilityButton'
import ReportButton from '../../moderation/components/ReportButton'
import FavoriteButton from '../../favorites/components/FavoriteButton'

const POSTS_PER_PAGE = 20

export default function TopicDetailPage() {
  const navigate = useNavigate()
  const topicId = Number(useParams().topicId)
  const valid = topicId > 0
  const request = useRequest(valid ? `topic-${topicId}` : null, (signal) => getTopic(topicId, signal))
  const topic = request.data

  if (!valid || request.error?.status === 404) {
    return <section className="page-section"><h1>Pregunta no encontrada</h1>
      <Empty icon={DataIcons.navigation.chats} title="Esta pregunta no existe o no está disponible" text="Puede que haya sido eliminada u ocultada."
        buttonIcon={DataIcons.buttons.arrowLongLeft} buttonText="Volver al foro" onClickButton={() => navigate('/forum')} /></section>
  }
  if (request.loading || (!topic && !request.error)) return <div className="loading-block"><Spinner label="Cargando pregunta…" /></div>
  if (!topic) {
    return <div className="auth-error load-error" role="alert"><p>{request.error?.message}</p>
      <Button size="sm" onClick={request.reload}>Reintentar</Button></div>
  }

  return <TopicView key={topic.forum_topic_id} topic={topic} onTopicChange={(next) => request.setData(() => next)} />
}

function TopicView({ topic, onTopicChange }: { topic: ForumTopic; onTopicChange: (topic: ForumTopic) => void }) {
  const navigate = useNavigate()
  const permissions = useCommunityPermissions()
  const topicId = topic.forum_topic_id
  const [posts, setPosts] = useState<ForumPost[]>([])
  const [page, setPage] = useState(0)
  const [lastPage, setLastPage] = useState(1)
  const [loadingPosts, setLoadingPosts] = useState(true)
  const [postsError, setPostsError] = useState<string | null>(null)
  const [busy, setBusy] = useState<'close' | 'reopen' | 'delete' | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  async function loadPage(next: number, signal?: AbortSignal) {
    setLoadingPosts(true)
    setPostsError(null)
    try {
      const result = await listPosts(topicId, { page: next, per_page: POSTS_PER_PAGE }, signal)
      setPosts((current) => mergePosts(current, result.data))
      setPage(result.meta.current_page)
      setLastPage(result.meta.last_page)
    } catch (failure) {
      if (!signal?.aborted) setPostsError(toApiError(failure).message)
    } finally {
      if (!signal?.aborted) setLoadingPosts(false)
    }
  }

  // Primera página de respuestas raíz; las siguientes se agregan con "Cargar más".
  useEffect(() => {
    const controller = new AbortController()
    listPosts(topicId, { page: 1, per_page: POSTS_PER_PAGE }, controller.signal)
      .then((result) => {
        setPosts(result.data)
        setPage(result.meta.current_page)
        setLastPage(result.meta.last_page)
      })
      .catch((failure: unknown) => { if (!controller.signal.aborted) setPostsError(toApiError(failure).message) })
      .finally(() => { if (!controller.signal.aborted) setLoadingPosts(false) })
    return () => controller.abort()
  }, [topicId])

  // El conteo del tema lo recalcula la API; se consulta de nuevo tras publicar o eliminar.
  function refreshTopic() {
    getTopic(topicId).then(onTopicChange).catch(() => undefined)
  }

  async function onAccept(postId: number) {
    onTopicChange(await acceptAnswer(topicId, postId))
  }

  async function transition(action: 'close' | 'reopen') {
    setBusy(action)
    setActionError(null)
    try {
      onTopicChange(action === 'close' ? await closeTopic(topicId) : await reopenTopic(topicId))
    } catch (failure) {
      setActionError(toApiError(failure).message)
    } finally {
      setBusy(null)
    }
  }

  async function remove() {
    setConfirmDelete(false)
    setBusy('delete')
    setActionError(null)
    try {
      await deleteTopic(topicId)
      navigate(topic.category ? `/forum/categories/${topic.forum_topic_category_id}` : '/forum', { replace: true })
    } catch (failure) {
      setActionError(toApiError(failure).message)
      setBusy(null)
    }
  }

  const accepted = topic.accepted_post ?? null
  const count = topic.forum_topic_posts_count ?? posts.length
  const canEdit = permissions.canEditTopic(topic)

  return (
    <div className="topic-page">
      <Link className="back-link" to={topic.category ? `/forum/categories/${topic.forum_topic_category_id}` : '/forum'}>
        <span aria-hidden="true">{DataIcons.buttons.arrowLongLeft}</span> {topic.category?.forum_category_name ?? 'Foro técnico'}</Link>

      <article className="topic-question" aria-labelledby="topic-title">
        <Card className="topic-question__card"><CardBody>
          <p className="topic-question__label">Pregunta</p>
          <div className="course-card__tags">
            {topic.forum_topic_accepted_post_id && <AcceptedAnswerBadge label="Resuelta" />}
            {topic.forum_topic_status === 'closed' && <Badge>Cerrada</Badge>}
            {topic.forum_topic_status === 'hidden' && <Badge variant="warning">Oculta por moderación</Badge>}
            {topic.course && <Link to={`/courses/${topic.course.forum_course_id}`} className="topic-question__course">
              <Badge><span className="badge-icon" aria-hidden="true">{DataIcons.global.bookOutline}</span>{topic.course.forum_course_title}</Badge></Link>}
          </div>
          <div className="detail-title-row">
            <h1 id="topic-title">{topic.forum_topic_title}</h1>
            <FavoriteButton kind="topic" id={topicId} title={topic.forum_topic_title} />
          </div>
          <p className="topic-question__meta">
            {authorLabel(topic.forum_topic_workspace_user_id, permissions.isMine, topic.forum_topic_workspace_user)} · {formatDateTime(topic.forum_topic_created_at)}
            {wasEdited(topic.forum_topic_created_at, topic.forum_topic_updated_at) && ' · editada'}
          </p>
          <div className="topic-question__body">{topic.forum_topic_body}</div>
          <div className="topic-question__actions">
            {canEdit && <Button size="sm" variant="default" disabled={busy !== null}
              onClick={() => navigate(`/forum/topics/${topicId}/edit`)}>Editar</Button>}
            {canEdit && topic.forum_topic_status === 'open' && <Button size="sm" variant="secondary--outline" loading={busy === 'close'}
              disabled={busy !== null} onClick={() => void transition('close')}>Cerrar pregunta</Button>}
            {canEdit && topic.forum_topic_status === 'closed' && <Button size="sm" variant="primary--outline" loading={busy === 'reopen'}
              disabled={busy !== null} onClick={() => void transition('reopen')}>Reabrir</Button>}
            {permissions.canDeleteTopic(topic) && <Button size="sm" variant="danger--outline" loading={busy === 'delete'}
              disabled={busy !== null} onClick={() => setConfirmDelete(true)}>Eliminar</Button>}
            {!permissions.isMine(topic.forum_topic_workspace_user_id) && <ReportButton target={{ kind: 'topic', id: topicId }} />}
            <ContentVisibilityButton kind="topic" id={topicId} hidden={topic.forum_topic_status === 'hidden'}
              onChanged={(changed) => onTopicChange({ ...topic, ...changed })} />
          </div>
          {actionError && <p className="auth-error" role="alert">{actionError}</p>}
        </CardBody></Card>
      </article>

      {accepted && <section className="accepted-answer" aria-labelledby="accepted-title">
        <h2 id="accepted-title"><span aria-hidden="true">{DataIcons.global.checkOutline}</span> Solución aceptada</h2>
        <Card className="accepted-answer__card"><CardBody>
          <p className="topic-question__meta">{authorLabel(accepted.forum_post_workspace_user_id, permissions.isMine, accepted.forum_post_workspace_user)} · {formatDateTime(accepted.forum_post_created_at)}</p>
          <div className="post-card__body">{accepted.forum_post_body}</div>
          <a className="text-link" href={`#post-${accepted.forum_post_id}`}>Ver en la conversación</a>
        </CardBody></Card>
      </section>}

      <section className="topic-answers" aria-labelledby="answers-title">
        <h2 id="answers-title">{count === 1 ? '1 respuesta' : `${count} respuestas`}</h2>
        {postsError && <div className="auth-error load-error" role="alert"><p>{postsError}</p>
          <Button size="sm" onClick={() => void loadPage(Math.max(page, 0) + 1)}>Reintentar</Button></div>}
        {!loadingPosts && !postsError && posts.length === 0 && <p className="muted topic-answers__empty">Aún nadie ha respondido. ¡Comparte lo que sabes!</p>}
        {posts.length > 0 && <ol className="post-thread">
          {posts.map((post) => <PostCard key={post.forum_post_id} post={post} topic={topic} onAccept={onAccept}
            onChange={(updated) => setPosts((current) => current.map((item) => item.forum_post_id === updated.forum_post_id ? updated : item))}
            onDeleted={(postId) => { setPosts((current) => current.filter((item) => item.forum_post_id !== postId)); refreshTopic() }} />)}
        </ol>}
        {loadingPosts && <div className="loading-block"><Spinner label="Cargando respuestas…" /></div>}
        {!loadingPosts && page < lastPage && <div className="load-more">
          <Button variant="default" onClick={() => void loadPage(page + 1)}>Cargar más respuestas</Button></div>}
      </section>

      <section className="topic-reply" aria-labelledby="reply-title">
        <h2 id="reply-title">Responder</h2>
        {permissions.canReply(topic)
          ? <Card><CardBody>
              <ReplyForm topicId={topicId} label="Tu respuesta"
                onSaved={(post) => { setPosts((current) => mergePosts(current, [post])); refreshTopic() }} />
            </CardBody></Card>
          : <p className="muted">{topic.forum_topic_status === 'open'
              ? 'No tienes permiso para responder en el foro.'
              : 'Esta pregunta está cerrada y no admite nuevas respuestas.'}</p>}
      </section>

      <Dialog open={confirmDelete} typeDialog="danger" titleDialog="Eliminar pregunta"
        textDialog={`¿Eliminar «${topic.forum_topic_title}»? Dejará de estar disponible en el foro.`}
        buttonCancelDialog="Cancelar" buttonConfirmDialog="Eliminar"
        onCancelDialog={() => setConfirmDelete(false)} callbackDialog={() => void remove()} />
    </div>
  )
}
