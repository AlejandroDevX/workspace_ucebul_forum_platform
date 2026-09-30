import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { ForumTopicStatus, TopicFilters } from '../types/community.types'

const STATUSES: ForumTopicStatus[] = ['open', 'closed', 'hidden']
export const TOPICS_PER_PAGE = 15

// Página, estado y curso viven en la URL para poder compartir y volver atrás.
export function useTopicFilters(categoryId?: number) {
  const [params, setParams] = useSearchParams()
  const filters = useMemo<TopicFilters>(() => {
    const page = Number(params.get('page'))
    const course = Number(params.get('course'))
    const status = params.get('status') as ForumTopicStatus | null
    return {
      page: Number.isInteger(page) && page > 0 ? page : 1,
      per_page: TOPICS_PER_PAGE,
      forum_topic_category_id: categoryId,
      forum_topic_course_id: Number.isInteger(course) && course > 0 ? course : undefined,
      forum_topic_status: status && STATUSES.includes(status) ? status : undefined,
    }
  }, [params, categoryId])

  function update(changes: Record<string, string | null>) {
    const next = new URLSearchParams(params)
    for (const [key, value] of Object.entries(changes)) {
      if (value === null || value === '') next.delete(key)
      else next.set(key, value)
    }
    if (!('page' in changes)) next.delete('page')
    setParams(next)
  }

  return {
    filters,
    setPage: (page: number) => { update({ page: String(page) }); window.scrollTo(0, 0) },
    setStatus: (status: string) => update({ status: status === 'all' ? null : status }),
    clearCourse: () => update({ course: null }),
  }
}
