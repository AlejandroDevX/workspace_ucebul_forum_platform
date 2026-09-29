import { useMemo } from 'react'
import type { FormOption } from 'ucebul_mui'
import { useRequest } from '../../../lib/useRequest'
import { listAllCourseCategories } from '../api/course-category.service'

export function useCourseCategories() {
  const request = useRequest('course-categories', listAllCourseCategories)
  const options = useMemo<FormOption[]>(() => (request.data ?? []).map((category) => ({
    label: category.forum_course_category_is_active
      ? category.forum_course_category_name
      : `${category.forum_course_category_name} (inactiva)`,
    value: category.forum_course_category_id,
  })), [request.data])
  return { ...request, options }
}
