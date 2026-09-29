import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, DataIcons } from 'ucebul_mui'
import { toApiError } from '../../../lib/api-error'
import { getContinueLesson } from '../api/learning.service'

// Pregunta a la API por la primera lección publicada pendiente y navega a ella.
export default function ContinueLearning({ courseId, started = true, size = 'md' }: { courseId: number; started?: boolean; size?: 'sm' | 'md' }) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function go() {
    setLoading(true)
    setMessage(null)
    try {
      const next = await getContinueLesson(courseId)
      if (next.lesson) navigate(`/courses/${courseId}/lessons/${next.lesson.forum_lesson_id}`)
      else setMessage(next.published_lessons === 0
        ? 'Este curso todavía no tiene lecciones publicadas.'
        : 'Completaste todas las lecciones de este curso.')
    } catch (failure) {
      setMessage(toApiError(failure).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="continue-learning">
      <Button size={size} variant="primary" loading={loading} disabled={loading} onClick={() => void go()}>
        <span className="button-icon" aria-hidden="true">{DataIcons.buttons.arrowLongRight}</span>
        {started ? 'Continuar' : 'Empezar'}
      </Button>
      {message && <p className="continue-learning__message" role="status">{message}</p>}
    </div>
  )
}
