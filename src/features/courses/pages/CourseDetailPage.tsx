import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { Badge, Button, Card, CardBody, DataIcons, Empty, Spinner } from 'ucebul_mui'
import { useAuthStore } from '../../auth/store/auth.store'
import CourseEnrollmentPanel from '../../learning/components/CourseEnrollmentPanel'
import { completedLessonIds, useCourseEnrollment } from '../../learning/utils/useCourseEnrollment'
import { useLearningPermissions } from '../../learning/utils/useLearningPermissions'
import CourseLessons from '../../lessons/components/CourseLessons'
import { useRequest } from '../../../lib/useRequest'
import { getCourse } from '../api/course.service'
import CourseActions from '../components/CourseActions'
import CourseCover from '../components/CourseCover'
import CourseStatusBadge from '../components/CourseStatusBadge'
import FavoriteButton from '../../favorites/components/FavoriteButton'
import { categoryName, formatDate, formatDuration } from '../utils/course-format'
import { instructorLabel, useCoursePermissions } from '../utils/useCoursePermissions'

export default function CourseDetailPage() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const notice: unknown = state?.notice
  const courseId = Number(useParams().courseId)
  const valid = Number.isInteger(courseId) && courseId > 0
  const { userId, canUpdate } = useCoursePermissions()
  const request = useRequest(valid ? `course-${courseId}` : null, (signal) => getCourse(courseId, signal))
  const course = request.data
  const learning = useLearningPermissions()
  const canSeeForum = useAuthStore((state) => state.status === 'authenticated' && state.hasPermission('forum.community.view'))
  // Solo los cursos publicados admiten inscripción y progreso.
  const enrollment = useCourseEnrollment(courseId, valid && learning.canView && course?.forum_course_status === 'published')

  if (!valid || request.error?.status === 404) {
    return <section className="page-section"><h1>Curso no encontrado</h1>
      <Empty icon={DataIcons.navigation.folder} title="Este curso no existe o no está disponible"
        text="Puede que haya sido eliminado o que aún no esté publicado." buttonIcon={DataIcons.buttons.arrowLongLeft}
        buttonText="Volver al catálogo" onClickButton={() => navigate('/courses')} /></section>
  }
  if (request.loading || (!course && !request.error)) return <div className="loading-block"><Spinner label="Cargando curso…" /></div>
  if (!course) {
    return <div className="auth-error load-error" role="alert"><p>{request.error?.message}</p>
      <Button size="sm" onClick={request.reload}>Reintentar</Button></div>
  }

  const category = categoryName(course)
  const published = formatDate(course.forum_course_published_at)
  const editable = canUpdate(course)

  return (
    <article className="course-detail" aria-labelledby="course-title">
      <div className="course-detail__topbar">
        <Link className="back-link" to="/courses"><span aria-hidden="true">{DataIcons.buttons.arrowLongLeft}</span> Catálogo de cursos</Link>
        {/* Vacío (y oculto) cuando el usuario no puede gestionar el curso. */}
        <div className="course-detail__manage">
          <CourseActions course={course} size="sm" onUpdated={(updated) => request.setData(() => updated)}
            onDeleted={() => navigate('/courses', { replace: true })} />
        </div>
      </div>
      {typeof notice === 'string' && <p className="notice" role="status">{notice}</p>}
      <header className="course-detail__header">
        <CourseCover course={course} className="course-detail__cover" />
        <div className="course-detail__intro">
          <div className="course-card__tags">
            {category && <Badge variant="info">{category}</Badge>}
            {course.forum_course_level && <Badge>{course.forum_course_level}</Badge>}
            <CourseStatusBadge status={course.forum_course_status} />
          </div>
          <div className="detail-title-row">
            <h1 id="course-title">{course.forum_course_title}</h1>
            <FavoriteButton kind="course" id={course.forum_course_id} title={course.forum_course_title} />
          </div>
          {course.forum_course_summary && <p className="course-detail__summary">{course.forum_course_summary}</p>}
          <dl className="course-meta course-meta--detail">
            <div><dt>Duración</dt><dd><span aria-hidden="true">{DataIcons.global.clockOutline}</span>{formatDuration(course.forum_course_duration_minutes)}</dd></div>
            <div><dt>Instructor</dt><dd><span aria-hidden="true">{DataIcons.global.userOutline}</span>{instructorLabel(course, userId)}</dd></div>
            {published && <div><dt>Publicado</dt><dd><span aria-hidden="true">{DataIcons.global.calendarOutline}</span>{published}</dd></div>}
          </dl>
          <CourseEnrollmentPanel course={course} enrollment={enrollment} />
          {canSeeForum && <Link className="course-forum-link" to={`/forum?course=${course.forum_course_id}`}>
            <span className="course-forum-link__icon" aria-hidden="true">{DataIcons.navigation.chats}</span>
            <span className="course-forum-link__text"><strong>Preguntas de la comunidad</strong>
              <small>Consulta dudas de otros estudiantes o abre un tema sobre este curso</small></span>
            <span className="course-forum-link__arrow" aria-hidden="true">{DataIcons.buttons.arrowLongRight}</span></Link>}
        </div>
      </header>
      {(course.forum_course_description || editable) && <Card className="course-detail__body"><CardBody>
        <h2>Sobre este curso</h2>
        {course.forum_course_description
          ? <p className="course-detail__description">{course.forum_course_description}</p>
          : <div className="course-detail__empty">
              <p className="muted">Los estudiantes no verán esta sección hasta que agregues una descripción.</p>
              <Button size="sm" variant="primary--outline" onClick={() => navigate(`/admin/courses/${course.forum_course_id}/edit`)}>Agregar descripción</Button>
            </div>}
      </CardBody></Card>}
      <CourseLessons course={course} completedIds={completedLessonIds(enrollment.progress)} />
    </article>
  )
}
