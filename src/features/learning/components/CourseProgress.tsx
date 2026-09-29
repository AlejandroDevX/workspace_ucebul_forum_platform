import { Badge } from 'ucebul_mui'
import type { ProgressSummary } from '../types/learning.types'
import { formatPercentage } from '../utils/learning-format'

// Barra de avance con los valores confirmados por la API; no calcula progreso propio.
export default function CourseProgress({ summary, compact = false }: { summary: ProgressSummary; compact?: boolean }) {
  const percentage = formatPercentage(summary.percentage)
  const label = summary.published_lessons === 0
    ? 'El curso aún no tiene lecciones publicadas'
    : `${summary.completed_lessons} de ${summary.published_lessons} ${summary.published_lessons === 1 ? 'lección completada' : 'lecciones completadas'}`

  return (
    <div className={`course-progress ${compact ? 'course-progress--compact' : ''} ${summary.is_completed ? 'is-completed' : ''}`}>
      <div className="course-progress__head">
        <span className="course-progress__label">{label}</span>
        {summary.is_completed ? <Badge variant="success">Finalizado</Badge> : <strong>{percentage}%</strong>}
      </div>
      <div className="course-progress__track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percentage}
        aria-label={`Avance del curso: ${percentage}%`}>
        <span className="course-progress__bar" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  )
}
