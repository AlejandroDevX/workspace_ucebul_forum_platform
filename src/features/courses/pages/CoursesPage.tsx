import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button, DataIcons, Empty, Field, Form, type FormOption, Pagination, Spinner } from 'ucebul_mui'
import { useRequest } from '../../../lib/useRequest'
import { maxLength } from '../../../lib/validators'
import { searchCourses } from '../api/course.service'
import CourseCard from '../components/CourseCard'
import type { CourseSearchFilters } from '../types/course.types'
import { levelOptions } from '../utils/course-format'
import { useCourseCategories } from '../utils/useCourseCategories'
import { useCoursePermissions } from '../utils/useCoursePermissions'

const PER_PAGE = 12
const ALL: FormOption = { label: 'Todas', value: '' }
const searchValidator = maxLength(100, 'La búsqueda admite máximo 100 caracteres.')

function readFilters(params: URLSearchParams): CourseSearchFilters {
  const page = Number(params.get('page'))
  const category = Number(params.get('category'))
  return {
    page: Number.isInteger(page) && page > 0 ? page : 1,
    per_page: PER_PAGE,
    search: params.get('q')?.trim() || undefined,
    forum_course_category_id: Number.isInteger(category) && category > 0 ? category : undefined,
    forum_course_level: params.get('level') || undefined,
  }
}

export default function CoursesPage() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const filters = useMemo(() => readFilters(params), [params])
  const { userId, canCreate } = useCoursePermissions()
  const categories = useCourseCategories()
  const [category, setCategory] = useState<string | number>(filters.forum_course_category_id ?? '')
  const [level, setLevel] = useState<string | number>(filters.forum_course_level ?? '')
  // Si la URL cambia (atrás/adelante), los selects vuelven a reflejarla.
  const [syncedQuery, setSyncedQuery] = useState(params.toString())
  if (syncedQuery !== params.toString()) {
    setSyncedQuery(params.toString())
    setCategory(filters.forum_course_category_id ?? '')
    setLevel(filters.forum_course_level ?? '')
  }
  const courses = useRequest(JSON.stringify(filters), (signal) => searchCourses(filters, signal))

  const categoryItems = useMemo(() => [ALL, ...categories.options], [categories.options])
  const levelItems = useMemo(() => [{ ...ALL, label: 'Todos' }, ...levelOptions(filters.forum_course_level)], [filters.forum_course_level])
  const hasFilters = Boolean(filters.search || filters.forum_course_category_id || filters.forum_course_level)

  function apply(values: Record<string, unknown>) {
    const next = new URLSearchParams()
    const search = String(values.course_search ?? '').trim()
    if (search) next.set('q', search)
    if (category !== '') next.set('category', String(category))
    if (level !== '') next.set('level', String(level))
    setParams(next)
  }

  function clear() {
    setCategory('')
    setLevel('')
    setParams(new URLSearchParams())
  }

  function goToPage(page: number) {
    const next = new URLSearchParams(params)
    next.set('page', String(page))
    setParams(next)
    window.scrollTo(0, 0)
  }

  const result = courses.data

  return (
    <section className="page-section catalog" aria-labelledby="catalog-title">
      <div className="page-title-row">
        <div>
          <p className="eyebrow">Catálogo</p>
          <h1 id="catalog-title">Explorar cursos</h1>
          <p className="page-intro">Formación agropecuaria para conectar el conocimiento técnico con la práctica en el campo.</p>
        </div>
        {canCreate && <Button variant="primary" onClick={() => navigate('/admin/courses/new')}>
          <span className="button-icon" aria-hidden="true">{DataIcons.buttons.plus}</span> Nuevo curso</Button>}
      </div>

      <Form className="catalog-filters" onSubmit={apply} key={params.toString()}>
        <Field id="course_search" name="course_search" label="Buscar" component="input" type="search"
          placeholder="Título o descripción" icon={DataIcons.forms.search} value={filters.search ?? ''} validator={searchValidator} />
        <Field id="filter_category" name="filter_category" label="Categoría" component="select"
          items={categoryItems} value={category} disabled={categories.loading}
          onChange={(option: FormOption) => setCategory(option.value)} />
        <Field id="filter_level" name="filter_level" label="Nivel" component="select"
          items={levelItems} value={level} onChange={(option: FormOption) => setLevel(option.value)} />
        <div className="catalog-filters__actions">
          <Button type="submit" variant="primary">Filtrar</Button>
          {hasFilters && <Button variant="default" onClick={clear}>Limpiar</Button>}
        </div>
      </Form>
      {categories.error && <p className="auth-error" role="alert">No se pudieron cargar las categorías: {categories.error.message}</p>}

      <div aria-live="polite" aria-busy={courses.loading}>
        {courses.loading && <div className="loading-block"><Spinner label="Cargando cursos…" /></div>}
        {!courses.loading && courses.error && <div className="auth-error load-error" role="alert"><p>{courses.error.message}</p>
          <Button size="sm" onClick={courses.reload}>Reintentar</Button></div>}
        {!courses.loading && !courses.error && result && (result.data.length === 0
          ? <Empty icon={DataIcons.navigation.folder}
              title={hasFilters ? 'No hay cursos con estos filtros' : 'Todavía no hay cursos publicados'}
              text={hasFilters ? 'Prueba con otra búsqueda, categoría o nivel.' : 'Cuando se publiquen cursos aparecerán aquí.'}
              buttonIcon={hasFilters ? DataIcons.buttons.close : DataIcons.navigation.home}
              buttonText={hasFilters ? 'Limpiar filtros' : 'Volver al inicio'}
              onClickButton={hasFilters ? clear : () => navigate('/dashboard')} />
          : <>
              <p className="result-count">{result.meta.total === 1 ? '1 curso' : `${result.meta.total} cursos`}</p>
              <ul className="course-grid">
                {result.data.map((course) => <li key={course.forum_course_id}><CourseCard course={course} userId={userId} /></li>)}
              </ul>
              {result.meta.last_page > 1 && <nav className="pagination-wrap" aria-label="Paginación de cursos">
                <Pagination totalPages={result.meta.last_page} currentPage={result.meta.current_page} onChangePage={goToPage} />
              </nav>}
            </>)}
      </div>
    </section>
  )
}
