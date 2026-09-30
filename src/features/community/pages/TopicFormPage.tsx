import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Button, Card, CardBody, DataIcons, Empty, Field, Form, type FormOption, Spinner } from 'ucebul_mui'
import FieldErrors from '../../../components/FieldErrors'
import { type ApiError, toApiError } from '../../../lib/api-error'
import { useRequest } from '../../../lib/useRequest'
import { searchCourses } from '../../courses/api/course.service'
import { listAllForumCategories } from '../api/forum-category.service'
import { createTopic, getTopic, updateTopic } from '../api/topic.service'
import type { ForumCategory, ForumTopic, ForumTopicPayload } from '../types/community.types'
import { topicValidators } from '../utils/community-validators'
import { changedFields } from '../utils/topic-payload'
import { useCommunityPermissions } from '../utils/useCommunityPermissions'

const FIELD_NAMES = ['forum_topic_title', 'forum_topic_category_id', 'forum_topic_course_id', 'forum_topic_body']


export default function TopicFormPage() {
  const navigate = useNavigate()
  const params = useParams()
  const editing = params.topicId !== undefined
  const topicId = Number(params.topicId)
  const permissions = useCommunityPermissions()
  const categories = useRequest('forum-categories', listAllForumCategories)
  // Curso relacionado (opcional): cursos visibles del catálogo.
  const courses = useRequest('forum-topic-courses', (signal) => searchCourses({ page: 1, per_page: 100 }, signal))
  const topic = useRequest(editing && topicId > 0 ? `topic-${topicId}` : null, (signal) => getTopic(topicId, signal))

  if (editing && (!(topicId > 0) || topic.error?.status === 404)) {
    return <section className="page-section"><h1>Pregunta no encontrada</h1>
      <Empty icon={DataIcons.navigation.chats} title="No encontramos esta pregunta" text="Puede que haya sido eliminada."
        buttonIcon={DataIcons.buttons.arrowLongLeft} buttonText="Volver al foro" onClickButton={() => navigate('/forum')} /></section>
  }
  const failed = [categories, courses, ...(editing ? [topic] : [])].find((request) => request.error)
  if (failed?.error) {
    return <div className="auth-error load-error" role="alert"><p>{failed.error.message}</p>
      <Button size="sm" onClick={() => { categories.reload(); courses.reload(); topic.reload() }}>Reintentar</Button></div>
  }
  if (categories.loading || courses.loading || !categories.data || (editing && (topic.loading || !topic.data))) {
    return <div className="loading-block"><Spinner label="Preparando el formulario…" /></div>
  }
  if (editing && topic.data && !permissions.canEditTopic(topic.data)) {
    return <section className="page-section"><h1>Editar pregunta</h1>
      <Empty icon={DataIcons.global.lockClosedOutline} title="Solo puedes editar tus propias preguntas" text="Esta pregunta pertenece a otra persona."
        buttonIcon={DataIcons.buttons.arrowLongLeft} buttonText="Ver la pregunta" onClickButton={() => navigate(`/forum/topics/${topicId}`)} /></section>
  }
  const active = categories.data.filter((category) => category.forum_category_is_active)
  if (active.length === 0) {
    return <section className="page-section"><h1>Hacer una pregunta</h1>
      <Empty icon={DataIcons.navigation.chats} title="No hay categorías activas"
        text="Para publicar una pregunta se necesita al menos una categoría activa del foro. Pide a un administrador que la cree."
        buttonIcon={DataIcons.buttons.arrowLongLeft} buttonText="Volver al foro" onClickButton={() => navigate('/forum')} /></section>
  }

  const courseOptions = (courses.data?.data ?? []).map((course) => ({ label: course.forum_course_title, value: course.forum_course_id }))
  return <TopicForm key={topic.data?.forum_topic_id ?? 'new'} topic={editing ? topic.data : undefined}
    categories={active} courseOptions={courseOptions} />
}

function TopicForm({ topic, categories, courseOptions }: { topic?: ForumTopic; categories: ForumCategory[]; courseOptions: FormOption[] }) {
  const navigate = useNavigate()
  const [query] = useSearchParams()
  const preset = (name: string, allowed: (number | string)[]) => {
    const value = Number(query.get(name))
    return allowed.some((item) => String(item) === String(value)) ? value : ''
  }
  const categoryItems = useMemo<FormOption[]>(() => categories.map((category) => ({ label: category.forum_category_name, value: category.forum_category_id })), [categories])
  const courseItems = useMemo<FormOption[]>(() => {
    const items = [{ label: 'Ninguno', value: '' }, ...courseOptions]
    // Conserva el curso actual aunque ya no aparezca en el catálogo.
    if (topic?.course && !courseOptions.some((option) => option.value === topic.course?.forum_course_id)) {
      items.push({ label: topic.course.forum_course_title, value: topic.course.forum_course_id })
    }
    return items
  }, [courseOptions, topic])
  const [category, setCategory] = useState<string | number>(topic?.forum_topic_category_id ?? preset('category', categoryItems.map((item) => item.value)))
  const [course, setCourse] = useState<string | number>(topic?.forum_topic_course_id ?? preset('course', courseItems.map((item) => item.value)))
  const [error, setError] = useState<ApiError | null>(null)
  const [saving, setSaving] = useState(false)

  function clearField(name: string) {
    setError((current) => {
      if (!current?.fieldErrors[name]) return current
      const fieldErrors = { ...current.fieldErrors }
      delete fieldErrors[name]
      return { ...current, fieldErrors }
    })
  }

  async function onSubmit(values: Record<string, unknown>) {
    // Los IDs se envían como números, nunca como objetos de opción.
    const payload: ForumTopicPayload = {
      forum_topic_title: String(values.forum_topic_title ?? '').trim(),
      forum_topic_category_id: Number(values.forum_topic_category_id),
      forum_topic_course_id: course === '' ? null : Number(course),
      forum_topic_body: String(values.forum_topic_body ?? '').trim(),
    }
    setSaving(true)
    setError(null)
    try {
      const saved = topic ? await updateTopic(topic.forum_topic_id, changedFields(topic, payload)) : await createTopic(payload)
      navigate(`/forum/topics/${saved.forum_topic_id}`, { replace: Boolean(topic) })
    } catch (failure) {
      setError(toApiError(failure))
      setSaving(false)
    }
  }

  const fieldErrors = error?.fieldErrors ?? {}
  const otherErrors = Object.entries(fieldErrors).filter(([name]) => !FIELD_NAMES.includes(name)).flatMap(([, messages]) => messages)

  return (
    <section className="page-section course-form-page" aria-labelledby="topic-form-title">
      <Link className="back-link" to={topic ? `/forum/topics/${topic.forum_topic_id}` : '/forum'}>
        <span aria-hidden="true">{DataIcons.buttons.arrowLongLeft}</span> {topic ? 'Volver a la pregunta' : 'Foro técnico'}</Link>
      <p className="eyebrow">Comunidad</p>
      <h1 id="topic-form-title">{topic ? 'Editar pregunta' : 'Hacer una pregunta'}</h1>
      <p className="page-intro">Explica tu situación con detalle: cultivo, zona, síntomas o lo que ya intentaste. Así la comunidad podrá ayudarte mejor.</p>

      <Card className="form-card"><CardBody>
        <Form className="stacked-form" onSubmit={(values) => void onSubmit(values)}>
          {error && <div className="auth-error" role="alert">
            {error.status === 422 ? 'Revisa los campos marcados.' : error.message}
            {otherErrors.length > 0 && <ul>{otherErrors.map((message) => <li key={message}>{message}</li>)}</ul>}
          </div>}
          <fieldset disabled={saving}>
            <legend className="sr-only">Pregunta</legend>
            <div>
              <Field id="forum_topic_title" name="forum_topic_title" label="Título" component="input" type="text"
                placeholder="Ej.: ¿Cómo controlar el gusano cogollero en maíz?" value={topic?.forum_topic_title ?? ''}
                validator={topicValidators.title} onChange={() => clearField('forum_topic_title')} />
              <FieldErrors messages={fieldErrors.forum_topic_title} />
            </div>
            <div className="form-grid form-grid--two">
              <div>
                <Field id="forum_topic_category_id" name="forum_topic_category_id" label="Categoría" component="select"
                  items={categoryItems} value={category} validator={topicValidators.category} disabled={saving}
                  onChange={(option: FormOption) => { clearField('forum_topic_category_id'); setCategory(option.value) }} />
                <FieldErrors messages={fieldErrors.forum_topic_category_id} />
              </div>
              <div>
                <Field id="forum_topic_course_id" name="forum_topic_course_id" label="Curso relacionado (opcional)" component="select"
                  items={courseItems} value={course} disabled={saving}
                  onChange={(option: FormOption) => { clearField('forum_topic_course_id'); setCourse(option.value) }} />
                <FieldErrors messages={fieldErrors.forum_topic_course_id} />
              </div>
            </div>
            <div>
              <Field id="forum_topic_body" name="forum_topic_body" label="Detalle de la pregunta" component="textarea"
                value={topic?.forum_topic_body ?? ''} validator={topicValidators.body} className="topic-body-input"
                onChange={() => clearField('forum_topic_body')} />
              <FieldErrors messages={fieldErrors.forum_topic_body} />
            </div>
          </fieldset>
          <div className="form-actions">
            <Button type="submit" variant="primary" loading={saving} disabled={saving}>
              {saving ? 'Publicando…' : topic ? 'Guardar cambios' : 'Publicar pregunta'}</Button>
            <Button variant="default" disabled={saving}
              onClick={() => navigate(topic ? `/forum/topics/${topic.forum_topic_id}` : '/forum')}>Cancelar</Button>
          </div>
        </Form>
      </CardBody></Card>
    </section>
  )
}
