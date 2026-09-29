import { type ChangeEvent, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { Button, Card, CardBody, DataIcons, Empty, Field, Form, Spinner } from 'ucebul_mui'
import FieldErrors from '../../../components/FieldErrors'
import { type ApiError, toApiError } from '../../../lib/api-error'
import { useRequest } from '../../../lib/useRequest'
import { compose, integerInRange, matches, maxLength, required } from '../../../lib/validators'
import { getCourse } from '../../courses/api/course.service'
import type { ForumCourse } from '../../courses/types/course.types'
import { MAX_DURATION_MINUTES, SLUG_PATTERN, slugify } from '../../courses/utils/course-format'
import { createLesson, getLesson, listAllCourseLessons, reorderLessons, updateLesson } from '../api/lesson.service'
import LessonResourceList from '../components/LessonResourceList'
import ResourceUploadForm from '../components/ResourceUploadForm'
import type { ForumLesson } from '../types/lesson.types'
import { moveLesson, sortLessons, toLessonPayload } from '../utils/lesson-payload'
import { useLessonPermissions } from '../utils/useLessonPermissions'

const FIELD_NAMES = ['forum_lesson_title', 'forum_lesson_slug', 'forum_lesson_body', 'forum_lesson_duration_minutes', 'forum_lesson_is_preview', 'forum_lesson_ids']

const validators = {
  title: compose(required('Escribe el título de la lección.'), maxLength(255, 'El título admite máximo 255 caracteres.')),
  slug: compose(required('Define el identificador para la URL.'), maxLength(190, 'El identificador admite máximo 190 caracteres.'),
    matches(SLUG_PATTERN, 'Usa solo minúsculas, números y guiones entre palabras.')),
  body: maxLength(65535, 'El contenido admite máximo 65.535 caracteres.'),
  duration: integerInRange(0, MAX_DURATION_MINUTES, 'La duración debe ser un número entero de minutos, 0 o mayor.'),
}

export default function LessonFormPage() {
  const params = useParams()
  const navigate = useNavigate()
  const courseId = Number(params.courseId)
  const editing = params.lessonId !== undefined
  const lessonId = Number(params.lessonId)
  const valid = courseId > 0 && (!editing || lessonId > 0)
  const courseRequest = useRequest(valid ? `course-${courseId}` : null, (signal) => getCourse(courseId, signal))
  const listRequest = useRequest(valid ? `course-lessons-${courseId}` : null,
    async (signal) => sortLessons(await listAllCourseLessons(courseId, signal)))
  const lessonRequest = useRequest(valid && editing ? `lesson-${lessonId}` : null, (signal) => getLesson(lessonId, signal))
  const permissions = useLessonPermissions(courseRequest.data)

  const notFound = !valid || courseRequest.error?.status === 404 || lessonRequest.error?.status === 404
    || (lessonRequest.data && lessonRequest.data.forum_lesson_course_id !== courseId)
  if (notFound) {
    return <section className="page-section"><h1>{editing ? 'Lección no encontrada' : 'Curso no encontrado'}</h1>
      <Empty icon={DataIcons.global.bookOutline} title="No encontramos lo que quieres editar" text="Puede que haya sido eliminado."
        buttonIcon={DataIcons.buttons.arrowLongLeft} buttonText="Volver a cursos" onClickButton={() => navigate('/admin/courses')} /></section>
  }
  const requests = editing ? [courseRequest, listRequest, lessonRequest] : [courseRequest, listRequest]
  const failed = requests.find((request) => request.error)
  if (failed?.error) {
    return <div className="auth-error load-error" role="alert"><p>{failed.error.message}</p>
      <Button size="sm" onClick={() => requests.forEach((request) => request.reload())}>Reintentar</Button></div>
  }
  if (requests.some((request) => request.loading || !request.data)) {
    return <div className="loading-block"><Spinner label="Preparando el formulario…" /></div>
  }
  const course = courseRequest.data!
  if (editing ? !permissions.canUpdate : !permissions.canCreate) {
    return <section className="page-section"><h1>{editing ? 'Editar lección' : 'Nueva lección'}</h1>
      <Empty icon={DataIcons.global.lockClosedOutline} title="Solo el instructor del curso puede gestionar sus lecciones"
        text="Necesitas ser el instructor de este curso y tener el permiso correspondiente."
        buttonIcon={DataIcons.buttons.arrowLongLeft} buttonText="Volver al curso"
        onClickButton={() => navigate(`/courses/${courseId}`)} /></section>
  }

  return <LessonForm key={lessonRequest.data?.forum_lesson_id ?? 'new'} course={course} lessons={listRequest.data!}
    lesson={editing ? lessonRequest.data : undefined} canDeleteResources={permissions.canUpdate}
    onLessonChange={(lesson) => lessonRequest.setData(() => lesson)}
    onLessonsChange={(lessons) => listRequest.setData(() => lessons)} />
}

interface FormProps {
  course: ForumCourse
  lessons: ForumLesson[]
  lesson?: ForumLesson
  canDeleteResources: boolean
  onLessonChange: (lesson: ForumLesson) => void
  onLessonsChange: (lessons: ForumLesson[]) => void
}

function LessonForm({ course, lessons, lesson, canDeleteResources, onLessonChange, onLessonsChange }: FormProps) {
  const navigate = useNavigate()
  const { state } = useLocation()
  const courseId = course.forum_course_id
  const initialNotice: unknown = state?.notice
  const currentPosition = lesson ? lessons.findIndex((item) => item.forum_lesson_id === lesson.forum_lesson_id) + 1 : 0
  const maxPosition = lesson ? lessons.length : lessons.length + 1
  const [slug, setSlug] = useState(lesson?.forum_lesson_slug ?? '')
  const [slugTouched, setSlugTouched] = useState(Boolean(lesson))
  const [isPreview, setIsPreview] = useState(lesson?.forum_lesson_is_preview ?? false)
  const [error, setError] = useState<ApiError | null>(null)
  const [notice, setNotice] = useState<string | null>(typeof initialNotice === 'string' ? initialNotice : null)
  const [saving, setSaving] = useState(false)
  const positionValidator = compose(required('Indica el orden de la lección.'),
    integerInRange(1, maxPosition, `El orden debe ser un número entre 1 y ${maxPosition}.`))

  function clearField(name: string) {
    setError((current) => {
      if (!current?.fieldErrors[name]) return current
      const fieldErrors = { ...current.fieldErrors }
      delete fieldErrors[name]
      return { ...current, fieldErrors }
    })
  }

  async function onSubmit(values: Record<string, unknown>) {
    const payload = toLessonPayload(values, slug, isPreview)
    const position = Number(values.forum_lesson_position)
    setSaving(true)
    setError(null)
    setNotice(null)
    let saved: ForumLesson
    try {
      saved = lesson ? await updateLesson(lesson.forum_lesson_id, payload) : await createLesson(courseId, payload)
    } catch (failure) {
      setError(toApiError(failure))
      setSaving(false)
      return
    }

    // La posición no forma parte del POST/PUT: se aplica con el reordenamiento de todas las lecciones.
    let list = lesson
      ? lessons.map((item) => item.forum_lesson_id === saved.forum_lesson_id ? { ...item, ...saved } : item)
      : [...lessons, saved]
    let reorderError: string | null = null
    const savedIndex = list.findIndex((item) => item.forum_lesson_id === saved.forum_lesson_id)
    if (position !== savedIndex + 1) {
      try {
        const ids = moveLesson(list.map((item) => item.forum_lesson_id), saved.forum_lesson_id, position)
        const byId = new Map(list.map((item) => [item.forum_lesson_id, item]))
        list = sortLessons((await reorderLessons(courseId, ids)).map((item) => ({ ...item, resources: byId.get(item.forum_lesson_id)?.resources })))
      } catch (failure) {
        reorderError = `La lección se guardó, pero no se pudo cambiar su orden: ${toApiError(failure).message}`
      }
    }
    setSaving(false)

    if (!lesson) {
      navigate(`/admin/courses/${courseId}/lessons/${saved.forum_lesson_id}/edit`, {
        replace: true,
        state: { notice: reorderError ?? 'Lección creada como borrador. Ya puedes adjuntar sus recursos.' },
      })
      return
    }
    onLessonsChange(list)
    onLessonChange({ ...saved, forum_lesson_position: list.find((item) => item.forum_lesson_id === saved.forum_lesson_id)?.forum_lesson_position ?? saved.forum_lesson_position })
    setNotice(reorderError ?? 'Los cambios de la lección se guardaron.')
  }

  const fieldErrors = error?.fieldErrors ?? {}
  const otherErrors = Object.entries(fieldErrors).filter(([name]) => !FIELD_NAMES.includes(name)).flatMap(([, messages]) => messages)

  return (
    <section className="page-section course-form-page" aria-labelledby="lesson-form-title">
      <Link className="back-link" to={`/courses/${courseId}`}>
        <span aria-hidden="true">{DataIcons.buttons.arrowLongLeft}</span> {course.forum_course_title}</Link>
      <p className="eyebrow">Lecciones del curso</p>
      <h1 id="lesson-form-title">{lesson ? 'Editar lección' : 'Nueva lección'}</h1>
      <p className="page-intro">{lesson
        ? 'Actualiza el contenido, el orden y los recursos de la lección.'
        : 'La lección se crea como borrador: los estudiantes no la verán hasta que la publiques.'}</p>
      {notice && <p className="notice" role="status">{notice}</p>}

      <Card className="form-card"><CardBody>
        <Form className="stacked-form" onSubmit={(values) => void onSubmit(values)}>
          {error && <div className="auth-error" role="alert">
            {error.status === 422 ? 'Revisa los campos marcados.' : error.message}
            {otherErrors.length > 0 && <ul>{otherErrors.map((message) => <li key={message}>{message}</li>)}</ul>}
          </div>}
          <fieldset disabled={saving}>
            <legend>Contenido</legend>
            <div>
              <Field id="forum_lesson_title" name="forum_lesson_title" label="Título" component="input" type="text"
                value={lesson?.forum_lesson_title ?? ''} validator={validators.title}
                onChange={(event: ChangeEvent<HTMLInputElement>) => {
                  clearField('forum_lesson_title')
                  if (!slugTouched) setSlug(slugify(event.target.value))
                }} />
              <FieldErrors messages={fieldErrors.forum_lesson_title} />
            </div>
            <div>
              <Field id="forum_lesson_slug" name="forum_lesson_slug" label="Identificador en la URL" component="input" type="text"
                value={slug} validator={validators.slug} smallText="Único dentro del curso. Se genera a partir del título."
                onChange={(event: ChangeEvent<HTMLInputElement>) => {
                  clearField('forum_lesson_slug')
                  setSlugTouched(true)
                  setSlug(event.target.value)
                }} />
              <FieldErrors messages={fieldErrors.forum_lesson_slug} />
            </div>
            <div>
              <Field id="forum_lesson_body" name="forum_lesson_body" label="Contenido escrito (opcional)" component="textarea"
                value={lesson?.forum_lesson_body ?? ''} validator={validators.body} className="lesson-body-input"
                onChange={() => clearField('forum_lesson_body')} />
              <FieldErrors messages={fieldErrors.forum_lesson_body} />
            </div>
          </fieldset>

          <fieldset disabled={saving} className="form-grid">
            <legend>Organización</legend>
            <div>
              <Field id="forum_lesson_position" name="forum_lesson_position" label="Orden en el curso" component="input" type="number"
                minValue={1} maxValue={maxPosition} value={String(lesson ? currentPosition : maxPosition)} validator={positionValidator}
                smallText={`Entre 1 y ${maxPosition}.`} onChange={() => clearField('forum_lesson_ids')} />
              <FieldErrors messages={fieldErrors.forum_lesson_ids} />
            </div>
            <div>
              <Field id="forum_lesson_duration_minutes" name="forum_lesson_duration_minutes" label="Duración en minutos (opcional)"
                component="input" type="number" minValue={0} value={lesson ? String(lesson.forum_lesson_duration_minutes) : ''}
                validator={validators.duration} onChange={() => clearField('forum_lesson_duration_minutes')} />
              <FieldErrors messages={fieldErrors.forum_lesson_duration_minutes} />
            </div>
            <div className="field-checkbox-cell">
              <Field id="forum_lesson_is_preview" name="forum_lesson_is_preview" label="Vista previa gratuita" component="checkbox"
                value={isPreview} disabled={saving}
                onChange={(event: ChangeEvent<HTMLInputElement>) => { clearField('forum_lesson_is_preview'); setIsPreview(event.target.checked) }} />
              <p className="field-hint">Visible para quien no está inscrito, cuando esté publicada.</p>
              <FieldErrors messages={fieldErrors.forum_lesson_is_preview} />
            </div>
          </fieldset>

          <div className="form-actions">
            <Button type="submit" variant="primary" loading={saving} disabled={saving}>
              {saving ? 'Guardando…' : lesson ? 'Guardar cambios' : 'Crear lección'}</Button>
            {lesson && <Button variant="default" disabled={saving}
              onClick={() => navigate(`/courses/${courseId}/lessons/${lesson.forum_lesson_id}`)}>Ver lección</Button>}
            {!lesson && <Button variant="default" disabled={saving} onClick={() => navigate(`/courses/${courseId}`)}>Cancelar</Button>}
          </div>
        </Form>
      </CardBody></Card>

      <Card className="form-card"><CardBody>
        <h2 className="form-card__title">Recursos</h2>
        {lesson ? <>
          {lesson.resources && lesson.resources.length > 0
            ? <LessonResourceList resources={lesson.resources} canDelete={canDeleteResources}
                onDeleted={(resourceId) => onLessonChange({ ...lesson, resources: lesson.resources?.filter((item) => item.forum_lesson_resource_id !== resourceId) })} />
            : <p className="muted">Esta lección todavía no tiene recursos.</p>}
          <ResourceUploadForm lessonId={lesson.forum_lesson_id}
            onUploaded={(resource) => {
              onLessonChange({ ...lesson, resources: [...(lesson.resources ?? []), resource] })
              setNotice(`Recurso «${resource.forum_lesson_resource_title}» adjuntado.`)
            }} />
        </> : <p className="muted">Guarda la lección para adjuntar videos, PDF, imágenes u otros archivos.</p>}
      </CardBody></Card>
    </section>
  )
}
