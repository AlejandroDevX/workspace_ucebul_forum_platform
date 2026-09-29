import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button, Card, CardBody, DataIcons, Empty, Spinner } from 'ucebul_mui'
import { useRequest } from '../../../lib/useRequest'
import { getCourse } from '../../courses/api/course.service'
import { formatDate, formatDuration } from '../../courses/utils/course-format'
import CompletedLessonIndicator from '../components/CompletedLessonIndicator'
import ContinueLearning from '../components/ContinueLearning'
import CourseProgress from '../components/CourseProgress'
import EnrollmentButton from '../components/EnrollmentButton'
import { formatClock } from '../utils/learning-format'
import { useCourseEnrollment } from '../utils/useCourseEnrollment'
import { useLearningPermissions } from '../utils/useLearningPermissions'

// Mi avance en un curso: resumen de Laravel y estado de cada lección publicada.
export default function LearningPage() {
  const navigate = useNavigate()
  const courseId = Number(useParams().courseId)
  const valid = courseId > 0
  const learning = useLearningPermissions()
  const course = useRequest(valid ? `course-${courseId}` : null, (signal) => getCourse(courseId, signal))
  const enrollment = useCourseEnrollment(courseId, valid)
  const progress = enrollment.progress
  const title = course.data?.forum_course_title ?? 'Curso'

  if (!valid || enrollment.status === 'unavailable') {
    return <section className="page-section"><h1>Curso no disponible</h1>
      <Empty icon={DataIcons.navigation.folder} title="Este curso no está disponible"
        text="Solo se puede seguir el avance de cursos publicados." buttonIcon={DataIcons.buttons.arrowLongLeft}
        buttonText="Ir a mis cursos" onClickButton={() => navigate('/my-courses')} /></section>
  }
  if (enrollment.status === 'loading' || enrollment.status === 'idle') return <div className="loading-block"><Spinner label="Cargando tu progreso…" /></div>
  if (enrollment.status === 'error') {
    return <div className="auth-error load-error" role="alert"><p>{enrollment.error?.message}</p>
      <Button size="sm" onClick={enrollment.reload}>Reintentar</Button></div>
  }

  return (
    <section className="page-section learning-page" aria-labelledby="learning-title">
      <Link className="back-link" to={`/courses/${courseId}`}><span aria-hidden="true">{DataIcons.buttons.arrowLongLeft}</span> Detalle del curso</Link>
      <p className="eyebrow">Mi aprendizaje</p>
      <h1 id="learning-title">{title}</h1>

      {enrollment.status === 'not-enrolled' || !progress
        ? <Card className="form-card"><CardBody>
            <Empty icon={DataIcons.global.bookOutline} title="Aún no estás inscrito en este curso"
              text="Inscríbete para seguir tu avance lección por lección." buttonIcon={DataIcons.buttons.arrowLongLeft}
              buttonText="Ver el curso" onClickButton={() => navigate(`/courses/${courseId}`)} />
            {learning.canEnroll && <div className="enroll-cta"><EnrollmentButton courseId={courseId} onEnrolled={enrollment.reload} /></div>}
          </CardBody></Card>
        : <>
            <Card className="form-card learning-summary"><CardBody>
              <CourseProgress summary={progress} />
              {progress.is_completed
                ? <p className="notice" role="status">Curso finalizado{formatDate(progress.forum_enrollment_completed_at) ? ` el ${formatDate(progress.forum_enrollment_completed_at)}` : ''}. ¡Buen trabajo!</p>
                : progress.published_lessons > 0 && <ContinueLearning courseId={courseId} started={progress.completed_lessons > 0} />}
            </CardBody></Card>

            <h2 className="learning-page__subtitle">Lecciones</h2>
            {progress.lessons.length === 0
              ? <p className="muted">El curso todavía no tiene lecciones publicadas.</p>
              : <ol className="progress-lessons">
                  {progress.lessons.map((lesson, index) => {
                    const done = lesson.progress?.forum_lesson_progress_is_completed ?? false
                    const position = lesson.progress?.forum_lesson_progress_last_position_seconds ?? 0
                    return (
                      <li key={lesson.forum_lesson_id} className={done ? 'is-completed' : ''}>
                        <CompletedLessonIndicator completed={done} />
                        <div className="progress-lessons__info">
                          <Link to={`/courses/${courseId}/lessons/${lesson.forum_lesson_id}`}>{index + 1}. {lesson.forum_lesson_title}</Link>
                          <span className="muted">
                            {done ? `Completada${formatDate(lesson.progress?.forum_lesson_progress_completed_at ?? null) ? ` el ${formatDate(lesson.progress?.forum_lesson_progress_completed_at ?? null)}` : ''}`
                              : position > 0 ? `Video en ${formatClock(position)}` : 'Pendiente'}
                            {lesson.forum_lesson_duration_minutes > 0 && ` · ${formatDuration(lesson.forum_lesson_duration_minutes)}`}
                          </span>
                        </div>
                      </li>
                    )
                  })}
                </ol>}
          </>}
    </section>
  )
}
