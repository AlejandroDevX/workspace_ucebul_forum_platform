import type { CSSProperties } from 'react'
import { Badge } from 'ucebul_mui'
import type { ProgressSummary } from '../types/learning.types'
import { formatPercentage } from '../utils/learning-format'

// Con más lecciones los segmentos quedan demasiado finos; se vuelve a la barra continua.
const MAX_SEGMENTS = 30

// Barra de avance con los valores confirmados por la API; no calcula progreso propio.
// `segmented` dibuja un segmento por lección publicada (solo refleja cuántas, no cuáles).
export default function CourseProgress({ summary, compact = false, segmented = false }: { summary: ProgressSummary; compact?: boolean; segmented?: boolean }) {
  const percentage = formatPercentage(summary.percentage)
  const label = summary.published_lessons === 0
    ? 'El curso aún no tiene lecciones publicadas'
    : `${summary.completed_lessons} de ${summary.published_lessons} ${summary.published_lessons === 1 ? 'lección completada' : 'lecciones completadas'}`
  const segments = segmented && summary.published_lessons > 0 && summary.published_lessons <= MAX_SEGMENTS ? summary.published_lessons : 0

  return (
    <div className={`course-progress ${compact ? 'course-progress--compact' : ''} ${summary.is_completed ? 'is-completed' : ''}`}>
      <div className="course-progress__head">
        <span className="course-progress__label">{label}</span>
        {summary.is_completed ? <Badge variant="success">Finalizado</Badge> : <strong>{percentage}%</strong>}
      </div>
      <div className={`course-progress__track ${segments ? 'course-progress__track--segmented' : ''}`} role="progressbar"
        aria-valuemin={0} aria-valuemax={100} aria-valuenow={percentage} aria-label={`Avance del curso: ${percentage}%`}>
        {segments
          ? Array.from({ length: segments }, (_, index) => <span key={index} style={{ '--segment': index } as CSSProperties}
              className={`course-progress__segment ${index < summary.completed_lessons ? 'is-done' : ''}`} />)
          : <span className="course-progress__bar" style={{ width: `${percentage}%` }} />}
      </div>
    </div>
  )
}
