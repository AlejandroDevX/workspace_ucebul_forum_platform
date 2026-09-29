import { useState } from 'react'
import { Button } from 'ucebul_mui'
import { toApiError } from '../../../lib/api-error'
import { enrollInCourse } from '../api/learning.service'
import type { ForumEnrollment } from '../types/learning.types'

export default function EnrollmentButton({ courseId, onEnrolled }: { courseId: number; onEnrolled: (enrollment: ForumEnrollment) => void }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function enroll() {
    setLoading(true)
    setError(null)
    try {
      onEnrolled(await enrollInCourse(courseId))
    } catch (failure) {
      const parsed = toApiError(failure)
      setError(parsed.status === 404 ? 'Este curso no admite inscripciones porque no está publicado.' : parsed.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="enrollment-button">
      <Button variant="primary" loading={loading} disabled={loading} onClick={() => void enroll()}>
        {loading ? 'Inscribiendo…' : 'Inscribirme en el curso'}</Button>
      {error && <p className="auth-error" role="alert">{error}</p>}
    </div>
  )
}
