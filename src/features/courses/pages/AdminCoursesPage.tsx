import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Badge, Button, Card, CardBody, DataIcons, Empty, Pagination, Spinner } from 'ucebul_mui'
import { useRequest } from '../../../lib/useRequest'
import { listCourses } from '../api/course.service'
import CourseActions from '../components/CourseActions'
import CourseCover from '../components/CourseCover'
import CourseStatusBadge from '../components/CourseStatusBadge'
import { categoryName, formatDuration } from '../utils/course-format'
import { instructorLabel, useCoursePermissions } from '../utils/useCoursePermissions'

const PER_PAGE = 15

export default function AdminCoursesPage() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const requested = Number(params.get('page'))
  const page = Number.isInteger(requested) && requested > 0 ? requested : 1
  const { userId, canCreate } = useCoursePermissions()
  const courses = useRequest(`admin-courses-${page}`, (signal) => listCourses({ page, per_page: PER_PAGE }, signal))
  const result = courses.data

  return (
    <section className="page-section" aria-labelledby="admin-courses-title">
      <div className="page-title-row">
        <div>
          <p className="eyebrow">Administración</p>
          <h1 id="admin-courses-title">Gestión de cursos</h1>
          <p className="page-intro">Incluye los cursos publicados y los borradores o archivados que puedes gestionar.</p>
        </div>
        {canCreate && <Button variant="primary" onClick={() => navigate('/admin/courses/new')}>
          <span className="button-icon" aria-hidden="true">{DataIcons.buttons.plus}</span> Nuevo curso</Button>}
      </div>

      <div aria-live="polite" aria-busy={courses.loading}>
        {courses.loading && <div className="loading-block"><Spinner label="Cargando cursos…" /></div>}
        {!courses.loading && courses.error && <div className="auth-error load-error" role="alert"><p>{courses.error.message}</p>
          <Button size="sm" onClick={courses.reload}>Reintentar</Button></div>}
        {!courses.loading && !courses.error && result && (result.data.length === 0
          ? <Empty icon={DataIcons.navigation.folder} title="Aún no hay cursos"
              text={canCreate ? 'Crea el primer curso para empezar a construir el catálogo.' : 'No hay cursos que puedas gestionar.'}
              buttonIcon={canCreate ? DataIcons.buttons.plus : DataIcons.buttons.arrowLongLeft}
              buttonText={canCreate ? 'Crear curso' : 'Volver al panel'}
              onClickButton={() => navigate(canCreate ? '/admin/courses/new' : '/admin')} />
          : <>
              <ul className="admin-list">
                {result.data.map((course) => (
                  <li key={course.forum_course_id}>
                    <Card className="admin-course"><CardBody>
                      <CourseCover course={course} className="admin-course__cover" />
                      <div className="admin-course__info">
                        <div className="course-card__tags">
                          <CourseStatusBadge status={course.forum_course_status} />
                          {categoryName(course) && <Badge variant="info">{categoryName(course)}</Badge>}
                        </div>
                        <h2><Link to={`/courses/${course.forum_course_id}`}>{course.forum_course_title}</Link></h2>
                        <p className="muted">{formatDuration(course.forum_course_duration_minutes)} · {instructorLabel(course, userId)}</p>
                      </div>
                      <CourseActions size="sm" course={course} onDeleted={courses.reload}
                        onUpdated={(updated) => courses.setData((current) => current && {
                          ...current,
                          data: current.data.map((item) => item.forum_course_id === updated.forum_course_id ? updated : item),
                        })} />
                    </CardBody></Card>
                  </li>
                ))}
              </ul>
              {result.meta.last_page > 1 && <nav className="pagination-wrap" aria-label="Paginación de cursos">
                <Pagination totalPages={result.meta.last_page} currentPage={result.meta.current_page}
                  onChangePage={(next) => setParams({ page: String(next) })} />
              </nav>}
            </>)}
      </div>
    </section>
  )
}
