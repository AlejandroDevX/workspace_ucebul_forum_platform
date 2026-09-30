import { Badge } from 'ucebul_mui'
import type { ForumReportStatus } from '../types/moderation.types'
import { REPORT_STATUS_LABELS, REPORT_STATUS_VARIANTS } from '../utils/report-format'

export default function ReportStatusBadge({ status }: { status: ForumReportStatus }) {
  return <Badge variant={REPORT_STATUS_VARIANTS[status]}>{REPORT_STATUS_LABELS[status]}</Badge>
}
