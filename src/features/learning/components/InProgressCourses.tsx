import { Link, useNavigate } from 'react-router-dom'
import { Button, Card, CardBody, DataIcons, Empty, Spinner } from 'ucebul_mui'
import { useRequest } from '../../../lib/useRequest'
import { listAllMyCourses } from '../api/learning.service'
import type { ForumEnrollment } from '../types/learning.types'
import ContinueLearning from './ContinueLearning'
import CourseProgress from './CourseProgress'

type EnrollmentsRequest = ReturnType<typeof useRequest<ForumEnrollment[]>>

// Cursos inscritos sin finalizar, para retomar desde el inicio. `enrollments` evita repetir la carga
// cuando la página ya consultó /forum/my-courses.
export default function InProgressCourses({ limit = 3, enrollments }: { limit?: number; enrollments?: EnrollmentsRequest }) {
  const navigate = useNavigate()
  const own = useRequest(enrollments ? null : 'my-courses', listAllMyCourses)
  const request = enrollments ?? own
  const active = (request.data ?? []).filter((enrollment) => enrollment.course && !enrollment.progress.is_completed)

  if (request.loading) return <div className="loading-block"><Spinner label="Cargando tus cursos…" /></div>
  if (request.error) {
    return <div className="auth-error load-error" role="alert"><p>{request.error.message}</p>
      <Button size="sm" onClick={request.reload}>Reintentar</Button></div>
  }
  if (active.length === 0) {
    return <Empty icon={DataIcons.global.bookOutline} title="No tienes cursos en progreso"
      text="Inscríbete en un curso del catálogo y retómalo desde aquí cuando quieras."
      buttonIcon={DataIcons.navigation.folder} buttonText="Explorar cursos" onClickButton={() => navigate('/courses')} />
  }

  return (
    <>
      <ul className="in-progress-list">
        {active.slice(0, limit).map((enrollment) => {
          const course = enrollment.course!
          return (
            <li key={enrollment.forum_enrollment_id}>
              <Card className="in-progress-card"><CardBody>
                <div className="in-progress-card__info">
                  <Link to={`/courses/${course.forum_course_id}`}><strong>{course.forum_course_title}</strong></Link>
                  <CourseProgress summary={enrollment.progress} compact />
                </div>
                {enrollment.progress.published_lessons > 0 && <ContinueLearning size="sm" courseId={course.forum_course_id}
                  started={enrollment.progress.completed_lessons > 0} />}
              </CardBody></Card>
            </li>
          )
        })}
      </ul>
      {active.length > limit && <Link className="text-link" to="/my-courses">Ver todos mis cursos
        <span aria-hidden="true">{DataIcons.buttons.arrowLongRight}</span></Link>}
    </>
  )
}
