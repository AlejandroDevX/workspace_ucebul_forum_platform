import { Link, useNavigate } from 'react-router-dom'
import { Button, Card, CardBody, DataIcons, Empty, Spinner } from 'ucebul_mui'
import { useRequest } from '../../../lib/useRequest'
import { listAllForumCategories } from '../api/forum-category.service'
import { listTopics } from '../api/topic.service'
import TopicFiltersBar from '../components/TopicFiltersBar'
import TopicList from '../components/TopicList'
import { useCommunityPermissions } from '../utils/useCommunityPermissions'
import { useTopicFilters } from '../utils/useTopicFilters'

export default function ForumHomePage() {
  const navigate = useNavigate()
  const permissions = useCommunityPermissions()
  const { filters, setPage, setStatus, clearCourse } = useTopicFilters()
  const categories = useRequest('forum-categories', listAllForumCategories)
  const topics = useRequest(`topics-${JSON.stringify(filters)}`, (signal) => listTopics(filters, signal))
  const activeCategories = (categories.data ?? []).filter((category) => category.forum_category_is_active)
  const canAsk = permissions.canCreateTopic && activeCategories.length > 0
  const newTopicUrl = filters.forum_topic_course_id ? `/forum/new?course=${filters.forum_topic_course_id}` : '/forum/new'

  return (
    <section className="page-section forum-home" aria-labelledby="forum-title">
      <div className="page-title-row">
        <div>
          <p className="eyebrow">Comunidad</p>
          <h1 id="forum-title">Foro técnico</h1>
          <p className="page-intro">Pregunta, comparte experiencias y ayuda a otras personas del sector agropecuario.</p>
        </div>
        <div className="page-title-row__actions">
          <Button variant="default" onClick={() => navigate('/forum/search')}>
            <span className="button-icon" aria-hidden="true">{DataIcons.forms.search}</span> Buscar</Button>
          {canAsk && <Button variant="primary" onClick={() => navigate(newTopicUrl)}>
            <span className="button-icon" aria-hidden="true">{DataIcons.buttons.plus}</span> Hacer una pregunta</Button>}
        </div>
      </div>

      <section className="forum-categories" aria-labelledby="categories-heading">
        <h2 id="categories-heading">Categorías</h2>
        {categories.loading && <div className="loading-block"><Spinner label="Cargando categorías…" /></div>}
        {categories.error && <div className="auth-error load-error" role="alert"><p>{categories.error.message}</p>
          <Button size="sm" onClick={categories.reload}>Reintentar</Button></div>}
        {!categories.loading && !categories.error && categories.data && (categories.data.length === 0
          ? <Empty icon={DataIcons.navigation.chats} title="El foro aún no tiene categorías"
              text={permissions.canCreateCategory
                ? 'Crea la primera categoría para que la comunidad pueda empezar a preguntar.'
                : 'Para publicar preguntas se necesita al menos una categoría activa. Solo un administrador con gestión total de la comunidad puede crearlas.'}
              buttonIcon={permissions.canCreateCategory ? DataIcons.buttons.plus : DataIcons.navigation.home}
              buttonText={permissions.canCreateCategory ? 'Crear categoría' : 'Volver al inicio'}
              onClickButton={() => navigate(permissions.canCreateCategory ? '/admin/forum-categories' : '/dashboard')} />
          : <ul className="forum-category-grid">
              {categories.data.map((category) => (
                <li key={category.forum_category_id}>
                  <Card className="forum-category-card"><CardBody>
                    <span className="feature-icon" aria-hidden="true">{DataIcons.navigation.chats}</span>
                    <h3><Link to={`/forum/categories/${category.forum_category_id}`}>{category.forum_category_name}</Link></h3>
                    {category.forum_category_description && <p>{category.forum_category_description}</p>}
                    {!category.forum_category_is_active && <p className="muted">Inactiva</p>}
                  </CardBody></Card>
                </li>
              ))}
            </ul>)}
      </section>

      <section className="forum-topics" aria-labelledby="recent-heading">
        <h2 id="recent-heading">Preguntas recientes</h2>
        <TopicFiltersBar filters={filters} onStatus={setStatus} onClearCourse={clearCourse} />
        <TopicList result={topics.data} loading={topics.loading} error={topics.error} onRetry={topics.reload} onPage={setPage}
          empty={<Empty icon={DataIcons.navigation.chats} title="Todavía no hay preguntas aquí"
            text={canAsk ? 'Sé la primera persona en preguntar.' : 'Cuando la comunidad publique preguntas aparecerán aquí.'}
            buttonIcon={canAsk ? DataIcons.buttons.plus : DataIcons.navigation.home}
            buttonText={canAsk ? 'Hacer una pregunta' : 'Volver al inicio'}
            onClickButton={() => navigate(canAsk ? newTopicUrl : '/dashboard')} />} />
      </section>
    </section>
  )
}
