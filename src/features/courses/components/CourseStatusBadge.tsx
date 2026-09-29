import { Badge } from 'ucebul_mui'
import type { ForumCourseStatus } from '../types/course.types'
import { STATUS_LABELS, STATUS_VARIANTS } from '../utils/course-format'

export default function CourseStatusBadge({ status }: { status: ForumCourseStatus }) {
  return <Badge variant={STATUS_VARIANTS[status] ?? 'default'}>{STATUS_LABELS[status] ?? status}</Badge>
}
