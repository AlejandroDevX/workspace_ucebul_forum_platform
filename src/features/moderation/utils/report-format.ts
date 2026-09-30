import { compose, maxLength, required, type FieldValidator } from '../../../lib/validators'
import type { ForumReport, ForumReportPayload, ForumReportStatus, ReportTarget } from '../types/moderation.types'

export const REPORT_STATUSES: ForumReportStatus[] = ['pending', 'resolved', 'dismissed']

export const REPORT_STATUS_LABELS: Record<ForumReportStatus, string> = {
  pending: 'Pendiente',
  resolved: 'Resuelto',
  dismissed: 'Descartado',
}

export const REPORT_STATUS_VARIANTS: Record<ForumReportStatus, 'warning' | 'success' | 'default'> = {
  pending: 'warning',
  resolved: 'success',
  dismissed: 'default',
}

// forum_report_reason es texto libre (máx. 255): el formulario ofrece motivos cerrados y envía su texto.
export const OTHER_REASON = 'Otro motivo'
export const REPORT_REASONS = [
  'Spam o publicidad',
  'Lenguaje ofensivo o acoso',
  'Información incorrecta o peligrosa',
  'Contenido fuera de tema',
  'Contenido duplicado',
  OTHER_REASON,
] as const

export const reportValidators = {
  reason: compose(required('Selecciona el motivo del reporte.'), maxLength(255, 'El motivo admite máximo 255 caracteres.')),
  // Con «Otro motivo» la descripción es la única explicación del reporte.
  description: (reason: string): FieldValidator => compose(
    reason === OTHER_REASON ? required('Describe el problema para que el equipo de moderación pueda revisarlo.') : () => null,
    maxLength(65535, 'La descripción admite máximo 65.535 caracteres.'),
  ),
}

// Normaliza los valores de Form al DTO: exactamente un destino y sin campos que asigna la API.
export function toReportPayload(target: ReportTarget, values: Record<string, unknown>): ForumReportPayload {
  const description = String(values.forum_report_description ?? '').trim()
  const base = {
    forum_report_reason: String(values.forum_report_reason ?? '').trim(),
    forum_report_description: description || null,
  }
  return target.kind === 'topic'
    ? { forum_report_topic_id: target.id, ...base }
    : { forum_report_post_id: target.id, ...base }
}

export function reportTargetKind(report: ForumReport): 'topic' | 'post' {
  return report.forum_report_post_id !== null ? 'post' : 'topic'
}

export function excerpt(text: string, length = 140) {
  const clean = text.replace(/\s+/g, ' ').trim()
  return clean.length > length ? `${clean.slice(0, length - 1)}…` : clean
}

export function reportTargetTitle(report: ForumReport) {
  if (report.post) return excerpt(report.post.forum_post_body, 90)
  if (report.topic) return report.topic.forum_topic_title
  const id = report.forum_report_post_id ?? report.forum_report_topic_id
  return reportTargetKind(report) === 'post' ? `Respuesta #${id}` : `Tema #${id}`
}

export type ContentState = 'visible' | 'hidden' | 'deleted' | 'unknown'

// Estado del contenido reportado según el resumen incluido en el reporte.
export function reportContentState(report: ForumReport): ContentState {
  if (reportTargetKind(report) === 'post') {
    if (!report.post) return 'unknown'
    if (report.post.forum_post_deleted_at) return 'deleted'
    return report.post.forum_post_status === 'hidden' ? 'hidden' : 'visible'
  }
  if (!report.topic) return 'unknown'
  if (report.topic.forum_topic_deleted_at) return 'deleted'
  return report.topic.forum_topic_status === 'hidden' ? 'hidden' : 'visible'
}

export const CONTENT_STATE_LABELS: Record<ContentState, string> = {
  visible: 'Visible',
  hidden: 'Oculto',
  deleted: 'Eliminado',
  unknown: 'Sin datos',
}
