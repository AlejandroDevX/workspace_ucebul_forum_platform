import type { ReactNode } from 'react'
import { Avatar } from 'ucebul_mui'
import { formatDateTime } from '../utils/community-format'

interface Props {
  name: string
  date: string
  edited?: boolean
  // inline: nombre · fecha en una línea (pregunta); stacked: fecha bajo el nombre (respuestas).
  layout?: 'inline' | 'stacked'
  children?: ReactNode
}

// Avatar con la inicial del autor (Workspace no expone foto), nombre y fecha de publicación.
export default function AuthorLine({ name, date, edited = false, layout = 'inline', children }: Props) {
  return (
    <div className={`author-line author-line--${layout}`}>
      <Avatar alt={name} width={layout === 'inline' ? 44 : 40} />
      <div className="author-line__text">
        <strong>{name}</strong>
        <span className="author-line__date">
          <time dateTime={date}>{formatDateTime(date)}</time>{edited && ' · editada'}
        </span>
      </div>
      {children}
    </div>
  )
}
