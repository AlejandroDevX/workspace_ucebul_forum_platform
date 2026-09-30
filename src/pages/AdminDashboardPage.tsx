import { Link, useNavigate } from 'react-router-dom'
import { Badge, Card, CardBody, DataIcons, Empty } from 'ucebul_mui'
import { ADMIN_NAVIGATION } from '../app/navigation'
import { useAuthStore } from '../features/auth/store/auth.store'
import { listReports } from '../features/moderation/api/report.service'
import { useModerationPermissions } from '../features/moderation/utils/useModerationPermissions'
import { useRequest } from '../lib/useRequest'

const DESCRIPTIONS: Record<string, string> = {
  '/admin/courses': 'Crear, editar y publicar cursos. Desde cada curso se gestionan sus lecciones.',
  '/admin/categories': 'Organizar los cursos por temáticas.',
  '/admin/forum-categories': 'Organizar las categorías de la comunidad.',
  '/admin/moderation': 'Revisar reportes, ocultar o restaurar contenido y cuidar la convivencia en el foro.',
}

export default function AdminDashboardPage() {
  const navigate = useNavigate()
  useAuthStore((state) => state.currentApplicationPermissions)
  const hasAnyPermission = useAuthStore((state) => state.hasAnyPermission)
  const { canView } = useModerationPermissions()
  // Solo el total de pendientes (meta.total); no se calculan otras métricas.
  const pending = useRequest(canView ? 'admin-pending-reports' : null,
    async (signal) => (await listReports({ forum_report_status: 'pending', per_page: 1 }, signal)).meta.total)
  const sections = ADMIN_NAVIGATION[0].items
    .filter((item) => item.to in DESCRIPTIONS && item.permissions && hasAnyPermission(item.permissions))

  return (
    <section className="page-section" aria-labelledby="admin-title">
      <p className="eyebrow">Administración</p>
      <h1 id="admin-title">Panel de administración</h1>
      <p className="page-intro">Gestiona el contenido educativo y la comunidad del Foro Técnico. Solo ves las secciones para las que tienes permisos.</p>
      {sections.length === 0
        ? <Card className="availability-card"><CardBody>
            <Empty icon={DataIcons.global.lockClosedOutline} title="No hay secciones disponibles"
              text="Tus permisos actuales no incluyen ninguna sección de administración."
              buttonIcon={DataIcons.buttons.arrowLongLeft} buttonText="Volver al foro" onClickButton={() => navigate('/dashboard')} />
          </CardBody></Card>
        : <ul className="shortcut-grid">
            {sections.map((section) => (
              <li key={section.to}>
                <Card className="shortcut-card"><CardBody>
                  <span className="feature-icon" aria-hidden="true">{section.icon}</span>
                  <h3>{section.title}</h3>
                  <p>{DESCRIPTIONS[section.to]}</p>
                  {section.to === '/admin/moderation' && pending.data !== undefined && <p className="shortcut-card__stat">
                    <Badge variant={pending.data > 0 ? 'warning' : 'success'}>
                      {pending.data === 0 ? 'Sin reportes pendientes' : pending.data === 1 ? '1 reporte pendiente' : `${pending.data} reportes pendientes`}
                    </Badge>
                  </p>}
                  {section.to === '/admin/moderation' && pending.error && <p className="shortcut-card__stat muted" role="status">
                    No se pudo consultar los reportes pendientes: {pending.error.message}</p>}
                  <Link className="text-link" to={section.to}>Abrir {section.title.toLowerCase()} <span aria-hidden="true">{DataIcons.buttons.arrowLongRight}</span></Link>
                </CardBody></Card>
              </li>
            ))}
          </ul>}
    </section>
  )
}
