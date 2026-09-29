import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Badge, Button, Card, CardBody, DataIcons, Empty, Spinner, Tabs } from 'ucebul_mui'
import { useRequest } from '../../../lib/useRequest'
import CourseCover from '../../courses/components/CourseCover'
import { categoryName } from '../../courses/utils/course-format'
import { listAllMyCourses } from '../api/learning.service'
import ContinueLearning from '../components/ContinueLearning'
import CourseProgress from '../components/CourseProgress'
import type { ForumEnrollment } from '../types/learning.types'

type Filter = 'active' | 'completed'

export default function MyCoursesPage() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState<string>('active')
  // Las inscripciones de un usuario son pocas: se cargan completas para separar en curso y finalizados.
  const request = useRequest('my-courses', listAllMyCourses)
  const enrollments = request.data ?? []
  const active = enrollments.filter((enrollment) => !enrollment.progress.is_completed)
  const completed = enrollments.filter((enrollment) => enrollment.progress.is_completed)
  const visible = (filter as Filter) === 'completed' ? completed : active

  return (
    <section className="page-section" aria-labelledby="my-courses-title">
      <p className="eyebrow">Mi aprendizaje</p>
      <h1 id="my-courses-title">Mis cursos</h1>
      <p className="page-intro">Retoma tus cursos donde los dejaste y consulta los que ya finalizaste.</p>

      {request.loading && <div className="loading-block"><Spinner label="Cargando tus cursos…" /></div>}
      {!request.loading && request.error && <div className="auth-error load-error" role="alert"><p>{request.error.message}</p>
        <Button size="sm" onClick={request.reload}>Reintentar</Button></div>}
      {!request.loading && !request.error && request.data && (enrollments.length === 0
        ? <Empty icon={DataIcons.global.bookOutline} title="Todavía no te has inscrito en ningún curso"
            text="Explora el catálogo y elige el primero." buttonIcon={DataIcons.navigation.folder}
            buttonText="Explorar cursos" onClickButton={() => navigate('/courses')} />
        : <>
            <div className="my-courses-tabs">
              <Tabs activeTab={filter} onChange={setFilter} tabs={[
                { label: `En curso (${active.length})`, value: 'active' },
                { label: `Finalizados (${completed.length})`, value: 'completed' },
              ]} />
            </div>
            {visible.length === 0
              ? <p className="muted my-courses-empty">{filter === 'completed'
                  ? 'Aún no has finalizado ningún curso. ¡Sigue avanzando!'
                  : 'No tienes cursos en curso. Todos tus cursos están finalizados.'}</p>
              : <ul className="course-grid">
                  {visible.map((enrollment) => <li key={enrollment.forum_enrollment_id}><EnrollmentCard enrollment={enrollment} /></li>)}
                </ul>}
          </>)}
    </section>
  )
}

function EnrollmentCard({ enrollment }: { enrollment: ForumEnrollment }) {
  const course = enrollment.course
  if (!course) {
    return <Card className="course-card course-card--unavailable"><CardBody>
      <Badge>No disponible</Badge>
      <h3>Curso no disponible</h3>
      <p className="course-card__description">Este curso fue retirado o dejó de estar publicado. Tu inscripción se conserva.</p>
    </CardBody></Card>
  }
  const courseId = course.forum_course_id
  const summary = enrollment.progress
  return (
    <Card className="course-card enrollment-card">
      <CourseCover course={course} />
      <CardBody>
        {categoryName(course) && <div className="course-card__tags"><Badge variant="info">{categoryName(course)}</Badge></div>}
        <h3><Link to={`/courses/${courseId}`}>{course.forum_course_title}</Link></h3>
        <CourseProgress summary={summary} compact />
        <div className="enrollment-card__actions">
          {!summary.is_completed && summary.published_lessons > 0 && <ContinueLearning size="sm" courseId={courseId} started={summary.completed_lessons > 0} />}
          <Link className="text-link" to={`/courses/${courseId}/learn`}>Ver progreso</Link>
        </div>
      </CardBody>
    </Card>
  )
}
