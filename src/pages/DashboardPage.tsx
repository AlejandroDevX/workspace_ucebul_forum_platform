import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Badge, Button, Card, CardBody, CardHeader, DataIcons, Empty, Spinner } from 'ucebul_mui'
import heroImage from '../assets/dashboard-hero.webp'
import { PERMISSIONS } from '../app/navigation'
import { useAuthStore } from '../features/auth/store/auth.store'
import { listTopics } from '../features/community/api/topic.service'
import { authorLabel, formatRelativeTime } from '../features/community/utils/community-format'
import { useCommunityPermissions } from '../features/community/utils/useCommunityPermissions'
import { searchCourses } from '../features/courses/api/course.service'
import CourseCover from '../features/courses/components/CourseCover'
import { categoryName, formatDuration } from '../features/courses/utils/course-format'
import { listAllMyCourses } from '../features/learning/api/learning.service'
import InProgressCourses from '../features/learning/components/InProgressCourses'
import { useRequest } from '../lib/useRequest'

const RECOMMENDED = 3
const RECENT_TOPICS = 5

const LEVEL_VARIANTS: Record<string, 'success' | 'warning' | 'danger'> = { Básico: 'success', Intermedio: 'warning', Avanzado: 'danger' }

function LoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <div className="auth-error load-error" role="alert"><p>{message}</p><Button size="sm" onClick={onRetry}>Reintentar</Button></div>
}

function StatCard({ to, icon, label, value, hint }: { to: string; icon: ReactNode; label: string; value: ReactNode; hint: string }) {
  return (
    <li>
      <Card className="stat-card"><CardBody>
        <span className="stat-card__icon" aria-hidden="true">{icon}</span>
        <div className="stat-card__text">
          <Link to={to} className="stat-card__link">{label}</Link>
          <strong>{value}</strong>
          <span>{hint}</span>
        </div>
        <span className="stat-card__chevron" aria-hidden="true">{DataIcons.global.arrowRightCheveronSolid}</span>
      </CardBody></Card>
    </li>
  )
}

function SectionCard({ id, title, action, children, className = '' }: {
  id: string
  title: string
  action?: { to: string; label: string }
  children: ReactNode
  className?: string
}) {
  return (
    <section aria-labelledby={id} className={className}>
      <Card className="dashboard-card">
        <CardHeader className="dashboard-card__header">
          <h2 id={id}>{title}</h2>
          {action && <Link className="dashboard-card__action" to={action.to}>{action.label}
            <span aria-hidden="true">{DataIcons.buttons.arrowLongRight}</span></Link>}
        </CardHeader>
        <CardBody>{children}</CardBody>
      </Card>
    </section>
  )
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  // Suscripción a los permisos para volver a evaluar hasPermission cuando cambien.
  useAuthStore((state) => state.currentApplicationPermissions)
  const hasPermission = useAuthStore((state) => state.hasPermission)
  const { isMine } = useCommunityPermissions()

  const canLearn = hasPermission(PERMISSIONS.learningView)
  const canViewCourses = hasPermission(PERMISSIONS.coursesView)
  const canViewCommunity = hasPermission(PERMISSIONS.communityView)

  const enrollments = useRequest(canLearn ? 'my-courses' : null, listAllMyCourses)
  const recommended = useRequest(canViewCourses ? 'dashboard-courses' : null,
    (signal) => searchCourses({ page: 1, per_page: RECOMMENDED * 2 }, signal))
  const topics = useRequest(canViewCommunity ? 'dashboard-topics' : null,
    (signal) => listTopics({ page: 1, per_page: RECENT_TOPICS }, signal))

  const name = user?.workspace_user_name?.trim() || 'de nuevo'
  const visible = (enrollments.data ?? []).filter((enrollment) => enrollment.course)
  const completedCourses = visible.filter((enrollment) => enrollment.progress.is_completed).length
  const completedLessons = visible.reduce((total, enrollment) => total + enrollment.progress.completed_lessons, 0)
  const publishedLessons = visible.reduce((total, enrollment) => total + enrollment.progress.published_lessons, 0)
  // Los recomendados excluyen los cursos en los que ya hay inscripción.
  const enrolledIds = new Set(visible.map((enrollment) => enrollment.forum_enrollment_course_id))
  const courses = (recommended.data?.data ?? []).filter((course) => !enrolledIds.has(course.forum_course_id)).slice(0, RECOMMENDED)

  return (
    <div className="dashboard">
      <section className="dashboard-hero" aria-labelledby="dashboard-title">
        <div className="dashboard-hero__copy">
          <p className="dashboard-hero__eyebrow">Tu espacio de aprendizaje</p>
          <h1 id="dashboard-title">Hola, {name} <span aria-hidden="true">👋</span></h1>
          <p>Aprende, comparte y fortalece tus conocimientos con la comunidad agropecuaria.</p>
          {canViewCourses && <Button variant="primary" onClick={() => navigate('/courses')}>
            <span className="button-icon" aria-hidden="true">{DataIcons.navigation.folder}</span>Explorar cursos
            <span className="button-icon button-icon--end" aria-hidden="true">{DataIcons.buttons.arrowLongRight}</span>
          </Button>}
        </div>
        <div className="dashboard-hero__media" aria-hidden="true">
          <img src={heroImage} alt="" />
        </div>
        <blockquote className="dashboard-hero__quote">
          <p>«Conocimiento técnico para un campo más fuerte»</p>
        </blockquote>
      </section>

      {canLearn && (
        <section aria-label="Tu avance">
          {enrollments.error ? <LoadError message={enrollments.error.message} onRetry={enrollments.reload} /> : (
            <ul className="stat-grid" aria-busy={enrollments.loading}>
              <StatCard to="/my-courses" icon={DataIcons.global.bookOutline} label="Cursos inscritos"
                value={enrollments.loading ? '—' : visible.length}
                hint={visible.length ? 'Consulta tus cursos y retómalos.' : 'Aún no te has inscrito en cursos.'} />
              <StatCard to="/my-courses" icon={DataIcons.global.checkOutline} label="Lecciones completadas"
                value={enrollments.loading ? '—' : <>{completedLessons}<small> de {publishedLessons}</small></>}
                hint={publishedLessons ? 'Lecciones publicadas en tus cursos.' : 'Comienza un curso para ver tu avance.'} />
              <StatCard to="/my-courses" icon={DataIcons.global.star} label="Cursos finalizados"
                value={enrollments.loading ? '—' : completedCourses}
                hint={completedCourses ? '¡Buen trabajo! Sigue aprendiendo.' : 'Finaliza un curso para verlo aquí.'} />
            </ul>
          )}
        </section>
      )}

      {canLearn && (
        <SectionCard id="continue-title" title="Continuar aprendiendo" className="dashboard-continue">
          <InProgressCourses enrollments={enrollments} />
        </SectionCard>
      )}

      {(canViewCourses || canViewCommunity) && (
        <div className="dashboard-columns">
          {canViewCourses && (
            <SectionCard id="recommended-title" title="Cursos recomendados" action={{ to: '/courses', label: 'Ver todos' }}>
              {recommended.loading ? <div className="loading-block"><Spinner label="Cargando cursos…" /></div>
                : recommended.error ? <LoadError message={recommended.error.message} onRetry={recommended.reload} />
                  : courses.length === 0 ? <p className="dashboard-muted">No hay cursos nuevos para recomendarte por ahora.</p>
                    : (
                      <ul className="recommended-grid">
                        {courses.map((course) => {
                          const description = course.forum_course_summary || course.forum_course_description
                          const category = categoryName(course)
                          return (
                            <li key={course.forum_course_id} className="recommended-course">
                              <div className="recommended-course__cover">
                                <CourseCover course={course} />
                                {course.forum_course_level && <Badge variant={LEVEL_VARIANTS[course.forum_course_level] ?? 'default'}
                                  className="recommended-course__level">{course.forum_course_level}</Badge>}
                              </div>
                              <div className="recommended-course__body">
                                <h3>{course.forum_course_title}</h3>
                                {description && <p>{description}</p>}
                                <dl className="recommended-course__meta">
                                  {category && <div><dt><span aria-hidden="true">{DataIcons.navigation.folder}</span><span className="sr-only">Categoría</span></dt><dd>{category}</dd></div>}
                                  <div><dt><span aria-hidden="true">{DataIcons.global.clockOutline}</span><span className="sr-only">Duración</span></dt><dd>{formatDuration(course.forum_course_duration_minutes)}</dd></div>
                                </dl>
                                <Link className="recommended-course__action" to={`/courses/${course.forum_course_id}`}>
                                  Ver curso<span className="sr-only">: {course.forum_course_title}</span>
                                  <span aria-hidden="true">{DataIcons.buttons.arrowLongRight}</span>
                                </Link>
                              </div>
                            </li>
                          )
                        })}
                      </ul>
                    )}
            </SectionCard>
          )}

          {canViewCommunity && (
            <SectionCard id="activity-title" title="Actividad reciente de la comunidad" action={{ to: '/forum', label: 'Ver foro' }}>
              {topics.loading ? <div className="loading-block"><Spinner label="Cargando actividad…" /></div>
                : topics.error ? <LoadError message={topics.error.message} onRetry={topics.reload} />
                  : !topics.data?.data.length ? <p className="dashboard-muted">Todavía no hay preguntas en el foro. ¡Sé el primero en participar!</p>
                    : (
                      <ul className="activity-list">
                        {topics.data.data.map((topic) => {
                          const solved = Boolean(topic.forum_topic_accepted_post_id)
                          const replies = topic.forum_topic_posts_count
                          return (
                            <li key={topic.forum_topic_id} className="activity-item">
                              <span className={`activity-item__icon ${solved ? 'activity-item__icon--solved' : ''}`} aria-hidden="true">
                                {solved ? DataIcons.global.checkOutline : DataIcons.global.question}
                              </span>
                              <div className="activity-item__main">
                                <Link to={`/forum/topics/${topic.forum_topic_id}`}>{topic.forum_topic_title}</Link>
                                <span>
                                  {authorLabel(topic.forum_topic_workspace_user_id, isMine, topic.forum_topic_workspace_user)}
                                  {topic.category && <> · en {topic.category.forum_category_name}</>}
                                  {solved && <span className="sr-only"> · Resuelta</span>}
                                </span>
                              </div>
                              <time className="activity-item__time" dateTime={topic.forum_topic_created_at}>{formatRelativeTime(topic.forum_topic_created_at)}</time>
                              {replies !== undefined && <span className="activity-item__replies">
                                <span aria-hidden="true">{DataIcons.navigation.chats}</span>{replies}
                                <span className="sr-only"> {replies === 1 ? 'respuesta' : 'respuestas'}</span>
                              </span>}
                            </li>
                          )
                        })}
                      </ul>
                    )}
            </SectionCard>
          )}
        </div>
      )}

      {!canLearn && !canViewCourses && !canViewCommunity && (
        <Empty
          icon={DataIcons.global.lockClosedOutline}
          title="Aún no tienes secciones habilitadas"
          text="Tu cuenta tiene acceso al Foro Técnico, pero sin permisos sobre cursos ni comunidad. Contacta al administrador de tu organización."
          buttonIcon={DataIcons.global.bookmarkOutline}
          buttonText="Ver favoritos"
          onClickButton={() => navigate('/favorites')}
        />
      )}
    </div>
  )
}
