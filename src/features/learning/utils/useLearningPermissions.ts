import { useAuthStore } from '../../auth/store/auth.store'

export function useLearningPermissions() {
  useAuthStore((state) => state.currentApplicationPermissions)
  const hasPermission = useAuthStore((state) => state.hasPermission)
  return {
    canView: hasPermission('forum.learning.view'),
    canEnroll: hasPermission('forum.learning.enroll'),
    canTrack: hasPermission('forum.learning.progress'),
  }
}
