import { useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button, DataIcons, Empty, type FormOption, Pagination, Spinner } from 'ucebul_mui'
import SearchFilters from '../../../components/SearchFilters'
import { useRequest } from '../../../lib/useRequest'
import { positiveInt, withChanges } from '../../../lib/search-params'
import { searchCourses } from '../api/course.service'
import CourseCard from '../components/CourseCard'
import type { CourseSearchFilters } from '../types/course.types'
import { levelOptions } from '../utils/course-format'
import { useCourseCategories } from '../utils/useCourseCategories'
import { useCoursePermissions } from '../utils/useCoursePermissions'

const PER_PAGE = 12
const ALL: FormOption = { label: 'Todas', value: '' }

function readFilters(params: URLSearchParams): CourseSearchFilters {
  return {
    page: positiveInt(params.get('page')) ?? 1,
    per_page: PER_PAGE,
    search: params.get('q')?.trim() || undefined,
    forum_course_category_id: positiveInt(params.get('category')),
    forum_course_level: params.get('level') || undefined,
  }
}

export default function CoursesPage() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const filters = useMemo(() => readFilters(params), [params])
  const { userId, canCreate } = useCoursePermissions()
  const categories = useCourseCategories()
  // Cada cambio de filtros cambia la clave: useRequest aborta la búsqueda anterior.
  const courses = useRequest(JSON.stringify(filters), (signal) => searchCourses(filters, signal))

  const categoryItems = useMemo(() => [ALL, ...categories.options], [categories.options])
  const levelItems = useMemo(() => [{ ...ALL, label: 'Todos' }, ...levelOptions(filters.forum_course_level)], [filters.forum_course_level])
  const hasFilters = Boolean(filters.search || filters.forum_course_category_id || filters.forum_course_level)

  // El texto se escribe con replace para no llenar el historial con cada búsqueda intermedia.
  const update = (changes: Record<string, string | null>, replace = false) => setParams(withChanges(params, changes), { replace })
  const clear = () => setParams(new URLSearchParams())

  function goToPage(page: number) {
    update({ page: String(page) })
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

      <SearchFilters label="Buscar cursos" hasFilters={hasFilters} onClear={clear}
        search={{ id: 'course_search', label: 'Buscar', placeholder: 'Título o descripción', value: filters.search ?? '',
          onSearch: (value) => update({ q: value }, true) }}
        selects={[
          { id: 'filter_category', label: 'Categoría', items: categoryItems, value: filters.forum_course_category_id ?? '',
            disabled: categories.loading, onChange: (value) => update({ category: value }) },
          { id: 'filter_level', label: 'Nivel', items: levelItems, value: filters.forum_course_level ?? '',
            onChange: (value) => update({ level: value }) },
        ]} />
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
