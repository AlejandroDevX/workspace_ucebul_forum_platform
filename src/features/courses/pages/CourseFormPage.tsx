import { type ChangeEvent, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { Button, Card, CardBody, DataIcons, Empty, Field, Form, type FormOption, Image, Spinner } from 'ucebul_mui'
import FieldErrors from '../../../components/FieldErrors'
import { type ApiError, toApiError } from '../../../lib/api-error'
import { useRequest } from '../../../lib/useRequest'
import { compose, integerInRange, matches, maxLength, required } from '../../../lib/validators'
import { createCourse, getCourse, updateCourse, uploadCourseCover } from '../api/course.service'
import type { ForumCourse } from '../types/course.types'
import { levelOptions, MAX_DURATION_MINUTES, SLUG_PATTERN, slugify } from '../utils/course-format'
import { coverProblem, toCoursePayload } from '../utils/course-payload'
import { useCourseCategories } from '../utils/useCourseCategories'
import { useCoursePermissions } from '../utils/useCoursePermissions'

const COVER_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.JPG', '.JPEG', '.PNG', '.WEBP']
const FIELD_NAMES = ['forum_course_title', 'forum_course_slug', 'forum_course_summary', 'forum_course_description',
  'forum_course_category_id', 'forum_course_level', 'forum_course_duration_minutes', 'cover']

const validators = {
  title: compose(required('Escribe el título del curso.'), maxLength(255, 'El título admite máximo 255 caracteres.')),
  slug: compose(required('Define el identificador para la URL.'), maxLength(190, 'El identificador admite máximo 190 caracteres.'),
    matches(SLUG_PATTERN, 'Usa solo minúsculas, números y guiones entre palabras.')),
  summary: maxLength(16000, 'El resumen admite máximo 16.000 caracteres.'),
  description: maxLength(16000, 'La descripción admite máximo 16.000 caracteres.'),
  category: required('Selecciona una categoría.'),
  duration: integerInRange(0, MAX_DURATION_MINUTES, 'La duración debe ser un número entero de minutos, 0 o mayor.'),
}

export default function CourseFormPage() {
  const params = useParams()
  const editing = params.courseId !== undefined
  const courseId = Number(params.courseId)
  const categories = useCourseCategories()
  const request = useRequest(editing && courseId > 0 ? `course-${courseId}` : null, (signal) => getCourse(courseId, signal))
  const { canUpdate } = useCoursePermissions()
  const navigate = useNavigate()

  if (editing && (!(courseId > 0) || request.error?.status === 404)) {
    return <section className="page-section"><h1>Curso no encontrado</h1>
      <Empty icon={DataIcons.navigation.folder} title="No encontramos el curso que quieres editar"
        text="Puede que haya sido eliminado." buttonIcon={DataIcons.buttons.arrowLongLeft}
        buttonText="Volver a cursos" onClickButton={() => navigate('/admin/courses')} /></section>
  }
  if (categories.loading || (editing && (request.loading || (!request.data && !request.error)))) {
    return <div className="loading-block"><Spinner label="Preparando el formulario…" /></div>
  }
  const loadError = categories.error ?? (editing ? request.error : null)
  if (loadError) {
    return <div className="auth-error load-error" role="alert"><p>{loadError.message}</p>
      <Button size="sm" onClick={() => { categories.reload(); request.reload() }}>Reintentar</Button></div>
  }
  if (editing && request.data && !canUpdate(request.data)) {
    return <section className="page-section"><h1>Editar curso</h1>
      <Empty icon={DataIcons.global.lockClosedOutline} title="No puedes editar este curso"
        text="Solo el instructor del curso o un administrador con gestión total pueden modificarlo."
        buttonIcon={DataIcons.buttons.arrowLongLeft} buttonText="Ver el curso"
        onClickButton={() => navigate(`/courses/${courseId}`)} /></section>
  }

  return <CourseForm key={request.data?.forum_course_id ?? 'new'} course={editing ? request.data : undefined}
    categoryOptions={categories.options} />
}

function CourseForm({ course, categoryOptions }: { course?: ForumCourse; categoryOptions: FormOption[] }) {
  const navigate = useNavigate()
  const { state } = useLocation()
  const initialCoverError: unknown = state?.coverError
  const [category, setCategory] = useState<string | number>(course?.forum_course_category_id ?? '')
  const [level, setLevel] = useState<string | number>(course?.forum_course_level ?? '')
  const [slug, setSlug] = useState(course?.forum_course_slug ?? '')
  const [slugTouched, setSlugTouched] = useState(Boolean(course))
  const [cover, setCover] = useState<File | null>(null)
  const [coverError, setCoverError] = useState<string | null>(null)
  const [coverUploadError, setCoverUploadError] = useState<string | null>(typeof initialCoverError === 'string' ? initialCoverError : null)
  const [error, setError] = useState<ApiError | null>(null)
  const [saving, setSaving] = useState(false)
  const levelItems = useMemo(() => [{ label: 'Sin nivel', value: '' }, ...levelOptions(course?.forum_course_level)], [course?.forum_course_level])

  function clearField(name: string) {
    setError((current) => {
      if (!current?.fieldErrors[name]) return current
      const fieldErrors = { ...current.fieldErrors }
      delete fieldErrors[name]
      return { ...current, fieldErrors }
    })
  }

  function onCoverChange(files: File[]) {
    clearField('cover')
    setCoverUploadError(null)
    const file = files[0] ?? null
    const problem = file ? coverProblem(file) : null
    setCoverError(problem)
    setCover(problem ? null : file)
  }

  async function onSubmit(values: Record<string, unknown>) {
    if (coverError) return
    setSaving(true)
    setError(null)
    const payload = toCoursePayload(values, slug, level)
    let saved: ForumCourse
    try {
      saved = course ? await updateCourse(course.forum_course_id, payload) : await createCourse(payload)
    } catch (failure) {
      setError(toApiError(failure))
      setSaving(false)
      return
    }
    if (cover) {
      try {
        saved = await uploadCourseCover(saved.forum_course_id, cover)
      } catch (failure) {
        const parsed = toApiError(failure)
        const message = `Los datos del curso se guardaron, pero la portada no se pudo subir: ${parsed.fieldErrors.cover?.[0] ?? parsed.message}`
        setSaving(false)
        if (course) {
          setCoverUploadError(message)
          return
        }
        navigate(`/admin/courses/${saved.forum_course_id}/edit`, { replace: true, state: { coverError: message } })
        return
      }
    }
    navigate(`/courses/${saved.forum_course_id}`, {
      state: { notice: course ? 'Los cambios del curso se guardaron.' : 'Curso creado como borrador. Publícalo cuando esté listo.' },
    })
  }

  const fieldErrors = error?.fieldErrors ?? {}
  const otherErrors = Object.entries(fieldErrors).filter(([name]) => !FIELD_NAMES.includes(name)).flatMap(([, messages]) => messages)

  return (
    <section className="page-section course-form-page" aria-labelledby="course-form-title">
      <Link className="back-link" to={course ? `/courses/${course.forum_course_id}` : '/admin/courses'}>
        <span aria-hidden="true">{DataIcons.buttons.arrowLongLeft}</span> {course ? 'Volver al curso' : 'Volver a cursos'}</Link>
      <p className="eyebrow">Administración de cursos</p>
      <h1 id="course-form-title">{course ? 'Editar curso' : 'Nuevo curso'}</h1>
      <p className="page-intro">{course
        ? 'Actualiza la información del curso. Los cambios se reflejan de inmediato en el catálogo.'
        : 'El curso se crea como borrador: nadie más lo verá hasta que lo publiques.'}</p>

      <Card className="form-card"><CardBody>
        <Form className="stacked-form" onSubmit={(values) => void onSubmit(values)}>
          {error && <div className="auth-error" role="alert">
            {error.status === 422 ? 'Revisa los campos marcados.' : error.message}
            {otherErrors.length > 0 && <ul>{otherErrors.map((message) => <li key={message}>{message}</li>)}</ul>}
          </div>}

          <fieldset disabled={saving}>
            <legend>Información general</legend>
            <div>
              <Field id="forum_course_title" name="forum_course_title" label="Título" component="input" type="text"
                value={course?.forum_course_title ?? ''} validator={validators.title}
                onChange={(event: ChangeEvent<HTMLInputElement>) => {
                  clearField('forum_course_title')
                  if (!slugTouched) setSlug(slugify(event.target.value))
                }} />
              <FieldErrors messages={fieldErrors.forum_course_title} />
            </div>
            <div>
              <Field id="forum_course_slug" name="forum_course_slug" label="Identificador en la URL" component="input" type="text"
                value={slug} validator={validators.slug} smallText="Se genera a partir del título. Solo minúsculas, números y guiones."
                onChange={(event: ChangeEvent<HTMLInputElement>) => {
                  clearField('forum_course_slug')
                  setSlugTouched(true)
                  setSlug(event.target.value)
                }} />
              <FieldErrors messages={fieldErrors.forum_course_slug} />
            </div>
            <div>
              <Field id="forum_course_summary" name="forum_course_summary" label="Resumen (opcional)" component="textarea"
                value={course?.forum_course_summary ?? ''} validator={validators.summary}
                smallText="Una o dos frases que aparecen en la tarjeta del catálogo."
                onChange={() => clearField('forum_course_summary')} />
              <FieldErrors messages={fieldErrors.forum_course_summary} />
            </div>
            <div>
              <Field id="forum_course_description" name="forum_course_description" label="Descripción (opcional)" component="textarea"
                value={course?.forum_course_description ?? ''} validator={validators.description}
                onChange={() => clearField('forum_course_description')} />
              <FieldErrors messages={fieldErrors.forum_course_description} />
            </div>
          </fieldset>

          <fieldset disabled={saving} className="form-grid">
            <legend>Clasificación</legend>
            <div>
              <Field id="forum_course_category_id" name="forum_course_category_id" label="Categoría" component="select"
                items={categoryOptions} value={category} validator={validators.category} disabled={saving}
                onChange={(option: FormOption) => { clearField('forum_course_category_id'); setCategory(option.value) }} />
              {categoryOptions.length === 0 && <p className="field-hint">No hay categorías. Crea una en Administración › Categorías.</p>}
              <FieldErrors messages={fieldErrors.forum_course_category_id} />
            </div>
            <div>
              <Field id="forum_course_level" name="forum_course_level" label="Nivel (opcional)" component="select"
                items={levelItems} value={level} disabled={saving}
                onChange={(option: FormOption) => { clearField('forum_course_level'); setLevel(option.value) }} />
              <FieldErrors messages={fieldErrors.forum_course_level} />
            </div>
            <div>
              <Field id="forum_course_duration_minutes" name="forum_course_duration_minutes" label="Duración en minutos (opcional)"
                component="input" type="number" minValue={0} value={course ? String(course.forum_course_duration_minutes) : ''}
                validator={validators.duration} onChange={() => clearField('forum_course_duration_minutes')} />
              <FieldErrors messages={fieldErrors.forum_course_duration_minutes} />
            </div>
          </fieldset>

          <fieldset disabled={saving}>
            <legend>Portada</legend>
            {course?.forum_course_cover_url && !cover && <figure className="current-cover">
              <Image src={course.forum_course_cover_url} alt="Portada actual del curso" width={160} height={90} />
              <figcaption>Portada actual. Sube otra imagen para reemplazarla.</figcaption>
            </figure>}
            <Field id="forum_course_cover" name="forum_course_cover" label="Imagen de portada (opcional)" component="upload"
              allowedFileTypes={COVER_EXTENSIONS} disabled={saving} onChange={onCoverChange}
              smallText="JPG, PNG o WebP de máximo 5 MB." />
            {coverError && <p className="field-server-error" role="alert">{coverError}</p>}
            {coverUploadError && <p className="field-server-error" role="alert">{coverUploadError}</p>}
            <FieldErrors messages={fieldErrors.cover} />
          </fieldset>

          <div className="form-actions">
            <Button type="submit" variant="primary" loading={saving} disabled={saving || Boolean(coverError)}>
              {saving ? 'Guardando…' : course ? 'Guardar cambios' : 'Crear curso'}
            </Button>
            <Button variant="default" disabled={saving}
              onClick={() => navigate(course ? `/courses/${course.forum_course_id}` : '/admin/courses')}>Cancelar</Button>
          </div>
        </Form>
      </CardBody></Card>
    </section>
  )
}
