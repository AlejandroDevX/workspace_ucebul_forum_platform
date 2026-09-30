import { useAuthStore } from '../../auth/store/auth.store'
import type { FavoriteKind } from '../types/favorite.types'

// Favoritos de cursos: forum.courses.view. Favoritos de temas: forum.community.view.
export const FAVORITE_PERMISSIONS: Record<FavoriteKind, string> = {
  course: 'forum.courses.view',
  topic: 'forum.community.view',
}

export function useFavoritePermissions() {
  useAuthStore((state) => state.currentApplicationPermissions)
  const has = useAuthStore((state) => state.hasPermission)
  return { course: has(FAVORITE_PERMISSIONS.course), topic: has(FAVORITE_PERMISSIONS.topic) }
}
