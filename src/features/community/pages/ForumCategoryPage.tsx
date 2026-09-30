import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button, DataIcons, Empty, Spinner } from 'ucebul_mui'
import { useRequest } from '../../../lib/useRequest'
import { listAllForumCategories } from '../api/forum-category.service'
import { listTopics } from '../api/topic.service'
import TopicFiltersBar from '../components/TopicFiltersBar'
import TopicList from '../components/TopicList'
import { useCommunityPermissions } from '../utils/useCommunityPermissions'
import { useTopicFilters } from '../utils/useTopicFilters'

export default function ForumCategoryPage() {
  const navigate = useNavigate()
  const categoryId = Number(useParams().categoryId)
  const valid = categoryId > 0
  const permissions = useCommunityPermissions()
  const { filters, setPage, setStatus, clearCourse } = useTopicFilters(valid ? categoryId : undefined)
  // No hay GET de una categoría: se busca en el listado (solo activas, salvo manage-any).
  const categories = useRequest('forum-categories', listAllForumCategories)
  const category = categories.data?.find((item) => item.forum_category_id === categoryId)
  const topics = useRequest(valid && category ? `topics-${JSON.stringify(filters)}` : null, (signal) => listTopics(filters, signal))
  const canAsk = permissions.canCreateTopic && category?.forum_category_is_active === true

  if (categories.loading) return <div className="loading-block"><Spinner label="Cargando categoría…" /></div>
  if (categories.error) {
    return <div className="auth-error load-error" role="alert"><p>{categories.error.message}</p>
      <Button size="sm" onClick={categories.reload}>Reintentar</Button></div>
  }
  if (!valid || !category) {
    return <section className="page-section"><h1>Categoría no encontrada</h1>
      <Empty icon={DataIcons.navigation.chats} title="Esta categoría no existe o no está activa" text="Explora las demás categorías del foro."
        buttonIcon={DataIcons.buttons.arrowLongLeft} buttonText="Volver al foro" onClickButton={() => navigate('/forum')} /></section>
  }

  return (
    <section className="page-section" aria-labelledby="category-title">
      <Link className="back-link" to="/forum"><span aria-hidden="true">{DataIcons.buttons.arrowLongLeft}</span> Foro técnico</Link>
      <div className="page-title-row">
        <div>
          <p className="eyebrow">Categoría</p>
          <h1 id="category-title">{category.forum_category_name}</h1>
          {category.forum_category_description && <p className="page-intro">{category.forum_category_description}</p>}
        </div>
        {canAsk && <Button variant="primary" onClick={() => navigate(`/forum/new?category=${categoryId}`)}>
          <span className="button-icon" aria-hidden="true">{DataIcons.buttons.plus}</span> Preguntar aquí</Button>}
      </div>
      <TopicFiltersBar filters={filters} onStatus={setStatus} onClearCourse={clearCourse} />
      <TopicList showCategory={false} result={topics.data} loading={topics.loading} error={topics.error} onRetry={topics.reload} onPage={setPage}
        empty={<Empty icon={DataIcons.navigation.chats} title="Aún no hay preguntas en esta categoría"
          text={canAsk ? 'Abre la conversación con la primera pregunta.' : 'Vuelve más tarde para ver nuevas preguntas.'}
          buttonIcon={canAsk ? DataIcons.buttons.plus : DataIcons.buttons.arrowLongLeft}
          buttonText={canAsk ? 'Hacer una pregunta' : 'Volver al foro'}
          onClickButton={() => navigate(canAsk ? `/forum/new?category=${categoryId}` : '/forum')} />} />
    </section>
  )
}
