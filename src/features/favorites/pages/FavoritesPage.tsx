import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button, Card, CardBody, DataIcons, Empty, Pagination, Spinner, Tabs } from 'ucebul_mui'
import { positiveInt, withChanges } from '../../../lib/search-params'
import { useRequest } from '../../../lib/useRequest'
import TopicCard from '../../community/components/TopicCard'
import CourseCard from '../../courses/components/CourseCard'
import { useCoursePermissions } from '../../courses/utils/useCoursePermissions'
import { listCourseFavorites, listTopicFavorites } from '../api/favorite.service'
import { useFavoritePermissions } from '../utils/useFavoritePermissions'

const PER_PAGE = 12

export default function FavoritesPage() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const allowed = useFavoritePermissions()
  const { userId } = useCoursePermissions()
  const tabs = [
    ...(allowed.course ? [{ label: 'Cursos', value: 'courses' }] : []),
    ...(allowed.topic ? [{ label: 'Preguntas', value: 'topics' }] : []),
  ]
  const requested = params.get('tab')
  const tab = tabs.find((item) => item.value === requested)?.value ?? tabs[0]?.value
  const page = positiveInt(params.get('page')) ?? 1

  // Los favoritos se consultan siempre a la API: sobreviven a recargar la página y a otros dispositivos.
  const courses = useRequest(tab === 'courses' ? `favorite-courses-${page}` : null,
    (signal) => listCourseFavorites({ page, per_page: PER_PAGE }, signal))
  const topics = useRequest(tab === 'topics' ? `favorite-topics-${page}` : null,
    (signal) => listTopicFavorites({ page, per_page: PER_PAGE }, signal))
  const request = tab === 'courses' ? courses : topics
  const meta = request.data?.meta

  const goTo = (changes: Record<string, string | null>) => setParams(withChanges(params, changes))

  // Al retirar un favorito desde esta página se quita de la lista; si la página queda vacía se recarga o se retrocede.
  function removed(kind: 'courses' | 'topics', targetId: number) {
    const target = kind === 'courses' ? courses : topics
    const remaining = (target.data?.data.length ?? 1) - 1
    if (remaining > 0) {
      if (kind === 'courses') courses.setData((current) => current && { ...current,
        data: current.data.filter((favorite) => favorite.forum_course_favorite_course_id !== targetId),
        meta: { ...current.meta, total: current.meta.total - 1 } })
      else topics.setData((current) => current && { ...current,
        data: current.data.filter((favorite) => favorite.forum_topic_favorite_topic_id !== targetId),
        meta: { ...current.meta, total: current.meta.total - 1 } })
    } else if (page > 1) goTo({ page: String(page - 1) })
    else target.reload()
  }

  return (
    <section className="page-section" aria-labelledby="favorites-title">
      <p className="eyebrow">Tu biblioteca</p>
      <h1 id="favorites-title">Favoritos</h1>
      <p className="page-intro">Los cursos y preguntas que guardaste para volver a ellos cuando los necesites.</p>

      {tabs.length === 0
        ? <Card className="availability-card"><CardBody>
            <Empty icon={DataIcons.global.lockClosedOutline} title="No tienes acceso a favoritos"
              text="Tus permisos actuales no incluyen cursos ni comunidad." buttonIcon={DataIcons.buttons.arrowLongLeft}
              buttonText="Volver al inicio" onClickButton={() => navigate('/dashboard')} />
          </CardBody></Card>
        : <>
            {tabs.length > 1 && <div className="favorites-tabs">
              <Tabs tabs={tabs} activeTab={tab} onChange={(value) => goTo({ tab: String(value) })} />
            </div>}

            <div aria-live="polite" aria-busy={request.loading}>
              {request.loading && <div className="loading-block"><Spinner label="Cargando favoritos…" /></div>}
              {!request.loading && request.error && <div className="auth-error load-error" role="alert"><p>{request.error.message}</p>
                <Button size="sm" onClick={request.reload}>Reintentar</Button></div>}

              {!request.loading && !request.error && meta && meta.total === 0 && <Empty icon={DataIcons.global.bookmarkOutline}
                title={tab === 'courses' ? 'Aún no guardas cursos' : 'Aún no guardas preguntas'}
                text={tab === 'courses'
                  ? 'Usa el marcador de un curso para guardarlo aquí.'
                  : 'Usa el marcador de una pregunta del foro para guardarla aquí.'}
                buttonIcon={DataIcons.forms.search}
                buttonText={tab === 'courses' ? 'Explorar cursos' : 'Buscar en el foro'}
                onClickButton={() => navigate(tab === 'courses' ? '/courses' : '/forum/search')} />}

              {!request.loading && !request.error && tab === 'courses' && courses.data && courses.data.data.length > 0 && <>
                <p className="result-count">{courses.data.meta.total === 1 ? '1 curso guardado' : `${courses.data.meta.total} cursos guardados`}</p>
                <ul className="course-grid">
                  {courses.data.data.map((favorite) => favorite.course && <li key={favorite.forum_course_favorite_id}>
                    <CourseCard course={favorite.course} userId={userId}
                      onFavoriteChange={(saved) => { if (!saved) removed('courses', favorite.forum_course_favorite_course_id) }} />
                  </li>)}
                </ul>
              </>}

              {!request.loading && !request.error && tab === 'topics' && topics.data && topics.data.data.length > 0 && <>
                <p className="result-count">{topics.data.meta.total === 1 ? '1 pregunta guardada' : `${topics.data.meta.total} preguntas guardadas`}</p>
                <ul className="topic-list">
                  {topics.data.data.map((favorite) => favorite.topic && <li key={favorite.forum_topic_favorite_id}>
                    <TopicCard topic={favorite.topic}
                      onFavoriteChange={(saved) => { if (!saved) removed('topics', favorite.forum_topic_favorite_topic_id) }} />
                  </li>)}
                </ul>
              </>}

              {!request.loading && !request.error && meta && meta.last_page > 1 && <nav className="pagination-wrap" aria-label="Paginación de favoritos">
                <Pagination totalPages={meta.last_page} currentPage={meta.current_page}
                  onChangePage={(next) => { goTo({ page: String(next) }); window.scrollTo(0, 0) }} />
              </nav>}
            </div>
          </>}
    </section>
  )
}
