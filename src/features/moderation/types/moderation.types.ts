import type { WorkspaceUserSummary } from '../../../lib/workspace-user'
import type { ForumPostStatus, ForumTopicStatus } from '../../community/types/community.types'

export type ForumReportStatus = 'pending' | 'resolved' | 'dismissed'

// Resúmenes del destino incluidos en ForumReportResource (incluyen eliminados lógicamente).
export interface ForumReportTopicSummary {
  forum_topic_id: number
  forum_topic_title: string
  forum_topic_status: ForumTopicStatus
  forum_topic_deleted_at: string | null
}

export interface ForumReportPostSummary {
  forum_post_id: number
  forum_post_topic_id: number
  forum_post_body: string
  forum_post_status: ForumPostStatus
  forum_post_deleted_at: string | null
}

export interface ForumReport {
  forum_report_id: number
  forum_report_topic_id: number | null
  forum_report_post_id: number | null
  forum_report_reported_by_workspace_user_id: number
  forum_report_reported_by_workspace_user?: WorkspaceUserSummary | null
  forum_report_reason: string
  forum_report_description: string | null
  forum_report_status: ForumReportStatus
  forum_report_resolved_by_workspace_user_id: number | null
  forum_report_resolved_by_workspace_user?: WorkspaceUserSummary | null
  forum_report_resolved_at: string | null
  forum_report_resolution_note: string | null
  forum_report_created_at: string
  forum_report_updated_at: string
  topic: ForumReportTopicSummary | null
  post: ForumReportPostSummary | null
}

// Exactamente uno de los destinos. El autor, el estado y la resolución los asigna la API (422 si se envían).
export type ForumReportPayload = {
  forum_report_reason: string
  forum_report_description: string | null
} & ({ forum_report_topic_id: number } | { forum_report_post_id: number })

export interface ReportFilters {
  page?: number
  per_page?: number
  forum_report_status?: ForumReportStatus
  forum_report_topic_id?: number
  forum_report_post_id?: number
}

export type ReportTarget = { kind: 'topic'; id: number } | { kind: 'post'; id: number }
