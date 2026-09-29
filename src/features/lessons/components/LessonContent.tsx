import { Badge, DataIcons } from 'ucebul_mui'
import { formatDuration } from '../../courses/utils/course-format'
import type { ForumLesson } from '../types/lesson.types'

export default function LessonContent({ lesson, position, total }: { lesson: ForumLesson; position: number; total: number }) {
  return (
    <header className="lesson-content">
      <div className="course-card__tags">
        <Badge>Lección {position} de {total}</Badge>
        {lesson.forum_lesson_status !== 'published' && <Badge variant="warning">Borrador</Badge>}
        {lesson.forum_lesson_is_preview && <Badge variant="info">Vista previa gratuita</Badge>}
      </div>
      <h1 id="lesson-title">{lesson.forum_lesson_title}</h1>
      {lesson.forum_lesson_duration_minutes > 0 && <p className="lesson-content__meta">
        <span aria-hidden="true">{DataIcons.global.clockOutline}</span>{formatDuration(lesson.forum_lesson_duration_minutes)}</p>}
    </header>
  )
}

export function LessonBody({ lesson }: { lesson: ForumLesson }) {
  return lesson.forum_lesson_body
    ? <div className="lesson-body">{lesson.forum_lesson_body}</div>
    : <p className="muted">Esta lección no tiene contenido escrito.</p>
}
