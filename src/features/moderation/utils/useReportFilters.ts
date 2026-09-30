import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { ForumReportStatus, ReportFilters } from '../types/moderation.types'
import { REPORT_STATUSES } from './report-format'

export const REPORTS_PER_PAGE = 15

const positive = (value: string | null) => {
  const number = Number(value)
  return Number.isInteger(number) && number > 0 ? number : undefined
}

// Filtros en la URL. Sin `status` se muestran los pendientes; status=all muestra todos.
export function useReportFilters() {
  const [params, setParams] = useSearchParams()
  const status = params.get('status') ?? 'pending'
  const filters = useMemo<ReportFilters>(() => ({
    page: positive(params.get('page')) ?? 1,
    per_page: REPORTS_PER_PAGE,
    forum_report_status: REPORT_STATUSES.includes(status as ForumReportStatus) ? status as ForumReportStatus : undefined,
    forum_report_topic_id: positive(params.get('topic')),
    forum_report_post_id: positive(params.get('post')),
  }), [params, status])

  function update(changes: Record<string, string | null>) {
    const next = new URLSearchParams(params)
    for (const [key, value] of Object.entries(changes)) {
      if (value === null) next.delete(key)
      else next.set(key, value)
    }
    if (!('page' in changes)) next.delete('page')
    setParams(next)
  }

  return {
    filters,
    activeStatus: filters.forum_report_status ?? 'all',
    setStatus: (value: string) => update({ status: value === 'pending' ? null : value }),
    setPage: (page: number) => update({ page: String(page) }),
    clearTarget: () => update({ topic: null, post: null }),
  }
}
