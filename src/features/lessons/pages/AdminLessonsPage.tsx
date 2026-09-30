import { Link, useNavigate, useParams } from 'react-router-dom'
import { Badge, Button, Card, CardBody, DataIcons, Dialog, Empty, IconButton, Spinner, Table } from 'ucebul_mui'
import { useRequest } from '../../../lib/useRequest'
import { getCourse } from '../../courses/api/course.service'
import CourseStatusBadge from '../../courses/components/CourseStatusBadge'
import { formatDuration } from '../../courses/utils/course-format'
import type { ForumCourse } from '../../courses/types/course.types'
import { listAllCourseLessons } from '../api/lesson.service'
import type { ForumLesson } from '../types/lesson.types'
import { sortLessons } from '../utils/lesson-payload'
import { useLessonActions } from '../utils/useLessonActions'
import { useLessonPermissions } from '../utils/useLessonPermissions'

export default function AdminLessonsPage() {
  const navigate = useNavigate()
  const courseId = Number(useParams().courseId)
  const valid = Number.isInteger(courseId) && courseId > 0
  const course = useRequest(valid ? `admin-course-${courseId}` : null, (signal) => getCourse(courseId, signal))

  if (!valid || course.error?.status === 404) {
    return <section className="page-section"><h1>Curso no encontrado</h1>
      <Empty icon={DataIcons.navigation.folder} title="Este curso no existe o no puedes gestionarlo" text="Vuelve al listado de cursos."
        buttonIcon={DataIcons.buttons.arrowLongLeft} buttonText="Volver a cursos" onClickButton={() => navigate('/admin/courses')} /></section>
  }
  if (course.loading || (!course.data && !course.error)) return <div className="loading-block"><Spinner label="Cargando curso…" /></div>
  if (!course.data) {
    return <div className="auth-error load-error" role="alert"><p>{course.error?.message}</p>
      <Button size="sm" onClick={course.reload}>Reintentar</Button></div>
  }
  return <CourseLessonsAdmin course={course.data} />
}

function CourseLessonsAdmin({ course }: { course: ForumCourse }) {
  const navigate = useNavigate()
  const courseId = course.forum_course_id
  const permissions = useLessonPermissions(course)
  const request = useRequest(`admin-lessons-${courseId}`, async (signal) => sortLessons(await listAllCourseLessons(courseId, signal)))
  const lessons = request.data ?? []
  const actions = useLessonActions(courseId, lessons, (next) => request.setData(() => next))
  const disabled = actions.busy !== null
  const newLesson = () => navigate(`/admin/courses/${courseId}/lessons/new`)

  const columns = [
    { key: 'order', name: 'Orden', width: '110px' },
    { key: 'title', name: 'Lección' },
    { key: 'status', name: 'Estado', width: '130px' },
    { key: 'duration', name: 'Duración', width: '110px' },
    { key: 'resources', name: 'Recursos', width: '100px' },
    ...(permissions.canManage ? [{ key: 'actions', name: <span className="sr-only">Acciones</span> }] : []),
  ]

  const row = (lesson: ForumLesson, index: number) => ({
    order: <span className="lesson-order-cell">
      <span className="lesson-list__number">{index + 1}</span>
      {permissions.canUpdate && lessons.length > 1 && <span className="lesson-list__order">
        <IconButton size="sm" className="icon-up" icon={DataIcons.navigation.arrowDown} label={`Subir «${lesson.forum_lesson_title}»`}
          disabled={disabled || index === 0} onClick={() => void actions.move(lesson, index)} />
        <IconButton size="sm" icon={DataIcons.navigation.arrowDown} label={`Bajar «${lesson.forum_lesson_title}»`}
          disabled={disabled || index === lessons.length - 1} onClick={() => void actions.move(lesson, index + 2)} />
      </span>}
    </span>,
    title: <div className="report-cell">
      <Link className="table-link" to={`/courses/${courseId}/lessons/${lesson.forum_lesson_id}`}>{lesson.forum_lesson_title}</Link>
      {lesson.forum_lesson_is_preview && <span><Badge variant="info">Vista previa</Badge></span>}
    </div>,
    status: <Badge variant={lesson.forum_lesson_status === 'published' ? 'success' : 'warning'}>
      {lesson.forum_lesson_status === 'published' ? 'Publicada' : 'Borrador'}</Badge>,
    duration: lesson.forum_lesson_duration_minutes > 0 ? formatDuration(lesson.forum_lesson_duration_minutes) : '—',
    resources: lesson.resources?.length ?? 0,
    actions: <div className="table-actions">
      {permissions.canPublish && lesson.forum_lesson_status !== 'published' && <Button size="sm" variant="primary"
        loading={actions.busy === lesson.forum_lesson_id} disabled={disabled} onClick={() => void actions.publish(lesson)}>Publicar</Button>}
      {permissions.canUpdate && <Button size="sm" variant="primary--outline" disabled={disabled}
        onClick={() => navigate(`/admin/courses/${courseId}/lessons/${lesson.forum_lesson_id}/edit`)}>Editar</Button>}
      {permissions.canDelete && <Button size="sm" variant="danger--outline" disabled={disabled}
        onClick={() => actions.setConfirm(lesson)}>Eliminar</Button>}
    </div>,
  })

  return (
    <section className="page-section" aria-labelledby="admin-lessons-title">
      <Link className="back-link" to="/admin/courses"><span aria-hidden="true">{DataIcons.buttons.arrowLongLeft}</span> Cursos</Link>
      <div className="page-title-row">
        <div>
          <p className="eyebrow">Lecciones del curso</p>
          <h1 id="admin-lessons-title">{course.forum_course_title}</h1>
          <p className="page-intro"><CourseStatusBadge status={course.forum_course_status} /> Ordena, publica y edita el contenido del curso.</p>
        </div>
        {permissions.canCreate && <Button variant="primary" onClick={newLesson}>
          <span className="button-icon" aria-hidden="true">{DataIcons.buttons.plus}</span> Nueva lección</Button>}
      </div>
      {!permissions.canManage && <p className="notice" role="status">Solo el instructor del curso puede crear, ordenar, publicar o eliminar sus lecciones.</p>}
      {actions.error && <p className="auth-error" role="alert">{actions.error}</p>}

      <div aria-live="polite" aria-busy={request.loading}>
        {request.loading && <div className="loading-block"><Spinner label="Cargando lecciones…" /></div>}
        {!request.loading && request.error && <div className="auth-error load-error" role="alert"><p>{request.error.message}</p>
          <Button size="sm" onClick={request.reload}>Reintentar</Button></div>}
        {!request.loading && !request.error && request.data && (lessons.length === 0
          ? <Card><CardBody><Empty icon={DataIcons.global.bookOutline} title="Este curso aún no tiene lecciones"
              text={permissions.canCreate ? 'Agrega la primera lección para empezar a construir el contenido.' : 'El instructor todavía no ha agregado lecciones.'}
              buttonIcon={permissions.canCreate ? DataIcons.buttons.plus : DataIcons.buttons.arrowLongLeft}
              buttonText={permissions.canCreate ? 'Crear lección' : 'Volver a cursos'}
              onClickButton={permissions.canCreate ? newLesson : () => navigate('/admin/courses')} /></CardBody></Card>
          // Todas las lecciones en una sola página: el reordenamiento trabaja sobre la lista completa.
          : <div className="admin-table">
              <Table columns={columns} data={lessons.map(row)} currentPage={1} totalPages={1} onChangePage={() => undefined} />
            </div>)}
      </div>

      <Dialog open={actions.confirm !== null} typeDialog="danger" titleDialog="Eliminar lección"
        textDialog={`¿Eliminar «${actions.confirm?.forum_lesson_title ?? ''}»? También se borrarán sus recursos y el progreso de los estudiantes.`}
        buttonCancelDialog="Cancelar" buttonConfirmDialog="Eliminar"
        onCancelDialog={() => actions.setConfirm(null)} callbackDialog={() => { if (actions.confirm) void actions.remove(actions.confirm) }} />
    </section>
  )
}
