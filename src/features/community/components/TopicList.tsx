import type { ReactNode } from 'react'
import { Button, Pagination, Spinner } from 'ucebul_mui'
import type { ApiError } from '../../../lib/api-error'
import type { Paginated } from '../../../lib/pagination'
import type { ForumTopic } from '../types/community.types'
import TopicCard from './TopicCard'

interface Props {
  result: Paginated<ForumTopic> | undefined
  loading: boolean
  error: ApiError | null
  onRetry: () => void
  onPage: (page: number) => void
  empty: ReactNode
  showCategory?: boolean
}

export default function TopicList({ result, loading, error, onRetry, onPage, empty, showCategory = true }: Props) {
  if (loading) return <div className="loading-block"><Spinner label="Cargando preguntas…" /></div>
  if (error) {
    return <div className="auth-error load-error" role="alert"><p>{error.message}</p><Button size="sm" onClick={onRetry}>Reintentar</Button></div>
  }
  if (!result) return null
  if (result.data.length === 0) return <>{empty}</>
  return (
    <>
      <ul className="topic-list">
        {result.data.map((topic) => <li key={topic.forum_topic_id}><TopicCard topic={topic} showCategory={showCategory} /></li>)}
      </ul>
      {result.meta.last_page > 1 && <nav className="pagination-wrap" aria-label="Paginación de preguntas">
        <Pagination totalPages={result.meta.last_page} currentPage={result.meta.current_page} onChangePage={onPage} />
      </nav>}
    </>
  )
}
