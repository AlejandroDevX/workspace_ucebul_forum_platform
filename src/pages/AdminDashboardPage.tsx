import { Link } from 'react-router-dom'
import { Card, CardBody, DataIcons } from 'ucebul_mui'
import { ADMIN_NAVIGATION } from '../app/navigation'
import { useAuthStore } from '../features/auth/store/auth.store'

const DESCRIPTIONS: Record<string, string> = {
  '/admin/courses': 'Crear, editar y publicar cursos y sus lecciones.',
  '/admin/categories': 'Organizar los cursos por temáticas.',
  '/admin/moderation': 'Revisar reportes y cuidar la convivencia en el foro.',
}

export default function AdminDashboardPage() {
  useAuthStore((state) => state.currentApplicationPermissions)
  const hasAnyPermission = useAuthStore((state) => state.hasAnyPermission)
  const sections = ADMIN_NAVIGATION[0].items
    .filter((item) => item.to in DESCRIPTIONS && item.permissions && hasAnyPermission(item.permissions))

  return (
    <section className="page-section" aria-labelledby="admin-title">
      <p className="eyebrow">Administración</p>
      <h1 id="admin-title">Panel de administración</h1>
      <p className="page-intro">Gestiona el contenido educativo y la comunidad del Foro Técnico. Solo ves las secciones para las que tienes permisos.</p>
      <ul className="shortcut-grid">
        {sections.map((section) => (
          <li key={section.to}>
            <Card className="shortcut-card"><CardBody>
              <span className="feature-icon" aria-hidden="true">{section.icon}</span>
              <h3>{section.title}</h3>
              <p>{DESCRIPTIONS[section.to]}</p>
              <Link className="text-link" to={section.to}>Abrir {section.title.toLowerCase()} <span aria-hidden="true">{DataIcons.buttons.arrowLongRight}</span></Link>
            </CardBody></Card>
          </li>
        ))}
      </ul>
    </section>
  )
}
