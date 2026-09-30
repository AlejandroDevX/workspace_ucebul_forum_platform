import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button, Card, CardBody, CardHeader, DataIcons, Empty, Spinner } from 'ucebul_mui'
import { useRequest } from '../../../lib/useRequest'
import { authorLabel, formatDateTime } from '../../community/utils/community-format'
import { useCommunityPermissions } from '../../community/utils/useCommunityPermissions'
import { getReport } from '../api/report.service'
import ContentVisibilityButton from '../components/ContentVisibilityButton'
import ReportedContent from '../components/ReportedContent'
import ReportStatusBadge from '../components/ReportStatusBadge'
import ResolveReportForm from '../components/ResolveReportForm'
import type { ForumReport } from '../types/moderation.types'
import { REPORT_STATUS_LABELS, reportContentState, reportTargetKind } from '../utils/report-format'
import { useModerationPermissions } from '../utils/useModerationPermissions'

export default function ReportDetailPage() {
  const navigate = useNavigate()
  const reportId = Number(useParams().reportId)
  const valid = Number.isInteger(reportId) && reportId > 0
  const request = useRequest(valid ? `report-${reportId}` : null, (signal) => getReport(reportId, signal))
  const report = request.data

  if (!valid || request.error?.status === 404) {
    return <section className="page-section"><h1>Reporte no encontrado</h1>
      <Empty icon={DataIcons.navigation.documentCheck} title="Este reporte no existe" text="Revisa el enlace o vuelve al listado de reportes."
        buttonIcon={DataIcons.buttons.arrowLongLeft} buttonText="Volver a moderación" onClickButton={() => navigate('/admin/moderation')} /></section>
  }
  if (request.loading || (!report && !request.error)) return <div className="loading-block"><Spinner label="Cargando reporte…" /></div>
  if (!report) {
    return <div className="auth-error load-error" role="alert"><p>{request.error?.message}</p>
      <Button size="sm" onClick={request.reload}>Reintentar</Button></div>
  }
  return <ReportView report={report} onChange={(next) => request.setData(() => next)} />
}

function ReportView({ report, onChange }: { report: ForumReport; onChange: (report: ForumReport) => void }) {
  const { isMine } = useCommunityPermissions()
  const { canManage } = useModerationPermissions()
  const kind = reportTargetKind(report)
  const state = reportContentState(report)
  const targetId = kind === 'topic' ? report.forum_report_topic_id : report.forum_report_post_id

  // Refleja en el resumen del reporte el nuevo estado del contenido.
  function setContentHidden(hidden: boolean, base: ForumReport = report) {
    onChange(kind === 'topic' && base.topic
      ? { ...base, topic: { ...base.topic, forum_topic_status: hidden ? 'hidden' : 'open' } }
      : kind === 'post' && base.post
        ? { ...base, post: { ...base.post, forum_post_status: hidden ? 'hidden' : 'published' } }
        : base)
  }

  return (
    <section className="page-section report-detail" aria-labelledby="report-title">
      <Link className="back-link" to="/admin/moderation"><span aria-hidden="true">{DataIcons.buttons.arrowLongLeft}</span> Reportes</Link>
      <div className="page-title-row">
        <div>
          <p className="eyebrow">Moderación</p>
          <h1 id="report-title">Reporte #{report.forum_report_id}</h1>
        </div>
        <ReportStatusBadge status={report.forum_report_status} />
      </div>

      <div className="report-detail__layout">
        <Card className="report-detail__content">
          <CardHeader><h2>Contenido reportado</h2></CardHeader>
          <CardBody>
            <ReportedContent report={report} isMine={isMine} />
            {canManage && targetId && (state === 'visible' || state === 'hidden') && <div className="report-detail__actions">
              {kind === 'topic'
                ? <ContentVisibilityButton kind="topic" id={targetId} hidden={state === 'hidden'}
                    onChanged={(topic) => setContentHidden(topic.forum_topic_status === 'hidden')} />
                : <ContentVisibilityButton kind="post" id={targetId} hidden={state === 'hidden'}
                    onChanged={(post) => setContentHidden(post.forum_post_status === 'hidden')} />}
            </div>}
            {targetId && <Link className="text-link" to={`/admin/moderation?status=all&${kind}=${targetId}`}>
              Ver todos los reportes de este contenido <span aria-hidden="true">{DataIcons.buttons.arrowLongRight}</span></Link>}
          </CardBody>
        </Card>

        <div className="report-detail__side">
          <Card>
            <CardHeader><h2>Detalle del reporte</h2></CardHeader>
            <CardBody>
              <dl className="detail-list">
                <div><dt>Motivo</dt><dd>{report.forum_report_reason}</dd></div>
                <div><dt>Descripción</dt><dd>{report.forum_report_description || <span className="muted">Sin descripción</span>}</dd></div>
                <div><dt>Reportado por</dt><dd>{authorLabel(report.forum_report_reported_by_workspace_user_id, isMine, report.forum_report_reported_by_workspace_user)}</dd></div>
                <div><dt>Fecha</dt><dd>{formatDateTime(report.forum_report_created_at)}</dd></div>
                {report.forum_report_status !== 'pending' && <>
                  <div><dt>{REPORT_STATUS_LABELS[report.forum_report_status]} por</dt>
                    <dd>{report.forum_report_resolved_by_workspace_user_id !== null
                      ? authorLabel(report.forum_report_resolved_by_workspace_user_id, isMine, report.forum_report_resolved_by_workspace_user) : '—'}</dd></div>
                  <div><dt>Fecha de cierre</dt><dd>{report.forum_report_resolved_at ? formatDateTime(report.forum_report_resolved_at) : '—'}</dd></div>
                  <div><dt>Nota de resolución</dt><dd>{report.forum_report_resolution_note || <span className="muted">Sin nota</span>}</dd></div>
                </>}
              </dl>
            </CardBody>
          </Card>

          {report.forum_report_status === 'pending' && <Card>
            <CardHeader><h2>Resolución</h2></CardHeader>
            <CardBody>
              {canManage
                ? <ResolveReportForm report={report} onUpdated={(saved, hidden) => hidden ? setContentHidden(true, saved) : onChange(saved)} />
                : <p className="muted">Puedes consultar este reporte, pero resolverlo requiere el permiso de gestión de moderación.</p>}
            </CardBody>
          </Card>}
        </div>
      </div>
    </section>
  )
}
