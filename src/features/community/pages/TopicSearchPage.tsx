import { useMemo } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { DataIcons, Empty, type FormOption } from 'ucebul_mui'
import SearchFilters from '../../../components/SearchFilters'
import { positiveInt, withChanges } from '../../../lib/search-params'
import { useRequest } from '../../../lib/useRequest'
import { useAuthStore } from '../../auth/store/auth.store'
import { searchCourses } from '../../courses/api/course.service'
import { listAllForumCategories } from '../api/forum-category.service'
import { searchTopics } from '../api/topic.service'
import TopicList from '../components/TopicList'
import type { TopicSearchFilters } from '../types/community.types'

const PER_PAGE = 15

function readFilters(params: URLSearchParams): TopicSearchFilters {
  return {
    page: positiveInt(params.get('page')) ?? 1,
    per_page: PER_PAGE,
    search: params.get('q')?.trim() || undefined,
    forum_topic_category_id: positiveInt(params.get('category')),
    forum_topic_course_id: positiveInt(params.get('course')),
  }
}

export default function TopicSearchPage() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const filters = useMemo(() => readFilters(params), [params])
  const canSeeCourses = useAuthStore((state) => state.hasPermission('forum.courses.view'))
  const categories = useRequest('forum-categories', listAllForumCategories)
  // Cursos del catálogo para filtrar (máx. 100); solo si la sesión puede ver cursos.
  const courses = useRequest(canSeeCourses ? 'topic-search-courses' : null, (signal) => searchCourses({ page: 1, per_page: 100 }, signal))
  // Cambiar filtros cambia la clave y aborta la búsqueda anterior.
  const topics = useRequest(`topic-search-${JSON.stringify(filters)}`, (signal) => searchTopics(filters, signal))

  const categoryItems = useMemo<FormOption[]>(() => [{ label: 'Todas', value: '' },
    ...(categories.data ?? []).map((category) => ({ label: category.forum_category_name, value: category.forum_category_id }))], [categories.data])
  const courseItems = useMemo<FormOption[]>(() => [{ label: 'Todos', value: '' },
    ...(courses.data?.data ?? []).map((course) => ({ label: course.forum_course_title, value: course.forum_course_id }))], [courses.data])
  const hasFilters = Boolean(filters.search || filters.forum_topic_category_id || filters.forum_topic_course_id)

  const update = (changes: Record<string, string | null>, replace = false) => setParams(withChanges(params, changes), { replace })
  const clear = () => setParams(new URLSearchParams())

  return (
    <section className="page-section" aria-labelledby="topic-search-title">
      <Link className="back-link" to="/forum"><span aria-hidden="true">{DataIcons.buttons.arrowLongLeft}</span> Foro técnico</Link>
      <p className="eyebrow">Comunidad</p>
      <h1 id="topic-search-title">Buscar en el foro</h1>
      <p className="page-intro">Encuentra preguntas por palabras del título o del contenido, y filtra por categoría o curso.</p>

      <SearchFilters label="Buscar preguntas" hasFilters={hasFilters} onClear={clear}
        search={{ id: 'topic_search', label: 'Buscar', placeholder: 'Plaga, riego, fertilización…', value: filters.search ?? '',
          onSearch: (value) => update({ q: value }, true) }}
        selects={[
          { id: 'filter_forum_category', label: 'Categoría', items: categoryItems, value: filters.forum_topic_category_id ?? '',
            disabled: categories.loading, onChange: (value) => update({ category: value }) },
          ...(canSeeCourses ? [{ id: 'filter_topic_course', label: 'Curso', items: courseItems, value: filters.forum_topic_course_id ?? '',
            disabled: courses.loading, onChange: (value: string) => update({ course: value }) }] : []),
        ]} />
      {(categories.error || courses.error) && <p className="auth-error" role="alert">
        No se pudieron cargar las opciones de filtro: {(categories.error ?? courses.error)?.message}</p>}

      <div aria-live="polite" aria-busy={topics.loading}>
        {!topics.loading && !topics.error && topics.data && topics.data.data.length > 0 && <p className="result-count">
          {topics.data.meta.total === 1 ? '1 pregunta' : `${topics.data.meta.total} preguntas`}</p>}
        <TopicList result={topics.data} loading={topics.loading} error={topics.error} onRetry={topics.reload}
          onPage={(page) => { update({ page: String(page) }); window.scrollTo(0, 0) }}
          empty={<Empty icon={DataIcons.forms.search}
            title={hasFilters ? 'No encontramos preguntas' : 'Todavía no hay preguntas'}
            text={hasFilters ? 'Prueba con otras palabras o quita algún filtro.' : 'Cuando la comunidad publique preguntas aparecerán aquí.'}
            buttonIcon={hasFilters ? DataIcons.buttons.close : DataIcons.navigation.chats}
            buttonText={hasFilters ? 'Limpiar filtros' : 'Volver al foro'}
            onClickButton={hasFilters ? clear : () => navigate('/forum')} />} />
      </div>
    </section>
  )
}
