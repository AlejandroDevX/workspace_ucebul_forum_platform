import { useNavigate } from 'react-router-dom'
import { Button, Card, CardBody, DataIcons, Empty, Spinner } from 'ucebul_mui'
import { useRequest } from '../../../lib/useRequest'
import type { ForumCourse } from '../../courses/types/course.types'
import { listAllCourseLessons } from '../api/lesson.service'
import { sortLessons } from '../utils/lesson-payload'
import { useLessonPermissions } from '../utils/useLessonPermissions'
import LessonList from './LessonList'

// Sección de lecciones del detalle del curso: índice para estudiantes y gestión para el instructor.
export default function CourseLessons({ course, completedIds }: { course: ForumCourse; completedIds?: Set<number> }) {
  const navigate = useNavigate()
  const permissions = useLessonPermissions(course)
  const courseId = course.forum_course_id
  const request = useRequest(permissions.canView ? `course-lessons-${courseId}` : null,
    async (signal) => sortLessons(await listAllCourseLessons(courseId, signal)))
  const lessons = request.data

  if (!permissions.canView) return null

  return (
    <Card className="course-lessons"><CardBody>
      <div className="section-title-row">
        <h2 id="lessons-title">Contenido del curso</h2>
        {permissions.canCreate && <Button size="sm" variant="primary" onClick={() => navigate(`/admin/courses/${courseId}/lessons/new`)}>
          <span className="button-icon" aria-hidden="true">{DataIcons.buttons.plus}</span> Nueva lección</Button>}
      </div>
      {request.loading && <div className="loading-block"><Spinner label="Cargando lecciones…" /></div>}
      {!request.loading && request.error && <div className="auth-error load-error" role="alert">
        <p>{request.error.status === 404 ? 'Las lecciones estarán disponibles cuando el curso se publique.' : request.error.message}</p>
        {request.error.status !== 404 && <Button size="sm" onClick={request.reload}>Reintentar</Button>}
      </div>}
      {!request.loading && !request.error && lessons && (lessons.length === 0
        ? <Empty icon={DataIcons.global.bookOutline}
            title={permissions.canCreate ? 'Este curso aún no tiene lecciones' : 'No hay lecciones disponibles'}
            text={permissions.canCreate
              ? 'Agrega la primera lección para empezar a construir el contenido.'
              : 'Si el curso tiene lecciones reservadas a estudiantes inscritos, las verás al inscribirte.'}
            buttonIcon={permissions.canCreate ? DataIcons.buttons.plus : DataIcons.navigation.folder}
            buttonText={permissions.canCreate ? 'Crear lección' : 'Explorar otros cursos'}
            onClickButton={() => navigate(permissions.canCreate ? `/admin/courses/${courseId}/lessons/new` : '/courses')} />
        : <LessonList courseId={courseId} lessons={lessons} permissions={permissions} completedIds={completedIds}
            onChange={(next) => request.setData(() => next)} />)}
    </CardBody></Card>
  )
}
