import { Badge, Button, DataIcons, Tabs } from 'ucebul_mui'
import type { TopicFilters } from '../types/community.types'

// Filtro por estado con Tabs de ucebul_mui y aviso del filtro por curso.
export default function TopicFiltersBar({ filters, onStatus, onClearCourse }: {
  filters: TopicFilters
  onStatus: (status: string) => void
  onClearCourse: () => void
}) {
  return (
    <div className="topic-filters">
      <Tabs activeTab={filters.forum_topic_status ?? 'all'} onChange={(value) => onStatus(String(value))} tabs={[
        { label: 'Todas', value: 'all' },
        { label: 'Abiertas', value: 'open' },
        { label: 'Cerradas', value: 'closed' },
      ]} />
      {filters.forum_topic_course_id && <div className="topic-filters__course">
        <Badge variant="info">Curso #{filters.forum_topic_course_id}</Badge>
        <Button size="sm" variant="default" onClick={onClearCourse}>
          <span className="button-icon" aria-hidden="true">{DataIcons.buttons.close}</span>Quitar filtro</Button>
      </div>}
    </div>
  )
}
