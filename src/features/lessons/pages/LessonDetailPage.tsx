import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { Button, Card, CardBody, DataIcons, Empty, Spinner } from 'ucebul_mui'
import { toApiError } from '../../../lib/api-error'
import { useRequest } from '../../../lib/useRequest'
import { getCourse } from '../../courses/api/course.service'
import CourseProgress from '../../learning/components/CourseProgress'
import EnrollmentButton from '../../learning/components/EnrollmentButton'
import LessonProgress from '../../learning/components/LessonProgress'
import type { LessonProgressWithCourse } from '../../learning/types/learning.types'
import { completedLessonIds, splitLessonProgress, useCourseEnrollment } from '../../learning/utils/useCourseEnrollment'
import { useLearningPermissions } from '../../learning/utils/useLearningPermissions'
import { useVideoProgress } from '../../learning/utils/useVideoProgress'
import { getLesson, listAllCourseLessons, publishLesson } from '../api/lesson.service'
import LessonContent, { LessonBody } from '../components/LessonContent'
import LessonList from '../components/LessonList'
import LessonNavigation from '../components/LessonNavigation'
import LessonResourceList from '../components/LessonResourceList'
import { sortLessons } from '../utils/lesson-payload'
import { useLessonPermissions } from '../utils/useLessonPermissions'

export default function LessonDetailPage() {
  const params = useParams()
  const navigate = useNavigate()
  const courseId = Number(params.courseId)
  const lessonId = Number(params.lessonId)
  const valid = courseId > 0 && lessonId > 0
  const lessonRequest = useRequest(valid ? `lesson-${lessonId}` : null, (signal) => getLesson(lessonId, signal))
  const courseRequest = useRequest(valid ? `course-${courseId}` : null, (signal) => getCourse(courseId, signal))
  const listRequest = useRequest(valid ? `course-lessons-${courseId}` : null,
    async (signal) => sortLessons(await listAllCourseLessons(courseId, signal)))
  const course = courseRequest.data
  const lesson = lessonRequest.data
  const permissions = useLessonPermissions(course)
  const [publishing, setPublishing] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const learning = useLearningPermissions()
  const enrollment = useCourseEnrollment(courseId, valid && learning.canView)
  const lessonProgress = enrollment.progress?.lessons.find((item) => item.forum_lesson_id === lessonId)?.progress ?? null
  // Solo se registra avance de lecciones publicadas en cursos donde el usuario está inscrito.
  const trackable = enrollment.status === 'enrolled' && learning.canTrack && lesson?.forum_lesson_status === 'published'
  function applyProgress(result: LessonProgressWithCourse) {
    const { course: summary, lessonProgress: saved } = splitLessonProgress(result)
    enrollment.applySummary(summary, saved)
  }
  const video = useVideoProgress({
    lessonId,
    enabled: trackable,
    initialPosition: lessonProgress?.forum_lesson_progress_last_position_seconds ?? 0,
    onSaved: applyProgress,
  })
  const backToCourse = () => navigate(`/courses/${courseId}`)
  const afterEnroll = () => { enrollment.reload(); lessonRequest.reload(); listRequest.reload() }

  if (!valid || lessonRequest.error?.status === 404) {
    return <section className="page-section"><h1>Lección no encontrada</h1>
      <Empty icon={DataIcons.global.bookOutline} title="Esta lección no existe o no está disponible"
        text="Puede que haya sido eliminada o que aún no esté publicada." buttonIcon={DataIcons.buttons.arrowLongLeft}
        buttonText="Volver al curso" onClickButton={backToCourse} /></section>
  }
  if (lessonRequest.error?.status === 403) {
    return <section className="page-section"><h1>Lección reservada</h1>
      <Empty icon={DataIcons.global.lockClosedOutline} title="Esta lección es para estudiantes inscritos"
        text="Inscríbete en el curso para acceder a todas sus lecciones. Las lecciones de vista previa están abiertas para todos."
        buttonIcon={DataIcons.buttons.arrowLongLeft} buttonText="Volver al curso" onClickButton={backToCourse} />
      {learning.canEnroll && enrollment.status === 'not-enrolled' && <div className="enroll-cta">
        <EnrollmentButton courseId={courseId} onEnrolled={afterEnroll} /></div>}
    </section>
  }
  if (lessonRequest.loading || (!lesson && !lessonRequest.error)) return <div className="loading-block"><Spinner label="Cargando lección…" /></div>
  if (!lesson) {
    return <div className="auth-error load-error" role="alert"><p>{lessonRequest.error?.message}</p>
      <Button size="sm" onClick={lessonRequest.reload}>Reintentar</Button></div>
  }
  // La URL debe corresponder al curso real de la lección.
  if (lesson.forum_lesson_course_id !== courseId) {
    return <Navigate to={`/courses/${lesson.forum_lesson_course_id}/lessons/${lesson.forum_lesson_id}`} replace />
  }

  const lessons = listRequest.data ?? []
  const completedIds = completedLessonIds(enrollment.progress)
  const firstVideo = [...(lesson.resources ?? [])].sort((a, b) => a.forum_lesson_resource_position - b.forum_lesson_resource_position)
    .find((resource) => resource.forum_lesson_resource_type === 'video')
  const index = lessons.findIndex((item) => item.forum_lesson_id === lesson.forum_lesson_id)
  const position = index >= 0 ? index + 1 : lesson.forum_lesson_position
  const total = Math.max(lessons.length, position)

  async function publish() {
    if (!lesson) return
    setPublishing(true)
    setActionError(null)
    try {
      const saved = await publishLesson(lesson.forum_lesson_id)
      lessonRequest.setData(() => saved)
      listRequest.setData((current) => current?.map((item) => item.forum_lesson_id === saved.forum_lesson_id ? { ...item, ...saved } : item))
    } catch (failure) {
      setActionError(toApiError(failure).message)
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div className="lesson-page">
      <article className="lesson-main" aria-labelledby="lesson-title">
        <Link className="back-link" to={`/courses/${courseId}`}>
          <span aria-hidden="true">{DataIcons.buttons.arrowLongLeft}</span> {course?.forum_course_title ?? 'Volver al curso'}</Link>
        <LessonContent lesson={lesson} position={position} total={total} />

        {(permissions.canUpdate || permissions.canPublish) && <div className="course-actions">
          <div className="course-actions__buttons">
            {permissions.canUpdate && <Button size="sm" variant="primary--outline"
              onClick={() => navigate(`/admin/courses/${courseId}/lessons/${lesson.forum_lesson_id}/edit`)}>Editar lección</Button>}
            {permissions.canPublish && lesson.forum_lesson_status !== 'published' && <Button size="sm" variant="primary"
              loading={publishing} disabled={publishing} onClick={() => void publish()}>Publicar lección</Button>}
          </div>
          {actionError && <p className="auth-error" role="alert">{actionError}</p>}
        </div>}

        {lesson.resources && lesson.resources.length > 0 && <section className="lesson-section" aria-labelledby="resources-title">
          <h2 id="resources-title">Recursos</h2>
          <LessonResourceList key={lesson.forum_lesson_id} resources={lesson.resources} autoOpenVideo
            videoTracking={trackable && firstVideo ? {
              resourceId: firstVideo.forum_lesson_resource_id,
              startAt: lessonProgress?.forum_lesson_progress_last_position_seconds ?? 0,
              handlers: video.handlers,
            } : undefined} />
          {video.error && <p className="auth-error" role="alert">{video.error}</p>}
        </section>}

        <Card className="lesson-section"><CardBody>
          <h2 className="sr-only">Contenido</h2>
          <LessonBody lesson={lesson} />
        </CardBody></Card>

        {enrollment.status === 'enrolled' && lesson.forum_lesson_status === 'published' && <Card className="lesson-section"><CardBody>
          <LessonProgress lessonId={lesson.forum_lesson_id} progress={lessonProgress} canTrack={learning.canTrack} onChange={applyProgress} />
          {enrollment.progress && <CourseProgress summary={enrollment.progress} compact />}
          {enrollment.progress?.is_completed && <p className="notice" role="status">¡Completaste todas las lecciones del curso!</p>}
        </CardBody></Card>}
        {enrollment.status === 'not-enrolled' && learning.canEnroll && <Card className="lesson-section enroll-card"><CardBody>
          <div><strong>Estás viendo una lección de vista previa.</strong>
            <p className="muted">Inscríbete para acceder a todo el curso y registrar tu avance.</p></div>
          <EnrollmentButton courseId={courseId} onEnrolled={afterEnroll} />
        </CardBody></Card>}

        <LessonNavigation courseId={courseId} lessons={lessons} currentId={lesson.forum_lesson_id} />
      </article>

      {lessons.length > 0 && <aside className="lesson-aside" aria-label="Lecciones del curso">
        <h2>Lecciones</h2>
        <LessonList compact courseId={courseId} lessons={lessons} currentId={lesson.forum_lesson_id} completedIds={completedIds} />
      </aside>}
    </div>
  )
}
