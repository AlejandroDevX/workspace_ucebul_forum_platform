import { Link } from 'react-router-dom'
import { DataIcons } from 'ucebul_mui'
import type { ForumLesson } from '../types/lesson.types'

export default function LessonNavigation({ courseId, lessons, currentId }: { courseId: number; lessons: ForumLesson[]; currentId: number }) {
  const index = lessons.findIndex((lesson) => lesson.forum_lesson_id === currentId)
  const previous = index > 0 ? lessons[index - 1] : undefined
  const next = index >= 0 && index < lessons.length - 1 ? lessons[index + 1] : undefined
  if (!previous && !next) return null
  const href = (lesson: ForumLesson) => `/courses/${courseId}/lessons/${lesson.forum_lesson_id}`

  return (
    <nav className="lesson-navigation" aria-label="Lecciones anterior y siguiente">
      {previous ? <Link className="lesson-navigation__link" to={href(previous)} rel="prev">
        <span className="lesson-navigation__icon" aria-hidden="true">{DataIcons.buttons.arrowLongLeft}</span>
        <span><small>Anterior</small>{previous.forum_lesson_title}</span>
      </Link> : <span />}
      {next && <Link className="lesson-navigation__link lesson-navigation__link--next" to={href(next)} rel="next">
        <span><small>Siguiente</small>{next.forum_lesson_title}</span>
        <span className="lesson-navigation__icon" aria-hidden="true">{DataIcons.buttons.arrowLongRight}</span>
      </Link>}
    </nav>
  )
}
