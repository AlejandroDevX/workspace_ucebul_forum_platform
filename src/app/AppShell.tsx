import { useEffect, useMemo, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Button, DataIcons, Header, IconButton, Sidebar } from 'ucebul_mui'
import { useAuthStore } from '../features/auth/store/auth.store'
import { permissionSlugs } from '../features/auth/utils/session-policy'
import { type NavGroup, type NavItem, visibleGroups } from './navigation'

interface Props {
  variant: 'forum' | 'admin'
  title: string
  navigation: NavGroup[]
}

const LINK_CLASS = 'vertical-navigation__link'
const ACTIVE_CLASS = 'vertical-navigation__link--active'

// Sidebar no admite `end`: las rutas raíz (/admin) solo se marcan activas en coincidencia exacta.
function isRootOfOthers(item: NavItem, items: NavItem[]) {
  return items.some((other) => other !== item && other.to.startsWith(`${item.to}/`))
}

function currentItem(pathname: string, items: NavItem[]) {
  return items
    .filter((item) => pathname === item.to || pathname.startsWith(`${item.to}/`))
    .sort((a, b) => b.to.length - a.to.length)[0]
}

export default function AppShell({ variant, title, navigation }: Props) {
  const { pathname } = useLocation()
  const main = useRef<HTMLElement>(null)
  const previousPath = useRef(pathname)
  const [openMenu, setOpenMenu] = useState(false)
  const user = useAuthStore((state) => state.user)
  const permissions = useAuthStore((state) => state.currentApplicationPermissions)
  const error = useAuthStore((state) => state.error)
  const logout = useAuthStore((state) => state.logout)
  const clearError = useAuthStore((state) => state.clearError)

  const groups = useMemo(() => {
    const slugs = permissionSlugs(permissions)
    return visibleGroups(navigation, (required) => required.some((slug) => slugs.has(slug)))
  }, [navigation, permissions])
  const items = useMemo(() => groups.flatMap((group) => group.items), [groups])
  const active = currentItem(pathname, items)

  const sidebarData = groups.map((group) => ({
    id: group.title,
    title: group.title,
    children: group.items.map((item) => ({
      id: item.to,
      title: item.title,
      to: item.to,
      icon: item.icon,
      className: LINK_CLASS,
      activeClassName: !isRootOfOthers(item, items) || pathname === item.to ? ACTIVE_CLASS : '',
    })),
  }))

  useEffect(() => {
    document.title = `${active?.title ?? 'Página no encontrada'} | ${title} UCEBUL`
    if (previousPath.current !== pathname) {
      window.scrollTo(0, 0)
      main.current?.focus({ preventScroll: true })
      previousPath.current = pathname
    }
  }, [active, pathname, title])

  const username = [user?.workspace_user_name, user?.workspace_user_last_name].filter(Boolean).join(' ')

  return (
    <div className={`app-shell app-shell--${variant}`}>
      <a className="skip-link" href="#contenido">Saltar al contenido</a>
      <Sidebar navigationData={sidebarData} openMenu={openMenu} setOpenMenu={setOpenMenu} />
      <div className="app-shell__body">
        <Header title={title} username={username || 'Usuario'} onLogout={() => void logout()} />
        <div className="app-shell__toolbar">
          <IconButton icon={DataIcons.navigation.menu} label="Abrir menú de navegación" variant="default"
            aria-expanded={openMenu} onClick={() => setOpenMenu(true)} />
          <span className="app-shell__current" aria-hidden="true">{active?.title}</span>
          <nav className="quick-nav" aria-label="Navegación rápida">
            {items.map((item) => (
              <NavLink key={item.to} to={item.to} end={isRootOfOthers(item, items)}>
                <span className="quick-nav__icon" aria-hidden="true">{item.icon}</span>
                <span className="quick-nav__label">{item.shortTitle ?? item.title}</span>
              </NavLink>
            ))}
          </nav>
        </div>
        <main id="contenido" ref={main} tabIndex={-1}>
          {error && <div className="auth-error global-error" role="alert"><p>{error.message}</p>
            <Button size="sm" onClick={() => clearError()}>Cerrar aviso</Button></div>}
          <Outlet />
        </main>
        <footer className="site-footer"><strong>UCEBUL · Foro técnico</strong><span>Educación y comunidad agropecuaria</span></footer>
      </div>
    </div>
  )
}
