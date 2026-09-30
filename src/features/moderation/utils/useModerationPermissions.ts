import { useAuthStore } from '../../auth/store/auth.store'

// Permisos efectivos de Workspace; nunca se deducen del rol. El backend decide en cada operación.
export function useModerationPermissions() {
  useAuthStore((state) => state.currentApplicationPermissions)
  const has = useAuthStore((state) => state.hasPermission)
  return {
    canReport: has('forum.moderation.reports'),
    canView: has('forum.moderation.view'),
    canManage: has('forum.moderation.manage'),
  }
}
