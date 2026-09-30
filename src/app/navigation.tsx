import type { ReactNode } from 'react'
import { DataIcons } from 'ucebul_mui'

// Slugs reales devueltos por Workspace en current_application_permissions.
export const PERMISSIONS = {
  coursesView: 'forum.courses.view',
  courseCreate: 'forum.courses.create',
  courseUpdate: 'forum.courses.update',
  lessonsView: 'forum.lessons.view',
  lessonsCreate: 'forum.lessons.create',
  lessonsUpdate: 'forum.lessons.update',
  learningView: 'forum.learning.view',
  communityView: 'forum.community.view',
  communityCreate: 'forum.community.create',
  communityUpdate: 'forum.community.update',
  communityManageAny: 'forum.community.manage-any',
  adminCourses: ['forum.courses.create', 'forum.courses.update', 'forum.courses.delete', 'forum.courses.publish'],
  adminCategories: ['forum.courses.create', 'forum.courses.update'],
  adminLessons: ['forum.lessons.create', 'forum.lessons.update', 'forum.lessons.delete', 'forum.lessons.publish'],
  moderationView: 'forum.moderation.view',
  moderationManage: 'forum.moderation.manage',
  moderationReports: 'forum.moderation.reports',
  // Listar y consultar reportes exige forum.moderation.view; manage o reports por sí solos no dan acceso al panel.
  adminModeration: ['forum.moderation.view'],
} as const

export const ADMIN_PERMISSIONS: readonly string[] = [
  ...new Set([...PERMISSIONS.adminCourses, ...PERMISSIONS.adminCategories, ...PERMISSIONS.adminLessons, ...PERMISSIONS.adminModeration, PERMISSIONS.communityManageAny]),
]

export interface NavItem {
  to: string
  title: string
  // Etiqueta corta para la barra compacta en móvil.
  shortTitle?: string
  icon: ReactNode
  // Sin permisos: visible para cualquier sesión autenticada.
  permissions?: readonly string[]
}

export interface NavGroup {
  title: string
  items: NavItem[]
}

export const FORUM_NAVIGATION: NavGroup[] = [
  {
    title: 'Aprender',
    items: [
      { to: '/dashboard', title: 'Inicio', icon: DataIcons.navigation.home },
      { to: '/courses', title: 'Cursos', icon: DataIcons.navigation.folder, permissions: [PERMISSIONS.coursesView] },
      { to: '/my-courses', title: 'Mis cursos', icon: DataIcons.global.bookOutline, permissions: [PERMISSIONS.learningView] },
    ],
  },
  {
    title: 'Comunidad',
    items: [
      { to: '/forum', title: 'Foro', icon: DataIcons.navigation.chats, permissions: [PERMISSIONS.communityView] },
      { to: '/favorites', title: 'Favoritos', icon: DataIcons.global.bookmarkOutline, permissions: [PERMISSIONS.coursesView, PERMISSIONS.communityView] },
    ],
  },
  {
    title: 'Gestión',
    items: [
      { to: '/admin', title: 'Administración', shortTitle: 'Admin', icon: DataIcons.global.settingsOutline, permissions: ADMIN_PERMISSIONS },
    ],
  },
]

export const ADMIN_NAVIGATION: NavGroup[] = [
  {
    title: 'Administración',
    items: [
      { to: '/admin', title: 'Panel', icon: DataIcons.navigation.clipboardDocumentList, permissions: ADMIN_PERMISSIONS },
      { to: '/admin/courses', title: 'Cursos', icon: DataIcons.navigation.folder, permissions: PERMISSIONS.adminCourses },
      { to: '/admin/categories', title: 'Categorías', icon: DataIcons.navigation.tableOutline, permissions: PERMISSIONS.adminCategories },
      { to: '/admin/forum-categories', title: 'Categorías del foro', icon: DataIcons.navigation.chats, permissions: [PERMISSIONS.communityManageAny] },
      { to: '/admin/moderation', title: 'Moderación', icon: DataIcons.navigation.documentCheck, permissions: PERMISSIONS.adminModeration },
    ],
  },
  {
    title: 'Foro',
    items: [
      { to: '/dashboard', title: 'Volver al foro', shortTitle: 'Foro', icon: DataIcons.buttons.arrowLongLeft },
    ],
  },
]

export function visibleGroups(groups: NavGroup[], hasAnyPermission: (slugs: readonly string[]) => boolean): NavGroup[] {
  return groups
    .map((group) => ({ ...group, items: group.items.filter((item) => !item.permissions || hasAnyPermission(item.permissions)) }))
    .filter((group) => group.items.length > 0)
}
