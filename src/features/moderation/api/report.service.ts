import { forumApi, type ApiResponse } from '../../../lib/api'
import type { Paginated } from '../../../lib/pagination'
import type { ForumReport, ForumReportPayload, ReportFilters } from '../types/moderation.types'

// forum.moderation.reports
export async function createReport(payload: ForumReportPayload) {
  const { data } = await forumApi.post<ApiResponse<ForumReport>>('/forum/reports', payload)
  return data.data
}

// forum.moderation.view. El listado no conserva filtros en sus enlaces: se reenvían en cada página.
export async function listReports(filters: ReportFilters, signal?: AbortSignal) {
  const { data } = await forumApi.get<Paginated<ForumReport>>('/forum/reports', { params: filters, signal })
  return data
}

export async function getReport(reportId: number, signal?: AbortSignal) {
  const { data } = await forumApi.get<ApiResponse<ForumReport>>(`/forum/reports/${reportId}`, { signal })
  return data.data
}

// forum.moderation.manage. Solo desde pending; la nota es opcional (máx. 2000). Resolver no oculta el contenido.
export async function resolveReport(reportId: number, note: string | null = null) {
  const { data } = await forumApi.post<ApiResponse<ForumReport>>(`/forum/reports/${reportId}/resolve`, closeBody(note))
  return data.data
}

export async function dismissReport(reportId: number, note: string | null = null) {
  const { data } = await forumApi.post<ApiResponse<ForumReport>>(`/forum/reports/${reportId}/dismiss`, closeBody(note))
  return data.data
}

// Sin nota no se envía cuerpo; el resolutor, el estado y la fecha los asigna la API.
function closeBody(note: string | null) {
  const text = note?.trim()
  return text ? { forum_report_resolution_note: text } : undefined
}
