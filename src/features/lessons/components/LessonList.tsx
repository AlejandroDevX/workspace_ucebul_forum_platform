import { Link, useNavigate } from 'react-router-dom'
import { Badge, Button, DataIcons, Dialog, IconButton } from 'ucebul_mui'
import { formatDuration } from '../../courses/utils/course-format'
import CompletedLessonIndicator from '../../learning/components/CompletedLessonIndicator'
import type { ForumLesson } from '../types/lesson.types'
import { useLessonActions } from '../utils/useLessonActions'

interface Permissions {
  canUpdate: boolean
  canDelete: boolean
  canPublish: boolean
}

interface Props {
  courseId: number
  lessons: ForumLesson[]
  currentId?: number
  compact?: boolean
  permissions?: Permissions
  onChange?: (lessons: ForumLesson[]) => void
  // Lecciones completadas según la API; undefined si el usuario no está inscrito.
  completedIds?: Set<number>
}

const NONE: Permissions = { canUpdate: false, canDelete: false, canPublish: false }

export default function LessonList({ courseId, lessons, currentId, compact = false, permissions = NONE, onChange, completedIds }: Props) {
  const navigate = useNavigate()
  const { busy, error, confirm, setConfirm, move, publish, remove } = useLessonActions(courseId, lessons, onChange)
  const manage = !compact && (permissions.canUpdate || permissions.canDelete || permissions.canPublish)

  return (
    <div className={`lesson-list ${compact ? 'lesson-list--compact' : ''}`}>
      {error && <p className="auth-error" role="alert">{error}</p>}
      <ol>
        {lessons.map((lesson, index) => {
          const current = lesson.forum_lesson_id === currentId
          const disabled = busy !== null
          return (
            <li key={lesson.forum_lesson_id} className={current ? 'is-current' : ''}>
              <span className="lesson-list__number" aria-hidden="true">{index + 1}</span>
              <div className="lesson-list__info">
                <Link to={`/courses/${courseId}/lessons/${lesson.forum_lesson_id}`} aria-current={current ? 'page' : undefined}>
                  <span className="sr-only">Lección {index + 1}: </span>{lesson.forum_lesson_title}
                </Link>
                <span className="lesson-list__meta">
                  {completedIds && <CompletedLessonIndicator completed={completedIds.has(lesson.forum_lesson_id)} />}
                  {lesson.forum_lesson_duration_minutes > 0 && <span>{formatDuration(lesson.forum_lesson_duration_minutes)}</span>}
                  {!compact && lesson.resources && lesson.resources.length > 0 && <span>{lesson.resources.length === 1 ? '1 recurso' : `${lesson.resources.length} recursos`}</span>}
                  {lesson.forum_lesson_status !== 'published' && <Badge variant="warning">Borrador</Badge>}
                  {!compact && lesson.forum_lesson_is_preview && <Badge variant="info">Vista previa</Badge>}
                </span>
              </div>
              {manage && <div className="lesson-list__actions">
                {permissions.canUpdate && lessons.length > 1 && <span className="lesson-list__order">
                  <IconButton size="sm" className="icon-up" icon={DataIcons.navigation.arrowDown} label={`Subir «${lesson.forum_lesson_title}»`}
                    disabled={disabled || index === 0} onClick={() => void move(lesson, index)} />
                  <IconButton size="sm" icon={DataIcons.navigation.arrowDown} label={`Bajar «${lesson.forum_lesson_title}»`}
                    disabled={disabled || index === lessons.length - 1} onClick={() => void move(lesson, index + 2)} />
                </span>}
                {permissions.canPublish && lesson.forum_lesson_status !== 'published' && <Button size="sm" variant="primary"
                  loading={busy === lesson.forum_lesson_id} disabled={disabled} onClick={() => void publish(lesson)}>Publicar</Button>}
                {permissions.canUpdate && <Button size="sm" variant="primary--outline" disabled={disabled}
                  onClick={() => navigate(`/admin/courses/${courseId}/lessons/${lesson.forum_lesson_id}/edit`)}>Editar</Button>}
                {permissions.canDelete && <Button size="sm" variant="danger--outline" disabled={disabled}
                  onClick={() => setConfirm(lesson)}>Eliminar</Button>}
              </div>}
            </li>
          )
        })}
      </ol>
      <Dialog open={confirm !== null} typeDialog="danger" titleDialog="Eliminar lección"
        textDialog={`¿Eliminar «${confirm?.forum_lesson_title ?? ''}»? También se borrarán sus recursos y el progreso de los estudiantes.`}
        buttonCancelDialog="Cancelar" buttonConfirmDialog="Eliminar"
        onCancelDialog={() => setConfirm(null)} callbackDialog={() => { if (confirm) void remove(confirm) }} />
    </div>
  )
}
