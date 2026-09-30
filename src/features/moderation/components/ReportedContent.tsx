import { Link } from 'react-router-dom'
import { Badge, DataIcons, Spinner } from 'ucebul_mui'
import { useRequest } from '../../../lib/useRequest'
import { getTopic } from '../../community/api/topic.service'
import { authorLabel, formatDateTime } from '../../community/utils/community-format'
import type { ForumReport } from '../types/moderation.types'
import { CONTENT_STATE_LABELS, reportContentState, reportTargetKind } from '../utils/report-format'

const STATE_VARIANTS = { visible: 'success', hidden: 'warning', deleted: 'danger', unknown: 'default' } as const

// Recurso reportado con su contexto: el resumen del reporte más el tema completo cuando es visible para la sesión.
export default function ReportedContent({ report, isMine }: { report: ForumReport; isMine: (id: number) => boolean }) {
  const kind = reportTargetKind(report)
  const state = reportContentState(report)
  const topicId = kind === 'topic' ? report.forum_report_topic_id : report.post?.forum_post_topic_id ?? null
  // Los temas eliminados no se consultan; ocultos o eliminados pueden responder 404 según los permisos.
  const topic = useRequest(topicId && !report.topic?.forum_topic_deleted_at ? `report-topic-${topicId}-${state}` : null,
    (signal) => getTopic(topicId!, signal))
  const context = topic.data

  return (
    <div className="reported-content">
      <div className="course-card__tags">
        <Badge variant="info">{kind === 'topic' ? 'Pregunta' : 'Respuesta'}</Badge>
        <Badge variant={STATE_VARIANTS[state]}>{CONTENT_STATE_LABELS[state]}</Badge>
        {context?.category && <Badge>{context.category.forum_category_name}</Badge>}
      </div>

      {kind === 'topic'
        ? <h3>{report.topic?.forum_topic_title ?? `Pregunta #${report.forum_report_topic_id}`}</h3>
        : <p className="reported-content__context">
            En la pregunta: <strong>{context?.forum_topic_title ?? `#${report.post?.forum_post_topic_id ?? '—'}`}</strong>
          </p>}

      {topic.loading && <Spinner size="sm" label="Cargando contexto…" />}
      {!topic.loading && topic.error && <p className="muted" role="status">
        {topic.error.status === 404
          ? 'No se puede mostrar la pregunta completa: está oculta o eliminada y solo la ven su autor y quienes gestionan la comunidad.'
          : `No se pudo cargar el contexto: ${topic.error.message}`}
      </p>}

      {kind === 'topic' && context && <>
        <p className="muted reported-content__meta">
          {authorLabel(context.forum_topic_workspace_user_id, isMine, context.forum_topic_workspace_user)} · {formatDateTime(context.forum_topic_created_at)}
          {context.course && <> · Curso: {context.course.forum_course_title}</>}
        </p>
        <blockquote className="reported-content__body">{context.forum_topic_body}</blockquote>
      </>}
      {kind === 'post' && report.post && <blockquote className="reported-content__body">{report.post.forum_post_body}</blockquote>}
      {kind === 'post' && !report.post && <p className="muted">La respuesta ya no está disponible.</p>}

      {state === 'deleted' && <p className="muted">El contenido fue eliminado por su autor o por la gestión de la comunidad; no se puede ocultar ni restaurar.</p>}
      {context && state !== 'deleted' && <Link className="text-link" to={`/forum/topics/${context.forum_topic_id}${kind === 'post' ? `#post-${report.forum_report_post_id}` : ''}`}>
        Ver en el foro <span aria-hidden="true">{DataIcons.global.externalLinkOutline}</span></Link>}
    </div>
  )
}
