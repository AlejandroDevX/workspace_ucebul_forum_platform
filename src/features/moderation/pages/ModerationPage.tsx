import { useNavigate } from 'react-router-dom'
import { Badge, Button, Card, CardBody, DataIcons, Empty, Spinner, Table, Tabs } from 'ucebul_mui'
import { useRequest } from '../../../lib/useRequest'
import { authorLabel, formatDateTime } from '../../community/utils/community-format'
import { useCommunityPermissions } from '../../community/utils/useCommunityPermissions'
import { listReports } from '../api/report.service'
import ReportStatusBadge from '../components/ReportStatusBadge'
import type { ForumReport } from '../types/moderation.types'
import { CONTENT_STATE_LABELS, excerpt, reportContentState, reportTargetKind, reportTargetTitle } from '../utils/report-format'
import { useReportFilters } from '../utils/useReportFilters'

const STATUS_TABS = [
  { label: 'Pendientes', value: 'pending' },
  { label: 'Resueltos', value: 'resolved' },
  { label: 'Descartados', value: 'dismissed' },
  { label: 'Todos', value: 'all' },
]

const COLUMNS = [
  { key: 'report', name: 'Reporte', width: '120px' },
  { key: 'target', name: 'Contenido reportado' },
  { key: 'reason', name: 'Motivo' },
  { key: 'status', name: 'Estado', width: '120px' },
  { key: 'actions', name: <span className="sr-only">Acciones</span>, width: '110px' },
]

export default function ModerationPage() {
  const navigate = useNavigate()
  const { isMine } = useCommunityPermissions()
  const { filters, activeStatus, setStatus, setPage, clearTarget } = useReportFilters()
  const reports = useRequest(`reports-${JSON.stringify(filters)}`, (signal) => listReports(filters, signal))
  const result = reports.data
  const targetFilter = filters.forum_report_topic_id ? `Pregunta #${filters.forum_report_topic_id}`
    : filters.forum_report_post_id ? `Respuesta #${filters.forum_report_post_id}` : null

  const row = (report: ForumReport) => {
    const state = reportContentState(report)
    return {
      report: <div className="report-cell">
        <strong>#{report.forum_report_id}</strong>
        <span className="muted">{formatDateTime(report.forum_report_created_at)}</span>
      </div>,
      target: <div className="report-cell">
        <span className="report-cell__tags">
          <Badge variant="info">{reportTargetKind(report) === 'topic' ? 'Pregunta' : 'Respuesta'}</Badge>
          {state !== 'visible' && <Badge variant={state === 'hidden' ? 'warning' : 'danger'}>{CONTENT_STATE_LABELS[state]}</Badge>}
        </span>
        <span className="report-cell__title">{reportTargetTitle(report)}</span>
      </div>,
      reason: <div className="report-cell">
        <span>{report.forum_report_reason}</span>
        {report.forum_report_description && <span className="muted">{excerpt(report.forum_report_description, 90)}</span>}
        <span className="muted">Por {authorLabel(report.forum_report_reported_by_workspace_user_id, isMine, report.forum_report_reported_by_workspace_user)}</span>
      </div>,
      status: <ReportStatusBadge status={report.forum_report_status} />,
      actions: <Button size="sm" variant="primary--outline" aria-label={`Revisar reporte #${report.forum_report_id}`}
        onClick={() => navigate(`/admin/moderation/reports/${report.forum_report_id}`)}>Revisar</Button>,
    }
  }

  return (
    <section className="page-section" aria-labelledby="moderation-title">
      <p className="eyebrow">Administración</p>
      <h1 id="moderation-title">Moderación</h1>
      <p className="page-intro">Revisa los reportes de la comunidad, consulta el contenido en su contexto y decide si resolverlos o descartarlos.</p>

      <div className="topic-filters moderation-filters">
        <Tabs tabs={STATUS_TABS} activeTab={activeStatus} onChange={(value) => setStatus(String(value))} />
        {targetFilter && <div className="topic-filters__course">
          <Badge variant="info">{targetFilter}</Badge>
          <Button size="sm" variant="default" onClick={clearTarget}>
            <span className="button-icon" aria-hidden="true">{DataIcons.buttons.close}</span>Quitar filtro</Button>
        </div>}
      </div>

      <div aria-live="polite" aria-busy={reports.loading}>
        {reports.loading && <div className="loading-block"><Spinner label="Cargando reportes…" /></div>}
        {!reports.loading && reports.error && <div className="auth-error load-error" role="alert"><p>{reports.error.message}</p>
          <Button size="sm" onClick={reports.reload}>Reintentar</Button></div>}
        {!reports.loading && !reports.error && result && (result.data.length === 0
          ? <Card><CardBody><Empty icon={DataIcons.navigation.documentCheck}
              title={activeStatus === 'pending' ? 'No hay reportes pendientes' : 'No hay reportes con este filtro'}
              text={activeStatus === 'pending' ? 'La comunidad está en orden. Los nuevos reportes aparecerán aquí.' : 'Prueba con otro estado.'}
              buttonIcon={DataIcons.global.reloadOutline} buttonText="Actualizar" onClickButton={reports.reload} /></CardBody></Card>
          : <>
              <p className="result-count muted">{result.meta.total === 1 ? '1 reporte' : `${result.meta.total} reportes`}</p>
              <div className="admin-table">
                <Table columns={COLUMNS} data={result.data.map(row)}
                  currentPage={result.meta.current_page} totalPages={Math.max(result.meta.last_page, 1)}
                  onChangePage={(page) => { if (page >= 1 && page <= result.meta.last_page) setPage(page) }} />
              </div>
            </>)}
      </div>
    </section>
  )
}
