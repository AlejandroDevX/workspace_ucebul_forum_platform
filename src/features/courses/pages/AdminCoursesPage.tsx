import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Button, DataIcons, Empty, Spinner, Table } from 'ucebul_mui'
import { useRequest } from '../../../lib/useRequest'
import { useAuthStore } from '../../auth/store/auth.store'
import { listCourses } from '../api/course.service'
import CourseActions from '../components/CourseActions'
import CourseCover from '../components/CourseCover'
import CourseStatusBadge from '../components/CourseStatusBadge'
import type { ForumCourse } from '../types/course.types'
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
  const canViewLessons = useAuthStore((state) => state.hasPermission('forum.lessons.view'))
  const updateCourse = (updated: ForumCourse) => courses.setData((current) => current && {
    ...current,
    data: current.data.map((item) => item.forum_course_id === updated.forum_course_id ? updated : item),
  })

  const columns = [
    { key: 'course', name: 'Curso' },
    { key: 'status', name: 'Estado', width: '120px' },
    { key: 'instructor', name: 'Instructor', width: '140px' },
    { key: 'actions', name: <span className="sr-only">Acciones</span> },
  ]

  const row = (course: ForumCourse) => ({
    course: <div className="table-course">
      <CourseCover course={course} className="table-course__cover" />
      <div className="report-cell">
        <Link className="table-link" to={`/courses/${course.forum_course_id}`}>{course.forum_course_title}</Link>
        <span className="muted">{[categoryName(course), formatDuration(course.forum_course_duration_minutes)].filter(Boolean).join(' · ')}</span>
      </div>
    </div>,
    status: <CourseStatusBadge status={course.forum_course_status} />,
    instructor: instructorLabel(course, userId),
    actions: <div className="table-actions">
      {canViewLessons && <Button size="sm" variant="default" onClick={() => navigate(`/admin/courses/${course.forum_course_id}/lessons`)}>
        Lecciones</Button>}
      <CourseActions size="sm" course={course} onDeleted={courses.reload} onUpdated={updateCourse} />
    </div>,
  })

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
          : <div className="admin-table">
              <Table columns={columns} data={result.data.map(row)} currentPage={result.meta.current_page}
                totalPages={Math.max(result.meta.last_page, 1)}
                onChangePage={(next) => { if (next >= 1 && next <= result.meta.last_page) setParams({ page: String(next) }) }} />
            </div>)}
      </div>
    </section>
  )
}
