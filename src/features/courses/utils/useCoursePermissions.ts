import { useCallback } from 'react'
import { useAuthStore } from '../../auth/store/auth.store'
import type { ForumCourse } from '../types/course.types'

// La API exige además ser instructor del curso o tener forum.courses.manage-any.
// El frontend solo oculta acciones; el backend valida definitivamente.
export function useCoursePermissions() {
  useAuthStore((state) => state.currentApplicationPermissions)
  const userId = useAuthStore((state) => state.user?.workspace_user_id)
  const hasPermission = useAuthStore((state) => state.hasPermission)

  const owns = useCallback((course: ForumCourse) => hasPermission('forum.courses.manage-any')
    || (userId != null && String(course.forum_course_instructor_workspace_user_id) === String(userId)), [hasPermission, userId])

  return {
    userId,
    canCreate: hasPermission('forum.courses.create'),
    canUpdate: (course: ForumCourse) => hasPermission('forum.courses.update') && owns(course),
    canDelete: (course: ForumCourse) => hasPermission('forum.courses.delete') && owns(course),
    canPublish: (course: ForumCourse) => hasPermission('forum.courses.publish') && owns(course),
  }
}

export function instructorLabel(course: ForumCourse, userId: number | string | undefined) {
  return userId != null && String(course.forum_course_instructor_workspace_user_id) === String(userId)
    ? 'Tú'
    : `Instructor #${course.forum_course_instructor_workspace_user_id}`
}
