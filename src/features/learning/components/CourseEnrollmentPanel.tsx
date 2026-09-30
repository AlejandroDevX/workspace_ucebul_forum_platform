import { Link } from 'react-router-dom'
import { Button, DataIcons, Spinner } from 'ucebul_mui'
import type { ForumCourse } from '../../courses/types/course.types'
import type { useCourseEnrollment } from '../utils/useCourseEnrollment'
import { useLearningPermissions } from '../utils/useLearningPermissions'
import ContinueLearning from './ContinueLearning'
import CourseProgress from './CourseProgress'
import EnrollmentButton from './EnrollmentButton'

type Enrollment = ReturnType<typeof useCourseEnrollment>

// Estado de aprendizaje del usuario en el detalle del curso.
export default function CourseEnrollmentPanel({ course, enrollment }: { course: ForumCourse; enrollment: Enrollment }) {
  const learning = useLearningPermissions()
  const courseId = course.forum_course_id

  if (enrollment.status === 'loading') return <div className="enrollment-panel"><Spinner size="sm" label="Consultando tu inscripción…" /></div>
  if (enrollment.status === 'error') {
    return <div className="enrollment-panel auth-error load-error" role="alert"><p>No pudimos consultar tu inscripción: {enrollment.error?.message}</p>
      <Button size="sm" onClick={enrollment.reload}>Reintentar</Button></div>
  }
  if (enrollment.status === 'enrolled' && enrollment.progress) {
    const summary = enrollment.progress
    return (
      <div className="enrollment-panel is-enrolled">
        <CourseProgress summary={summary} segmented />
        <div className="enrollment-panel__actions">
          {!summary.is_completed && summary.published_lessons > 0 && <ContinueLearning courseId={courseId} started={summary.completed_lessons > 0} />}
          <Link className="text-link" to={`/courses/${courseId}/learn`}>
            Ver mi progreso <span aria-hidden="true">{DataIcons.buttons.arrowLongRight}</span></Link>
        </div>
      </div>
    )
  }
  if (enrollment.status === 'not-enrolled' && learning.canEnroll && course.forum_course_status === 'published') {
    return (
      <div className="enrollment-panel">
        <p className="muted">Inscríbete para acceder a todas las lecciones y registrar tu avance.</p>
        <EnrollmentButton courseId={courseId} onEnrolled={enrollment.reload} />
      </div>
    )
  }
  return null
}
