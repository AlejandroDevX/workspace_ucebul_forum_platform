import { useAuthStore } from '../../auth/store/auth.store'
import type { ForumCourse } from '../../courses/types/course.types'

// La API exige ser el instructor del curso además del permiso; forum.courses.manage-any no basta.
export function useLessonPermissions(course: ForumCourse | undefined) {
  useAuthStore((state) => state.currentApplicationPermissions)
  const userId = useAuthStore((state) => state.user?.workspace_user_id)
  const hasPermission = useAuthStore((state) => state.hasPermission)
  const instructor = course !== undefined && userId != null
    && String(course.forum_course_instructor_workspace_user_id) === String(userId)

  const canCreate = instructor && hasPermission('forum.lessons.create')
  const canUpdate = instructor && hasPermission('forum.lessons.update')
  const canDelete = instructor && hasPermission('forum.lessons.delete')
  const canPublish = instructor && hasPermission('forum.lessons.publish')
  return {
    canView: hasPermission('forum.lessons.view'),
    canCreate,
    canUpdate,
    canDelete,
    canPublish,
    canManage: canCreate || canUpdate || canDelete || canPublish,
  }
}
