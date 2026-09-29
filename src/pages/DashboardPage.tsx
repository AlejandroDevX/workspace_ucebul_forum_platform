import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Avatar, Badge, Card, CardBody, DataIcons, Empty } from 'ucebul_mui'
import { PERMISSIONS } from '../app/navigation'
import { useAuthStore } from '../features/auth/store/auth.store'
import { applicationRoleName } from '../features/auth/utils/session-policy'

interface Shortcut {
  to: string
  title: string
  description: string
  action: string
  icon: ReactNode
  permission: string
}

const SHORTCUTS: Shortcut[] = [
  { to: '/courses', title: 'Explorar cursos', description: 'Descubre formación técnica sobre cultivos, ganadería y gestión del campo.', action: 'Ver cursos', icon: DataIcons.navigation.folder, permission: PERMISSIONS.coursesView },
  { to: '/my-courses', title: 'Mis cursos', description: 'Consulta los cursos en los que estás inscrito y tu avance en cada uno.', action: 'Ir a mis cursos', icon: DataIcons.global.bookOutline, permission: PERMISSIONS.learningView },
  { to: '/forum', title: 'Participar en el foro', description: 'Pregunta, responde y comparte experiencias con otras personas del sector.', action: 'Entrar al foro', icon: DataIcons.navigation.chats, permission: PERMISSIONS.communityView },
]

export default function DashboardPage() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const access = useAuthStore((state) => state.currentApplicationAccess)
  // Suscripción a los permisos para volver a evaluar hasPermission cuando cambien.
  useAuthStore((state) => state.currentApplicationPermissions)
  const hasPermission = useAuthStore((state) => state.hasPermission)

  const name = user?.workspace_user_name?.trim() || 'de nuevo'
  const fullName = [user?.workspace_user_name, user?.workspace_user_last_name].filter(Boolean).join(' ')
  const role = applicationRoleName(access)
  const shortcuts = SHORTCUTS.filter((shortcut) => hasPermission(shortcut.permission))
  const canLearn = hasPermission(PERMISSIONS.learningView)

  return (
    <div className="dashboard">
      <section className="dashboard-welcome" aria-labelledby="dashboard-title">
        <Avatar alt={fullName || 'Usuario'} width={64} className="dashboard-welcome__avatar" />
        <div className="dashboard-welcome__copy">
          <p className="eyebrow">Tu espacio de aprendizaje</p>
          <h1 id="dashboard-title">Hola, {name}.</h1>
          <p>Aprende a tu ritmo y comparte lo que sabes con la comunidad agropecuaria.</p>
        </div>
        {role && <Badge variant="success" className="dashboard-welcome__role">{role}</Badge>}
      </section>

      {canLearn && (
        <section className="dashboard-section" aria-labelledby="continue-title">
          <h2 id="continue-title">Continuar aprendiendo</h2>
          <Empty
            icon={DataIcons.global.bookOutline}
            title="Tu progreso aparecerá aquí"
            text="Cuando el seguimiento de aprendizaje esté disponible podrás retomar tus lecciones desde este punto."
            buttonIcon={DataIcons.buttons.arrowLongRight}
            buttonText="Ir a mis cursos"
            onClickButton={() => navigate('/my-courses')}
          />
        </section>
      )}

      {shortcuts.length > 0 && (
        <section className="dashboard-section" aria-labelledby="shortcuts-title">
          <h2 id="shortcuts-title">¿Qué quieres hacer hoy?</h2>
          <ul className="shortcut-grid">
            {shortcuts.map((shortcut) => (
              <li key={shortcut.to}>
                <Card className="shortcut-card"><CardBody>
                  <span className="feature-icon" aria-hidden="true">{shortcut.icon}</span>
                  <h3>{shortcut.title}</h3>
                  <p>{shortcut.description}</p>
                  <Link className="text-link" to={shortcut.to}>{shortcut.action} <span aria-hidden="true">{DataIcons.buttons.arrowLongRight}</span></Link>
                </CardBody></Card>
              </li>
            ))}
          </ul>
        </section>
      )}

      {!canLearn && shortcuts.length === 0 && (
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
