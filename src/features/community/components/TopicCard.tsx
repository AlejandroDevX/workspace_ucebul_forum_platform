import { Link } from 'react-router-dom'
import { Badge, Card, CardBody, DataIcons } from 'ucebul_mui'
import type { ForumTopic } from '../types/community.types'
import { authorLabel, formatDateTime } from '../utils/community-format'
import { useCommunityPermissions } from '../utils/useCommunityPermissions'
import AcceptedAnswerBadge from './AcceptedAnswerBadge'
import FavoriteButton from '../../favorites/components/FavoriteButton'

export default function TopicCard({ topic, showCategory = true, onFavoriteChange }: {
  topic: ForumTopic
  showCategory?: boolean
  onFavoriteChange?: (favorite: boolean) => void
}) {
  const { isMine } = useCommunityPermissions()
  // Los temas de favoritos no incluyen el conteo de respuestas: en ese caso no se muestra.
  const replies = topic.forum_topic_posts_count

  return (
    <Card className={`topic-card ${topic.forum_topic_accepted_post_id ? 'topic-card--solved' : ''} ${replies === undefined ? 'topic-card--no-stats' : ''}`}>
      <CardBody>
        {replies !== undefined && <div className="topic-card__stats" aria-hidden="true">
          <strong>{replies}</strong><span>{replies === 1 ? 'respuesta' : 'respuestas'}</span>
        </div>}
        <div className="topic-card__main">
          <div className="course-card__tags">
            {topic.forum_topic_accepted_post_id && <AcceptedAnswerBadge label="Resuelta" />}
            {topic.forum_topic_status === 'closed' && <Badge>Cerrada</Badge>}
            {topic.forum_topic_status === 'hidden' && <Badge variant="warning">Oculta</Badge>}
            {showCategory && topic.category && <Badge variant="info">{topic.category.forum_category_name}</Badge>}
            {topic.course && <Badge><span className="badge-icon" aria-hidden="true">{DataIcons.global.bookOutline}</span>{topic.course.forum_course_title}</Badge>}
          </div>
          <h3><Link to={`/forum/topics/${topic.forum_topic_id}`}>{topic.forum_topic_title}</Link></h3>
          <p className="topic-card__excerpt">{topic.forum_topic_body}</p>
          <p className="topic-card__meta">
            {authorLabel(topic.forum_topic_workspace_user_id, isMine, topic.forum_topic_workspace_user)} · {formatDateTime(topic.forum_topic_created_at)}
            {replies !== undefined && <span className="sr-only"> · {replies} {replies === 1 ? 'respuesta' : 'respuestas'}</span>}
          </p>
        </div>
        <FavoriteButton kind="topic" id={topic.forum_topic_id} title={topic.forum_topic_title} onChange={onFavoriteChange} className="card-favorite" />
      </CardBody>
    </Card>
  )
}
