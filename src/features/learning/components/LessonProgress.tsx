import { useState } from 'react'
import { Button, DataIcons } from 'ucebul_mui'
import { toApiError } from '../../../lib/api-error'
import { completeLesson } from '../api/learning.service'
import type { ForumLessonProgress, LessonProgressWithCourse } from '../types/learning.types'
import { formatClock } from '../utils/learning-format'

interface Props {
  lessonId: number
  progress: ForumLessonProgress | null
  canTrack: boolean
  onChange: (result: LessonProgressWithCourse) => void
}

// Estado de la lección para el estudiante inscrito. La UI solo cambia con la respuesta de la API.
export default function LessonProgress({ lessonId, progress, canTrack, onChange }: Props) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const completed = progress?.forum_lesson_progress_is_completed ?? false
  const position = progress?.forum_lesson_progress_last_position_seconds ?? 0

  async function complete() {
    setSaving(true)
    setError(null)
    try {
      onChange(await completeLesson(lessonId))
    } catch (failure) {
      setError(toApiError(failure).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={`lesson-progress ${completed ? 'is-completed' : ''}`}>
      <span className="lesson-progress__icon" aria-hidden="true">{completed ? DataIcons.global.checkOutline : DataIcons.global.clockOutline}</span>
      <div className="lesson-progress__text">
        <strong>{completed ? 'Lección completada' : 'Lección en curso'}</strong>
        <span className="muted">{completed
          ? 'Tu avance quedó registrado.'
          : position > 0 ? `Tu video quedó guardado en ${formatClock(position)}.` : 'Cuando termines, márcala como completada.'}</span>
      </div>
      {!completed && canTrack && <Button variant="primary" loading={saving} disabled={saving} onClick={() => void complete()}>
        {saving ? 'Guardando…' : 'Marcar como completada'}</Button>}
      {error && <p className="auth-error lesson-progress__error" role="alert">{error}</p>}
    </div>
  )
}
