import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Badge, Button, Card, CardBody, DataIcons, Dialog, Divider, Empty, Spinner } from 'ucebul_mui'
import ButtonIcon from '../../../components/ButtonIcon'
import { toApiError } from '../../../lib/api-error'
import { useRequest } from '../../../lib/useRequest'
import { listPosts } from '../api/post.service'
import { acceptAnswer, closeTopic, deleteTopic, getTopic, reopenTopic } from '../api/topic.service'
import AcceptedAnswerBadge from '../components/AcceptedAnswerBadge'
import AuthorLine from '../components/AuthorLine'
import PostCard from '../components/PostCard'
import ReplyForm from '../components/ReplyForm'
import type { ForumPost, ForumTopic } from '../types/community.types'
import { authorLabel, mergePosts, wasEdited } from '../utils/community-format'
import { useCommunityPermissions } from '../utils/useCommunityPermissions'
import ContentVisibilityButton from '../../moderation/components/ContentVisibilityButton'
import ReportButton from '../../moderation/components/ReportButton'
import FavoriteButton from '../../favorites/components/FavoriteButton'

const POSTS_PER_PAGE = 20

const REPLY_TIPS = [
  'Comparte tu experiencia o conocimientos.',
  'Sé claro y conciso.',
  'Si es posible, incluye fuentes o referencias.',
  'Mantén un tono respetuoso.',
]

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
      <div className="topic-page__nav">
        <Link className="back-link" to="/forum"><span aria-hidden="true">{DataIcons.buttons.arrowLongLeft}</span> Volver al foro</Link>
        {topic.category && <Link className="topic-page__category" to={`/forum/categories/${topic.forum_topic_category_id}`}>
          <Badge variant="success"><span className="badge-icon" aria-hidden="true">{DataIcons.navigation.chats}</span>{topic.category.forum_category_name}</Badge>
        </Link>}
      </div>

      <article className="topic-question" aria-labelledby="topic-title">
        <Card className="topic-question__card"><CardBody>
          <div className="topic-question__head">
            <div className="course-card__tags">
              <Badge variant="success" className="topic-question__label">Pregunta</Badge>
              {topic.forum_topic_accepted_post_id && <AcceptedAnswerBadge label="Resuelta" />}
              {topic.forum_topic_status === 'closed' && <Badge>Cerrada</Badge>}
              {topic.forum_topic_status === 'hidden' && <Badge variant="warning">Oculta por moderación</Badge>}
              {topic.course && <Link to={`/courses/${topic.course.forum_course_id}`} className="topic-question__course">
                <Badge><span className="badge-icon" aria-hidden="true">{DataIcons.global.bookOutline}</span>{topic.course.forum_course_title}</Badge></Link>}
            </div>
            <FavoriteButton kind="topic" id={topicId} title={topic.forum_topic_title} />
          </div>
          <h1 id="topic-title">{topic.forum_topic_title}</h1>
          <AuthorLine name={authorLabel(topic.forum_topic_workspace_user_id, permissions.isMine, topic.forum_topic_workspace_user)}
            date={topic.forum_topic_created_at} edited={wasEdited(topic.forum_topic_created_at, topic.forum_topic_updated_at)} />
          <div className="topic-question__body">{topic.forum_topic_body}</div>
          <Divider className="topic-question__divider" />
          <div className="topic-question__actions">
            {canEdit && <Button size="md" variant="default" disabled={busy !== null}
              onClick={() => navigate(`/forum/topics/${topicId}/edit`)}><ButtonIcon icon={DataIcons.global.pencilOutline} />Editar</Button>}
            {canEdit && topic.forum_topic_status === 'open' && <Button size="md" variant="default" loading={busy === 'close'}
              disabled={busy !== null} onClick={() => void transition('close')}><ButtonIcon icon={DataIcons.global.lockClosedOutline} />Cerrar pregunta</Button>}
            {canEdit && topic.forum_topic_status === 'closed' && <Button size="md" variant="primary--outline" loading={busy === 'reopen'}
              disabled={busy !== null} onClick={() => void transition('reopen')}><ButtonIcon icon={DataIcons.global.reloadOutline} />Reabrir</Button>}
            <ContentVisibilityButton kind="topic" id={topicId} hidden={topic.forum_topic_status === 'hidden'} size="md"
              onChanged={(changed) => onTopicChange({ ...topic, ...changed })} />
            {permissions.canDeleteTopic(topic) && <Button size="md" variant="danger--outline" loading={busy === 'delete'}
              disabled={busy !== null} onClick={() => setConfirmDelete(true)}><ButtonIcon icon={DataIcons.global.trashOutline} />Eliminar</Button>}
            {!permissions.isMine(topic.forum_topic_workspace_user_id) && <ReportButton target={{ kind: 'topic', id: topicId }} />}
          </div>
          {actionError && <p className="auth-error" role="alert">{actionError}</p>}
        </CardBody></Card>
      </article>

      {accepted && <section className="accepted-answer" aria-labelledby="accepted-title">
        <h2 id="accepted-title"><span aria-hidden="true">{DataIcons.global.checkOutline}</span> Solución aceptada</h2>
        <Card className="accepted-answer__card"><CardBody>
          <AuthorLine layout="stacked" name={authorLabel(accepted.forum_post_workspace_user_id, permissions.isMine, accepted.forum_post_workspace_user)}
            date={accepted.forum_post_created_at} />
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
        <Card><CardBody className="topic-reply__layout">
          <div className="topic-reply__main">
            <h2 id="reply-title">Responder</h2>
            {permissions.canReply(topic)
              ? <ReplyForm topicId={topicId} label="Tu respuesta" placeholder="Escribe tu respuesta aquí…"
                  hint="Sé claro y aporta información útil para la comunidad." submitIcon={DataIcons.global.airplaneOutline}
                  onSaved={(post) => { setPosts((current) => mergePosts(current, [post])); refreshTopic() }} />
              : <p className="muted">{topic.forum_topic_status === 'open'
                  ? 'No tienes permiso para responder en el foro.'
                  : 'Esta pregunta está cerrada y no admite nuevas respuestas.'}</p>}
          </div>
          <Divider orientation="vertical" className="topic-reply__divider" />
          <aside className="topic-reply__tips" aria-labelledby="reply-tips-title">
            <h3 id="reply-tips-title"><span aria-hidden="true">{DataIcons.alert.info}</span> Consejos para una buena respuesta</h3>
            <ul>
              {REPLY_TIPS.map((tip) => <li key={tip}><span aria-hidden="true">{DataIcons.global.checkOutline}</span>{tip}</li>)}
            </ul>
          </aside>
        </CardBody></Card>
      </section>

      <Dialog open={confirmDelete} typeDialog="danger" titleDialog="Eliminar pregunta"
        textDialog={`¿Eliminar «${topic.forum_topic_title}»? Dejará de estar disponible en el foro.`}
        buttonCancelDialog="Cancelar" buttonConfirmDialog="Eliminar"
        onCancelDialog={() => setConfirmDelete(false)} callbackDialog={() => void remove()} />
    </div>
  )
}
